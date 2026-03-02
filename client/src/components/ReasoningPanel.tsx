import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RefundCase, TriggeredRule } from "@shared/schema";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingDown, CheckCircle2, ExternalLink, Mail, Monitor, History, Info } from "lucide-react";

interface ReasoningPanelProps {
  refundCase: RefundCase;
}

const RULE_COLORS: Record<string, { bg: string; border: string; badge: string; icon: React.ReactNode }> = {
  R1: { bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300", icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" /> },
  R2: { bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300", icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" /> },
  R3: { bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300", icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" /> },
  R4: { bg: "bg-orange-50 dark:bg-orange-950/50", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300", icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" /> },
  R5: { bg: "bg-orange-50 dark:bg-orange-950/50", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300", icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" /> },
  R6: { bg: "bg-orange-50 dark:bg-orange-950/50", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300", icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" /> },
  R7: { bg: "bg-orange-50 dark:bg-orange-950/50", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300", icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" /> },
  R8: { bg: "bg-green-50 dark:bg-green-950/50", border: "border-green-200 dark:border-green-800", badge: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300", icon: <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" /> },
};

interface LogModalState {
  open: boolean;
  type: "email" | "refund" | null;
}

export function ReasoningPanel({ refundCase }: ReasoningPanelProps) {
  const [logModal, setLogModal] = useState<LogModalState>({ open: false, type: null });
  const { riskAssessment } = refundCase;

  if (!riskAssessment) return null;

  const { triggeredRules, totalScore, category, hasIncompleteData } = riskAssessment;

  return (
    <div className="space-y-4">
      {/* Score Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-semibold text-sm text-foreground">Risk Evidence & Reasoning</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{triggeredRules.length} rule{triggeredRules.length !== 1 ? "s" : ""} triggered</span>
          </div>
        </div>

        {hasIncompleteData && (
          <div className="mb-3 flex items-start gap-2.5 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800">
            <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <span className="font-semibold">Incomplete Data Warning:</span> Email engagement data is unavailable. Request defaulted to Moderate Risk per safety policy to prevent unfair auto-rejection.
            </div>
          </div>
        )}

        {triggeredRules.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3 rounded-md bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <div className="text-sm text-green-800 dark:text-green-200">
              No risk rules triggered. This request qualifies for auto-approval.
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {triggeredRules.map((rule, idx) => {
              const style = RULE_COLORS[rule.ruleId] || RULE_COLORS.R4;
              const isDiscount = rule.scoreAdded < 0;
              return (
                <div
                  key={rule.ruleId}
                  className={cn("rounded-md border p-3.5", style.bg, style.border)}
                  data-testid={`rule-card-${rule.ruleId}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {style.icon}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", style.badge)}>
                            {rule.ruleId}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{rule.ruleName}</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "shrink-0 text-sm font-bold px-2 py-1 rounded",
                      isDiscount
                        ? "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900"
                        : "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900"
                    )}>
                      {isDiscount ? "" : "+"}{rule.scoreAdded} pts
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rule.detail}</p>

                  {rule.ruleId === "R3" && refundCase.emailEngagementLog && refundCase.emailEngagementLog.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => setLogModal({ open: true, type: "email" })}
                      data-testid="button-view-email-log"
                    >
                      <Mail className="w-3 h-3 mr-1.5" />
                      View Email Engagement Log
                      <ExternalLink className="w-3 h-3 ml-1.5" />
                    </Button>
                  )}
                  {rule.ruleId === "R7" && refundCase.emailEngagementLog && refundCase.emailEngagementLog.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => setLogModal({ open: true, type: "email" })}
                      data-testid="button-view-system-log"
                    >
                      <Monitor className="w-3 h-3 mr-1.5" />
                      View System Access Log
                      <ExternalLink className="w-3 h-3 ml-1.5" />
                    </Button>
                  )}
                  {(rule.ruleId === "R1" || rule.ruleId === "R2" || rule.ruleId === "R6") && refundCase.refundHistory && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => setLogModal({ open: true, type: "refund" })}
                      data-testid="button-view-refund-history"
                    >
                      <History className="w-3 h-3 mr-1.5" />
                      View 6-Month Refund History
                      <ExternalLink className="w-3 h-3 ml-1.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Score Summary */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</span>
        </div>
        <div className="space-y-1.5">
          {triggeredRules.map((rule) => (
            <div key={rule.ruleId} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{rule.ruleId}: {rule.ruleName}</span>
              <span className={cn("font-semibold", rule.scoreAdded < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {rule.scoreAdded > 0 ? "+" : ""}{rule.scoreAdded}
              </span>
            </div>
          ))}
          {triggeredRules.length > 0 && <div className="border-t border-border my-1.5" />}
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-foreground">Total Risk Score</span>
            <span className={cn(
              "text-base",
              totalScore >= 70 ? "text-red-600 dark:text-red-400" :
              totalScore >= 30 ? "text-orange-600 dark:text-orange-400" :
              "text-green-600 dark:text-green-400"
            )}>
              {totalScore} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Evidence Modals */}
      <Dialog open={logModal.open} onOpenChange={(open) => setLogModal({ open, type: null })}>
        <DialogContent className="max-w-lg" data-testid="modal-log-viewer">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {logModal.type === "email" ? "Email Engagement & System Access Log" : "6-Month Refund History"}
            </DialogTitle>
          </DialogHeader>
          {logModal.type === "email" && refundCase.emailEngagementLog && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-3">
                Case: {refundCase.id} · Customer: {refundCase.customerName} · Booking: {refundCase.bookingId}
              </div>
              <div className="font-mono text-xs bg-muted rounded-md p-3 space-y-2 border border-border">
                {refundCase.emailEngagementLog.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-muted-foreground shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    <span className="text-orange-600 dark:text-orange-400 shrink-0">[{entry.event}]</span>
                    <span className="text-foreground">{entry.device} · {entry.location}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/50 rounded border border-yellow-200 dark:border-yellow-800">
                System log timestamps confirm active engagement within {Math.abs(refundCase.refundTimingHours)} hours of the experience.
              </div>
            </div>
          )}
          {logModal.type === "refund" && refundCase.refundHistory && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-3">
                Showing refund history for {refundCase.customerName} ({refundCase.customerId})
              </div>
              <div className="space-y-1.5">
                {refundCase.refundHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded border border-border bg-card">
                    <div>
                      <div className="font-medium text-foreground">{entry.experience}</div>
                      <div className="text-muted-foreground">{entry.date} · {entry.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">${entry.amount}</div>
                      <Badge variant={entry.outcome === "Approved" ? "secondary" : "destructive"} className="text-xs mt-0.5">
                        {entry.outcome}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground p-2 bg-red-50 dark:bg-red-950/50 rounded border border-red-200 dark:border-red-800">
                Total: {refundCase.refundCountLast6Months} refunds in last 6 months · {refundCase.totalRefundCount} lifetime total
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
