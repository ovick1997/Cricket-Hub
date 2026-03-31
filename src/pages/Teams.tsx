import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, Loader2, ChevronRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamFormDialog, type TeamFormData } from "@/components/forms/TeamFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Teams = () => {
  const [formOpen, setFormOpen] = useState(false);
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("teams").select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ["team_players", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase.from("team_players").select("id, team_id, player_id, is_captain, players(name)").order("joined_at");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const createTeam = useMutation({
    mutationFn: async (formData: TeamFormData) => {
      if (!organizationId) throw new Error("No organization");
      const { error } = await supabase.from("teams").insert({
        name: formData.name, short_name: formData.shortName, color: formData.color, organization_id: organizationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const playerCount = (teamId: string) => teamPlayers.filter(tp => tp.team_id === teamId).length;
  const getCaptain = (teamId: string) => {
    const cap = teamPlayers.find(tp => tp.team_id === teamId && (tp as any).is_captain);
    return cap ? (cap as any).players?.name : null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Teams</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{teams.length} registered teams</p>
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Add Team
          </motion.button>
        </motion.div>

        <TeamFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={(d) => createTeam.mutate(d)} mode="create" />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No teams yet. Create your first team!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
            {teams.map((team, i) => {
              const count = playerCount(team.id);
              const captain = getCaptain(team.id);
              return (
                <motion.button
                  key={team.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="rounded-xl md:rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-all group text-left"
                >
                  <div className="h-1" style={{ background: `linear-gradient(90deg, ${team.color}, ${team.color}60)` }} />
                  <div className="p-2.5 md:p-4 flex items-center gap-2 md:gap-3">
                    <div
                      className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl flex items-center justify-center font-display font-bold text-[11px] md:text-sm ring-1 shrink-0"
                      style={{ backgroundColor: team.color + "15", color: team.color, borderColor: team.color + "30" }}
                    >
                      {team.short_name}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-xs md:text-sm text-foreground group-hover:text-primary transition-colors truncate">{team.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] md:text-[11px] text-muted-foreground mt-0.5">
                        <span className="shrink-0">{count} player{count !== 1 ? "s" : ""}</span>
                        {captain && (
                          <span className="hidden md:inline-flex items-center gap-0.5 text-amber-500 truncate">
                            <span className="shrink-0">·</span>
                            <Shield className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{captain}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Teams;
