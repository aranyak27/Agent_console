import type { RefundCase, AuditEntry } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Shield, User, CheckCircle2, XCircle, ArrowUpRight, PenLine, FileSearch } from "lucide-react";

interface AuditTrailProps {
  refundCase: RefundCase;
}

function getActionIcon(action: string, actor: string) {
  if (actor === "system") {
    if (action.includes("Risk")) return <Shield className="w-3.5 h-3.5 text-primary" />;
    return <FileSearch className="w-3.5 h-3.5 text-muted-foreground" />;
  }
  if (action.includes("Approved") || action.includes("Override")) return <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />;
  if (action.includes("Denied")) return <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />;
  if (action.includes("Escalated")) return <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
  if (action.includes("Override")) return <PenLine className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />;
  return <User className="w-3.5 h-3.5 text-muted-foreground" />;
}

function getActionColor(action: string, actor: string) {
  if (actor === "system") return "bg-primary/10 border-primary/20";
  if (action.includes("Approved") || action.includes("Override")) return "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800";
  if (action.includes("Denied")) return "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800";
  if (action.includes("Escalated")) return "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800";
  return "bg-card border-border";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AuditTrail({ refundCase }: AuditTrailProps) {
  const entries = refundCase.auditTrail || [];

  return (
    <div>
      <h3 className="font-semibold text-sm text-foreground mb-4">Case Audit Trail</h3>
      {entries.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">No audit entries yet.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3 pl-10">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="relative" data-testid={`audit-entry-${idx}`}>
                <div className="absolute -left-6 top-3.5 w-2.5 h-2.5 rounded-full bg-background border-2 border-border" />
                <div className={cn("rounded-md border p-3", getActionColor(entry.action, entry.actor))}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action, entry.actor)}
                      <span className="text-xs font-semibold text-foreground">{entry.action}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        entry.actor === "system"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-secondary-foreground"
                      )}>
                        {entry.actor === "system" ? "System" : "Agent"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{entry.detail}</p>
                  <div className="mt-1.5 text-xs text-muted-foreground/70 font-mono">{formatTime(entry.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
