import { Link, useLocation } from "react-router-dom";
import { Radio, Trophy, Home, BarChart3, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/", label: "Home", icon: Home, activeColor: "text-primary", exact: true as const },
  { path: "/live", label: "Live", icon: Radio, activeColor: "text-destructive", exact: false as const },
  { path: "/results", label: "Results", icon: Trophy, activeColor: "text-primary", exact: false as const },
  { path: "/leaderboard", label: "Stats", icon: BarChart3, activeColor: "text-accent", exact: false as const },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return location.pathname === item.path;
    if (item.path === "/live") return location.pathname === "/live" || location.pathname.startsWith("/live/");
    if (item.path === "/results") return location.pathname === "/results" || location.pathname.startsWith("/scorecard/");
    if (item.path === "/leaderboard") return location.pathname === "/leaderboard";
    return location.pathname === item.path;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between px-4 h-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-[10px]">CH</span>
              </div>
              <span className="font-display font-bold text-sm text-foreground tracking-tight">CricketHub</span>
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Sign In →
              </Link>
            )}
          </div>
          {/* Nav Tabs */}
          <nav className="flex px-4 gap-0">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  <item.icon className={`h-3.5 w-3.5 ${active ? item.activeColor : ""}`} />
                  {item.label}
                  {active && (
                    <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center space-y-1">
          <p className="text-[10px] text-muted-foreground">
            Powered by <span className="font-semibold text-primary">CricketHub</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            Developed by{" "}
            <a href="https://shorovabedin.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Shorov</a>
            <span className="mx-1.5">·</span>
            <a href="https://www.facebook.com/shorovabedin/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">FB</a>
            <span className="mx-1">·</span>
            <a href="https://www.linkedin.com/in/shorovabedin/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">LI</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
