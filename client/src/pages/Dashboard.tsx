import { useLocation } from "wouter";
import { MOCK_CASES, getDashboardMetrics } from "@/lib/mockData";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  DollarSign,
  Shield,
  Zap,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#64748b"];

function StatCard({ title, value, sub, icon, color = "text-foreground", trend }: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: string; up: boolean };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">{title}</div>
            <div className={cn("text-2xl font-bold", color)}>{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs mt-1", trend.up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                <ArrowDown className={cn("w-3 h-3", trend.up && "rotate-180")} />
                {trend.value}
              </div>
            )}
          </div>
          <div className="text-muted-foreground/60">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const metrics = getDashboardMetrics();

  const casesByStatus = [
    { name: "Auto-Approved", value: metrics.autoApproved, color: "#22c55e" },
    { name: "Medium Risk", value: metrics.mediumRisk, color: "#f97316" },
    { name: "High Risk", value: metrics.highRisk, color: "#ef4444" },
  ];

  const riskDistribution = [
    { range: "0–9", count: MOCK_CASES.filter((c) => (c.riskAssessment?.totalScore ?? 0) < 10).length },
    { range: "10–29", count: MOCK_CASES.filter((c) => { const s = c.riskAssessment?.totalScore ?? 0; return s >= 10 && s < 30; }).length },
    { range: "30–49", count: MOCK_CASES.filter((c) => { const s = c.riskAssessment?.totalScore ?? 0; return s >= 30 && s < 50; }).length },
    { range: "50–69", count: MOCK_CASES.filter((c) => { const s = c.riskAssessment?.totalScore ?? 0; return s >= 50 && s < 70; }).length },
    { range: "70–89", count: MOCK_CASES.filter((c) => { const s = c.riskAssessment?.totalScore ?? 0; return s >= 70 && s < 90; }).length },
    { range: "90+", count: MOCK_CASES.filter((c) => (c.riskAssessment?.totalScore ?? 0) >= 90).length },
  ];

  const ruleTriggerCounts = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"].map((ruleId) => ({
    rule: ruleId,
    count: MOCK_CASES.filter((c) =>
      c.riskAssessment?.triggeredRules.some((r) => r.ruleId === ruleId)
    ).length,
  }));

  const refundReasonBreakdown = [
    { name: "No Show", value: MOCK_CASES.filter((c) => c.refundReason === "no_show").length },
    { name: "Technical Issue", value: MOCK_CASES.filter((c) => c.refundReason === "technical_issue").length },
    { name: "Cancellation", value: MOCK_CASES.filter((c) => c.refundReason === "cancellation").length },
    { name: "Weather", value: MOCK_CASES.filter((c) => c.refundReason === "weather").length },
    { name: "Other", value: MOCK_CASES.filter((c) => c.refundReason === "other").length },
  ];

  const totalRefundValue = MOCK_CASES.reduce((acc, c) => acc + c.refundAmount, 0);
  const highRiskValue = MOCK_CASES
    .filter((c) => c.status === "high_risk")
    .reduce((acc, c) => acc + c.refundAmount, 0);

  const highRiskCount = MOCK_CASES.filter((c) => c.status === "high_risk").length;
  const medRiskCount = MOCK_CASES.filter((c) => c.status === "medium_risk").length;

  const manualReviewPct = Math.round(((medRiskCount + highRiskCount) / metrics.totalCases) * 100);
  const manualReviewHoursOld = 1250;
  const manualReviewHoursNew = Math.round((medRiskCount + highRiskCount) * 5);
  const reductionPct = Math.round(((manualReviewHoursOld - manualReviewHoursNew) / manualReviewHoursOld) * 100);

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader
        onNavigateDashboard={() => navigate("/dashboard")}
        highRiskCount={highRiskCount}
        medRiskCount={medRiskCount}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-foreground">Performance Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              RADS system metrics · Fraud reduction & efficiency KPIs · As of March 2026
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title="Total Cases"
              value={metrics.totalCases}
              sub="This period"
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Auto-Approved"
              value={`${metrics.autoApprovalRate}%`}
              sub={`${metrics.autoApproved} of ${metrics.totalCases} cases`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="text-green-600 dark:text-green-400"
              trend={{ value: "Targeting 90%+", up: true }}
            />
            <StatCard
              title="High Risk Flagged"
              value={highRiskCount}
              sub={`$${highRiskValue.toLocaleString()} at risk`}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="text-red-600 dark:text-red-400"
            />
            <StatCard
              title="Avg Risk Score"
              value={metrics.avgRiskScore}
              sub="Across all cases"
              icon={<Shield className="w-5 h-5" />}
              color={metrics.avgRiskScore >= 30 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}
            />
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title="Revenue Protected"
              value={`$${highRiskValue.toLocaleString()}`}
              sub="High-risk refund value"
              icon={<DollarSign className="w-5 h-5" />}
              color="text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Manual Hours Saved"
              value={`${reductionPct}%`}
              sub={`${manualReviewHoursNew}h vs ${manualReviewHoursOld}h baseline`}
              icon={<TrendingDown className="w-5 h-5" />}
              color={reductionPct >= 70 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}
              trend={{ value: `Target: 70%+ reduction`, up: reductionPct >= 70 }}
            />
            <StatCard
              title="False Positive Rate"
              value={`${metrics.falsePosRate}%`}
              sub="Legitimate claims flagged"
              icon={<Zap className="w-5 h-5" />}
              color="text-green-600 dark:text-green-400"
              trend={{ value: "Target: <5%", up: true }}
            />
            <StatCard
              title="Medium Risk"
              value={medRiskCount}
              sub="Standard queue"
              icon={<Clock className="w-5 h-5" />}
              color="text-orange-600 dark:text-orange-400"
            />
          </div>

          {/* Manual Review Reduction */}
          <Card>
            <CardHeader className="pb-3 gap-1">
              <CardTitle className="text-sm font-semibold">Manual Review Hour Reduction</CardTitle>
              <p className="text-xs text-muted-foreground">Target: 70%+ reduction in manual CS hours</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Before RADS: ~1,250 hrs/month</span>
                    <span className="font-semibold text-muted-foreground">Baseline</span>
                  </div>
                  <Progress value={100} className="h-2 bg-muted" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">After RADS: ~{manualReviewHoursNew} hrs/month (estimated)</span>
                    <span className={cn("font-bold", reductionPct >= 70 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400")}>
                      {reductionPct}% reduction
                    </span>
                  </div>
                  <Progress
                    value={100 - reductionPct}
                    className="h-2"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {reductionPct >= 70 ? (
                    <Badge className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      KPI Target Met
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                      KPI In Progress
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Auto-approving {metrics.autoApproved} of {metrics.totalCases} cases eliminates manual review
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Score Distribution */}
            <Card>
              <CardHeader className="pb-2 gap-1">
                <CardTitle className="text-sm font-semibold">Risk Score Distribution</CardTitle>
                <p className="text-xs text-muted-foreground">Number of cases by score range</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={riskDistribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Case Status Breakdown Pie */}
            <Card>
              <CardHeader className="pb-2 gap-1">
                <CardTitle className="text-sm font-semibold">Case Classification Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Auto-approved vs review queues</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={180}>
                    <PieChart>
                      <Pie
                        data={casesByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {casesByStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 11, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {casesByStatus.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rule Trigger Frequency */}
            <Card>
              <CardHeader className="pb-2 gap-1">
                <CardTitle className="text-sm font-semibold">Rule Trigger Frequency</CardTitle>
                <p className="text-xs text-muted-foreground">How often each rule fires</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ruleTriggerCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rule" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {ruleTriggerCounts.map((_, i) => (
                        <Cell key={i} fill={i === 7 ? "#22c55e" : i < 3 ? "#ef4444" : "#f97316"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Refund Reason Breakdown */}
            <Card>
              <CardHeader className="pb-2 gap-1">
                <CardTitle className="text-sm font-semibold">Refund Reason Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Customer-stated reasons by volume</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5 pt-2">
                  {refundReasonBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground w-24 shrink-0">{item.name}</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(item.value / metrics.totalCases) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-6 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Risk Cases Table */}
          <Card>
            <CardHeader className="pb-3 gap-1">
              <CardTitle className="text-sm font-semibold">Top High-Risk Cases</CardTitle>
              <p className="text-xs text-muted-foreground">Highest scoring cases requiring immediate review</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_CASES
                  .filter((c) => c.riskAssessment && c.riskAssessment.totalScore >= 50)
                  .sort((a, b) => (b.riskAssessment?.totalScore ?? 0) - (a.riskAssessment?.totalScore ?? 0))
                  .slice(0, 5)
                  .map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-card hover-elevate" data-testid={`dashboard-risk-row-${c.id}`}>
                      <div className={cn(
                        "w-12 text-center text-sm font-bold shrink-0 rounded py-1",
                        (c.riskAssessment?.totalScore ?? 0) >= 70
                          ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900"
                          : "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900"
                      )}>
                        {c.riskAssessment?.totalScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{c.customerName}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.experienceName}</div>
                      </div>
                      <div className="text-sm font-semibold text-foreground shrink-0">${c.refundAmount.toLocaleString()}</div>
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {c.riskAssessment?.triggeredRules.slice(0, 2).map((r) => (
                          <Badge key={r.ruleId} variant="secondary" className="text-xs">{r.ruleId}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
