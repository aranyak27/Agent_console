import { Moon, Sun, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">RADS</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <nav className="flex items-center gap-0.5">
          <Button
            variant={location === "/" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate("/")}
            data-testid="nav-workspace"
          >
            Workspace
          </Button>
          <Button
            variant={location === "/dashboard" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={onNavigateDashboard}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-3 h-3 mr-1" />
            Dashboard
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Understated risk indicators */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {highRiskCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{highRiskCount} high</span>
            </div>
          )}
          {medRiskCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{medRiskCount} medium</span>
            </div>
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="w-7 h-7"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>

        <div className="flex items-center gap-1.5 pl-2 border-l border-border">
          <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">SA</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">Sarah A.</span>
        </div>
      </div>
    </header>
  );
}
