import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RefundCase } from "@shared/schema";
import { Customer360 } from "@/components/Customer360";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { ActionHub } from "@/components/ActionHub";
import { AuditTrail } from "@/components/AuditTrail";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  User,
  CalendarDays,
  DollarSign,
  Tag,
} from "lucide-react";

interface CaseDetailProps {
  refundCase: RefundCase;
  onUpdate: (updated: RefundCase) => void;
}

function getRiskHeader(score: number, category: string) {
  if (category === "high_risk") {
    return {
      label: "HIGH RISK",
      bg: "bg-red-600",
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  }
  if (category === "medium_risk") {
    return {
      label: "MEDIUM RISK",
      bg: "bg-orange-500",
      icon: <Clock className="w-4 h-4" />,
    };
  }
  return {
    label: "LOW RISK",
    bg: "bg-green-600",
    icon: <CheckCircle2 className="w-4 h-4" />,
  };
}

function getReasonLabel(reason: string) {
  const map: Record<string, string> = {
    no_show: "No Show",
    technical_issue: "Technical Issue",
    cancellation: "Cancellation",
    weather: "Weather-Related",
    other: "Other",
  };
  return map[reason] || reason;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CaseDetail({ refundCase, onUpdate }: CaseDetailProps) {
  const { riskAssessment } = refundCase;
  const score = riskAssessment?.totalScore ?? 0;
  const category = riskAssessment?.category ?? "auto_approve";
  const header = getRiskHeader(score, category);

  const isResolved = ["approved", "denied", "escalated", "auto_approved"].includes(refundCase.status);

  return (
    <div className="flex h-full bg-background">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Risk Score Header */}
        <div className={cn("flex items-center justify-between px-4 py-2.5 text-white shrink-0", header.bg)}>
          <div className="flex items-center gap-2.5">
            {header.icon}
            <div>
              <div className="font-bold text-sm tracking-wide">
                {header.label} — SCORE: {score}
              </div>
              <div className="text-xs opacity-90">{riskAssessment?.systemDecision}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs opacity-80">Case ID</div>
              <div className="font-mono text-sm font-semibold">{refundCase.id}</div>
            </div>
            {isResolved && (
              <Badge className="bg-white/20 text-white text-xs border-white/30">
                {refundCase.status === "auto_approved" ? "Auto-Approved" : 
                 refundCase.status.charAt(0).toUpperCase() + refundCase.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {/* Case Info Bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card/50 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{refundCase.customerName}</span>
            <span className="text-xs text-muted-foreground">({refundCase.customerId})</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Booking:</span>
            <span className="text-sm font-mono text-foreground">{refundCase.bookingId}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">${refundCase.refundAmount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">refund requested</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{formatDateTime(refundCase.requestDate)}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="secondary" className="text-xs">{getReasonLabel(refundCase.refundReason)}</Badge>
        </div>

        {/* Experience Info */}
        <div className="px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-semibold text-sm text-foreground">{refundCase.experienceName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {refundCase.experienceCategory} · Experience date: {formatDateTime(refundCase.experienceDate)} · Value: ${refundCase.experienceValue.toLocaleString()} ({refundCase.experienceValuePercentile}th percentile)
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reasoning" className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 border-b border-border shrink-0 bg-background">
            <TabsList className="h-9 bg-transparent gap-1 rounded-none p-0">
              <TabsTrigger
                value="reasoning"
                className="text-xs rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                data-testid="tab-reasoning"
              >
                Reasoning & Evidence
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="text-xs rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                data-testid="tab-audit"
              >
                Audit Trail
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reasoning" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4">
                <ReasoningPanel refundCase={refundCase} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="audit" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4">
                <AuditTrail refundCase={refundCase} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Action Hub */}
        {!isResolved && (
          <div className="shrink-0 border-t border-border bg-card/50 p-4">
            <ActionHub refundCase={refundCase} onUpdate={onUpdate} />
          </div>
        )}
        {isResolved && refundCase.status !== "auto_approved" && (
          <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span>Case resolved — {refundCase.status}. {refundCase.agentNotes ? `Notes: ${refundCase.agentNotes}` : ""}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Customer 360 */}
      <div className="w-72 shrink-0 border-l border-border overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <Customer360 refundCase={refundCase} />
        </ScrollArea>
      </div>
    </div>
  );
}
