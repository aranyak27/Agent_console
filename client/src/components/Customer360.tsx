import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { RefundCase } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
  Mail,
  BookOpen,
} from "lucide-react";

interface Customer360Props {
  refundCase: RefundCase;
}

function getTenureLabel(months: number) {
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years}yr`;
}

const POLICY_ARTICLES: Record<string, { title: string; summary: string }> = {
  R1: { title: "Serial Refund Threshold", summary: ">20 refunds in 6 months with tenure <12 months flags for review." },
  R2: { title: "Velocity Spike Policy", summary: "Sudden spikes in refund frequency within 30 days trigger review." },
  R3: { title: "No-Show Evidence Policy", summary: "Email/system engagement within 2h of experience invalidates no-show claims." },
  R4: { title: "Post-Experience Refund", summary: "Requests after the experience date require documented evidence." },
  R5: { title: "High-Value Booking Policy", summary: ">90th percentile bookings require 24h+ advance cancellation." },
  R6: { title: "New Account Policy", summary: "Accounts <90 days requesting high-value refunds need extra verification." },
  R7: { title: "System Access Evidence", summary: "Portal logins near experience time contradict no-show or tech claims." },
  R8: { title: "Loyalty Benefit", summary: "24+ month tenure with <5 refunds qualifies for expedited review." },
};

const REASON_ARTICLES: Record<string, { title: string; summary: string }> = {
  no_show: { title: "No-Show Guidelines", summary: "Verify absence of engagement signals before approving." },
  technical_issue: { title: "Tech Issue Claims", summary: "Require screenshot evidence or platform incident reports." },
  weather: { title: "Weather-Related Claims", summary: "Cross-reference official weather reports for date and city." },
  cancellation: { title: "Cancellation Window", summary: "Must be submitted before the deadline per booking type." },
};

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full group"
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      {open ? (
        <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
      ) : (
        <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </button>
  );
}

function StatRow({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <span className={cn("text-xs font-medium text-foreground shrink-0", valueClass)}>{value}</span>
    </div>
  );
}

export function Customer360({ refundCase }: Customer360Props) {
  const [accountOpen, setAccountOpen] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(true);

  const score = refundCase.riskAssessment?.totalScore ?? 0;
  const triggeredRuleIds = refundCase.riskAssessment?.triggeredRules?.map((r) => r.ruleId) ?? [];

  const scoreColor =
    score >= 70 ? "text-rose-600 dark:text-rose-400" :
    score >= 30 ? "text-amber-600 dark:text-amber-400" :
    "text-emerald-600 dark:text-emerald-400";

  const scoreLabel =
    score >= 70 ? "High Risk" : score >= 30 ? "Medium Risk" : "Low Risk";

  const scoreDot =
    score >= 70 ? "bg-rose-500" : score >= 30 ? "bg-amber-500" : "bg-emerald-500";

  const relevantPolicies = [
    ...triggeredRuleIds
      .map((id) => POLICY_ARTICLES[id])
      .filter(Boolean),
    REASON_ARTICLES[refundCase.refundReason],
  ].filter(Boolean).filter((v, i, arr) => arr.findIndex((a) => a.title === v.title) === i);

  return (
    <div className="p-3 space-y-3">
      {/* Customer identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-foreground">
            {refundCase.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground truncate">{refundCase.customerName}</div>
          <div className="text-xs text-muted-foreground truncate">{refundCase.customerEmail}</div>
        </div>
      </div>

      {/* Risk score pill */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/40 border border-border">
        <span className={cn("w-2 h-2 rounded-full shrink-0", scoreDot)} />
        <span className={cn("text-sm font-bold tabular-nums", scoreColor)}>{score}</span>
        <span className={cn("text-xs font-medium", scoreColor)}>{scoreLabel}</span>
      </div>

      <Separator />

      {/* Account Details */}
      <div className="space-y-2">
        <SectionHeader label="Account" open={accountOpen} onToggle={() => setAccountOpen((v) => !v)} />
        {accountOpen && (
          <div className="space-y-2">
            <StatRow
              icon={<Star className="w-3 h-3 shrink-0" />}
              label="Member since"
              value={getTenureLabel(refundCase.customerTenureMonths)}
            />
            <StatRow
              icon={<TrendingUp className="w-3 h-3 shrink-0" />}
              label="Refunds (6 mo)"
              value={refundCase.refundCountLast6Months}
              valueClass={refundCase.refundCountLast6Months > 10 ? "text-rose-600 dark:text-rose-400" :
                refundCase.refundCountLast6Months > 5 ? "text-amber-600 dark:text-amber-400" : undefined}
            />
            <StatRow
              icon={<Activity className="w-3 h-3 shrink-0" />}
              label="Lifetime refunds"
              value={refundCase.totalRefundCount}
            />
            <StatRow
              icon={<AlertCircle className="w-3 h-3 shrink-0" />}
              label="No-shows"
              value={`${refundCase.previousNoShowCount} prev`}
              valueClass={refundCase.previousNoShowCount > 2 ? "text-rose-600 dark:text-rose-400" :
                refundCase.previousNoShowCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Booking Details */}
      <div className="space-y-2">
        <SectionHeader label="Booking" open={bookingOpen} onToggle={() => setBookingOpen((v) => !v)} />
        {bookingOpen && (
          <div className="space-y-2">
            <StatRow
              icon={<TrendingUp className="w-3 h-3 shrink-0" />}
              label="Value"
              value={`$${refundCase.experienceValue.toLocaleString()}`}
              valueClass={refundCase.experienceValuePercentile > 90 ? "text-rose-600 dark:text-rose-400" : undefined}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Percentile</span>
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", refundCase.experienceValuePercentile > 90 ? "bg-rose-500" : "bg-primary")}
                    style={{ width: `${refundCase.experienceValuePercentile}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{refundCase.experienceValuePercentile}th</span>
              </div>
            </div>
            <StatRow
              icon={<Clock className="w-3 h-3 shrink-0" />}
              label="Request timing"
              value={refundCase.refundTimingHours < 0
                ? `${Math.abs(refundCase.refundTimingHours).toFixed(0)}h after`
                : `${refundCase.refundTimingHours.toFixed(0)}h before`}
              valueClass={refundCase.refundTimingHours < 0 ? "text-rose-600 dark:text-rose-400" :
                refundCase.refundTimingHours < 24 ? "text-amber-600 dark:text-amber-400" : undefined}
            />
            <StatRow
              icon={<Mail className="w-3 h-3 shrink-0" />}
              label="Email"
              value={refundCase.emailEngagement === "opened" ? "Opened ⚠" :
                refundCase.emailEngagement === "unavailable" ? "Unavail." : "Not opened"}
              valueClass={refundCase.emailEngagement === "opened" ? "text-rose-600 dark:text-rose-400" :
                refundCase.emailEngagement === "unavailable" ? "text-muted-foreground" :
                "text-emerald-600 dark:text-emerald-400"}
            />
            <StatRow
              icon={<Activity className="w-3 h-3 shrink-0" />}
              label="Logins (24h)"
              value={refundCase.systemLoginsLast24h}
              valueClass={refundCase.systemLoginsLast24h > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Smart Policy Reference */}
      <div className="space-y-2">
        <SectionHeader label="Policy Reference" open={policyOpen} onToggle={() => setPolicyOpen((v) => !v)} />
        {policyOpen && (
          <div className="space-y-1.5">
            {relevantPolicies.length === 0 ? (
              <div className="text-xs rounded-md bg-muted/30 p-2 border border-border text-muted-foreground">
                No specific policy flags for this case.
              </div>
            ) : (
              relevantPolicies.map((article, i) => (
                <div key={i} className="text-xs rounded-md bg-muted/30 p-2 border border-border">
                  <div className="flex items-start gap-1.5 mb-0.5">
                    <BookOpen className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="font-medium text-foreground">{article.title}</span>
                  </div>
                  <div className="text-muted-foreground pl-4">{article.summary}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
