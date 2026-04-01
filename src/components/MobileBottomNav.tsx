import { useState } from "react";
import { LayoutDashboard, Swords, Radio, UserCircle, MoreHorizontal, Trophy, BarChart3, History, Settings, ChevronRight, BookOpen, KeyRound, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navItems: { title: string; url: string; icon: any; permission: PermissionKey }[] = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { title: "Matches", url: "/matches", icon: Swords, permission: "matches" },
  { title: "Score", url: "/scoring", icon: Radio, permission: "scoring" },
  { title: "Players", url: "/players", icon: UserCircle, permission: "players" },
];

const moreItems: { title: string; url: string; icon: any; permission: PermissionKey }[] = [
  { title: "Teams", url: "/teams", icon: Users, permission: "teams" },
  { title: "Tournaments", url: "/tournaments", icon: Trophy, permission: "tournaments" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, permission: "analytics" },
  { title: "Rankings", url: "/rankings", icon: Trophy, permission: "analytics" },
  { title: "Match History", url: "/match-history", icon: History, permission: "matches" },
  { title: "Settings", url: "/settings", icon: Settings, permission: "settings" },
  { title: "My Account", url: "/account", icon: KeyRound, permission: "dashboard" },
  { title: "Documentation", url: "/documentation", icon: BookOpen, permission: "settings" },
];

const morePaths = moreItems.map(i => i.url);

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const isMoreActive = morePaths.some(p => location.pathname.startsWith(p));
  const visibleItems = navItems.filter(item => hasPermission(item.permission));
  const visibleMoreItems = moreItems.filter(item => hasPermission(item.permission));

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-stretch">
          {visibleItems.map((item) => {
            const active = isActive(item.url);
            const isScoring = item.url === "/scoring";
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
                activeClassName=""
              >
                {isScoring ? (
                  <div className={`-mt-5 h-12 w-12 rounded-full flex items-center justify-center shadow-lg ${
                    active ? "bg-primary text-primary-foreground shadow-primary/30" : "bg-secondary text-secondary-foreground"
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                ) : (
                  <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                )}
                <span className={`text-[10px] mt-0.5 font-medium ${isScoring ? "mt-1" : ""}`}>{item.title}</span>
              </NavLink>
            );
          })}
          {/* More tab */}
          <button
            onClick={() => setSheetOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 transition-colors ${
              isMoreActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? "text-primary" : ""}`} />
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8">
          <SheetHeader className="px-5 pb-2">
            <SheetTitle className="text-base font-display">More</SheetTitle>
          </SheetHeader>
          <div className="space-y-0.5 px-2">
            {visibleMoreItems.map((item) => {
              const active = isActive(item.url);
              return (
                <button
                  key={item.url}
                  onClick={() => { navigate(item.url); setSheetOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    active ? "bg-primary/15" : "bg-muted/50"
                  }`}>
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}