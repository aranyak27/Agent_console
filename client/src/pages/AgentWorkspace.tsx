import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { MOCK_CASES } from "@/lib/mockData";
import type { RefundCase } from "@shared/schema";
import { CaseQueue } from "@/components/CaseQueue";
import { CaseDetail } from "@/components/CaseDetail";
import { AppHeader } from "@/components/AppHeader";

export default function AgentWorkspace() {
  const [, navigate] = useLocation();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(MOCK_CASES[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cases, setCases] = useState<RefundCase[]>(MOCK_CASES);
  const [queueCollapsed, setQueueCollapsed] = useState(false);

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
        <CaseQueue
          cases={filteredCases}
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          filterOptions={[]}
          totalCount={cases.length}
          collapsed={queueCollapsed}
          onToggleCollapse={() => setQueueCollapsed((v) => !v)}
        />
        <div className="flex-1 overflow-hidden">
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
