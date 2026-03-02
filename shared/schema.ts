import { z } from "zod";

export const refundReasonEnum = z.enum([
  "no_show",
  "technical_issue",
  "cancellation",
  "weather",
  "other",
]);

export const emailEngagementEnum = z.enum([
  "opened",
  "not_opened",
  "unavailable",
]);

export const caseStatusEnum = z.enum([
  "pending",
  "auto_approved",
  "medium_risk",
  "high_risk",
  "approved",
  "denied",
  "escalated",
]);

export const riskCategoryEnum = z.enum([
  "auto_approve",
  "medium_risk",
  "high_risk",
]);

export type RefundReason = z.infer<typeof refundReasonEnum>;
export type EmailEngagement = z.infer<typeof emailEngagementEnum>;
export type CaseStatus = z.infer<typeof caseStatusEnum>;
export type RiskCategory = z.infer<typeof riskCategoryEnum>;

export interface TriggeredRule {
  ruleId: string;
  ruleName: string;
  scoreAdded: number;
  detail: string;
  pattern: string;
}

export interface RiskAssessment {
  totalScore: number;
  category: RiskCategory;
  triggeredRules: TriggeredRule[];
  hasIncompleteData: boolean;
  systemDecision: string;
}

export interface AuditEntry {
  id: string;
  caseId: string;
  timestamp: string;
  action: string;
  actor: "system" | "agent";
  detail: string;
}

export interface RefundCase {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  bookingId: string;
  experienceName: string;
  experienceCategory: string;
  experienceValue: number;
  experienceValuePercentile: number;
  refundReason: RefundReason;
  refundAmount: number;
  refundTimingHours: number;
  customerTenureMonths: number;
  refundCountLast6Months: number;
  totalRefundCount: number;
  emailEngagement: EmailEngagement;
  systemLoginsLast24h: number;
  previousNoShowCount: number;
  requestDate: string;
  experienceDate: string;
  status: CaseStatus;
  riskAssessment?: RiskAssessment;
  agentId?: string;
  agentNotes?: string;
  overrideReason?: string;
  resolvedAt?: string;
  auditTrail: AuditEntry[];
  emailEngagementLog?: EmailEngagementLog[];
  refundHistory?: RefundHistoryEntry[];
}

export interface EmailEngagementLog {
  timestamp: string;
  event: string;
  device: string;
  location: string;
}

export interface RefundHistoryEntry {
  date: string;
  experience: string;
  amount: number;
  reason: string;
  outcome: string;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  triggerRules: string[];
  subject: string;
  body: string;
}

export interface DashboardMetrics {
  totalCases: number;
  autoApproved: number;
  mediumRisk: number;
  highRisk: number;
  approved: number;
  denied: number;
  escalated: number;
  avgRiskScore: number;
  manualReviewHoursTarget: number;
  manualReviewHoursCurrent: number;
  fraudReductionPct: number;
  falsePosRate: number;
  autoApprovalRate: number;
}

export const insertAuditEntrySchema = z.object({
  caseId: z.string(),
  action: z.string(),
  actor: z.enum(["system", "agent"]),
  detail: z.string(),
});

export type InsertAuditEntry = z.infer<typeof insertAuditEntrySchema>;

export const updateCaseSchema = z.object({
  caseId: z.string(),
  status: caseStatusEnum,
  agentNotes: z.string().optional(),
  overrideReason: z.string().optional(),
  templateId: z.string().optional(),
});

export type UpdateCase = z.infer<typeof updateCaseSchema>;

export type User = { id: string; username: string };
export type InsertUser = { username: string; password: string };
