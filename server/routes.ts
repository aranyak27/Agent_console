import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAuditEntrySchema, updateCaseSchema } from "@shared/schema";

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

  return httpServer;
}
