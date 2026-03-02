import type { AuditEntry, UpdateCase } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAuditEntries(caseId: string): Promise<AuditEntry[]>;
  addAuditEntry(entry: Omit<AuditEntry, "id">): Promise<AuditEntry>;
  updateCase(update: UpdateCase): Promise<{ success: boolean }>;
}

export class MemStorage implements IStorage {
  private auditEntries: Map<string, AuditEntry[]>;
  private caseUpdates: Map<string, UpdateCase>;

  constructor() {
    this.auditEntries = new Map();
    this.caseUpdates = new Map();
  }

  async getAuditEntries(caseId: string): Promise<AuditEntry[]> {
    return this.auditEntries.get(caseId) || [];
  }

  async addAuditEntry(entry: Omit<AuditEntry, "id">): Promise<AuditEntry> {
    const id = randomUUID();
    const full: AuditEntry = { ...entry, id };
    const existing = this.auditEntries.get(entry.caseId) || [];
    this.auditEntries.set(entry.caseId, [...existing, full]);
    return full;
  }

  async updateCase(update: UpdateCase): Promise<{ success: boolean }> {
    this.caseUpdates.set(update.caseId, update);
    return { success: true };
  }
}

export const storage = new MemStorage();
