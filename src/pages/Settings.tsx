import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, ALL_PERMISSIONS, DEFAULT_PERMISSIONS } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Settings as SettingsIcon,
  Users,
  Building2,
  Shield,
  Check,
  X,
  Loader2,
  UserPlus,
  Pencil,
  Plus,
  Trash2,
  Crown,
  ToggleLeft,
  Download,
  Upload,
  Database,
  Calendar,
  FileJson,
  UserCog,
  UserMinus,
  RotateCcw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const roleColors: Record<string, string> = {
  admin: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  moderator: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  scorer: "text-green-400 bg-green-400/10 border-green-400/20",
  viewer: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

const ROLES = ["admin", "moderator", "scorer", "viewer"] as const;

type AssignableProfile = {
  user_id: string;
  full_name: string | null;
  organization_id: string | null;
  is_approved: boolean;
};

type UserRoleEntry = {
  user_id: string;
  organization_id: string;
  role: string;
};

function ExportDataButton({ organizationId, orgName }: { organizationId: string; orgName: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [teamsRes, playersRes, matchesRes, statsRes, summariesRes, tournamentsRes] = await Promise.all([
        supabase.from("teams").select("*").eq("organization_id", organizationId),
        supabase.from("players").select("*").eq("organization_id", organizationId),
        supabase.from("matches").select("*").eq("organization_id", organizationId),
        supabase.from("player_stats").select("*").eq("organization_id", organizationId),
        supabase.from("match_summaries").select("*").eq("organization_id", organizationId),
        supabase.from("tournaments").select("*").eq("organization_id", organizationId),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        organization: orgName,
        teams: teamsRes.data || [],
        players: playersRes.data || [],
        matches: matchesRes.data || [],
        playerStats: statsRes.data || [],
        matchSummaries: summariesRes.data || [],
        tournaments: tournamentsRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orgName.replace(/[^a-zA-Z0-9]/g, "_")}_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handleExport}
      disabled={exporting}
      className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 border border-primary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
    >
      {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Export Data
    </motion.button>
  );
}

function BackupSection({ organizationId, orgName }: { organizationId: string; orgName: string }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleBackupExport = async () => {
    setExporting(true);
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const since = fiveDaysAgo.toISOString();

      const [teamsRes, playersRes, matchesRes, statsRes, summariesRes, tournamentsRes, inningsRes, ballsRes, teamPlayersRes] = await Promise.all([
        supabase.from("teams").select("*").eq("organization_id", organizationId).gte("created_at", since),
        supabase.from("players").select("*").eq("organization_id", organizationId).gte("created_at", since),
        supabase.from("matches").select("*").eq("organization_id", organizationId).gte("created_at", since),
        supabase.from("player_stats").select("*").eq("organization_id", organizationId).gte("updated_at", since),
        supabase.from("match_summaries").select("*").eq("organization_id", organizationId).gte("created_at", since),
        supabase.from("tournaments").select("*").eq("organization_id", organizationId).gte("created_at", since),
        supabase.from("innings").select("*").gte("created_at", since),
        supabase.from("balls").select("*").gte("created_at", since),
        supabase.from("team_players").select("*").gte("joined_at", since),
      ]);

      // Filter innings/balls/team_players to only this org's matches/teams
      const matchIds = new Set((matchesRes.data || []).map(m => m.id));
      const teamIds = new Set((teamsRes.data || []).map(t => t.id));
      const filteredInnings = (inningsRes.data || []).filter(i => matchIds.has(i.match_id));
      const inningsIds = new Set(filteredInnings.map(i => i.id));
      const filteredBalls = (ballsRes.data || []).filter(b => inningsIds.has(b.innings_id));
      const filteredTeamPlayers = (teamPlayersRes.data || []).filter(tp => teamIds.has(tp.team_id));

      const backup = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        organization: orgName,
        organizationId,
        periodDays: 5,
        data: {
          teams: teamsRes.data || [],
          players: playersRes.data || [],
          matches: matchesRes.data || [],
          innings: filteredInnings,
          balls: filteredBalls,
          playerStats: statsRes.data || [],
          matchSummaries: summariesRes.data || [],
          tournaments: tournamentsRes.data || [],
          teamPlayers: filteredTeamPlayers,
        },
      };

      const counts = Object.entries(backup.data).map(([k, v]) => `${k}: ${(v as any[]).length}`).join(", ");

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orgName.replace(/[^a-zA-Z0-9]/g, "_")}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup exported! " + counts);
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.version || !backup.data) {
        throw new Error("Invalid backup file format");
      }

      const results: string[] = [];
      const { data } = backup;

      // Import order matters due to FK constraints
      if (data.teams?.length) {
        const { error } = await supabase.from("teams").upsert(
          data.teams.map((t: any) => ({ ...t, organization_id: organizationId })),
          { onConflict: "id" }
        );
        if (error) results.push(`Teams: ❌ ${error.message}`);
        else results.push(`Teams: ✅ ${data.teams.length}`);
      }

      if (data.players?.length) {
        const { error } = await supabase.from("players").upsert(
          data.players.map((p: any) => ({ ...p, organization_id: organizationId })),
          { onConflict: "id" }
        );
        if (error) results.push(`Players: ❌ ${error.message}`);
        else results.push(`Players: ✅ ${data.players.length}`);
      }

      if (data.tournaments?.length) {
        const { error } = await supabase.from("tournaments").upsert(
          data.tournaments.map((t: any) => ({ ...t, organization_id: organizationId })),
          { onConflict: "id" }
        );
        if (error) results.push(`Tournaments: ❌ ${error.message}`);
        else results.push(`Tournaments: ✅ ${data.tournaments.length}`);
      }

      if (data.teamPlayers?.length) {
        const { error } = await supabase.from("team_players").upsert(data.teamPlayers, { onConflict: "id" });
        if (error) results.push(`Team Players: ❌ ${error.message}`);
        else results.push(`Team Players: ✅ ${data.teamPlayers.length}`);
      }

      if (data.matches?.length) {
        const { error } = await supabase.from("matches").upsert(
          data.matches.map((m: any) => ({ ...m, organization_id: organizationId })),
          { onConflict: "id" }
        );
        if (error) results.push(`Matches: ❌ ${error.message}`);
        else results.push(`Matches: ✅ ${data.matches.length}`);
      }

      if (data.innings?.length) {
        const { error } = await supabase.from("innings").upsert(data.innings, { onConflict: "id" });
        if (error) results.push(`Innings: ❌ ${error.message}`);
        else results.push(`Innings: ✅ ${data.innings.length}`);
      }

      if (data.balls?.length) {
        // Batch in chunks of 500
        for (let i = 0; i < data.balls.length; i += 500) {
          const chunk = data.balls.slice(i, i + 500);
          const { error } = await supabase.from("balls").upsert(chunk, { onConflict: "id" });
          if (error) { results.push(`Balls: ❌ ${error.message}`); break; }
        }
        if (!results.some(r => r.startsWith("Balls:"))) results.push(`Balls: ✅ ${data.balls.length}`);
      }

      if (data.matchSummaries?.length) {
        const { error } = await supabase.from("match_summaries").upsert(
          data.matchSummaries.map((s: any) => ({ ...s, organization_id: organizationId })),
          { onConflict: "match_id" }
        );
        if (error) results.push(`Summaries: ❌ ${error.message}`);
        else results.push(`Summaries: ✅ ${data.matchSummaries.length}`);
      }

      if (data.playerStats?.length) {
        const { error } = await supabase.from("player_stats").upsert(
          data.playerStats.map((s: any) => ({ ...s, organization_id: organizationId })),
          { onConflict: "id" }
        );
        if (error) results.push(`Stats: ❌ ${error.message}`);
        else results.push(`Stats: ✅ ${data.playerStats.length}`);
      }

      setImportResult(results.join("\n"));
      const hasError = results.some(r => r.includes("❌"));
      if (hasError) toast.warning("Import completed with some errors");
      else toast.success("Data imported successfully!");
    } catch (err: any) {
      toast.error("Import failed: " + err.message);
      setImportResult("Error: " + err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Section */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Download className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-foreground">Export Backup</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Download data from the last 5 days as a JSON backup file. Includes teams, players, matches, innings, balls, stats, and tournaments.</p>
        
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 mb-4">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Last 5 Days</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(Date.now() - 5 * 86400000).toLocaleDateString()} — {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBackupExport}
          disabled={exporting}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export Last 5 Days
        </motion.button>
      </div>

      {/* Import Section */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="h-4 w-4 text-accent" />
          <h3 className="font-display font-bold text-foreground">Import Backup</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Restore data from a previously exported backup JSON file. Existing records with the same ID will be updated (upsert).</p>

        <label className="cursor-pointer">
          <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
          <motion.div
            whileTap={{ scale: 0.97 }}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed transition-colors ${
              importing
                ? "border-accent/30 bg-accent/5 opacity-60 cursor-wait"
                : "border-border hover:border-accent/40 hover:bg-accent/5 cursor-pointer"
            }`}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <FileJson className="h-5 w-5 text-accent" />}
            <span className="text-xs font-semibold text-foreground">
              {importing ? "Importing..." : "Choose backup file (.json)"}
            </span>
          </motion.div>
        </label>

        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-muted/20 border border-border/50"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Import Results</p>
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{importResult}</pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const Settings = () => {
  const { user, organizationId, userRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = userRole === "admin";
  const { getRolePermissions } = usePermissions();
  const [selectedPermRole, setSelectedPermRole] = useState<string>("moderator");

  // Pending users
  const { data: pendingUsers = [], isLoading: loadingPending } = useQuery({
    queryKey: ["pending-users", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_approved", false);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // All organizations (admin can see all)
  const { data: allOrgs = [] } = useQuery({
    queryKey: ["all-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const org = useMemo(() => allOrgs.find(o => o.id === organizationId) || null, [allOrgs, organizationId]);

  // Org edit & create
  const [orgName, setOrgName] = useState("");
  const [editingOrg, setEditingOrg] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [assignMemberOrgId, setAssignMemberOrgId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState("viewer");
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteOrgInput, setDeleteOrgInput] = useState("");
  const [resetOrgConfirm, setResetOrgConfirm] = useState<{ id: string; name: string } | null>(null);
  const [resetOrgInput, setResetOrgInput] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("viewer");
  const [creatingUser, setCreatingUser] = useState(false);

  // All profiles + roles (for member management)
  const { data: allProfilesData, isLoading: loadingAllProfiles } = useQuery<{ users: AssignableProfile[]; roles: UserRoleEntry[] }>({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Unauthorized");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to load users");
      return { users: result.users ?? [], roles: result.roles ?? [] };
    },
    enabled: isAdmin,
  });

  const allProfiles = allProfilesData?.users ?? [];
  const allUserRoles = allProfilesData?.roles ?? [];

  // Member management state
  const [memberMgmtOrgId, setMemberMgmtOrgId] = useState<string | null>(null);
  const [removeFromOrgConfirm, setRemoveFromOrgConfirm] = useState<{ userId: string; name: string; orgId: string } | null>(null);

  const organizationNameById = useMemo(
    () => Object.fromEntries(allOrgs.map((org: any) => [org.id, org.name])),
    [allOrgs]
  );

  const assignableProfiles = useMemo(
    () => allProfiles.filter((profile) => profile.organization_id !== assignMemberOrgId),
    [allProfiles, assignMemberOrgId]
  );

  // Approve user
  const approveUser = useMutation({
    mutationFn: async ({ profileId, userId }: { profileId: string; userId: string }) => {
      if (!organizationId) throw new Error("No organization");
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true, organization_id: organizationId })
        .eq("id", profileId);
      if (error) throw error;
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, organization_id: organizationId, role: "viewer" });
      if (roleError && !roleError.message.includes("duplicate")) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["member-roles"] });
      toast.success("User approved!");
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectUser = useMutation({
    mutationFn: async (_profileId: string) => {
      toast.info("User remains unapproved");
    },
  });

  // Delete member
  const [removeConfirm, setRemoveConfirm] = useState<{ id: string; userId: string; name: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const removeMember = useMutation({
    mutationFn: async ({ profileId: _profileId, userId }: { profileId: string; userId: string }) => {
      if (!userId) throw new Error("User ID is required");
      setDeletingUser(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["member-roles"] });
      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
      toast.success("User deleted permanently");
      setDeletingUser(false);
    },
    onError: (err) => { toast.error(err.message); setDeletingUser(false); },
  });

  // Toggle permission
  const togglePermission = useMutation({
    mutationFn: async ({ role, permissionKey, enabled }: { role: string; permissionKey: string; enabled: boolean }) => {
      if (!organizationId) throw new Error("No organization");
      // Upsert
      const { error } = await supabase
        .from("role_permissions")
        .upsert(
          {
            organization_id: organizationId,
            role: role as any,
            permission_key: permissionKey,
            enabled,
          },
          { onConflict: "organization_id,role,permission_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateOrg = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (!slug) slug = "org-" + Date.now();
      const { error } = await supabase
        .from("organizations")
        .update({ name, slug })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-organizations"] });
      setEditingOrg(false);
      toast.success("Organization updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const createOrg = useMutation({
    mutationFn: async (name: string) => {
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (!slug) slug = "org-" + Date.now();
      const { data, error } = await supabase
        .from("organizations")
        .insert({ name, slug })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-organizations"] });
      setCreatingOrg(false);
      setNewOrgName("");
      toast.success("Organization created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const assignMember = useMutation({
    mutationFn: async ({ orgId, userId, role }: { orgId: string; userId: string; role: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assign-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: userId, organization_id: orgId, role }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to assign member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["all-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["member-roles"] });
      setAssignMemberOrgId(null);
      setAssignUserId("");
      toast.success("Member assigned to organization!");
    },
    onError: (err) => toast.error(err.message),
  });

  // Remove member from org (unassign, not delete)
  const removeMemberFromOrg = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assign-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: userId, remove: true }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to remove member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["member-roles"] });
      setRemoveFromOrgConfirm(null);
      toast.success("Member removed from organization!");
    },
    onError: (err) => toast.error(err.message),
  });


  const deleteOrg = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase.rpc("delete_organization_cascade", { _org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Organization deleted!");
      setDeleteOrgConfirm(null);
      setDeleteOrgInput("");
      // Force reload to reset auth context
      window.location.href = "/dashboard";
    },
    onError: (err) => toast.error("Failed to delete: " + err.message),
  });

  const resetOrgData = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase.rpc("reset_organization_data", { _org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Organization data reset successfully! Players & stats preserved.");
      setResetOrgConfirm(null);
      setResetOrgInput("");
      queryClient.invalidateQueries({ queryKey: ["all-organizations"] });
    },
    onError: (err) => toast.error("Failed to reset: " + err.message),
  });

  // Current permissions for selected role
  const currentPerms = getRolePermissions(selectedPermRole);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-display font-bold text-foreground">Admin Access Required</h2>
            <p className="text-sm text-muted-foreground">Only admins can access settings.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 md:space-y-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg md:text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 md:h-7 md:w-7 text-primary" /> Settings
          </h1>
          <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5">Manage your organization, members, and permissions</p>
        </motion.div>

        <Tabs defaultValue="approvals" className="space-y-3 md:space-y-4">
          <TabsList className="bg-muted/30 border border-border/50 flex-wrap h-auto gap-0.5 md:gap-1 p-0.5 md:p-1">
            <TabsTrigger value="approvals" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1 text-[10px] md:text-xs px-2 md:px-3 py-1.5">
              <UserPlus className="h-3 w-3 md:h-3.5 md:w-3.5" /> Approvals
              {pendingUsers.length > 0 && (
                <span className="ml-0.5 h-4 min-w-[16px] px-0.5 rounded-full bg-accent text-accent-foreground text-[8px] md:text-[10px] font-bold flex items-center justify-center">
                  {pendingUsers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1 text-[10px] md:text-xs px-2 md:px-3 py-1.5">
              <ToggleLeft className="h-3 w-3 md:h-3.5 md:w-3.5" /> Permissions
            </TabsTrigger>
            <TabsTrigger value="organization" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1 text-[10px] md:text-xs px-2 md:px-3 py-1.5">
              <Building2 className="h-3 w-3 md:h-3.5 md:w-3.5" /> Organization
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1 text-[10px] md:text-xs px-2 md:px-3 py-1.5">
              <Database className="h-3 w-3 md:h-3.5 md:w-3.5" /> Backup
            </TabsTrigger>
            <TabsTrigger value="member-mgmt" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1 text-[10px] md:text-xs px-2 md:px-3 py-1.5">
              <UserCog className="h-3 w-3 md:h-3.5 md:w-3.5" /> Member Mgmt
            </TabsTrigger>
          </TabsList>

          {/* APPROVALS TAB */}
          <TabsContent value="approvals" className="space-y-3 md:space-y-4">
            <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-5">
              <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-0.5">Pending Approvals</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4">New sign-ups waiting for your approval</p>
              {loadingPending ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingUsers.map((profile: any) => (
                    <motion.div key={profile.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-muted/20 border border-border/50">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-accent/10 flex items-center justify-center text-xs md:text-sm font-bold text-accent shrink-0">
                        {(profile.full_name || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{profile.full_name || "Unknown User"}</p>
                        <p className="text-[10px] text-muted-foreground">User ID: {profile.user_id?.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => approveUser.mutate({ profileId: profile.id, userId: profile.user_id })}
                          className="h-8 px-3 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Approve
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => rejectUser.mutate(profile.id)}
                          className="h-8 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors flex items-center gap-1">
                          <X className="h-3.5 w-3.5" /> Reject
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>


          {/* PERMISSIONS TAB */}
          <TabsContent value="permissions" className="space-y-3 md:space-y-4">
            <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-5">
              <div className="mb-3 md:mb-4">
                <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-0.5">Role Permissions</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground">Control what each role can access. Admin always has full access.</p>
              </div>

              {/* Role selector */}
              <div className="flex gap-1.5 md:gap-2 mb-3 md:mb-5">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedPermRole(role)}
                    disabled={role === "admin"}
                    className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold capitalize transition-all border ${
                      selectedPermRole === role
                        ? `${roleColors[role]} ring-1`
                        : role === "admin"
                        ? "opacity-40 cursor-not-allowed bg-muted/20 text-muted-foreground border-border/30"
                        : "bg-muted/20 text-muted-foreground border-border/40 hover:bg-muted/40"
                    }`}
                  >
                    {role === "admin" && <Crown className="h-2.5 w-2.5 md:h-3 md:w-3 inline mr-0.5" />}
                    {role}
                    {role === "admin" && <span className="text-[8px] md:text-[9px] ml-0.5 opacity-60">(full)</span>}
                  </button>
                ))}
              </div>

              {/* Permission toggles */}
              <div className="space-y-1">
                {ALL_PERMISSIONS.map((perm, i) => {
                  const isSubPerm = perm.key.includes(".");
                  const enabled = selectedPermRole === "admin" ? true : currentPerms[perm.key] ?? false;

                  return (
                    <motion.div
                      key={perm.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl transition-colors ${
                        isSubPerm ? "ml-4 md:ml-6 bg-muted/5" : "bg-muted/15 border border-border/30"
                      } ${enabled ? "" : "opacity-60"}`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-sm md:text-base">{perm.icon}</span>
                        <div>
                          <p className={`font-semibold text-foreground ${isSubPerm ? "text-[11px] md:text-xs" : "text-xs md:text-sm"}`}>{perm.label}</p>
                          <p className="text-[9px] md:text-[10px] text-muted-foreground">{perm.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={enabled}
                        disabled={selectedPermRole === "admin"}
                        onCheckedChange={(checked) => {
                          togglePermission.mutate({
                            role: selectedPermRole,
                            permissionKey: perm.key,
                            enabled: checked,
                          });
                        }}
                        className="data-[state=checked]:bg-primary"
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Reset to defaults */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <button
                  onClick={() => {
                    const defaults = DEFAULT_PERMISSIONS[selectedPermRole] || [];
                    ALL_PERMISSIONS.forEach((perm) => {
                      togglePermission.mutate({
                        role: selectedPermRole,
                        permissionKey: perm.key,
                        enabled: defaults.includes(perm.key),
                      });
                    });
                    toast.success(`Reset ${selectedPermRole} to default permissions`);
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          </TabsContent>

          {/* ORGANIZATION TAB */}
          <TabsContent value="organization" className="space-y-4">
            {/* Current Org */}
            {org && (
              <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-5">
                <div className="mb-3 md:mb-4">
                  <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-0.5">Current Organization</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Your active organization</p>
                </div>
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/20 border border-primary/20">
                  <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-base md:text-xl font-display font-bold text-primary shrink-0">
                    {org.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-lg font-display font-bold text-foreground truncate">{org.name}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Slug: {org.slug}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => { setOrgName(org.name); setEditingOrgId(org.id); setEditingOrg(true); }}
                    className="px-4 py-2 rounded-xl bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors">
                    Edit
                  </motion.button>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-3 mt-3 md:mt-4">
                  <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/10 border border-border/40 text-center">
                    <p className="text-lg md:text-2xl font-display font-bold text-foreground">{allProfiles.filter((p: any) => p.organization_id === organizationId).length}</p>
                    <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest">Members</p>
                  </div>
                  <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/10 border border-border/40 text-center">
                    <p className="text-lg md:text-2xl font-display font-bold text-accent">{pendingUsers.length}</p>
                    <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest">Pending</p>
                  </div>
                  <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/10 border border-border/40 text-center">
                    <p className="text-lg md:text-2xl font-display font-bold text-primary">{allUserRoles.filter((r: any) => r.role === "admin" && r.organization_id === organizationId).length}</p>
                    <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest">Admins</p>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="mt-6 pt-5 border-t border-destructive/20">
                  <h4 className="text-sm font-display font-bold text-destructive mb-1">Danger Zone</h4>
                  <p className="text-[10px] text-muted-foreground mb-3">Permanently delete this organization and all its data (teams, players, matches, stats). This cannot be undone.</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <ExportDataButton organizationId={org.id} orgName={org.name} />
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { setDeleteOrgConfirm({ id: org.id, name: org.name }); setDeleteOrgInput(""); }}
                      className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 border border-destructive/20 transition-colors flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" /> Delete Organization
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* All Organizations */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground mb-1">All Organizations</h3>
                  <p className="text-xs text-muted-foreground">Create and manage organizations</p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setCreatingOrg(true); setNewOrgName(""); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                  <Plus className="h-3.5 w-3.5" /> New Organization
                </motion.button>
              </div>

              <div className="space-y-2">
                {allOrgs.map((o: any) => {
                  const orgMembers = allProfiles.filter((p) => p.organization_id === o.id && p.is_approved);
                  const isCurrent = o.id === organizationId;
                  return (
                    <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isCurrent ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border/50"}`}>
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-display font-bold text-primary shrink-0">
                        {o.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{o.name}</p>
                          {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-bold">Active</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{orgMembers.length} members • {o.slug}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { setAssignMemberOrgId(o.id); setAssignUserId(""); }}
                          className="h-8 px-2.5 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors flex items-center gap-1">
                          <UserPlus className="h-3 w-3" /> Assign
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { setResetOrgConfirm({ id: o.id, name: o.name }); setResetOrgInput(""); }}
                          className="h-8 px-2.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                          title="Reset all data (keeps players & stats)">
                          <RotateCcw className="h-3 w-3" /> Reset
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { setOrgName(o.name); setEditingOrgId(o.id); setEditingOrg(true); }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { setDeleteOrgConfirm({ id: o.id, name: o.name }); setDeleteOrgInput(""); }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* BACKUP TAB */}
          <TabsContent value="backup" className="space-y-4">
            {org ? (
              <BackupSection organizationId={org.id} orgName={org.name} />
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">No organization found</div>
            )}
          </TabsContent>

          {/* MEMBER MANAGEMENT TAB */}
          <TabsContent value="member-mgmt" className="space-y-3 md:space-y-4">
            {/* Header with Create User */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-foreground text-sm md:text-base">Member Management</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground">Create users, assign to organizations, manage roles, or delete accounts</p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => setCreateUserOpen(true)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] md:text-xs font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <UserPlus className="h-3 w-3 md:h-3.5 md:w-3.5" /> Create User
              </motion.button>
            </div>

            {/* Section 1: Organization Members */}
            <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-5">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-foreground text-sm md:text-base">Organization Members</h3>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4">Select an organization to view and manage its members</p>
              
              <Select value={memberMgmtOrgId || ""} onValueChange={(val) => setMemberMgmtOrgId(val)}>
                <SelectTrigger className="bg-muted/40 border-border/60 mb-4"><SelectValue placeholder="Select organization..." /></SelectTrigger>
                <SelectContent>
                  {allOrgs.map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {memberMgmtOrgId && (() => {
                const orgMembers = allProfiles.filter(p => p.organization_id === memberMgmtOrgId && p.is_approved);
                const orgRoles = allUserRoles.filter(r => r.organization_id === memberMgmtOrgId);
                
                if (orgMembers.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-6">No members in this organization</p>;
                }

                return (
                  <div className="space-y-2">
                    {orgMembers.map((member) => {
                      const role = orgRoles.find(r => r.user_id === member.user_id);
                      const isSelf = member.user_id === user?.id;
                      return (
                        <motion.div key={member.user_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-muted/20 border border-border/50">
                          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center text-xs md:text-sm font-bold text-primary shrink-0">
                            {(member.full_name || "?")[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">{member.full_name || "Unknown"}</p>
                              {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">You</span>}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold capitalize ${roleColors[role?.role || "viewer"]}`}>
                              {role?.role === "admin" && <Crown className="h-2.5 w-2.5 inline mr-0.5" />}
                              {role?.role || "viewer"}
                            </span>
                          </div>
                          {!isSelf && (
                            <div className="flex items-center gap-2">
                              <Select value={role?.role || "viewer"} onValueChange={(val) => {
                                assignMember.mutate({ orgId: memberMgmtOrgId, userId: member.user_id, role: val });
                              }}>
                                <SelectTrigger className="h-8 w-[110px] text-xs bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="scorer">Scorer</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => setRemoveFromOrgConfirm({ userId: member.user_id, name: member.full_name || "this member", orgId: memberMgmtOrgId })}
                                className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                <UserMinus className="h-3.5 w-3.5" /> Remove
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => setRemoveConfirm({ id: member.user_id, userId: member.user_id, name: member.full_name || "this member" })}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Delete user permanently">
                                <Trash2 className="h-3.5 w-3.5" />
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Section 2: Unassigned Users */}
            {(() => {
              const unassigned = allProfiles.filter(p => !p.organization_id);
              if (loadingAllProfiles) {
                return (
                  <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-5">
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                  </div>
                );
              }
              return (
                <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="h-4 w-4 text-accent" />
                    <h3 className="font-display font-bold text-foreground text-sm md:text-base">Unassigned Users</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">{unassigned.length}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4">Users not assigned to any organization. Assign them to an org with a role.</p>
                  
                  {unassigned.length === 0 ? (
                    <div className="text-center py-6">
                      <Check className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">All users are assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unassigned.map((profile) => (
                        <motion.div key={profile.user_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-muted/20 border border-border/50">
                          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-accent/10 flex items-center justify-center text-xs md:text-sm font-bold text-accent shrink-0">
                            {(profile.full_name || "?")[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{profile.full_name || "Unknown"}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-md border font-semibold text-muted-foreground bg-muted/10 border-border/40">Unassigned</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => { setAssignMemberOrgId("pick"); setAssignUserId(profile.user_id); }}
                              className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-[10px] md:text-xs font-semibold hover:bg-primary/25 transition-colors flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Assign
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={() => setRemoveConfirm({ id: profile.user_id, userId: profile.user_id, name: profile.full_name || "this user" })}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete user permanently">
                              <Trash2 className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Section 3: All Users Overview */}
            <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-5">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-foreground text-sm md:text-base">All Users Overview</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{allProfiles.length}</span>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4">Complete list of all users in the system</p>
              
              {loadingAllProfiles ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 px-2 text-muted-foreground font-semibold">Name</th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-semibold">Organization</th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-semibold">Role</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles.map((profile) => {
                        const role = allUserRoles.find(r => r.user_id === profile.user_id);
                        const orgName = profile.organization_id ? organizationNameById[profile.organization_id] || "Unknown Org" : null;
                        const isSelf = profile.user_id === user?.id;
                        return (
                          <tr key={profile.user_id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{profile.full_name || "Unknown"}</span>
                                {isSelf && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold">You</span>}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                                orgName
                                  ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                                  : "text-muted-foreground bg-muted/10 border-border/40"
                              }`}>
                                {orgName || "Unassigned"}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold capitalize ${roleColors[role?.role || ""] || "text-muted-foreground bg-muted/10 border-border/40"}`}>
                                {role?.role || "—"}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right">
                              {!isSelf && (
                                <div className="flex items-center justify-end gap-1">
                                  {!profile.organization_id ? (
                                    <motion.button whileTap={{ scale: 0.97 }}
                                      onClick={() => { setAssignMemberOrgId("pick"); setAssignUserId(profile.user_id); }}
                                      className="px-2 py-1 rounded-md bg-primary/15 text-primary text-[10px] font-semibold hover:bg-primary/25 transition-colors">
                                      Assign
                                    </motion.button>
                                  ) : (
                                    <motion.button whileTap={{ scale: 0.97 }}
                                      onClick={() => setRemoveFromOrgConfirm({ userId: profile.user_id, name: profile.full_name || "this user", orgId: profile.organization_id! })}
                                      className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[10px] font-semibold hover:bg-destructive/20 transition-colors">
                                      Remove
                                    </motion.button>
                                  )}
                                  <motion.button whileTap={{ scale: 0.9 }}
                                    onClick={() => setRemoveConfirm({ id: profile.user_id, userId: profile.user_id, name: profile.full_name || "this user" })}
                                    className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[10px] font-semibold hover:bg-destructive/20 transition-colors"
                                    title="Delete permanently">
                                    <Trash2 className="h-3 w-3" />
                                  </motion.button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Org Dialog */}
      <Dialog open={creatingOrg} onOpenChange={setCreatingOrg}>
        <DialogContent className="sm:max-w-sm bg-card border-border/60">
          <DialogHeader><DialogTitle className="font-display">Create Organization</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (newOrgName.trim()) createOrg.mutate(newOrgName.trim()); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Organization Name</Label>
              <Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="e.g. Dhaka Cricket Club" className="bg-muted/40 border-border/60" required autoFocus />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCreatingOrg(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Create</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Org Dialog */}
      <Dialog open={editingOrg} onOpenChange={setEditingOrg}>
        <DialogContent className="sm:max-w-sm bg-card border-border/60">
          <DialogHeader><DialogTitle className="font-display">Edit Organization</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingOrgId) updateOrg.mutate({ id: editingOrgId, name: orgName }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Organization Name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="bg-muted/40 border-border/60" required />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingOrg(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Member to Org Dialog */}
      <Dialog open={!!assignMemberOrgId} onOpenChange={(open) => { if (!open) { setAssignMemberOrgId(null); setAssignUserId(""); } }}>
        <DialogContent className="sm:max-w-sm bg-card border-border/60">
          <DialogHeader><DialogTitle className="font-display">Assign Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {assignMemberOrgId === "pick" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Select Organization</Label>
                <Select value="" onValueChange={(val) => setAssignMemberOrgId(val)}>
                  <SelectTrigger className="bg-muted/40 border-border/60"><SelectValue placeholder="Choose an organization" /></SelectTrigger>
                  <SelectContent>
                    {allOrgs.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {assignMemberOrgId !== "pick" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Select User</Label>
                  <Select value={assignUserId} onValueChange={setAssignUserId}>
                    <SelectTrigger className="bg-muted/40 border-border/60"><SelectValue placeholder="Choose a user" /></SelectTrigger>
                    <SelectContent>
                      {loadingAllProfiles ? (
                        <div className="px-2 py-3 text-xs text-muted-foreground">Loading users...</div>
                      ) : assignableProfiles.length > 0 ? (
                        assignableProfiles.map((p) => (
                          <SelectItem key={p.user_id} value={p.user_id}>
                            {p.full_name || `User ${p.user_id.slice(0, 8)}`}
                            {p.organization_id
                              ? ` • ${organizationNameById[p.organization_id] || "Assigned"}`
                              : " • Unassigned"}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-xs text-muted-foreground">No eligible users found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
                  <Select value={assignRole} onValueChange={setAssignRole}>
                    <SelectTrigger className="bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="scorer">Scorer</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setAssignMemberOrgId(null); setAssignUserId(""); }} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
              <motion.button whileTap={{ scale: 0.97 }}
                disabled={!assignUserId || assignMemberOrgId === "pick"}
                onClick={() => {
                  if (assignMemberOrgId && assignMemberOrgId !== "pick" && assignUserId) {
                    assignMember.mutate({ orgId: assignMemberOrgId, userId: assignUserId, role: assignRole });
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Assign
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeConfirm} onOpenChange={(open) => { if (!open) setRemoveConfirm(null); }}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong className="text-foreground">{removeConfirm?.name}</strong> from the system? This will remove their account, role, and all access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingUser}
              onClick={(e) => {
                e.preventDefault();
                if (removeConfirm) {
                  removeMember.mutate({ profileId: removeConfirm.id, userId: removeConfirm.userId });
                  setRemoveConfirm(null);
                }
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">
              {deletingUser && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Organization Confirmation */}
      <AlertDialog open={!!deleteOrgConfirm} onOpenChange={(open) => { if (!open) { setDeleteOrgConfirm(null); setDeleteOrgInput(""); } }}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">Delete Organization</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span>This will <strong>permanently delete</strong> <strong className="text-foreground">{deleteOrgConfirm?.name}</strong> and all its data including teams, players, matches, stats, and tournaments. This action cannot be undone.</span>
              <span className="block mt-3 text-xs">Type <strong className="text-foreground font-mono">{deleteOrgConfirm?.name}</strong> to confirm:</span>
              <Input
                value={deleteOrgInput}
                onChange={(e) => setDeleteOrgInput(e.target.value)}
                placeholder="Type organization name..."
                className="bg-muted/40 border-destructive/30 mt-2"
                autoFocus
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => { setDeleteOrgConfirm(null); setDeleteOrgInput(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteOrgInput !== deleteOrgConfirm?.name || deleteOrg.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteOrgConfirm && deleteOrgInput === deleteOrgConfirm.name) {
                  deleteOrg.mutate(deleteOrgConfirm.id);
                }
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed">
              {deleteOrg.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={(open) => { if (!open) { setCreateUserOpen(false); setNewUserEmail(""); setNewUserPassword(""); setNewUserName(""); setNewUserRole("viewer"); } }}>
        <DialogContent className="sm:max-w-sm bg-card border-border/60">
          <DialogHeader><DialogTitle className="font-display">Create New User</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newUserEmail || !newUserPassword) return;
            setCreatingUser(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                  email: newUserEmail,
                  password: newUserPassword,
                  full_name: newUserName,
                  role: newUserRole,
                }),
              });
              const result = await res.json();
              if (!res.ok) throw new Error(result.error || "Failed to create user");
              toast.success("User created successfully!");
              setCreateUserOpen(false);
              setNewUserEmail(""); setNewUserPassword(""); setNewUserName(""); setNewUserRole("viewer");
              queryClient.invalidateQueries({ queryKey: ["org-members"] });
              queryClient.invalidateQueries({ queryKey: ["member-roles"] });
              queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
            } catch (err: any) {
              toast.error(err.message);
            } finally {
              setCreatingUser(false);
            }
          }} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Full Name</Label>
              <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g. Rahul Ahmed" className="bg-muted/40 border-border/60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Email *</Label>
              <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="user@example.com" className="bg-muted/40 border-border/60" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Password *</Label>
              <Input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Min 6 characters" className="bg-muted/40 border-border/60" required minLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="scorer">Scorer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setCreateUserOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" disabled={creatingUser || !newUserEmail || !newUserPassword} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {creatingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create User
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove from Org Confirmation */}
      <AlertDialog open={!!removeFromOrgConfirm} onOpenChange={(open) => { if (!open) setRemoveFromOrgConfirm(null); }}>
        <AlertDialogContent className="bg-card border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remove from Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong className="text-foreground">{removeFromOrgConfirm?.name}</strong> from their organization? They will become unassigned and lose their role. Their account will NOT be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (removeFromOrgConfirm) {
                  removeMemberFromOrg.mutate({ userId: removeFromOrgConfirm.userId });
                }
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {removeMemberFromOrg.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Remove from Org
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Organization Data Confirmation */}
      <AlertDialog open={!!resetOrgConfirm} onOpenChange={(open) => { if (!open) { setResetOrgConfirm(null); setResetOrgInput(""); } }}>
        <AlertDialogContent className="bg-card border-amber-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-amber-500">Reset Organization Data</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span>This will delete all <strong>matches, teams, tournaments, and notifications</strong> for <strong className="text-foreground">{resetOrgConfirm?.name}</strong>.</span>
              <span className="block text-xs mt-1">✅ Players and player statistics will be <strong className="text-primary">preserved</strong>.</span>
              <span className="block text-xs">✅ Members and roles will stay assigned.</span>
              <span className="block mt-3 text-xs">Type <strong className="text-foreground font-mono">{resetOrgConfirm?.name}</strong> to confirm:</span>
              <Input
                value={resetOrgInput}
                onChange={(e) => setResetOrgInput(e.target.value)}
                placeholder="Type organization name..."
                className="bg-muted/40 border-amber-500/30 mt-2"
                autoFocus
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => { setResetOrgConfirm(null); setResetOrgInput(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetOrgInput !== resetOrgConfirm?.name || resetOrgData.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (resetOrgConfirm && resetOrgInput === resetOrgConfirm.name) {
                  resetOrgData.mutate(resetOrgConfirm.id);
                }
              }}
              className="rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {resetOrgData.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="h-4 w-4 mr-1" />}
              Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Settings;