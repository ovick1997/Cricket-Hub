import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, UserPlus, Loader2, Users, Shield, Star, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { PlayerFormDialog, type PlayerFormData } from "@/components/forms/PlayerFormDialog";
import { TeamFormDialog, type TeamFormData } from "@/components/forms/TeamFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Searchable player list for adding existing players
function AddExistingPlayerList({ players, onSelect }: { players: any[]; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = search ? players.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())) : players;
  const initials = (name: string) => name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
      <div className="max-h-52 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {players.length === 0 ? "No available players" : "No players match your search"}
          </p>
        ) : (
          filtered.map((p: any) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(p.id)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-left transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">{initials(p.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{p.role}</p>
              </div>
              {p.jersey_number !== null && <span className="text-[10px] text-muted-foreground font-mono">#{p.jersey_number}</span>}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();

  const [editFormOpen, setEditFormOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [addMode, setAddMode] = useState<"existing" | "new">("existing");
  const [_selectedPlayerId, setSelectedPlayerId] = useState("");
  const [newPlayerFormOpen, setNewPlayerFormOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<{ player: any; tpId: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ tpId: string; name: string } | null>(null);
  const [deleteTeamConfirm, setDeleteTeamConfirm] = useState(false);

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ["team_players", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_players")
        .select("*, players(*)")
        .eq("team_id", id!)
        .order("joined_at");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase.from("players").select("*").eq("organization_id", organizationId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: teamUsage } = useQuery({
    queryKey: ["team_usage", id],
    queryFn: async () => {
      const [matchesRes, tournamentsRes] = await Promise.all([
        supabase.from("matches")
          .select("id, status")
          .or(`team1_id.eq.${id},team2_id.eq.${id}`)
          .in("status", ["upcoming", "live"]),
        supabase.from("tournament_teams")
          .select("tournament_id, tournaments(name, status)")
          .eq("team_id", id!),
      ]);
      const activeMatches = (matchesRes.data || []);
      const activeTournaments = (tournamentsRes.data || []).filter(
        (tt: any) => tt.tournaments?.status === "upcoming" || tt.tournaments?.status === "ongoing"
      );
      return { activeMatches, activeTournaments };
    },
    enabled: !!id,
  });

  const updateTeam = useMutation({
    mutationFn: async (formData: TeamFormData) => {
      const { error } = await supabase.from("teams").update({
        name: formData.name, short_name: formData.shortName, color: formData.color,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const addPlayerToTeam = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.from("team_players").insert({ team_id: id!, player_id: playerId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_players", id] });
      toast.success("Player added!");
    },
    onError: (err) => toast.error(err.message),
  });

  const createAndAddPlayer = useMutation({
    mutationFn: async (formData: PlayerFormData) => {
      if (!organizationId) throw new Error("No organization");
      const { data, error } = await supabase.from("players").insert({
        name: formData.name, role: formData.role, batting_style: formData.battingStyle,
        bowling_style: formData.bowlingStyle || null, jersey_number: formData.jerseyNumber ?? null,
        organization_id: organizationId,
      }).select("id").single();
      if (error) throw error;
      const { error: tpError } = await supabase.from("team_players").insert({ team_id: id!, player_id: data.id });
      if (tpError) throw tpError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_players", id] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player created and added!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePlayer = useMutation({
    mutationFn: async ({ playerId, formData }: { playerId: string; formData: PlayerFormData }) => {
      const { error } = await supabase.from("players").update({
        name: formData.name, role: formData.role, batting_style: formData.battingStyle,
        bowling_style: formData.bowlingStyle || null, jersey_number: formData.jerseyNumber ?? null,
      }).eq("id", playerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_players", id] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const removePlayer = useMutation({
    mutationFn: async (tpId: string) => {
      const { error } = await supabase.from("team_players").delete().eq("id", tpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_players", id] });
      toast.success("Player removed!");
    },
    onError: (err) => toast.error(err.message),
  });

  const setCaptain = useMutation({
    mutationFn: async (tpId: string) => {
      await supabase.from("team_players").update({ is_captain: false } as any).eq("team_id", id!);
      const { error } = await supabase.from("team_players").update({ is_captain: true } as any).eq("id", tpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_players", id] });
      toast.success("Captain updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const setViceCaptain = useMutation({
    mutationFn: async (tpId: string) => {
      await supabase.from("team_players").update({ is_vice_captain: false } as any).eq("team_id", id!);
      const { error } = await supabase.from("team_players").update({ is_vice_captain: true } as any).eq("id", tpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_players", id] });
      toast.success("Vice-Captain updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const hasLiveMatch = teamUsage?.activeMatches.some((m: any) => m.status === "live") ?? false;

  const deleteTeam = useMutation({
    mutationFn: async () => {
      if (hasLiveMatch) throw new Error("Cannot delete a team with a live match in progress");
      await supabase.from("team_players").delete().eq("team_id", id!);
      const { error } = await supabase.from("teams").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted!");
      navigate("/teams");
    },
    onError: (err) => toast.error(err.message),
  });

  const existingIds = new Set(teamPlayers.map((tp: any) => tp.player_id));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Team not found</p>
          <button onClick={() => navigate("/teams")} className="text-primary text-sm mt-2">← Back to Teams</button>
        </div>
      </DashboardLayout>
    );
  }

  const roleGroups = {
    batsman: teamPlayers.filter((tp: any) => tp.players?.role === "batsman"),
    bowler: teamPlayers.filter((tp: any) => tp.players?.role === "bowler"),
    "all-rounder": teamPlayers.filter((tp: any) => tp.players?.role === "all-rounder"),
    wicketkeeper: teamPlayers.filter((tp: any) => tp.players?.role === "wicketkeeper"),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button onClick={() => navigate("/teams")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Teams
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div
              className="h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center font-display font-bold text-lg md:text-xl ring-1 shrink-0"
              style={{ backgroundColor: team.color + "15", color: team.color, borderColor: team.color + "30" }}
            >
              {team.short_name}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">{team.name}</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{teamPlayers.length} players in squad</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setDeleteTeamConfirm(true)}
                className="h-9 px-3 rounded-xl text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditFormOpen(true)}
                className="h-9 px-3 rounded-xl text-xs font-semibold bg-muted/60 text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setAddPlayerOpen(true); setAddMode("existing"); setSelectedPlayerId(""); }}
                className="h-9 px-3 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Player
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Team color bar */}
        <div className="h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}40)` }} />

        {/* Squad */}
        {teamPlayers.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border/60 bg-card/50">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No players yet</p>
            <button
              onClick={() => { setAddPlayerOpen(true); setAddMode("existing"); }}
              className="mt-3 text-primary text-sm font-semibold hover:underline"
            >
              Add your first player →
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {(Object.entries(roleGroups) as [string, any[]][])
              .filter(([, players]) => players.length > 0)
              .map(([role, players]) => (
                <motion.div key={role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1 capitalize">{role}s</p>
                  <div className="grid gap-1.5">
                    {players.map((tp: any) => (
                      <div
                        key={tp.id}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 hover:border-primary/20 transition-all group"
                      >
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ backgroundColor: team.color + "15", color: team.color }}
                        >
                          {tp.players?.jersey_number ?? "–"}
                        </div>
                         <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground truncate">{tp.players?.name}</p>
                            {(tp as any).is_captain && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold shrink-0">
                                <Shield className="h-2.5 w-2.5" /> C
                              </span>
                            )}
                            {(tp as any).is_vice_captain && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-500 text-[10px] font-bold shrink-0">
                                <Star className="h-2.5 w-2.5" /> VC
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {tp.players?.batting_style} • {tp.players?.bowling_style || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!(tp as any).is_captain && (
                            <button
                              onClick={() => setCaptain.mutate(tp.id)}
                              title="Make Captain"
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!(tp as any).is_vice_captain && (
                            <button
                              onClick={() => setViceCaptain.mutate(tp.id)}
                              title="Make Vice-Captain"
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditPlayer({ player: tp.players, tpId: tp.id })}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ tpId: tp.id, name: tp.players?.name })}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* Edit Team */}
      <TeamFormDialog
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        onSubmit={(data) => updateTeam.mutate(data)}
        initialData={{ name: team.name, shortName: team.short_name, color: team.color }}
        mode="edit"
      />

      {/* Add Player Dialog */}
      <Dialog open={addPlayerOpen && !newPlayerFormOpen} onOpenChange={(o) => { if (!o) setAddPlayerOpen(false); }}>
        <DialogContent className="sm:max-w-sm bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Add Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setAddMode("existing")} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${addMode === "existing" ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-muted/40 text-muted-foreground"}`}>
                Existing Player
              </button>
              <button onClick={() => setAddMode("new")} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${addMode === "new" ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-muted/40 text-muted-foreground"}`}>
                Create New
              </button>
            </div>
            {addMode === "existing" ? (
              <AddExistingPlayerList
                players={allPlayers.filter(p => !existingIds.has(p.id))}
                onSelect={(playerId) => { addPlayerToTeam.mutate(playerId); setAddPlayerOpen(false); }}
              />
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setNewPlayerFormOpen(true)}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <UserPlus className="h-4 w-4 inline mr-2" /> Create New Player
              </motion.button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Player Form */}
      <PlayerFormDialog
        open={newPlayerFormOpen}
        onOpenChange={(o) => { if (!o) { setNewPlayerFormOpen(false); setAddPlayerOpen(false); } }}
        onSubmit={(data) => { createAndAddPlayer.mutate(data); setNewPlayerFormOpen(false); setAddPlayerOpen(false); }}
        mode="create"
      />

      {/* Edit Player */}
      <PlayerFormDialog
        open={!!editPlayer}
        onOpenChange={(o) => { if (!o) setEditPlayer(null); }}
        onSubmit={(data) => { if (editPlayer) { updatePlayer.mutate({ playerId: editPlayer.player.id, formData: data }); setEditPlayer(null); } }}
        initialData={editPlayer ? {
          name: editPlayer.player.name, role: editPlayer.player.role,
          battingStyle: editPlayer.player.batting_style, bowlingStyle: editPlayer.player.bowling_style || "",
          jerseyNumber: editPlayer.player.jersey_number ?? undefined,
        } : undefined}
        mode="edit"
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <AlertDialogContent className="bg-card border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteConfirm?.name}</strong> from this team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirm) { removePlayer.mutate(deleteConfirm.tpId); setDeleteConfirm(null); } }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Confirm */}
      <AlertDialog open={deleteTeamConfirm} onOpenChange={setDeleteTeamConfirm}>
        <AlertDialogContent className="bg-card border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Team</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Are you sure you want to delete <strong>{team?.name}</strong>? All player associations will be removed. This action cannot be undone.</p>
                {hasLiveMatch && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>This team has a <strong>live match in progress</strong>. You cannot delete it until the match is completed.</span>
                  </div>
                )}
                {!hasLiveMatch && teamUsage && teamUsage.activeMatches.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-amber-400 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>This team is part of <strong>{teamUsage.activeMatches.length}</strong> upcoming match{teamUsage.activeMatches.length > 1 ? "es" : ""}. Deleting it may break those matches.</span>
                  </div>
                )}
                {teamUsage && teamUsage.activeTournaments.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-amber-400 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>This team is in <strong>{teamUsage.activeTournaments.length}</strong> active tournament{teamUsage.activeTournaments.length > 1 ? "s" : ""}: {teamUsage.activeTournaments.map((t: any) => t.tournaments?.name).join(", ")}.</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeam.mutate()}
              disabled={hasLiveMatch}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TeamDetails;
