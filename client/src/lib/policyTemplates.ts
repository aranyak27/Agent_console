import type { PolicyTemplate } from "@shared/schema";

export const policyTemplates: PolicyTemplate[] = [
  {
    id: "T1",
    name: "Serial Refunder Denial",
    triggerRules: ["R1", "R2"],
    subject: "Your Refund Request — Case #{{caseId}} — Decision",
    body: `Dear {{customerName}},

Thank you for reaching out to Headout Support regarding your recent booking ({{bookingId}}).

After a thorough review of your account and refund history, we regret to inform you that we are unable to approve this refund request at this time.

Our records indicate an unusually high volume of refund requests associated with your account that falls outside our standard refund policy thresholds. Per our Terms of Service (Section 5.3), accounts exhibiting patterns inconsistent with our usage policies may have refund requests declined.

If you believe this decision is in error, or if you have documentation that supports your claim, please reply to this email and our specialist team will review your case manually.

We value your patronage and hope to continue providing you with great experiences.

Warm regards,
Headout Customer Support Team`,
  },
  {
    id: "T2",
    name: "False No-Show Denial",
    triggerRules: ["R3", "R6"],
    subject: "Your Refund Request — Case #{{caseId}} — Decision",
    body: `Dear {{customerName}},

Thank you for contacting Headout Support regarding your booking ({{bookingId}}).

We have carefully reviewed your refund request for "{{experienceName}}" citing a no-show.

Upon review of our system records, we have identified activity associated with your account (including email engagement and platform access) during the time of the experience. Our no-show refund policy requires that the customer was genuinely unable to attend with no prior engagement or access to the booking materials.

Based on this evidence, we are unable to approve the requested refund under the no-show policy.

If you have additional context or documentation that explains this discrepancy, please don't hesitate to share it with us and we'll be happy to take another look.

Kind regards,
Headout Customer Support Team`,
  },
  {
    id: "T3",
    name: "False Technical Issue Denial",
    triggerRules: ["R7"],
    subject: "Your Refund Request — Case #{{caseId}} — Technical Issue Claim",
    body: `Dear {{customerName}},

Thank you for reaching out to Headout Support about your booking ({{bookingId}}).

We have reviewed your refund request citing a technical issue that prevented you from accessing or using the experience.

Our system logs indicate that your account was successfully accessed and booking materials were engaged with during the relevant time period. This suggests our platform was accessible and functional for your account at the time of the experience.

As a result, we are unable to approve a refund on the basis of a technical issue for this booking.

We take technical complaints seriously and continuously work to improve our platform. If you experienced a specific technical issue, please describe it in detail so our engineering team can investigate and prevent future occurrences.

Best regards,
Headout Customer Support Team`,
  },
  {
    id: "T4",
    name: "High-Value Last-Minute Cancellation Denial",
    triggerRules: ["R4"],
    subject: "Your Refund Request — Case #{{caseId}} — Outside Cancellation Window",
    body: `Dear {{customerName}},

Thank you for contacting Headout Support regarding your booking ({{bookingId}}).

We have reviewed your refund request for "{{experienceName}}."

Unfortunately, this cancellation request was submitted outside our standard cancellation window. For high-value experiences, our policy requires cancellation requests to be made at least 24 hours before the scheduled experience time in order to qualify for a full refund.

Your cancellation request was received approximately {{refundTiming}} before the experience, which falls within our non-refundable window.

We understand this may be disappointing. As a one-time courtesy, we may be able to offer an experience credit. Please reply to this email to discuss this option with our team.

With apologies for any inconvenience,
Headout Customer Support Team`,
  },
  {
    id: "T5",
    name: "New Account Policy Denial",
    triggerRules: ["R5"],
    subject: "Your Refund Request — Case #{{caseId}} — Account Review",
    body: `Dear {{customerName}},

Thank you for contacting Headout Support.

We have received your refund request for booking ({{bookingId}}).

As part of our standard fraud prevention measures, we conduct enhanced reviews of refund requests from recently created accounts. After reviewing your account history, we are unable to process this refund at this time.

If you are a genuine customer and believe this decision is incorrect, we warmly encourage you to contact us via live chat or phone to speak directly with a specialist who can review your case with additional context.

We apologize for any inconvenience and appreciate your understanding.

Sincerely,
Headout Customer Support Team`,
  },
];

export interface ApprovalTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const approvalTemplates: ApprovalTemplate[] = [
  {
    id: "A1",
    name: "Standard Approval",
    subject: "Your Refund Request — Case #{{caseId}} — Approved",
    body: `Dear {{customerName}},

We are pleased to inform you that your refund request for booking {{bookingId}} has been approved.

Refund amount: {{refundAmount}}
Expected processing time: 5–7 business days
Refund method: Original payment method

We apologize for any inconvenience and hope to welcome you back to Headout soon.

Warm regards,
Headout Customer Support Team`,
  },
  {
    id: "A2",
    name: "Goodwill Approval",
    subject: "Your Refund Request — Case #{{caseId}} — Approved",
    body: `Dear {{customerName}},

Thank you for your patience while we reviewed your refund request for booking {{bookingId}}.

We understand that circumstances don't always go as planned. As a gesture of goodwill, we are pleased to approve your refund of {{refundAmount}}.

Your refund will be processed within 5–7 business days to your original payment method.

We truly value your continued support and look forward to welcoming you back soon.

Kind regards,
Headout Customer Support Team`,
  },
  {
    id: "A3",
    name: "Loyalty Appreciation Approval",
    subject: "Your Refund Request — Case #{{caseId}} — Approved",
    body: `Dear {{customerName}},

As a valued long-standing member of the Headout community, we are happy to approve your refund request for booking {{bookingId}}.

Refund amount: {{refundAmount}}
Processing time: 5–7 business days

Your loyalty means a great deal to us. We look forward to welcoming you back for more great experiences.

With gratitude,
Headout Customer Support Team`,
  },
  {
    id: "A4",
    name: "Experience Credit Offer",
    subject: "Your Refund Request — Case #{{caseId}} — Credit Offered",
    body: `Dear {{customerName}},

Thank you for contacting Headout Support regarding booking {{bookingId}}.

While a direct cash refund is not available under our standard policy, we would like to offer you an Headout Experience Credit of {{refundAmount}} valid for 12 months — giving you the flexibility to rebook any experience at your convenience.

To accept this offer, please reply to this email and we'll apply the credit to your account within 24 hours.

We hope to have the opportunity to make your next experience exceptional.

Best regards,
Headout Customer Support Team`,
  },
];

export function getTemplatesForRules(ruleIds: string[]): PolicyTemplate[] {
  return policyTemplates.filter((t) =>
    t.triggerRules.some((r) => ruleIds.includes(r))
  );
}

export function getTemplateById(id: string): PolicyTemplate | undefined {
  return policyTemplates.find((t) => t.id === id);
}
