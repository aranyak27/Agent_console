import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { VoiceAgentTickets } from "@/components/VoiceAgentTickets";
import { MOCK_CASES } from "@/lib/mockData";
import { useMemo } from "react";
import { calculateRiskScore } from "@/lib/scoringEngine";

export default function VoiceTickets() {
  const [, navigate] = useLocation();

  const scoredCases = useMemo(
    () => MOCK_CASES.map((c) => ({ ...c, riskAssessment: calculateRiskScore(c) })),
    []
  );

  const highRiskCount = scoredCases.filter((c) => (c.riskAssessment?.totalScore ?? 0) >= 70).length;
  const medRiskCount = scoredCases.filter((c) => {
    const s = c.riskAssessment?.totalScore ?? 0;
    return s >= 30 && s < 70;
  }).length;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <AppHeader
        onNavigateDashboard={() => navigate("/dashboard")}
        highRiskCount={highRiskCount}
        medRiskCount={medRiskCount}
      />
      <div className="flex-1 overflow-y-auto">
        <VoiceAgentTickets />
      </div>
    </div>
  );
}
