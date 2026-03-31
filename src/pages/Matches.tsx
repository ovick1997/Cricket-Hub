import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, Loader2, Radio, MapPin, Calendar, History, Award } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { MatchFormDialog, type MatchFormData } from "@/components/forms/MatchFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusFilters = ["all", "live", "upcoming", "completed"] as const;

const filterDots: Record<string, string> = {
  live: "bg-primary",
  upcoming: "bg-info",
  completed: "bg-muted-foreground",
};

const Matches = () => {
  const [filter, setFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: matchesData = [], isLoading } = useQuery({
    queryKey: ["matches", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(id, name, short_name, color), team2:teams!matches_team2_id_fkey(id, name, short_name, color), man_of_match:players!matches_man_of_match_id_fkey(name), innings(*)")
        .eq("organization_id", organizationId)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const createMatch = useMutation({
    mutationFn: async (formData: MatchFormData) => {
      if (!organizationId) throw new Error("No organization");
      const { error } = await supabase.from("matches").insert({
        team1_id: formData.team1,
        team2_id: formData.team2,
        overs: formData.overs,
        venue: formData.venue,
        match_date: formData.date,
        tournament_id: formData.tournamentId && formData.tournamentId !== "none" ? formData.tournamentId : null,
        organization_id: organizationId,
        is_short_chris: formData.isShortChris || false,
        batting_option: formData.battingOption ?? 2,
        max_overs_per_bowler: formData.maxOversPerBowler || null,
        players_per_team: formData.playersPerTeam,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Match created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = filter === "all" ? matchesData : matchesData.filter((m) => m.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-display font-bold text-foreground tracking-tight">Matches</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{matchesData.length} total matches</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/match-history")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/60 text-muted-foreground font-semibold text-xs hover:bg-muted hover:text-foreground transition-colors"
            >
              <History className="h-3.5 w-3.5" /> History
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" /> New Match
            </motion.button>
          </div>
        </motion.div>

        <MatchFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={(data) => createMatch.mutate(data)}
        />

        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                filter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s !== "all" && <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${filterDots[s]}`} />}
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">{matchesData.length === 0 ? "No matches yet. Create your first match!" : "No matches found for this filter"}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
            {filtered.map((match: any, i: number) => {
              const isLive = match.status === "live";
              const innings = match.innings || [];
              const team1Inn = innings.find((inn: any) => inn.batting_team_id === match.team1?.id);
              const team2Inn = innings.find((inn: any) => inn.batting_team_id === match.team2?.id);
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  onClick={() => match.status === "completed" ? navigate(`/scorecard/${match.id}`) : undefined}
                  className={`relative rounded-xl md:rounded-2xl border bg-card p-3 md:p-4 transition-all cursor-pointer overflow-hidden group ${
                    isLive ? "border-primary/25 glow-primary" : "border-border hover:border-primary/15"
                  }`}
                >
                  {isLive && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />}

                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-md ${
                      isLive ? "bg-primary/15 text-primary" : match.status === "upcoming" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"
                    }`}>
                      {isLive && <Radio className="h-2.5 w-2.5 inline mr-1 animate-pulse-glow" />}
                      {match.status}
                    </span>
                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-mono">{match.overs} ov</span>
                  </div>

                  <div className="space-y-1.5 md:space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 md:h-7 md:w-7 rounded-md md:rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-bold" style={{ backgroundColor: (match.team1?.color || "#22c55e") + "15", color: match.team1?.color || "#22c55e" }}>
                          {match.team1?.short_name || "??"}
                        </div>
                        <span className="font-display font-semibold text-xs md:text-sm text-foreground">{match.team1?.name || "TBD"}</span>
                      </div>
                      {team1Inn && (
                        <span className="text-xs md:text-sm font-display font-bold text-foreground">
                          {team1Inn.total_runs}/{team1Inn.total_wickets}
                          <span className="text-[9px] md:text-[10px] text-muted-foreground font-mono ml-0.5">({team1Inn.total_overs})</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 md:h-7 md:w-7 rounded-md md:rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-bold" style={{ backgroundColor: (match.team2?.color || "#f59e0b") + "15", color: match.team2?.color || "#f59e0b" }}>
                          {match.team2?.short_name || "??"}
                        </div>
                        <span className="font-display font-semibold text-xs md:text-sm text-foreground">{match.team2?.name || "TBD"}</span>
                      </div>
                      {team2Inn && (
                        <span className="text-xs md:text-sm font-display font-bold text-foreground">
                          {team2Inn.total_runs}/{team2Inn.total_wickets}
                          <span className="text-[9px] md:text-[10px] text-muted-foreground font-mono ml-0.5">({team2Inn.total_overs})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {match.result && (
                    <p className="text-[10px] md:text-xs text-primary font-medium mt-2 md:mt-3 bg-primary/5 rounded-md md:rounded-lg px-2 py-1 md:px-2.5 md:py-1.5">{match.result}</p>
                  )}

                  <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border/60">
                    {match.match_date && (
                      <span className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" /> {format(new Date(match.match_date), "MMM d, yyyy")}
                      </span>
                    )}
                    {match.venue && (
                      <span className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0" /> <span className="truncate">{match.venue}</span>
                      </span>
                    )}
                    {(match.man_of_match as any)?.name && (
                      <span className="text-[9px] md:text-[10px] text-amber-500 flex items-center gap-1 ml-auto">
                        <Award className="h-2.5 w-2.5 md:h-3 md:w-3" /> {(match.man_of_match as any).name}
                      </span>
                    )}
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

export default Matches;
