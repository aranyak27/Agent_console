import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { MOCK_CASES } from "@/lib/mockData";
import type { RefundCase } from "@shared/schema";
import { CaseQueue } from "@/components/CaseQueue";
import { CaseDetail } from "@/components/CaseDetail";
import { AppHeader } from "@/components/AppHeader";

const QUEUE_MIN = 200;
const QUEUE_MAX = 480;
const QUEUE_DEFAULT = 272;

export default function AgentWorkspace() {
  const [, navigate] = useLocation();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(MOCK_CASES[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cases, setCases] = useState<RefundCase[]>(MOCK_CASES);
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [queueWidth, setQueueWidth] = useState(QUEUE_DEFAULT);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.customerName.toLowerCase().includes(q) ||
        c.bookingId.toLowerCase().includes(q) ||
        c.experienceName.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [cases, statusFilter, searchQuery]);

  const selectedCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) || null,
    [cases, selectedCaseId]
  );

  const handleCaseUpdate = (updatedCase: RefundCase) => {
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleQueueResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = queueWidth;

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(QUEUE_MIN, Math.min(QUEUE_MAX, startWidth + ev.clientX - startX));
      setQueueWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [queueWidth]);

  const highRiskCount = cases.filter((c) => c.status === "high_risk").length;
  const medRiskCount = cases.filter((c) => c.status === "medium_risk").length;

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader
        onNavigateDashboard={() => navigate("/dashboard")}
        highRiskCount={highRiskCount}
        medRiskCount={medRiskCount}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Queue panel */}
        <div
          style={{ width: queueCollapsed ? 40 : queueWidth }}
          className="shrink-0 flex flex-col overflow-hidden transition-none"
        >
          <CaseQueue
            cases={filteredCases}
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            totalCount={cases.length}
            collapsed={queueCollapsed}
            onToggleCollapse={() => setQueueCollapsed((v) => !v)}
          />
        </div>

        {/* Queue resize handle */}
        {!queueCollapsed && (
          <div
            className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/40 active:bg-primary/60 transition-colors group relative"
            onMouseDown={handleQueueResizeStart}
            title="Drag to resize queue"
          >
            <div className="absolute inset-y-0 left-0 right-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
              <span className="w-px h-3 bg-muted-foreground/20 rounded-full" />
              <span className="w-px h-3 bg-muted-foreground/20 rounded-full" />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-hidden min-w-0">
          {selectedCase ? (
            <CaseDetail
              refundCase={selectedCase}
              onUpdate={handleCaseUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-20">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">Select a case to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
