import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { MatchCard } from "@/components/MatchCard";
import { Swords, Users, UserCircle, Trophy, Radio, Loader2, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();
  const { organizationId } = useAuth();

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["matches", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(id, name, short_name, color), team2:teams!matches_team2_id_fkey(id, name, short_name, color)")
        .eq("organization_id", organizationId)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Fetch innings for score display
  const { data: innings = [] } = useQuery({
    queryKey: ["all-innings", organizationId],
    queryFn: async () => {
      if (!organizationId || matches.length === 0) return [];
      const matchIds = matches.map(m => m.id);
      const { data, error } = await supabase
        .from("innings")
        .select("*")
        .in("match_id", matchIds);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && matches.length > 0,
  });

  const { data: teamCount = 0 } = useQuery({
    queryKey: ["team-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return 0;
      const { count, error } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });

  const { data: playerCount = 0 } = useQuery({
    queryKey: ["player-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return 0;
      const { count, error } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });

  // Build match cards with scores from innings
  const matchCards = matches.map((m: any) => {
    const matchInnings = innings.filter(i => i.match_id === m.id);
    const inn1 = matchInnings.find(i => i.innings_number === 1);
    const inn2 = matchInnings.find(i => i.innings_number === 2);
    return {
      ...m,
      team1Score: inn1 ? `${inn1.total_runs}/${inn1.total_wickets} (${inn1.total_overs})` : undefined,
      team2Score: inn2 ? `${inn2.total_runs}/${inn2.total_wickets} (${inn2.total_overs})` : undefined,
    };
  });

  const liveMatches = matchCards.filter((m: any) => m.status === "live");
  const recentMatches = matchCards.filter((m: any) => m.status !== "upcoming").slice(0, 3);
  const upcomingMatches = matchCards.filter((m: any) => m.status === "upcoming").slice(0, 2);

  if (matchesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 md:space-y-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Welcome back — here's what's happening</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open("/", "_blank")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              Public Page
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <StatCard title="Matches" value={matches.length} icon={Swords} />
          <StatCard title="Live Now" value={liveMatches.length} icon={Radio} glowing={liveMatches.length > 0} />
          <StatCard title="Teams" value={teamCount} icon={Users} />
          <StatCard title="Players" value={playerCount} icon={UserCircle} />
        </div>

        {liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-xl md:rounded-2xl border border-primary/20 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => navigate("/scoring")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                <div className="flex items-center gap-1.5 bg-primary/15 rounded-lg px-2 py-0.5">
                  <Radio className="h-3 w-3 text-primary animate-pulse-glow" />
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Live</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm md:text-xl text-foreground tracking-tight truncate">
                    {liveMatches[0].team1?.name} <span className="text-muted-foreground font-normal text-xs md:text-sm mx-0.5">vs</span> {liveMatches[0].team2?.name}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">{liveMatches[0].venue} • {liveMatches[0].overs} ov</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {liveMatches[0].team1Score && (
                    <p className="font-mono font-bold text-lg md:text-2xl text-foreground tracking-tight">{liveMatches[0].team1Score}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 md:mt-1 justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(`/live/${liveMatches[0].id}`, '_blank'); }}
                      className="text-[9px] md:text-[10px] text-accent font-medium hover:underline"
                    >Share ↗</button>
                    <p className="text-[9px] md:text-[10px] text-primary font-medium">View →</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="font-display font-semibold text-foreground text-sm md:text-lg">Recent Matches</h2>
              <button onClick={() => navigate("/matches")} className="text-xs text-primary font-medium">View all →</button>
            </div>
            <div className="space-y-2 md:space-y-3">
              {recentMatches.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No matches yet</p>}
              {recentMatches.map((match: any, i: number) => (
                <MatchCard key={match.id} match={match} index={i} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <h2 className="font-display font-semibold text-foreground text-sm md:text-lg">Upcoming</h2>
                <button onClick={() => navigate("/matches")} className="text-xs text-primary font-medium">View all →</button>
              </div>
              <div className="space-y-2 md:space-y-2.5">
                {upcomingMatches.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No upcoming matches</p>}
                {upcomingMatches.map((match: any, i: number) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            </div>

            <div className="rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-4">
              <h3 className="font-display font-semibold text-foreground text-xs md:text-sm mb-2 md:mb-2.5">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                {[
                  { label: "New Match", icon: Swords, path: "/matches" },
                  { label: "Start Scoring", icon: Radio, path: "/scoring" },
                  { label: "Add Team", icon: Users, path: "/teams" },
                  { label: "Tournament", icon: Trophy, path: "/tournaments" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-muted/50 active:bg-muted transition-colors text-xs md:text-sm text-foreground touch-manipulation"
                  >
                    <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-primary/10">
                      <action.icon className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
                    </div>
                    <span className="font-medium text-[11px] md:text-[12px]">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
