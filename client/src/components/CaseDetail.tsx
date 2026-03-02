import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RefundCase } from "@shared/schema";
import { Customer360 } from "@/components/Customer360";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { ActionHub } from "@/components/ActionHub";
import { AuditTrail } from "@/components/AuditTrail";
import { TicketChatView } from "@/components/TicketChatView";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Tag,
  User,
} from "lucide-react";

interface CaseDetailProps {
  refundCase: RefundCase;
  onUpdate: (updated: RefundCase) => void;
}

function getRiskIndicator(category: string) {
  if (category === "high_risk") {
    return { dot: "bg-rose-500", label: "High Risk", text: "text-rose-600 dark:text-rose-400" };
  }
  if (category === "medium_risk") {
    return { dot: "bg-amber-500", label: "Medium Risk", text: "text-amber-600 dark:text-amber-400" };
  }
  return { dot: "bg-emerald-500", label: "Low Risk", text: "text-emerald-600 dark:text-emerald-400" };
}

function getReasonLabel(reason: string) {
  const map: Record<string, string> = {
    no_show: "No Show",
    technical_issue: "Tech Issue",
    cancellation: "Cancellation",
    weather: "Weather",
    other: "Other",
  };
  return map[reason] || reason;
}

export function CaseDetail({ refundCase, onUpdate }: CaseDetailProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { riskAssessment } = refundCase;
  const score = riskAssessment?.totalScore ?? 0;
  const category = riskAssessment?.category ?? "auto_approve";
  const risk = getRiskIndicator(category);
  const isResolved = ["approved", "denied", "escalated", "auto_approved"].includes(refundCase.status);

  return (
    <div className="flex h-full bg-background">
      {/* Center: main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Slim status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={cn("w-2 h-2 rounded-full shrink-0", risk.dot)} />
            <span className={cn("text-xs font-semibold", risk.text)}>{risk.label}</span>
            <span className="text-xs text-muted-foreground">Score: {score}</span>
            {riskAssessment?.systemDecision && (
              <span className="text-xs text-muted-foreground hidden sm:inline">· {riskAssessment.systemDecision}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{refundCase.id}</span>
            {isResolved && (
              <Badge variant="secondary" className="text-xs h-5">
                {refundCase.status === "auto_approved" ? "Auto-Approved" :
                 refundCase.status.charAt(0).toUpperCase() + refundCase.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {/* Compact case info bar */}
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-muted/20 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{refundCase.customerName}</span>
          </div>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">{refundCase.bookingId}</span>
          </div>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">${refundCase.refundAmount.toLocaleString()}</span>
          </div>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <Badge variant="outline" className="text-xs h-4 px-1.5 py-0">{getReasonLabel(refundCase.refundReason)}</Badge>
          <span className="text-muted-foreground/40 text-xs hidden md:inline">·</span>
          <span className="text-xs text-muted-foreground truncate hidden md:inline max-w-[200px]">{refundCase.experienceName}</span>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="chat" className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 border-b border-border shrink-0 bg-background">
            <TabsList className="h-8 bg-transparent gap-0.5 rounded-none p-0">
              <TabsTrigger
                value="chat"
                className="text-xs rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground h-7"
                data-testid="tab-chat"
              >
                Ticket & Chat
              </TabsTrigger>
              <TabsTrigger
                value="reasoning"
                className="text-xs rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground h-7"
                data-testid="tab-reasoning"
              >
                Reasoning
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="text-xs rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground h-7"
                data-testid="tab-audit"
              >
                Audit
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <TicketChatView refundCase={refundCase} />
          </TabsContent>

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

        {/* Action hub */}
        {!isResolved && (
          <div className="shrink-0 border-t border-border bg-card/50 p-3">
            <ActionHub refundCase={refundCase} onUpdate={onUpdate} />
          </div>
        )}
        {isResolved && refundCase.status !== "auto_approved" && (
          <div className="shrink-0 border-t border-border bg-muted/20 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Case resolved — {refundCase.status}{refundCase.agentNotes ? `. ${refundCase.agentNotes}` : ""}</span>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Customer 360 sidebar */}
      {sidebarOpen ? (
        <div className="w-60 shrink-0 border-l border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer 360</span>
            <Button
              size="icon"
              variant="ghost"
              className="w-5 h-5"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-close-sidebar"
              title="Hide sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <Customer360 refundCase={refundCase} />
          </ScrollArea>
        </div>
      ) : (
        <div className="w-8 shrink-0 border-l border-border flex flex-col items-center py-3">
          <Button
            size="icon"
            variant="ghost"
            className="w-6 h-6"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
            title="Show customer details"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
