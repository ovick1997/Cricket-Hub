import {
  LayoutDashboard,
  Users,
  UserCircle,
  Swords,
  Trophy,
  Radio,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
  LogOut,
  History,
  BookOpen,
  KeyRound,
  Building2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems: { title: string; url: string; icon: any; permission: PermissionKey }[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { title: "Matches", url: "/matches", icon: Swords, permission: "matches" },
  { title: "Match History", url: "/match-history", icon: History, permission: "matches" },
  { title: "Live Scoring", url: "/scoring", icon: Radio, permission: "scoring" },
  { title: "Teams", url: "/teams", icon: Users, permission: "teams" },
  { title: "Players", url: "/players", icon: UserCircle, permission: "players" },
  { title: "Tournaments", url: "/tournaments", icon: Trophy, permission: "tournaments" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, permission: "analytics" },
  { title: "Rankings", url: "/rankings", icon: Trophy, permission: "analytics" },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, isAdmin, allOrganizations, activeOrganizationId } = useAuth();
  const { hasPermission } = usePermissions();
  const activeOrg = allOrganizations.find(org => org.id === activeOrganizationId);
  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const visibleItems = mainItems.filter(item => hasPermission(item.permission));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Zap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex items-center justify-between flex-1">
              <div>
                <h2 className="font-display font-bold text-foreground text-sm leading-none tracking-tight">CricketHub</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Match Management</p>
              </div>
              <button onClick={toggleSidebar} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        {isAdmin && activeOrg && (
          <div className={`mt-2 ${collapsed ? "flex justify-center" : "px-1"}`}>
            {collapsed ? (
              <div className="h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center" title={activeOrg.name}>
                <Building2 className="h-3 w-3 text-primary" />
              </div>
            ) : (
              <Badge variant="secondary" className="w-full justify-start gap-1.5 rounded-lg bg-primary/10 text-primary border-primary/20 text-[10px] font-medium px-2 py-1 truncate">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{activeOrg.name}</span>
              </Badge>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 px-3 mb-1">Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-all rounded-xl mx-1"
                        activeClassName="bg-primary/12 text-primary font-medium shadow-sm"
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                        {!collapsed && <span className="text-[13px]">{item.title}</span>}
                        {!collapsed && item.url === "/scoring" && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className={`border-t border-border/50 pt-3 ${collapsed ? "" : "mx-1"}`}>
          <SidebarMenu>
            {hasPermission("settings") && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" className="text-sidebar-foreground hover:text-foreground rounded-xl" activeClassName="text-primary">
                    <Settings className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-[13px]">Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {hasPermission("settings") && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/documentation" className="text-sidebar-foreground hover:text-foreground rounded-xl" activeClassName="text-primary">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-[13px]">Documentation</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/account" className="text-sidebar-foreground hover:text-foreground rounded-xl" activeClassName="text-primary">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-[13px]">My Account</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} className="text-sidebar-foreground hover:text-destructive rounded-xl cursor-pointer">
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-[13px]">Sign Out</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {!collapsed && (
            <p className="text-[9px] text-muted-foreground/60 text-center mt-3">
              Developed by{" "}
              <a href="https://shorovabedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Shorov</a>
            </p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}