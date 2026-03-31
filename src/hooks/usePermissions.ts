import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// All available permissions in the system
export const ALL_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", description: "View dashboard and stats", icon: "📊" },
  { key: "matches", label: "Matches", description: "View and manage matches", icon: "⚔️" },
  { key: "matches.create", label: "Create Matches", description: "Create new matches", icon: "➕" },
  { key: "matches.edit", label: "Edit Matches", description: "Edit match details", icon: "✏️" },
  { key: "scoring", label: "Live Scoring", description: "Access live scoring", icon: "📻" },
  { key: "teams", label: "Teams", description: "View and manage teams", icon: "👥" },
  { key: "teams.create", label: "Create Teams", description: "Create new teams", icon: "➕" },
  { key: "teams.edit", label: "Edit Teams", description: "Edit team details and players", icon: "✏️" },
  { key: "players", label: "Players", description: "View and manage players", icon: "🏏" },
  { key: "players.create", label: "Create Players", description: "Create new players", icon: "➕" },
  { key: "players.edit", label: "Edit Players", description: "Edit player details", icon: "✏️" },
  { key: "tournaments", label: "Tournaments", description: "View and manage tournaments", icon: "🏆" },
  { key: "tournaments.create", label: "Create Tournaments", description: "Create tournaments", icon: "➕" },
  { key: "analytics", label: "Analytics", description: "View analytics and reports", icon: "📈" },
  { key: "settings", label: "Settings", description: "Access settings (admin only by default)", icon: "⚙️" },
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number]["key"];

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  admin: ALL_PERMISSIONS.map(p => p.key),
  moderator: ["dashboard", "matches", "matches.create", "matches.edit", "teams", "teams.create", "teams.edit", "players", "players.create", "players.edit", "tournaments", "tournaments.create", "analytics", "scoring"],
  scorer: ["dashboard", "matches", "scoring", "teams", "players"],
  viewer: ["dashboard", "matches", "teams", "players", "tournaments", "analytics"],
};

export function usePermissions() {
  const { organizationId, userRole } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["role-permissions", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const hasPermission = (permissionKey: PermissionKey): boolean => {
    if (!userRole) return false;
    // Admin always has full access
    if (userRole === "admin") return true;

    // Check if custom permission exists in DB
    const customPerm = permissions.find(
      (p: any) => p.role === userRole && p.permission_key === permissionKey
    );
    if (customPerm) return customPerm.enabled;

    // Fall back to defaults
    return DEFAULT_PERMISSIONS[userRole]?.includes(permissionKey) ?? false;
  };

  const getRolePermissions = (role: string): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    for (const perm of ALL_PERMISSIONS) {
      const customPerm = permissions.find(
        (p: any) => p.role === role && p.permission_key === perm.key
      );
      if (customPerm) {
        result[perm.key] = customPerm.enabled;
      } else {
        result[perm.key] = DEFAULT_PERMISSIONS[role]?.includes(perm.key) ?? false;
      }
    }
    return result;
  };

  return { hasPermission, getRolePermissions, permissions, isLoading };
}
