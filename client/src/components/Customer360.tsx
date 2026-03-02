import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { RefundCase } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Activity,
  Calendar,
  Star,
} from "lucide-react";

interface Customer360Props {
  refundCase: RefundCase;
}

function getTenureLabel(months: number) {
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years} year${years > 1 ? "s" : ""}`;
}

function getRiskIndicator(score: number) {
  if (score >= 70) return { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/50", label: "High Risk" };
  if (score >= 30) return { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/50", label: "Medium Risk" };
  return { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/50", label: "Low Risk" };
}

export function Customer360({ refundCase }: Customer360Props) {
  const score = refundCase.riskAssessment?.totalScore ?? 0;
  const risk = getRiskIndicator(score);

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Customer 360</div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {refundCase.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">{refundCase.customerName}</div>
            <div className="text-xs text-muted-foreground truncate">{refundCase.customerEmail}</div>
            <div className="text-xs font-mono text-muted-foreground">{refundCase.customerId}</div>
          </div>
        </div>

        {/* Risk Score */}
        <div className={cn("rounded-md p-3 mb-3 text-center", risk.bg)}>
          <div className={cn("text-2xl font-bold", risk.color)}>{score}</div>
          <div className="text-xs text-muted-foreground">Risk Score</div>
          <div className={cn("text-xs font-semibold mt-0.5", risk.color)}>{risk.label}</div>
        </div>
      </div>

      <Separator />

      {/* Customer Stats */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Account Details</div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5" />
              Member Since
            </div>
            <span className="text-xs font-medium text-foreground">{getTenureLabel(refundCase.customerTenureMonths)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              Refunds (6 mo)
            </div>
            <span className={cn(
              "text-xs font-semibold",
              refundCase.refundCountLast6Months > 10 ? "text-red-600 dark:text-red-400" :
              refundCase.refundCountLast6Months > 5 ? "text-orange-600 dark:text-orange-400" :
              "text-foreground"
            )}>
              {refundCase.refundCountLast6Months}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5" />
              Total Refunds
            </div>
            <span className="text-xs font-medium text-foreground">{refundCase.totalRefundCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5" />
              No-Show History
            </div>
            <span className={cn(
              "text-xs font-semibold",
              refundCase.previousNoShowCount > 2 ? "text-red-600 dark:text-red-400" :
              refundCase.previousNoShowCount > 0 ? "text-orange-600 dark:text-orange-400" :
              "text-green-600 dark:text-green-400"
            )}>
              {refundCase.previousNoShowCount} previous
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Booking Details */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Booking Details</div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              Experience Value
            </div>
            <span className={cn(
              "text-xs font-semibold",
              refundCase.experienceValuePercentile > 90 ? "text-red-600 dark:text-red-400" : "text-foreground"
            )}>
              ${refundCase.experienceValue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              Value Percentile
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", refundCase.experienceValuePercentile > 90 ? "bg-red-500" : "bg-primary")}
                  style={{ width: `${refundCase.experienceValuePercentile}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{refundCase.experienceValuePercentile}th</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Request Timing
            </div>
            <span className={cn(
              "text-xs font-medium",
              refundCase.refundTimingHours < 0 ? "text-red-600 dark:text-red-400" :
              refundCase.refundTimingHours < 24 ? "text-orange-600 dark:text-orange-400" :
              "text-foreground"
            )}>
              {refundCase.refundTimingHours < 0
                ? `${Math.abs(refundCase.refundTimingHours).toFixed(0)}h after`
                : `${refundCase.refundTimingHours.toFixed(0)}h before`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              Email Engagement
            </div>
            {refundCase.emailEngagement === "opened" ? (
              <Badge className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                Opened
              </Badge>
            ) : refundCase.emailEngagement === "unavailable" ? (
              <Badge variant="secondary" className="text-xs">Unavailable</Badge>
            ) : (
              <Badge className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                Not Opened
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5" />
              Logins (24h)
            </div>
            <span className={cn(
              "text-xs font-medium",
              refundCase.systemLoginsLast24h > 0 ? "text-orange-600 dark:text-orange-400" : "text-foreground"
            )}>
              {refundCase.systemLoginsLast24h}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quick Policy Reference */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Policy Reference</div>
        <div className="space-y-1.5">
          <div className="text-xs rounded-md bg-muted/50 p-2 border border-border">
            <div className="font-medium text-foreground mb-0.5">Serial Refund Threshold</div>
            <div className="text-muted-foreground">R1: &gt;20 refunds in 6 months + tenure &lt;1yr</div>
          </div>
          <div className="text-xs rounded-md bg-muted/50 p-2 border border-border">
            <div className="font-medium text-foreground mb-0.5">No-Show Policy</div>
            <div className="text-muted-foreground">Evidence of email/system engagement invalidates no-show claims</div>
          </div>
          <div className="text-xs rounded-md bg-muted/50 p-2 border border-border">
            <div className="font-medium text-foreground mb-0.5">Cancellation Window</div>
            <div className="text-muted-foreground">High-value (&gt;90th pct) requires &gt;24h notice</div>
          </div>
        </div>
      </div>
    </div>
  );
}
