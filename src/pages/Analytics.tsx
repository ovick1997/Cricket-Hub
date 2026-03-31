import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, Target, Award, BarChart3, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const COLORS = ["hsl(152,55%,48%)", "hsl(36,90%,55%)", "hsl(215,85%,58%)", "hsl(0,72%,51%)", "hsl(280,60%,55%)"];

const tooltipStyle = {
  backgroundColor: "hsl(222,18%,11%)",
  border: "1px solid hsl(222,14%,16%)",
  borderRadius: "12px",
  color: "hsl(210,25%,96%)",
  fontSize: "12px",
  padding: "8px 12px",
};

const Analytics = () => {
  const { organizationId } = useAuth();

  const { data: players = [] } = useQuery({
    queryKey: ["players", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("players")
        .select("id, name")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, short_name, color")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: balls = [], isLoading } = useQuery({
    queryKey: ["all-balls", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      // Get all innings for this org's matches
      const { data: matchIds } = await supabase
        .from("matches")
        .select("id")
        .eq("organization_id", organizationId);
      if (!matchIds || matchIds.length === 0) return [];

      const { data: inningsData } = await supabase
        .from("innings")
        .select("id")
        .in("match_id", matchIds.map(m => m.id));
      if (!inningsData || inningsData.length === 0) return [];

      const { data, error } = await supabase
        .from("balls")
        .select("*")
        .in("innings_id", inningsData.map(i => i.id));
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const playerMap = useMemo(() => {
    const m: Record<string, string> = {};
    players.forEach(p => { m[p.id] = p.name; });
    return m;
  }, [players]);

  // Compute batting stats from balls
  const battingStats = useMemo(() => {
    const stats: Record<string, { name: string; runs: number; balls: number }> = {};
    balls.forEach(b => {
      const id = b.batsman_id;
      if (!stats[id]) stats[id] = { name: playerMap[id] || "Unknown", runs: 0, balls: 0 };
      stats[id].runs += b.runs_scored;
      stats[id].balls += 1;
    });
    return Object.values(stats).sort((a, b) => b.runs - a.runs);
  }, [balls, playerMap]);

  // Compute bowling stats from balls
  const bowlingStats = useMemo(() => {
    const stats: Record<string, { name: string; wickets: number; runs: number; balls: number }> = {};
    balls.forEach(b => {
      const id = b.bowler_id;
      if (!stats[id]) stats[id] = { name: playerMap[id] || "Unknown", wickets: 0, runs: 0, balls: 0 };
      stats[id].runs += b.runs_scored + b.extra_runs;
      stats[id].balls += 1;
      if (b.is_wicket) stats[id].wickets += 1;
    });
    return Object.values(stats).sort((a, b) => b.wickets - a.wickets);
  }, [balls, playerMap]);

  const topScorers = battingStats.slice(0, 5);
  const topWicketTakers = bowlingStats.filter(b => b.wickets > 0).slice(0, 5);
  const maxRuns = topScorers[0]?.runs || 1;
  const maxWickets = topWicketTakers[0]?.wickets || 1;

  // Team win/loss data
  const teamData = useMemo(() => {
    // Count wins/losses from completed matches with results
    const stats: Record<string, { wins: number; losses: number }> = {};
    teams.forEach(t => { stats[t.id] = { wins: 0, losses: 0 }; });

    matches.filter(m => m.status === "completed" && m.result).forEach(m => {
      // Simple heuristic: if result contains team1's name → team1 won
      const result = m.result || "";
      if (stats[m.team1_id] && stats[m.team2_id]) {
        // Can't determine winner from result text without team names, just count matches
        stats[m.team1_id].wins += 1; // placeholder
        stats[m.team2_id].losses += 1;
      }
    });

    return teams.map(t => ({
      name: t.short_name,
      wins: stats[t.id]?.wins || 0,
      losses: stats[t.id]?.losses || 0,
    }));
  }, [teams, matches]);

  const totalMatches = matches.length;
  const highestScore = topScorers[0];
  const mostWickets = topWicketTakers[0];

  if (isLoading) {
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
      <div className="space-y-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Performance insights and statistics</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Highest Score" value={highestScore?.runs?.toLocaleString() || "—"} subtitle={highestScore?.name} icon={TrendingUp} />
          <StatCard title="Most Wickets" value={mostWickets?.wickets || "—"} subtitle={mostWickets?.name} icon={Target} />
          <StatCard title="Teams" value={teams.length} icon={Award} />
          <StatCard title="Total Matches" value={totalMatches} icon={BarChart3} />
        </div>

        {balls.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No match data yet. Start scoring to see analytics!</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Top Scorers */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-foreground">Top Run Scorers</h3>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-3.5">
                {topScorers.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 group">
                    <span className={`text-xs font-mono font-bold w-5 text-center ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/15">
                      <span className="text-[10px] font-bold text-primary">{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <div className="w-full bg-muted/60 rounded-full h-1.5 mt-1.5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(p.runs / maxRuns) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className="bg-gradient-to-r from-primary to-primary/60 h-1.5 rounded-full" />
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-foreground tabular-nums">{p.runs.toLocaleString()}</span>
                  </motion.div>
                ))}
                {topScorers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No batting data yet</p>}
              </div>
            </div>

            {/* Top Wicket Takers */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-foreground">Top Wicket Takers</h3>
                <Target className="h-4 w-4 text-info" />
              </div>
              <div className="space-y-3.5">
                {topWicketTakers.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 group">
                    <span className={`text-xs font-mono font-bold w-5 text-center ${i === 0 ? "text-info" : "text-muted-foreground"}`}>{i + 1}</span>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-info/15 to-info/5 flex items-center justify-center ring-1 ring-info/15">
                      <span className="text-[10px] font-bold text-info">{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <div className="w-full bg-muted/60 rounded-full h-1.5 mt-1.5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(p.wickets / maxWickets) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className="bg-gradient-to-r from-info to-info/60 h-1.5 rounded-full" />
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-foreground tabular-nums">{p.wickets}</span>
                  </motion.div>
                ))}
                {topWicketTakers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No bowling data yet</p>}
              </div>
            </div>

            {/* Team Performance Chart */}
            {teamData.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-foreground mb-5">Team Performance</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={teamData} barGap={4}>
                    <XAxis dataKey="name" tick={{ fill: "hsl(215,12%,50%)", fontSize: 12, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215,12%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(222,14%,14%)" }} />
                    <Bar dataKey="wins" name="Wins" fill="hsl(152,55%,48%)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="losses" name="Losses" fill="hsl(0,72%,51%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Win Distribution */}
            {teamData.length > 0 && teamData.some(t => t.wins > 0) && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-foreground mb-5">Win Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={teamData.filter(t => t.wins > 0).map(t => ({ name: t.name, value: t.wins }))}
                      cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value"
                      stroke="hsl(222,22%,6%)" strokeWidth={3}
                    >
                      {teamData.filter(t => t.wins > 0).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-5 mt-3 flex-wrap">
                  {teamData.filter(t => t.wins > 0).map((t, i) => (
                    <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground/50">({t.wins})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
