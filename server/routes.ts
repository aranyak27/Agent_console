import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAuditEntrySchema, updateCaseSchema } from "@shared/schema";
import { z } from "zod";
import { getOpenAiClient } from "./openai";

const draftReplySchema = z.object({
  caseId: z.string(),
  customerName: z.string(),
  bookingId: z.string(),
  experienceName: z.string(),
  refundAmount: z.number(),
  refundReason: z.string(),
  riskScore: z.number(),
  riskCategory: z.string(),
  triggeredRules: z.array(z.object({ ruleId: z.string(), ruleName: z.string() })),
  lastCustomerMessage: z.string(),
  emailEngagement: z.string(),
  customerTenureMonths: z.number(),
  previousNoShowCount: z.number(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/audit/:caseId", async (req, res) => {
    const entries = await storage.getAuditEntries(req.params.caseId);
    res.json(entries);
  });

  app.post("/api/audit", async (req, res) => {
    const result = insertAuditEntrySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.message });
    }
    const entry = await storage.addAuditEntry({
      ...result.data,
      timestamp: new Date().toISOString(),
    });
    res.json(entry);
  });

  app.post("/api/cases/update", async (req, res) => {
    const result = updateCaseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.message });
    }
    const update = await storage.updateCase(result.data);
    res.json(update);
  });

  app.post("/api/ai/draft-reply", async (req, res) => {
    const result = draftReplySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const data = result.data;

    try {
      const openai = getOpenAiClient();

      const ruleDetails = data.triggeredRules.length > 0
        ? `Risk rules triggered: ${data.triggeredRules.map((r) => `${r.ruleId} (${r.ruleName})`).join(", ")}`
        : "No specific risk rules triggered — appears to be a legitimate claim.";

      const fraudIndicator = data.riskCategory === "high_risk"
        ? "HIGH RISK: Multiple fraud indicators detected. The reply should be professional and non-committal, requesting documentation without directly accusing the customer."
        : data.riskCategory === "medium_risk"
        ? "MEDIUM RISK: Some suspicious patterns detected. The reply should acknowledge the request while indicating review is in progress."
        : "LOW RISK: Appears legitimate. The reply should be warm and indicate the refund is being processed.";

      const systemPrompt = `You are a professional Customer Support agent at Headout, a travel experiences platform. 
Draft a polished, empathetic email reply to a customer's refund request.

Guidelines:
- Be professional, empathetic, and concise (max 150 words)
- Do NOT make any commitments about approval or denial — you are only acknowledging and informing
- Use the customer's first name
- Reference the booking ID naturally
- Maintain a warm but professional tone
- Do not include subject line — just the email body
- Start with "Dear [Name]," and end with "Kind regards,\nHeadout Customer Support Team"`;

      const userPrompt = `Customer: ${data.customerName}
Booking ID: ${data.bookingId}
Experience: ${data.experienceName}
Refund Amount: $${data.refundAmount}
Stated Reason: ${data.refundReason.replace(/_/g, " ")}
${ruleDetails}
${fraudIndicator}
Customer Tenure: ${data.customerTenureMonths} months
Previous No-Shows: ${data.previousNoShowCount}
Email Engagement: ${data.emailEngagement}

Last customer message:
"${data.lastCustomerMessage}"

Draft a reply for the support agent to send:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const draft = response.choices[0]?.message?.content?.trim() || "";
      res.json({ draft });
    } catch (err: any) {
      console.error("AI draft error:", err?.message || err);
      res.status(503).json({ error: "AI service unavailable" });
    }
  });

  return httpServer;
}
