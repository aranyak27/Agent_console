# RADS — Refund Abuse Detection System

## Overview
An enterprise-grade Agent Console for detecting and managing refund abuse at ExperienceCo. Built as a functional prototype with a deterministic rules-based risk scoring engine (8 rules), dual-pane agent workspace, reasoning panel, policy template engine, audit trail, and performance dashboard.

## Architecture
- **Frontend**: React + TypeScript + Vite + TanStack Query + Recharts
- **Backend**: Express.js (serves API routes for audit logging and case updates)
- **Storage**: In-memory (MemStorage) — prototype with mock data
- **Styling**: Tailwind CSS + shadcn/ui components

## Key Features
1. **Risk Scoring Engine** (8 deterministic rules R1-R8, 0-100+ score)
2. **Auto-classification**: Auto-Approve (<30), Medium Risk (30-70), High Risk (70+)
3. **Dual-Pane Agent Workspace**: Case Queue (left) + Case Detail (right)
4. **Agent Reasoning Panel**: Triggered rules with evidence, score breakdown, log modals
5. **Policy Template Engine**: 5 denial email templates matching rule patterns
6. **Customer 360 Panel**: Tenure, history, engagement, policy reference
7. **Audit Trail**: Timeline of all system and agent actions per case
8. **Action Hub**: Approve / Deny (with template) / Escalate / Override with audit log
9. **Performance Dashboard**: Charts, KPIs, manual review reduction tracking

## Routes
- `GET /` — Agent Workspace (main dual-pane view)
- `GET /dashboard` — Performance Dashboard (lead view)
- `GET /api/audit/:caseId` — Get audit entries for a case
- `POST /api/audit` — Add audit entry
- `POST /api/cases/update` — Update case status

## File Structure
- `client/src/lib/mockData.ts` — 25 realistic mock refund cases
- `client/src/lib/scoringEngine.ts` — Risk score calculation (R1-R8 rules)
- `client/src/lib/policyTemplates.ts` — 5 denial email templates
- `client/src/pages/AgentWorkspace.tsx` — Main workspace page
- `client/src/pages/Dashboard.tsx` — Performance dashboard
- `client/src/components/CaseQueue.tsx` — Left pane case list
- `client/src/components/CaseDetail.tsx` — Right pane case detail
- `client/src/components/ReasoningPanel.tsx` — Rule evidence panel
- `client/src/components/ActionHub.tsx` — Approve/Deny/Escalate/Override
- `client/src/components/Customer360.tsx` — Right sidebar customer data
- `client/src/components/AuditTrail.tsx` — Case timeline
- `client/src/components/AppHeader.tsx` — Header with navigation
- `client/src/components/ThemeProvider.tsx` — Dark/light mode

## Risk Rules
| Rule | Name | Points |
|------|------|--------|
| R1 | Serial Refunder (Extreme) >20 in 6 mo + tenure <1yr | +50 |
| R2 | Serial Refunder (Moderate) >10 in 6 mo | +35 |
| R3 | No-Show with Email Engagement | +40 |
| R4 | High-Value Last-Minute Cancel (>90th pct, <24h) | +25 |
| R5 | New Account Abuse (<1 mo + >2 refunds) | +15 |
| R6 | Repeated False No-Show (>2 prev) | +30 |
| R7 | False Technical Issue Claim | +35 |
| R8 | Legitimate Tenure Discount (>2yr + <3 total) | -40 |
