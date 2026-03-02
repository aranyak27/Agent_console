import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RefundCase } from "@shared/schema";
import { policyTemplates, getTemplatesForRules } from "@/lib/policyTemplates";
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

export function ActionHub({ refundCase, onUpdate }: ActionHubProps) {
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<ActionType | null>(null);
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const triggeredRuleIds = refundCase.riskAssessment?.triggeredRules.map((r) => r.ruleId) || [];
  const relevantTemplates = getTemplatesForRules(triggeredRuleIds);
  const otherTemplates = policyTemplates.filter((t) => !relevantTemplates.find((r) => r.id === t.id));

  const selectedTemplate = selectedTemplateId
    ? policyTemplates.find((t) => t.id === selectedTemplateId)
    : null;

  const fillTemplate = (template: typeof policyTemplates[0]) => {
    return template.body
      .replace(/{{customerName}}/g, refundCase.customerName)
      .replace(/{{caseId}}/g, refundCase.id)
      .replace(/{{bookingId}}/g, refundCase.bookingId)
      .replace(/{{experienceName}}/g, refundCase.experienceName)
      .replace(/{{refundTiming}}/g, `${Math.abs(refundCase.refundTimingHours).toFixed(1)} hours`);
  };

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
      const updatedAuditEntry = {
        id: `audit-${Date.now()}`,
        caseId: refundCase.id,
        timestamp: new Date().toISOString(),
        action: vars.status === "approved" ? "Case Approved" :
                vars.status === "denied" ? "Case Denied" :
                vars.status === "escalated" ? "Case Escalated" : "Manual Override",
        actor: "agent" as const,
        detail: vars.notes || vars.overrideReason || `Case status changed to ${vars.status}`,
      };

      const updated: RefundCase = {
        ...refundCase,
        status: vars.status as RefundCase["status"],
        agentNotes: vars.notes,
        overrideReason: vars.overrideReason,
        resolvedAt: new Date().toISOString(),
        auditTrail: [...(refundCase.auditTrail || []), updatedAuditEntry],
      };
      onUpdate(updated);
      setActiveDialog(null);
      setNotes("");
      setOverrideReason("");
      setSelectedTemplateId(null);
      toast({
        title: "Case updated",
        description: `Case ${refundCase.id} has been ${vars.status}.`,
      });
    },
  });

  const handleAction = (action: ActionType) => {
    if (action === "approve") {
      updateMutation.mutate({ status: "approved", notes });
    } else if (action === "deny") {
      updateMutation.mutate({ status: "denied", notes, templateId: selectedTemplateId || undefined });
    } else if (action === "escalate") {
      updateMutation.mutate({ status: "escalated", notes });
    } else if (action === "override") {
      updateMutation.mutate({ status: "approved", overrideReason, notes });
    }
  };

  const isHighRisk = refundCase.riskAssessment?.category === "high_risk";

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="font-semibold text-sm text-foreground">Agent Actions</h3>
        {isHighRisk && (
          <Badge variant="destructive" className="text-xs">Senior Review Required</Badge>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="bg-green-600 text-white"
          onClick={() => setActiveDialog("approve")}
          data-testid="button-approve"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setActiveDialog("deny")}
          data-testid="button-deny"
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" />
          Deny
        </Button>
        <Button
          size="sm"
          variant="secondary"
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
            onClick={() => setActiveDialog("override")}
            data-testid="button-override"
          >
            <PenLine className="w-3.5 h-3.5 mr-1.5" />
            Override Score
          </Button>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={activeDialog === "approve"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent data-testid="modal-approve">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Approve Refund Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are approving a <strong>${refundCase.refundAmount.toLocaleString()}</strong> refund for{" "}
              <strong>{refundCase.customerName}</strong>.
            </p>
            <div>
              <Label htmlFor="approve-notes" className="text-xs mb-1.5 block">Agent Notes (optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any notes for the record..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
                data-testid="textarea-approve-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button size="sm" className="bg-green-600 text-white" onClick={() => handleAction("approve")} disabled={updateMutation.isPending} data-testid="button-confirm-approve">
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog with Template Engine */}
      <Dialog open={activeDialog === "deny"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl" data-testid="modal-deny">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Deny Refund Request — Policy Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a denial policy template for <strong>{refundCase.customerName}</strong> (${refundCase.refundAmount.toLocaleString()}).
            </p>

            {relevantTemplates.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">Recommended Templates</Label>
                <div className="space-y-2">
                  {relevantTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id === selectedTemplateId ? null : t.id)}
                      data-testid={`template-${t.id}`}
                      className={cn(
                        "w-full text-left rounded-md border p-3 text-xs transition-colors hover-elevate",
                        selectedTemplateId === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
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

            {otherTemplates.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAllTemplates(!showAllTemplates)}
                  className="flex items-center gap-1 text-xs text-muted-foreground mb-2"
                  data-testid="button-show-all-templates"
                >
                  {showAllTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showAllTemplates ? "Hide" : "Show"} other templates ({otherTemplates.length})
                </button>
                {showAllTemplates && (
                  <div className="space-y-2">
                    {otherTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id === selectedTemplateId ? null : t.id)}
                        data-testid={`template-other-${t.id}`}
                        className={cn(
                          "w-full text-left rounded-md border p-3 text-xs transition-colors hover-elevate",
                          selectedTemplateId === t.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
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

            {selectedTemplate && (
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">
                  <FileText className="w-3 h-3 inline mr-1" />
                  Email Preview — {selectedTemplate.name}
                </Label>
                <ScrollArea className="h-40 rounded-md border border-border bg-muted/30">
                  <div className="p-3">
                    <div className="text-xs font-semibold text-foreground mb-1">
                      Subject: {selectedTemplate.subject.replace("{{caseId}}", refundCase.id)}
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {fillTemplate(selectedTemplate)}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            )}

            <div>
              <Label htmlFor="deny-notes" className="text-xs mb-1.5 block">Internal Notes</Label>
              <Textarea
                id="deny-notes"
                placeholder="Document the reason for denial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
                data-testid="textarea-deny-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction("deny")}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-deny"
            >
              Confirm Denial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={activeDialog === "escalate"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent data-testid="modal-escalate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
              Escalate to Senior Agent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escalate case <strong>{refundCase.id}</strong> for senior fraud analyst review.
            </p>
            <div>
              <Label htmlFor="escalate-notes" className="text-xs mb-1.5 block">Escalation Reason <span className="text-destructive">*</span></Label>
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

      {/* Override Dialog */}
      <Dialog open={activeDialog === "override"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent data-testid="modal-override">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Override High-Risk Score
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-xs text-orange-800 dark:text-orange-200">
              <strong>Audit Notice:</strong> Overriding a High-Risk score requires a documented justification. This action is logged and subject to review.
            </div>
            <div>
              <Label htmlFor="override-reason" className="text-xs mb-1.5 block">Override Justification <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="override-notes" className="text-xs mb-1.5 block">Additional Notes</Label>
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
              className="border-orange-400 text-orange-700 dark:text-orange-300"
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
