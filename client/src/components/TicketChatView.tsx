import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { RefundCase } from "@shared/schema";
import { getTicketForCase, type SupportTicket, type TicketMessage } from "@/lib/mockTickets";
import { policyTemplates } from "@/lib/policyTemplates";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Mail,
  MessageSquare,
  Globe,
  Sparkles,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Headphones,
  AlertCircle,
  RefreshCw,
  Reply,
  Paperclip,
  Check,
  Loader2,
} from "lucide-react";

interface TicketChatViewProps {
  refundCase: RefundCase;
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "email": return <Mail className="w-3.5 h-3.5" />;
    case "chat": return <MessageSquare className="w-3.5 h-3.5" />;
    case "portal": return <Globe className="w-3.5 h-3.5" />;
    default: return <Mail className="w-3.5 h-3.5" />;
  }
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "urgent": return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
    case "high": return "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300";
    case "medium": return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
    default: return "bg-muted text-muted-foreground";
  }
}

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const QUICK_TEMPLATES = [
  {
    id: "ack",
    label: "Acknowledgement",
    body: (c: RefundCase) =>
      `Dear ${c.customerName},\n\nThank you for contacting Headout Support. We have received your refund request for booking ${c.bookingId} and it is currently under review.\n\nWe aim to respond within 24 hours. We appreciate your patience.\n\nKind regards,\nHeadout Customer Support`,
  },
  {
    id: "info_needed",
    label: "Request More Info",
    body: (c: RefundCase) =>
      `Dear ${c.customerName},\n\nThank you for reaching out regarding booking ${c.bookingId}.\n\nTo process your refund request, we require additional information:\n\n• A brief description of the circumstances\n• Any supporting documentation (if applicable)\n• Your preferred resolution\n\nPlease reply to this email at your earliest convenience.\n\nBest regards,\nHeadout Customer Support`,
  },
  {
    id: "approved",
    label: "Refund Approved",
    body: (c: RefundCase) =>
      `Dear ${c.customerName},\n\nWe're pleased to inform you that your refund request for booking ${c.bookingId} has been approved.\n\nRefund amount: $${c.refundAmount.toLocaleString()}\nExpected processing time: 5–7 business days\nRefund method: Original payment method\n\nWe apologize for any inconvenience caused and hope to welcome you back to Headout soon.\n\nWarm regards,\nHeadout Customer Support`,
  },
  {
    id: "escalated",
    label: "Case Escalated",
    body: (c: RefundCase) =>
      `Dear ${c.customerName},\n\nThank you for your patience regarding booking ${c.bookingId}.\n\nYour case has been escalated to our senior review team for further assessment. A dedicated specialist will contact you within 4–6 hours with a resolution.\n\nWe appreciate your understanding.\n\nBest regards,\nHeadout Senior Support Team`,
  },
];

function MessageBubble({ msg }: { msg: TicketMessage }) {
  const isCustomer = msg.fromRole === "customer";
  const isSystem = msg.fromRole === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
          {msg.body}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 mb-4", isCustomer ? "flex-row" : "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
        isCustomer
          ? "bg-muted border border-border text-muted-foreground"
          : "bg-primary text-primary-foreground"
      )}>
        {isCustomer
          ? msg.from.split(" ").map((n) => n[0]).join("").slice(0, 2)
          : <Headphones className="w-4 h-4" />}
      </div>

      <div className={cn("max-w-[75%]", isCustomer ? "" : "items-end flex flex-col")}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-semibold text-foreground">{msg.from}</span>
          <span className="text-xs text-muted-foreground">{msg.fromEmail}</span>
          <span className="text-xs text-muted-foreground">{formatMessageTime(msg.timestamp)}</span>
          {!msg.isRead && isCustomer && (
            <Badge className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 py-0">
              Unread
            </Badge>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap border",
          isCustomer
            ? "bg-card border-border text-foreground"
            : "bg-primary/10 border-primary/20 text-foreground"
        )}>
          {msg.body}
        </div>
      </div>
    </div>
  );
}

export function TicketChatView({ refundCase }: TicketChatViewProps) {
  const { toast } = useToast();
  const ticket = getTicketForCase(refundCase.id);
  const [messages, setMessages] = useState<TicketMessage[]>(ticket.messages);
  const [replyBody, setReplyBody] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const aiDraftMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/draft-reply", {
        caseId: refundCase.id,
        customerName: refundCase.customerName,
        bookingId: refundCase.bookingId,
        experienceName: refundCase.experienceName,
        refundAmount: refundCase.refundAmount,
        refundReason: refundCase.refundReason,
        riskScore: refundCase.riskAssessment?.totalScore ?? 0,
        riskCategory: refundCase.riskAssessment?.category ?? "auto_approve",
        triggeredRules: refundCase.riskAssessment?.triggeredRules?.map((r) => ({
          ruleId: r.ruleId,
          ruleName: r.ruleName,
        })) ?? [],
        lastCustomerMessage: messages.filter((m) => m.fromRole === "customer").at(-1)?.body ?? "",
        emailEngagement: refundCase.emailEngagement,
        customerTenureMonths: refundCase.customerTenureMonths,
        previousNoShowCount: refundCase.previousNoShowCount,
      });
      return (await res.json()) as { draft: string };
    },
    onSuccess: (data) => {
      setReplyBody(data.draft);
      toast({ title: "AI draft generated", description: "Review and edit before sending." });
    },
    onError: () => {
      toast({
        title: "AI draft unavailable",
        description: "Could not generate a draft. Try a manual template instead.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!replyBody.trim()) return;
    const newMsg: TicketMessage = {
      id: `msg-sent-${Date.now()}`,
      from: "Sarah Agent (You)",
      fromEmail: "support@headout.com",
      fromRole: "agent",
      to: refundCase.customerEmail,
      subject: `Re: ${ticket.subject}`,
      body: replyBody.trim(),
      timestamp: new Date().toISOString(),
      isRead: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setReplyBody("");
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2000);
    toast({ title: "Reply sent", description: `Email sent to ${refundCase.customerEmail}` });
  };

  const applyQuickTemplate = (templateId: string) => {
    const tmpl = QUICK_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) setReplyBody(tmpl.body(refundCase));
  };

  const unreadCount = messages.filter((m) => m.fromRole === "customer" && !m.isRead).length;

  return (
    <div className="flex flex-col h-full">
      {/* Ticket Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">{ticket.ticketId}</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getChannelIcon(ticket.channel)}
                <span className="capitalize">{ticket.channel}</span>
              </div>
              <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium capitalize", getPriorityStyle(ticket.priority))}>
                {ticket.priority}
              </span>
              {unreadCount > 0 && (
                <Badge className="text-xs bg-blue-500 text-white py-0">{unreadCount} unread</Badge>
              )}
            </div>
            <div className="font-semibold text-sm text-foreground truncate">{ticket.subject}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {refundCase.customerName} · {refundCase.customerEmail}
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 text-right">
            <div>{messages.length} message{messages.length !== 1 ? "s" : ""}</div>
            <div className="mt-0.5">Opened {formatMessageTime(ticket.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
      </div>

      {/* Reply Composer */}
      <div className="shrink-0 border-t border-border bg-background">
        {/* Composer Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Reply className="w-3.5 h-3.5" />
            <span>Reply to:</span>
            <span className="font-medium text-foreground">{refundCase.customerEmail}</span>
          </div>
          <button
            onClick={() => setShowCc(!showCc)}
            className="text-xs text-muted-foreground ml-auto"
            data-testid="button-toggle-cc"
          >
            {showCc ? "Hide CC" : "Add CC"}
          </button>
        </div>

        {showCc && (
          <div className="px-4 py-2 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-6">CC:</Label>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="h-7 text-xs bg-background flex-1"
                data-testid="input-cc"
              />
            </div>
          </div>
        )}

        {/* AI Assist + Templates Bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => aiDraftMutation.mutate()}
            disabled={aiDraftMutation.isPending}
            data-testid="button-ai-draft"
          >
            {aiDraftMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-purple-500" />
            )}
            {aiDraftMutation.isPending ? "Drafting..." : "AI Assist"}
          </Button>

          <Select onValueChange={applyQuickTemplate}>
            <SelectTrigger
              className="h-7 text-xs w-auto min-w-[140px]"
              data-testid="select-quick-template"
            >
              <FileText className="w-3 h-3 mr-1.5" />
              <SelectValue placeholder="Quick Templates" />
            </SelectTrigger>
            <SelectContent>
              {QUICK_TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1.5"
            onClick={() => setTemplateModalOpen(true)}
            data-testid="button-policy-templates"
          >
            <FileText className="w-3 h-3" />
            Policy Templates
          </Button>

          {replyBody && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground ml-auto"
              onClick={() => setReplyBody("")}
              data-testid="button-clear-reply"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Textarea */}
        <div className="px-4 pb-2">
          <Textarea
            placeholder="Write your reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            className="text-sm min-h-[100px] resize-none bg-background"
            data-testid="textarea-reply"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {(replyBody ?? "").length} characters
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                data-testid="button-attach"
              >
                <Paperclip className="w-3 h-3 mr-1" />
                Attach
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleSend}
                disabled={!(replyBody ?? "").trim()}
                data-testid="button-send-reply"
              >
                {isSent ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isSent ? "Sent!" : "Send Reply"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Templates Modal */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-xl" data-testid="modal-policy-templates">
          <DialogHeader>
            <DialogTitle className="text-sm">Policy Email Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Select a template to pre-fill the reply box. Review and edit before sending.
            </p>
            {policyTemplates.map((t) => (
              <div key={t.id} className="rounded-md border border-border p-3 hover-elevate bg-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Triggers: {t.triggerRules.join(", ")}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    onClick={() => {
                      const filled = t.body
                        .replace(/{{customerName}}/g, refundCase.customerName)
                        .replace(/{{caseId}}/g, refundCase.id)
                        .replace(/{{bookingId}}/g, refundCase.bookingId)
                        .replace(/{{experienceName}}/g, refundCase.experienceName)
                        .replace(/{{refundTiming}}/g, `${Math.abs(refundCase.refundTimingHours).toFixed(1)} hours`);
                      setReplyBody(filled);
                      setTemplateModalOpen(false);
                    }}
                    data-testid={`button-use-template-${t.id}`}
                  >
                    Use Template
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 font-sans leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {t.subject.replace("{{caseId}}", refundCase.id)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
