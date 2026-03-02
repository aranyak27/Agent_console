import { Moon, Sun, LayoutDashboard, Shield, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import { useLocation } from "wouter";

interface AppHeaderProps {
  onNavigateDashboard: () => void;
  highRiskCount: number;
  medRiskCount: number;
}

export function AppHeader({ onNavigateDashboard, highRiskCount, medRiskCount }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-sidebar shrink-0 gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm text-foreground">RADS</div>
            <div className="text-xs text-muted-foreground">Refund Abuse Detection</div>
          </div>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        <nav className="flex items-center gap-1">
          <Button
            variant={location === "/" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            data-testid="nav-workspace"
          >
            Agent Workspace
          </Button>
          <Button
            variant={location === "/dashboard" ? "secondary" : "ghost"}
            size="sm"
            onClick={onNavigateDashboard}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {highRiskCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">{highRiskCount} High Risk</span>
          </div>
        )}
        {medRiskCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">{medRiskCount} Medium Risk</span>
          </div>
        )}

        <Button
          size="icon"
          variant="ghost"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-foreground">SA</span>
          </div>
          <div className="text-xs leading-tight">
            <div className="font-medium text-foreground">Sarah Agent</div>
            <div className="text-muted-foreground">Senior CS</div>
          </div>
        </div>
      </div>
    </header>
  );
}
