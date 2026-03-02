import type { RefundCase, RiskAssessment, RiskCategory, TriggeredRule } from "@shared/schema";

export function calculateRiskScore(refundCase: RefundCase): RiskAssessment {
  const triggeredRules: TriggeredRule[] = [];
  let totalScore = 0;
  let hasIncompleteData = false;

  const {
    refundCountLast6Months,
    totalRefundCount,
    customerTenureMonths,
    refundReason,
    emailEngagement,
    refundTimingHours,
    experienceValuePercentile,
    previousNoShowCount,
    systemLoginsLast24h,
  } = refundCase;

  if (emailEngagement === "unavailable") {
    hasIncompleteData = true;
  }

  // R1: Serial Refunder (Extreme) - +50 pts
  if (refundCountLast6Months > 20 && customerTenureMonths < 12) {
    const rule: TriggeredRule = {
      ruleId: "R1",
      ruleName: "Serial Refunder (Extreme)",
      scoreAdded: 50,
      detail: `Customer has requested ${refundCountLast6Months} refunds in the last 6 months (Policy Threshold: 20 refunds). Account tenure is only ${customerTenureMonths} months.`,
      pattern: "serial_refunder",
    };
    triggeredRules.push(rule);
    totalScore += 50;
  }

  // R2: Serial Refunder (Moderate) - +35 pts
  if (refundCountLast6Months > 10 && refundCountLast6Months <= 20) {
    const rule: TriggeredRule = {
      ruleId: "R2",
      ruleName: "Serial Refunder (Moderate)",
      scoreAdded: 35,
      detail: `Customer has requested ${refundCountLast6Months} refunds in the last 6 months (Policy Threshold: 10 refunds).`,
      pattern: "serial_refunder",
    };
    triggeredRules.push(rule);
    totalScore += 35;
  }

  // R3: No-Show with Engagement - +40 pts
  if (
    refundReason === "no_show" &&
    emailEngagement === "opened" &&
    refundTimingHours < 0
  ) {
    const absHours = Math.abs(refundTimingHours);
    const rule: TriggeredRule = {
      ruleId: "R3",
      ruleName: "No-Show with Engagement",
      scoreAdded: 40,
      detail: `Customer claims "didn't show up," but system logs show they opened the booking confirmation email ${absHours} hours before the experience start time. Refund requested ${absHours} hours after experience.`,
      pattern: "false_no_show",
    };
    triggeredRules.push(rule);
    totalScore += 40;
  }

  // R4: High Value Last Minute - +25 pts
  if (experienceValuePercentile > 90 && refundTimingHours >= 0 && refundTimingHours < 24) {
    const rule: TriggeredRule = {
      ruleId: "R4",
      ruleName: "High-Value Last-Minute Cancel",
      scoreAdded: 25,
      detail: `Experience is in the top ${100 - experienceValuePercentile}% of value (${Math.round(experienceValuePercentile)}th percentile) and was cancelled only ${refundTimingHours.toFixed(1)} hours before the experience started.`,
      pattern: "high_value_cancel",
    };
    triggeredRules.push(rule);
    totalScore += 25;
  }

  // R5: New Account Abuse - +15 pts
  if (customerTenureMonths < 1 && totalRefundCount > 2) {
    const rule: TriggeredRule = {
      ruleId: "R5",
      ruleName: "New Account Abuse",
      scoreAdded: 15,
      detail: `Account is less than 1 month old (${customerTenureMonths < 1 ? "< 1 month" : `${customerTenureMonths} months`}) and has already submitted ${totalRefundCount} refund requests.`,
      pattern: "new_account",
    };
    triggeredRules.push(rule);
    totalScore += 15;
  }

  // R6: Repeated False No-Show - +30 pts
  if (previousNoShowCount > 2 && refundReason === "no_show") {
    const rule: TriggeredRule = {
      ruleId: "R6",
      ruleName: "Repeated False No-Show",
      scoreAdded: 30,
      detail: `Customer has ${previousNoShowCount} previous no-show refund claims on record (Policy Threshold: >2). This pattern indicates habitual false no-show abuse.`,
      pattern: "repeated_no_show",
    };
    triggeredRules.push(rule);
    totalScore += 30;
  }

  // R7: False Tech Engagement - +35 pts
  if (
    refundReason === "technical_issue" &&
    (emailEngagement === "opened" || systemLoginsLast24h > 0)
  ) {
    const engagementDetails = [];
    if (emailEngagement === "opened") engagementDetails.push("opened booking confirmation email");
    if (systemLoginsLast24h > 0) engagementDetails.push(`logged into the platform ${systemLoginsLast24h} time(s) within 24 hours of experience`);
    const rule: TriggeredRule = {
      ruleId: "R7",
      ruleName: "False Technical Issue Claim",
      scoreAdded: 35,
      detail: `Customer claims a technical issue prevented participation, but system logs show they ${engagementDetails.join(" and ")}, indicating successful access.`,
      pattern: "false_tech",
    };
    triggeredRules.push(rule);
    totalScore += 35;
  }

  // R8: Legitimate Tenure Discount - -40 pts
  if (customerTenureMonths >= 24 && totalRefundCount < 3) {
    const rule: TriggeredRule = {
      ruleId: "R8",
      ruleName: "Legitimate Tenure Discount",
      scoreAdded: -40,
      detail: `Customer has been a loyal member for ${customerTenureMonths} months (>2 years) with only ${totalRefundCount} total refund(s) in their history. Strong indicator of a legitimate claim.`,
      pattern: "legitimate",
    };
    triggeredRules.push(rule);
    totalScore -= 40;
  }

  const clampedScore = Math.max(0, Math.min(150, totalScore));

  let category: RiskCategory;
  let systemDecision: string;

  if (hasIncompleteData && clampedScore < 30) {
    category = "medium_risk";
    systemDecision = "FLAGGED FOR REVIEW — INCOMPLETE DATA (Default: Moderate Risk)";
  } else if (clampedScore >= 70) {
    category = "high_risk";
    systemDecision = "FLAGGED FOR SENIOR REVIEW";
  } else if (clampedScore >= 30) {
    category = "medium_risk";
    systemDecision = "FLAGGED FOR STANDARD REVIEW";
  } else {
    category = "auto_approve";
    systemDecision = "AUTO-APPROVED — LOW RISK";
  }

  return {
    totalScore: clampedScore,
    category,
    triggeredRules,
    hasIncompleteData,
    systemDecision,
  };
}

export function getCategoryFromStatus(status: string): RiskCategory | null {
  if (status === "auto_approved") return "auto_approve";
  if (status === "medium_risk") return "medium_risk";
  if (status === "high_risk") return "high_risk";
  return null;
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-red-600 dark:text-red-400";
  if (score >= 30) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

export function getScoreBg(score: number): string {
  if (score >= 70) return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
  if (score >= 30) return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800";
  return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
}
