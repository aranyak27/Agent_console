import { Search, Filter, AlertTriangle, Clock, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { RefundCase } from "@shared/schema";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface CaseQueueProps {
  cases: RefundCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  filterOptions: FilterOption[];
  totalCount: number;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "high_risk":
      return <Badge variant="destructive" className="text-xs shrink-0">High Risk</Badge>;
    case "medium_risk":
      return <Badge className="text-xs shrink-0 bg-orange-500 dark:bg-orange-600 text-white">Med Risk</Badge>;
    case "auto_approved":
      return <Badge className="text-xs shrink-0 bg-green-600 dark:bg-green-700 text-white">Auto-Approved</Badge>;
    case "approved":
      return <Badge className="text-xs shrink-0 bg-green-600 dark:bg-green-700 text-white">Approved</Badge>;
    case "denied":
      return <Badge className="text-xs shrink-0 bg-slate-500 text-white">Denied</Badge>;
    case "escalated":
      return <Badge className="text-xs shrink-0 bg-purple-600 text-white">Escalated</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs shrink-0">Pending</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "high_risk":
      return <AlertTriangle className="w-3 h-3 text-red-500" />;
    case "medium_risk":
      return <Clock className="w-3 h-3 text-orange-500" />;
    case "auto_approved":
    case "approved":
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case "denied":
      return <XCircle className="w-3 h-3 text-slate-400" />;
    default:
      return <Clock className="w-3 h-3 text-muted-foreground" />;
  }
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-red-600 dark:text-red-400";
  if (score >= 30) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

function formatReason(reason: string) {
  const map: Record<string, string> = {
    no_show: "No Show",
    technical_issue: "Tech Issue",
    cancellation: "Cancellation",
    weather: "Weather",
    other: "Other",
  };
  return map[reason] || reason;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CaseQueue({
  cases,
  selectedCaseId,
  onSelectCase,
  statusFilter,
  onStatusFilter,
  searchQuery,
  onSearch,
  filterOptions,
  totalCount,
}: CaseQueueProps) {
  return (
    <div className="w-80 shrink-0 flex flex-col border-r border-border bg-sidebar">
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="font-semibold text-sm text-sidebar-foreground">Case Queue</h2>
          <span className="text-xs text-muted-foreground">{cases.length} of {totalCount}</span>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-background"
            data-testid="input-search-cases"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilter(opt.value)}
              data-testid={`filter-${opt.value}`}
              className={cn(
                "px-2 py-0.5 text-xs rounded-md border transition-colors",
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover-elevate"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {cases.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No cases match your filters
            </div>
          ) : (
            cases.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                data-testid={`case-item-${c.id}`}
                className={cn(
                  "w-full text-left rounded-md p-2.5 transition-colors hover-elevate",
                  selectedCaseId === c.id
                    ? "bg-sidebar-accent"
                    : "bg-transparent"
                )}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getStatusIcon(c.status)}
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{c.id}</span>
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                <div className="font-medium text-sm text-sidebar-foreground truncate mb-0.5">
                  {c.customerName}
                </div>
                <div className="text-xs text-muted-foreground truncate mb-1.5">
                  {c.experienceName}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatReason(c.refundReason)}</span>
                    <span className="text-xs font-semibold text-foreground">${c.refundAmount.toLocaleString()}</span>
                  </div>
                  {c.riskAssessment && (
                    <span className={cn("text-xs font-bold", getScoreColor(c.riskAssessment.totalScore))}>
                      {c.riskAssessment.totalScore}pts
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
