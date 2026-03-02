import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RefundCase } from "@shared/schema";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, Mail, Monitor, History, Info } from "lucide-react";

interface ReasoningPanelProps {
  refundCase: RefundCase;
}

function getScoreColor(pts: number) {
  if (pts > 0) return "text-rose-600 dark:text-rose-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function getRuleAccent(ruleId: string) {
  const high = ["R1", "R2", "R3"];
  const medium = ["R4", "R5", "R6", "R7"];
  if (high.includes(ruleId)) return "border-l-rose-400 dark:border-l-rose-600";
  if (medium.includes(ruleId)) return "border-l-amber-400 dark:border-l-amber-600";
  return "border-l-emerald-400 dark:border-l-emerald-600";
}

function getRuleBadge(ruleId: string) {
  const high = ["R1", "R2", "R3"];
  const medium = ["R4", "R5", "R6", "R7"];
  if (high.includes(ruleId)) return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300";
  if (medium.includes(ruleId)) return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300";
  return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300";
}

interface LogModalState {
  open: boolean;
  type: "email" | "refund" | null;
}

export function ReasoningPanel({ refundCase }: ReasoningPanelProps) {
  const [logModal, setLogModal] = useState<LogModalState>({ open: false, type: null });
  const { riskAssessment } = refundCase;

  if (!riskAssessment) return null;

  const { triggeredRules, totalScore, category, hasIncompleteData } = riskAssessment;

  const totalColor =
    totalScore >= 70 ? "text-rose-600 dark:text-rose-400" :
    totalScore >= 30 ? "text-amber-600 dark:text-amber-400" :
    "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Risk Reasoning</h3>
        <span className="text-xs text-muted-foreground">
          {triggeredRules.length} rule{triggeredRules.length !== 1 ? "s" : ""} triggered
        </span>
      </div>

      {hasIncompleteData && (
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border text-xs">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Incomplete data:</span> Email engagement unavailable — defaulted to Moderate Risk per safety policy.
          </span>
        </div>
      )}

      {triggeredRules.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/30 border border-border text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          No risk rules triggered — qualifies for auto-approval.
        </div>
      ) : (
        <div className="space-y-2">
          {triggeredRules.map((rule) => {
            const isDiscount = rule.scoreAdded < 0;
            return (
              <div
                key={rule.ruleId}
                className={cn(
                  "rounded-md border border-border bg-card border-l-2 p-3",
                  getRuleAccent(rule.ruleId)
                )}
                data-testid={`rule-card-${rule.ruleId}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", getRuleBadge(rule.ruleId))}>
                      {rule.ruleId}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{rule.ruleName}</span>
                  </div>
                  <span className={cn("shrink-0 text-xs font-bold tabular-nums", getScoreColor(rule.scoreAdded))}>
                    {isDiscount ? "" : "+"}{rule.scoreAdded} pts
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{rule.detail}</p>

                {rule.ruleId === "R3" && refundCase.emailEngagementLog && refundCase.emailEngagementLog.length > 0 && (
                  <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs px-2" onClick={() => setLogModal({ open: true, type: "email" })} data-testid="button-view-email-log">
                    <Mail className="w-3 h-3 mr-1" /> Email log <ExternalLink className="w-2.5 h-2.5 ml-1" />
                  </Button>
                )}
                {rule.ruleId === "R7" && refundCase.emailEngagementLog && refundCase.emailEngagementLog.length > 0 && (
                  <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs px-2" onClick={() => setLogModal({ open: true, type: "email" })} data-testid="button-view-system-log">
                    <Monitor className="w-3 h-3 mr-1" /> System log <ExternalLink className="w-2.5 h-2.5 ml-1" />
                  </Button>
                )}
                {(rule.ruleId === "R1" || rule.ruleId === "R2" || rule.ruleId === "R6") && refundCase.refundHistory && (
                  <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs px-2" onClick={() => setLogModal({ open: true, type: "refund" })} data-testid="button-view-refund-history">
                    <History className="w-3 h-3 mr-1" /> Refund history <ExternalLink className="w-2.5 h-2.5 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Score summary */}
      <div className="rounded-md border border-border bg-muted/20 p-3">
        <div className="space-y-1">
          {triggeredRules.map((rule) => (
            <div key={rule.ruleId} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{rule.ruleId}: {rule.ruleName}</span>
              <span className={cn("font-semibold tabular-nums", getScoreColor(rule.scoreAdded))}>
                {rule.scoreAdded > 0 ? "+" : ""}{rule.scoreAdded}
              </span>
            </div>
          ))}
          {triggeredRules.length > 0 && <div className="border-t border-border my-1.5" />}
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-foreground">Total Score</span>
            <span className={cn("text-sm tabular-nums", totalColor)}>{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Evidence Modals */}
      <Dialog open={logModal.open} onOpenChange={(open) => setLogModal({ open, type: null })}>
        <DialogContent className="max-w-lg" data-testid="modal-log-viewer">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {logModal.type === "email" ? "Email & System Access Log" : "6-Month Refund History"}
            </DialogTitle>
          </DialogHeader>
          {logModal.type === "email" && refundCase.emailEngagementLog && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{refundCase.id} · {refundCase.customerName} · {refundCase.bookingId}</div>
              <div className="font-mono text-xs bg-muted rounded-md p-3 space-y-1.5 border border-border">
                {refundCase.emailEngagementLog.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-muted-foreground shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    <span className="text-amber-600 dark:text-amber-400 shrink-0">[{entry.event}]</span>
                    <span className="text-foreground">{entry.device} · {entry.location}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-border">
                Log confirms active engagement within {Math.abs(refundCase.refundTimingHours)}h of the experience.
              </div>
            </div>
          )}
          {logModal.type === "refund" && refundCase.refundHistory && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Refund history for {refundCase.customerName}</div>
              <div className="space-y-1">
                {refundCase.refundHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded border border-border bg-card">
                    <div>
                      <div className="font-medium text-foreground">{entry.experience}</div>
                      <div className="text-muted-foreground">{entry.date} · {entry.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${entry.amount}</div>
                      <div className={cn("text-xs", entry.outcome === "Approved" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                        {entry.outcome}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-border">
                {refundCase.refundCountLast6Months} refunds in last 6 months · {refundCase.totalRefundCount} lifetime total
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
