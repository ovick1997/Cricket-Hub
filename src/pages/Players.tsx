import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, Search, Loader2, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { PlayerFormDialog, type PlayerFormData } from "@/components/forms/PlayerFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const roleConfig: Record<string, { bg: string; text: string; dot: string }> = {
  batsman: { bg: "bg-accent/10", text: "text-accent", dot: "bg-accent" },
  bowler: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  "all-rounder": { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  wicketkeeper: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
};

const Players = () => {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<any>(null);
  const [deletePlayer, setDeletePlayer] = useState<any>(null);
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("players.edit");

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const createPlayer = useMutation({
    mutationFn: async (formData: PlayerFormData) => {
      if (!organizationId) throw new Error("No organization");
      const { error } = await supabase.from("players").insert({
        name: formData.name,
        role: formData.role,
        batting_style: formData.battingStyle,
        bowling_style: formData.bowlingStyle || null,
        jersey_number: formData.jerseyNumber ?? null,
        organization_id: organizationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player added!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: PlayerFormData }) => {
      const { error } = await supabase.from("players").update({
        name: formData.name,
        role: formData.role,
        batting_style: formData.battingStyle,
        bowling_style: formData.bowlingStyle || null,
        jersey_number: formData.jerseyNumber ?? null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player deleted!");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Players</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{players.length} registered players</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-muted/40 border border-border/60 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/30 w-56 transition-all"
              />
            </div>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Player
            </motion.button>
          </div>
        </motion.div>

        <PlayerFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={(data) => createPlayer.mutate(data)}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">{players.length === 0 ? "No players yet. Add your first player!" : "No players match your search"}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      {["#", "Player", "Role", "Batting", "Bowling", ...(canEdit ? [""] : [])].map((h) => (
                        <th key={h || "actions"} className="text-left px-4 py-3.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest first:pl-5 last:pr-5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map((player, i) => {
                      const rc = roleConfig[player.role] || roleConfig.batsman;
                      return (
                        <motion.tr
                          key={player.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => navigate(`/player/${player.id}`)}
                          className="hover:bg-muted/20 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3.5 pl-5">
                            <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{player.jersey_number ?? "-"}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/15">
                                <span className="text-[11px] font-bold text-primary">{player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                              </div>
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{player.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-1 rounded-lg ${rc.bg} ${rc.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${rc.dot}`} />
                              {player.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{player.batting_style}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground pr-5">{player.bowling_style || "-"}</td>
                          {canEdit && (
                            <td className="px-4 py-3.5 pr-5">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditPlayer(player); }}
                                  className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeletePlayer(player); }}
                                  className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
              {filtered.map((player, i) => {
                const rc = roleConfig[player.role] || roleConfig.batsman;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                  >
                    <button
                      onClick={() => navigate(`/player/${player.id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/15 shrink-0">
                        <span className="text-xs font-bold text-primary">{player.jersey_number ?? player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded ${rc.bg} ${rc.text}`}>
                            <span className={`h-1 w-1 rounded-full ${rc.dot}`} />
                            {player.role}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{player.batting_style}</span>
                        </div>
                      </div>
                    </button>
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditPlayer(player)}
                          className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletePlayer(player)}
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit Player Dialog */}
      {editPlayer && (
        <PlayerFormDialog
          open={!!editPlayer}
          onOpenChange={(open) => { if (!open) setEditPlayer(null); }}
          onSubmit={(data) => updatePlayerMutation.mutate({ id: editPlayer.id, formData: data })}
          initialData={{
            name: editPlayer.name,
            role: editPlayer.role,
            battingStyle: editPlayer.batting_style,
            bowlingStyle: editPlayer.bowling_style || "",
            jerseyNumber: editPlayer.jersey_number ?? undefined,
          }}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePlayer} onOpenChange={(open) => { if (!open) setDeletePlayer(null); }}>
        <AlertDialogContent className="bg-card border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletePlayer?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deletePlayerMutation.mutate(deletePlayer.id); setDeletePlayer(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Players;
