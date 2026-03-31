import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, Trophy, Calendar, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { TournamentFormDialog, type TournamentFormData } from "@/components/forms/TournamentFormDialog";

const formatConfig: Record<string, { bg: string; text: string }> = {
  league: { bg: "bg-primary/10", text: "text-primary" },
  knockout: { bg: "bg-destructive/10", text: "text-destructive" },
  "round-robin": { bg: "bg-info/10", text: "text-info" },
  "short-chris": { bg: "bg-accent/10", text: "text-accent" },
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  upcoming: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  ongoing: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary animate-pulse-glow" },
  completed: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const Tournaments = () => {
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: tournamentTeams = [] } = useQuery({
    queryKey: ["tournament_teams", organizationId],
    queryFn: async () => {
      if (!organizationId || tournaments.length === 0) return [];
      const ids = tournaments.map(t => t.id);
      const { data, error } = await supabase.from("tournament_teams").select("*").in("tournament_id", ids);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && tournaments.length > 0,
  });

  const { data: matchCounts = {} } = useQuery({
    queryKey: ["tournament_match_counts", organizationId],
    queryFn: async () => {
      if (!organizationId || tournaments.length === 0) return {};
      const ids = tournaments.map(t => t.id);
      const { data, error } = await supabase.from("matches").select("tournament_id").in("tournament_id", ids);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(m => { if (m.tournament_id) counts[m.tournament_id] = (counts[m.tournament_id] || 0) + 1; });
      return counts;
    },
    enabled: !!organizationId && tournaments.length > 0,
  });

  const createTournament = useMutation({
    mutationFn: async (formData: TournamentFormData) => {
      if (!organizationId) throw new Error("No organization");
      const { error } = await supabase.from("tournaments").insert({
        name: formData.name,
        format: formData.format as any,
        status: formData.status as any,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        overs_per_match: formData.overs_per_match,
        prize_money: formData.prize_money || null,
        players_per_team: formData.players_per_team,
        venue: formData.venue || null,
        description: formData.description || null,
        organization_id: organizationId,
        batting_option: formData.batting_option ?? 2,
        max_overs_per_bowler: formData.max_overs_per_bowler || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tournaments"] }); toast.success("Tournament created!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Tournaments</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{tournaments.length} tournaments</p>
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> New Tournament
          </motion.button>
        </motion.div>

        <TournamentFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={(data) => createTournament.mutate(data)} />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No tournaments yet. Create your first tournament!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-2.5 md:gap-4">
            {tournaments.map((t, i) => {
              const sc = statusConfig[t.status] || statusConfig.upcoming;
              const fc = formatConfig[t.format] || formatConfig.league;
              const teamsCount = tournamentTeams.filter(tt => tt.tournament_id === t.id).length;
              const mCount = (matchCounts as Record<string, number>)[t.id] || 0;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                  className="rounded-xl md:rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/15 transition-all cursor-pointer group"
                >
                  <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2.5 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15">
                          <Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">{t.name}</h3>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{teamsCount} teams • {mCount} matches</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg ${sc.bg} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {t.status}
                      </span>
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg ${fc.bg} ${fc.text}`}>
                        {t.format}
                      </span>
                      {t.start_date && (
                        <span className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                          <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />{format(new Date(t.start_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tournaments;
