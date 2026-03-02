import { Search, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { RefundCase } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CaseQueueProps {
  cases: RefundCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  totalCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const FILTER_OPTS = [
  { label: "All", value: "all" },
  { label: "High", value: "high_risk" },
  { label: "Medium", value: "medium_risk" },
  { label: "Resolved", value: "approved" },
];

function getStatusDot(status: string) {
  switch (status) {
    case "high_risk": return <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-[3px]" />;
    case "medium_risk": return <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-[3px]" />;
    case "auto_approved":
    case "approved": return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-[3px]" />;
    case "denied": return <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-[3px]" />;
    case "escalated": return <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-[3px]" />;
    default: return <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-[3px]" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "high_risk": return <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">High</span>;
    case "medium_risk": return <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">Med</span>;
    case "auto_approved": return <span className="text-[10px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Auto</span>;
    case "approved": return <span className="text-[10px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">OK</span>;
    case "denied": return <span className="text-[10px] text-muted-foreground whitespace-nowrap">Denied</span>;
    case "escalated": return <span className="text-[10px] text-violet-600 dark:text-violet-400 whitespace-nowrap">Esc.</span>;
    default: return <span className="text-[10px] text-muted-foreground whitespace-nowrap">Pending</span>;
  }
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-rose-600 dark:text-rose-400";
  if (score >= 30) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function formatReason(reason: string) {
  const map: Record<string, string> = {
    no_show: "No Show",
    technical_issue: "Tech",
    cancellation: "Cancel",
    weather: "Weather",
    other: "Other",
  };
  return map[reason] || reason;
}

export function CaseQueue({
  cases,
  selectedCaseId,
  onSelectCase,
  statusFilter,
  onStatusFilter,
  searchQuery,
  onSearch,
  totalCount,
  collapsed,
  onToggleCollapse,
}: CaseQueueProps) {
  if (collapsed) {
    return (
      <div className="w-10 shrink-0 flex flex-col items-center border-r border-border bg-sidebar py-3 gap-3">
        <Button
          size="icon"
          variant="ghost"
          className="w-7 h-7"
          onClick={onToggleCollapse}
          data-testid="button-expand-queue"
          title="Expand case queue"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div
          className="text-[10px] text-muted-foreground font-medium tracking-widest select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {cases.length} cases
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-sidebar">
      <div className="p-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="font-semibold text-sm text-sidebar-foreground">Queue</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{cases.length}/{totalCount}</span>
            <Button
              size="icon"
              variant="ghost"
              className="w-6 h-6"
              onClick={onToggleCollapse}
              data-testid="button-collapse-queue"
              title="Collapse queue"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-8 h-7 text-xs bg-background"
            data-testid="input-search-cases"
          />
        </div>

        {/* Filter pills — use flex-wrap + whitespace-nowrap to prevent truncation */}
        <div className="flex flex-wrap gap-1">
          {FILTER_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilter(opt.value)}
              data-testid={`filter-${opt.value}`}
              className={cn(
                "whitespace-nowrap shrink-0 px-2 py-0.5 text-xs rounded border transition-colors",
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Case list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {cases.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">No cases match your filters</div>
          ) : (
            cases.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                data-testid={`case-item-${c.id}`}
                className={cn(
                  "w-full text-left rounded-md px-2.5 py-2 transition-colors",
                  selectedCaseId === c.id
                    ? "bg-sidebar-accent"
                    : "hover:bg-sidebar-accent/50"
                )}
              >
                <div className="flex items-start gap-2">
                  {getStatusDot(c.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{c.id}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {c.riskAssessment && (
                          <span className={cn("text-[10px] font-bold tabular-nums", getScoreColor(c.riskAssessment.totalScore))}>
                            {c.riskAssessment.totalScore}
                          </span>
                        )}
                        {getStatusLabel(c.status)}
                      </div>
                    </div>
                    <div className="font-medium text-xs text-sidebar-foreground truncate">{c.customerName}</div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">{c.experienceName}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatReason(c.refundReason)}</span>
                      <span className="text-[10px] font-medium text-foreground">${c.refundAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
