import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RefundCase } from "@shared/schema";
import { policyTemplates, approvalTemplates, getTemplatesForRules, type ApprovalTemplate } from "@/lib/policyTemplates";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, ArrowUpRight, PenLine, FileText, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionHubProps {
  refundCase: RefundCase;
  onUpdate: (updated: RefundCase) => void;
}

type ActionType = "approve" | "deny" | "escalate" | "override";

function fillApprovalTemplate(template: ApprovalTemplate, refundCase: RefundCase) {
  return template.body
    .replace(/{{customerName}}/g, refundCase.customerName)
    .replace(/{{caseId}}/g, refundCase.id)
    .replace(/{{bookingId}}/g, refundCase.bookingId)
    .replace(/{{refundAmount}}/g, `$${refundCase.refundAmount.toLocaleString()}`)
    .replace(/{{experienceName}}/g, refundCase.experienceName);
}

function fillDenialTemplate(template: typeof policyTemplates[0], refundCase: RefundCase) {
  return template.body
    .replace(/{{customerName}}/g, refundCase.customerName)
    .replace(/{{caseId}}/g, refundCase.id)
    .replace(/{{bookingId}}/g, refundCase.bookingId)
    .replace(/{{experienceName}}/g, refundCase.experienceName)
    .replace(/{{refundTiming}}/g, `${Math.abs(refundCase.refundTimingHours).toFixed(1)} hours`);
}

export function ActionHub({ refundCase, onUpdate }: ActionHubProps) {
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<ActionType | null>(null);
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [selectedApprovalTemplateId, setSelectedApprovalTemplateId] = useState<string | null>(null);
  const [selectedDenialTemplateId, setSelectedDenialTemplateId] = useState<string | null>(null);
  const [showAllDenialTemplates, setShowAllDenialTemplates] = useState(false);

  const triggeredRuleIds = refundCase.riskAssessment?.triggeredRules.map((r) => r.ruleId) || [];
  const relevantDenialTemplates = getTemplatesForRules(triggeredRuleIds);
  const otherDenialTemplates = policyTemplates.filter((t) => !relevantDenialTemplates.find((r) => r.id === t.id));

  const selectedApprovalTemplate = selectedApprovalTemplateId
    ? approvalTemplates.find((t) => t.id === selectedApprovalTemplateId)
    : null;
  const selectedDenialTemplate = selectedDenialTemplateId
    ? policyTemplates.find((t) => t.id === selectedDenialTemplateId)
    : null;

  const updateMutation = useMutation({
    mutationFn: async (data: { status: string; notes?: string; overrideReason?: string; templateId?: string }) => {
      await apiRequest("POST", "/api/cases/update", {
        caseId: refundCase.id,
        status: data.status,
        agentNotes: data.notes,
        overrideReason: data.overrideReason,
        templateId: data.templateId,
      });
      await apiRequest("POST", "/api/audit", {
        caseId: refundCase.id,
        action: data.status === "approved" ? "Case Approved" :
                data.status === "denied" ? "Case Denied" :
                data.status === "escalated" ? "Case Escalated" :
                "Manual Override",
        actor: "agent",
        detail: data.notes || data.overrideReason || `Case status changed to ${data.status}`,
      });
    },
    onSuccess: (_, vars) => {
      const updated: RefundCase = {
        ...refundCase,
        status: vars.status as RefundCase["status"],
        agentNotes: vars.notes,
        overrideReason: vars.overrideReason,
        resolvedAt: new Date().toISOString(),
        auditTrail: [
          ...(refundCase.auditTrail || []),
          {
            id: `audit-${Date.now()}`,
            caseId: refundCase.id,
            timestamp: new Date().toISOString(),
            action: vars.status === "approved" ? "Case Approved" :
                    vars.status === "denied" ? "Case Denied" :
                    vars.status === "escalated" ? "Case Escalated" : "Manual Override",
            actor: "agent" as const,
            detail: vars.notes || vars.overrideReason || `Case status changed to ${vars.status}`,
          },
        ],
      };
      onUpdate(updated);
      setActiveDialog(null);
      setNotes("");
      setOverrideReason("");
      setSelectedApprovalTemplateId(null);
      setSelectedDenialTemplateId(null);
      toast({ title: "Case updated", description: `Case ${refundCase.id} has been ${vars.status}.` });
    },
  });

  const handleAction = (action: ActionType) => {
    if (action === "approve") {
      updateMutation.mutate({ status: "approved", notes, templateId: selectedApprovalTemplateId || undefined });
    } else if (action === "deny") {
      updateMutation.mutate({ status: "denied", notes, templateId: selectedDenialTemplateId || undefined });
    } else if (action === "escalate") {
      updateMutation.mutate({ status: "escalated", notes });
    } else if (action === "override") {
      updateMutation.mutate({ status: "approved", overrideReason, notes });
    }
  };

  const isHighRisk = refundCase.riskAssessment?.category === "high_risk";

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Agent Actions</h3>
        {isHighRisk && (
          <Badge variant="outline" className="text-xs border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400">
            Senior Review Required
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          onClick={() => setActiveDialog("approve")}
          data-testid="button-approve"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
          onClick={() => setActiveDialog("deny")}
          data-testid="button-deny"
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" />
          Deny
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => setActiveDialog("escalate")}
          data-testid="button-escalate"
        >
          <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
          Escalate
        </Button>
        {isHighRisk && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setActiveDialog("override")}
            data-testid="button-override"
          >
            <PenLine className="w-3.5 h-3.5 mr-1.5" />
            Override
          </Button>
        )}
      </div>

      {/* ── APPROVE DIALOG with email template picker ── */}
      <Dialog open={activeDialog === "approve"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl" data-testid="modal-approve">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Approve Refund — Choose Email Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select an approval email to send to <strong>{refundCase.customerName}</strong> for{" "}
              <strong>${refundCase.refundAmount.toLocaleString()}</strong>. The selected email will be sent when you confirm.
            </p>

            {/* Template picker */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-2 block">Approval Email Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {approvalTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedApprovalTemplateId(t.id === selectedApprovalTemplateId ? null : t.id)}
                    data-testid={`approval-template-${t.id}`}
                    className={cn(
                      "text-left rounded-md border p-2.5 text-xs transition-colors",
                      selectedApprovalTemplateId === t.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <div className="font-semibold text-foreground mb-0.5">{t.name}</div>
                    <div className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.body.split("\n").filter(Boolean)[1] || ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {selectedApprovalTemplate && (
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  <FileText className="w-3 h-3 inline mr-1" />
                  Email Preview — {selectedApprovalTemplate.name}
                </Label>
                <ScrollArea className="h-40 rounded-md border border-border bg-muted/30">
                  <div className="p-3">
                    <div className="text-xs font-semibold text-foreground mb-1.5">
                      Subject: {selectedApprovalTemplate.subject.replace("{{caseId}}", refundCase.id)}
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {fillApprovalTemplate(selectedApprovalTemplate, refundCase)}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            )}

            <div>
              <Label htmlFor="approve-notes" className="text-xs mb-1 block text-muted-foreground">Internal Notes (optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any notes for the audit trail..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm min-h-[60px]"
                data-testid="textarea-approve-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleAction("approve")}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {selectedApprovalTemplate ? "Approve & Send Email" : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DENY DIALOG with policy template picker ── */}
      <Dialog open={activeDialog === "deny"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl" data-testid="modal-deny">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-rose-600" />
              Deny Request — Policy Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select a denial template for <strong>{refundCase.customerName}</strong> (${refundCase.refundAmount.toLocaleString()}).
            </p>

            {relevantDenialTemplates.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">Recommended</Label>
                <div className="space-y-1.5">
                  {relevantDenialTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedDenialTemplateId(t.id === selectedDenialTemplateId ? null : t.id)}
                      data-testid={`template-${t.id}`}
                      className={cn(
                        "w-full text-left rounded-md border p-2.5 text-xs transition-colors",
                        selectedDenialTemplateId === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-foreground">{t.name}</span>
                        <div className="flex gap-1">
                          {t.triggerRules.map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-muted-foreground truncate">{t.subject.replace("{{caseId}}", refundCase.id)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {otherDenialTemplates.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAllDenialTemplates(!showAllDenialTemplates)}
                  className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5"
                  data-testid="button-show-all-templates"
                >
                  {showAllDenialTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showAllDenialTemplates ? "Hide" : "Show"} other templates ({otherDenialTemplates.length})
                </button>
                {showAllDenialTemplates && (
                  <div className="space-y-1.5">
                    {otherDenialTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedDenialTemplateId(t.id === selectedDenialTemplateId ? null : t.id)}
                        data-testid={`template-other-${t.id}`}
                        className={cn(
                          "w-full text-left rounded-md border p-2.5 text-xs transition-colors",
                          selectedDenialTemplateId === t.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-foreground">{t.name}</span>
                          <div className="flex gap-1">
                            {t.triggerRules.map((r) => (
                              <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-muted-foreground truncate">{t.subject.replace("{{caseId}}", refundCase.id)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDenialTemplate && (
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  <FileText className="w-3 h-3 inline mr-1" />
                  Preview — {selectedDenialTemplate.name}
                </Label>
                <ScrollArea className="h-36 rounded-md border border-border bg-muted/30">
                  <div className="p-3">
                    <div className="text-xs font-semibold text-foreground mb-1">
                      Subject: {selectedDenialTemplate.subject.replace("{{caseId}}", refundCase.id)}
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {fillDenialTemplate(selectedDenialTemplate, refundCase)}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            )}

            <div>
              <Label htmlFor="deny-notes" className="text-xs mb-1 block text-muted-foreground">Internal Notes</Label>
              <Textarea
                id="deny-notes"
                placeholder="Document the reason for denial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm min-h-[60px]"
                data-testid="textarea-deny-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button
              variant="outline"
              size="sm"
              className="border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
              onClick={() => handleAction("deny")}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-deny"
            >
              Confirm Denial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ESCALATE DIALOG ── */}
      <Dialog open={activeDialog === "escalate"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent data-testid="modal-escalate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              Escalate to Senior Agent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Escalate case <strong>{refundCase.id}</strong> for senior fraud analyst review.
            </p>
            <div>
              <Label htmlFor="escalate-notes" className="text-xs mb-1 block">Escalation Reason <span className="text-rose-500">*</span></Label>
              <Textarea
                id="escalate-notes"
                placeholder="Explain why this case needs senior review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
                data-testid="textarea-escalate-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAction("escalate")}
              disabled={updateMutation.isPending || !notes.trim()}
              data-testid="button-confirm-escalate"
            >
              Confirm Escalation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── OVERRIDE DIALOG ── */}
      <Dialog open={activeDialog === "override"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent data-testid="modal-override">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Override High-Risk Score
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-2.5 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
              <strong className="text-foreground">Audit Notice:</strong> Overriding a High-Risk score requires documented justification. This action is logged and subject to review.
            </div>
            <div>
              <Label htmlFor="override-reason" className="text-xs mb-1 block">Justification <span className="text-rose-500">*</span></Label>
              <Textarea
                id="override-reason"
                placeholder="Provide a clear reason for overriding the system's high-risk flag..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="text-sm"
                data-testid="textarea-override-reason"
              />
            </div>
            <div>
              <Label htmlFor="override-notes" className="text-xs mb-1 block text-muted-foreground">Additional Notes</Label>
              <Textarea
                id="override-notes"
                placeholder="Any additional context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
                data-testid="textarea-override-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-700 dark:text-amber-300"
              onClick={() => handleAction("override")}
              disabled={updateMutation.isPending || !overrideReason.trim()}
              data-testid="button-confirm-override"
            >
              Override & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
