import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback, useState } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useSwipeNav } from "@/hooks/use-swipe-nav";
import { Search, RefreshCw, Settings, LogOut, UserCircle, BarChart3, ChevronDown, Trophy, History, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/usePermissions";

export function DashboardLayout({ children, onRefresh }: { children: React.ReactNode; onRefresh?: () => Promise<void> | void }) {
  const { user, organizationId, loading, signOut, userRole, isAdmin, allOrganizations, activeOrganizationId, setActiveOrganizationId } = useAuth();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (!loading && user && !organizationId) {
      navigate("/org-setup", { replace: true });
    }
  }, [loading, user, organizationId, navigate]);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const defaultRefresh = useCallback(async () => {
    // Simple reload-like behavior: wait 600ms to simulate refresh
    await new Promise((r) => setTimeout(r, 600));
    window.location.reload();
  }, []);

  const { containerRef, pullDistance, refreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: onRefresh ?? defaultRefresh,
  });

  const swipeHandlers = useSwipeNav();

  // Merge touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    pullHandlers.onTouchStart(e);
    swipeHandlers.onTouchStart(e);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    pullHandlers.onTouchEnd();
    swipeHandlers.onTouchEnd(e);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-12 md:h-14 flex items-center justify-between border-b border-border/60 px-3 md:px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-2 md:gap-3">
              <SidebarTrigger className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors" />
              <div className="hidden md:block h-5 w-px bg-border/60" />
              {/* Mobile: logo */}
              <div className="md:hidden flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-xs">C</span>
                </div>
                <span className="font-display font-bold text-sm text-foreground">CricketHub</span>
              </div>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search matches, teams, players..."
                  className="bg-muted/40 border border-border/60 rounded-xl pl-9 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/30 w-72 transition-all"
                />
              </div>
            </div>
            {/* Admin org switcher */}
            <div className="flex items-center gap-2">
              {isAdmin && allOrganizations.length > 1 && (
                <Select value={activeOrganizationId ?? ""} onValueChange={setActiveOrganizationId}>
                  <SelectTrigger className="w-auto min-w-[140px] max-w-[200px] h-8 text-xs bg-muted/40 border-border/60 rounded-xl gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <SelectValue placeholder="Select org" />
                  </SelectTrigger>
                  <SelectContent>
                    {allOrganizations.map((org) => (
                      <SelectItem key={org.id} value={org.id} className="text-xs">
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <NotificationBell />
              <div className="h-5 w-px bg-border/60 hidden sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 rounded-xl hover:bg-muted/40 px-2 py-1.5 transition-colors outline-none">
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
                      <span className="text-primary font-bold text-[10px] md:text-[11px]">{initials}</span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-foreground leading-none">{user?.user_metadata?.full_name || user?.email || "User"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{userRole || "Member"}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border/60">
                  {/* Profile info for mobile */}
                  <DropdownMenuLabel className="sm:hidden">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
                        <span className="text-primary font-bold text-xs">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user?.user_metadata?.full_name || user?.email || "User"}</p>
                        <p className="text-[10px] text-muted-foreground capitalize font-normal">{userRole || "Member"}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="sm:hidden" />
                  
                  {hasPermission("players") && (
                    <DropdownMenuItem onClick={() => navigate("/players")} className="gap-2 cursor-pointer">
                      <UserCircle className="h-4 w-4" /> Players
                    </DropdownMenuItem>
                  )}
                  {hasPermission("tournaments") && (
                    <DropdownMenuItem onClick={() => navigate("/tournaments")} className="gap-2 cursor-pointer">
                      <Trophy className="h-4 w-4" /> Tournaments
                    </DropdownMenuItem>
                  )}
                  {hasPermission("matches") && (
                    <DropdownMenuItem onClick={() => navigate("/match-history")} className="gap-2 cursor-pointer">
                      <History className="h-4 w-4" /> Match History
                    </DropdownMenuItem>
                  )}
                  {hasPermission("analytics") && (
                    <DropdownMenuItem onClick={() => navigate("/analytics")} className="gap-2 cursor-pointer">
                      <BarChart3 className="h-4 w-4" /> Analytics
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {hasPermission("settings") && (
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" /> Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Pull-to-refresh indicator (mobile only) */}
          <div className="md:hidden relative overflow-hidden">
            <AnimatePresence>
              {(pullDistance > 0 || refreshing) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: pullDistance > 0 ? pullDistance * 0.5 : 40, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="flex items-center justify-center bg-primary/5"
                >
                  <motion.div
                    animate={{ rotate: refreshing ? 360 : pullDistance * 3 }}
                    transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { type: "spring" }}
                  >
                    <RefreshCw className={`h-5 w-5 ${pullDistance >= 80 || refreshing ? "text-primary" : "text-muted-foreground"}`} />
                  </motion.div>
                  {pullDistance >= 80 && !refreshing && (
                    <span className="text-[10px] text-primary font-medium ml-2">Release to refresh</span>
                  )}
                  {refreshing && (
                    <span className="text-[10px] text-primary font-medium ml-2">Refreshing…</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main content — with bottom padding for mobile nav */}
          <main
            ref={containerRef as React.RefObject<HTMLElement>}
            onTouchStart={onTouchStart}
            onTouchMove={pullHandlers.onTouchMove}
            onTouchEnd={onTouchEnd}
            className="flex-1 p-3 md:p-6 lg:p-8 pb-20 md:pb-6 overflow-auto touch-pan-y"
          >
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}