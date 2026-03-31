import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, TrendingUp, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerStat {
  id: string;
  player_id: string;
  matches_played: number;
  innings_batted: number;
  total_runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  highest_score: number;
  not_outs: number;
  innings_bowled: number;
  overs_bowled: number;
  runs_conceded: number;
  wickets_taken: number;
  best_bowling_wickets: number;
  best_bowling_runs: number;
  catches: number;
  run_outs: number;
  stumpings: number;
  fifties: number;
  hundreds: number;
  five_wickets: number;
  player?: { name: string; role: string; photo_url: string | null };
}

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const getRankStyle = (i: number) => {
  if (i === 0) return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400";
  if (i === 1) return "bg-gradient-to-br from-slate-300/15 to-slate-400/5 border-slate-400/25 text-slate-300";
  if (i === 2) return "bg-gradient-to-br from-amber-700/15 to-amber-800/5 border-amber-600/25 text-amber-500";
  return "bg-muted/30 border-border/40 text-muted-foreground";
};

const PublicLeaderboard = () => {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["public-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("*, player:players(name, role, photo_url)")
        .gt("matches_played", 0)
        .order("total_runs", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PlayerStat[];
    },
  });

  const topBatsmen = [...stats]
    .filter(s => s.innings_batted > 0)
    .sort((a, b) => b.total_runs - a.total_runs)
    .slice(0, 20);

  const topBowlers = [...stats]
    .filter(s => s.wickets_taken > 0)
    .sort((a, b) => {
      if (b.wickets_taken !== a.wickets_taken) return b.wickets_taken - a.wickets_taken;
      const aEcon = a.overs_bowled > 0 ? a.runs_conceded / Number(a.overs_bowled) : 999;
      const bEcon = b.overs_bowled > 0 ? b.runs_conceded / Number(b.overs_bowled) : 999;
      return aEcon - bEcon;
    })
    .slice(0, 20);

  const topFielders = [...stats]
    .filter(s => (s.catches + s.run_outs + s.stumpings) > 0)
    .sort((a, b) => (b.catches + b.run_outs + b.stumpings) - (a.catches + a.run_outs + a.stumpings))
    .slice(0, 20);

  const maxRuns = topBatsmen[0]?.total_runs || 1;
  const maxWickets = topBowlers[0]?.wickets_taken || 1;
  const maxDismissals = topFielders[0] ? (topFielders[0].catches + topFielders[0].run_outs + topFielders[0].stumpings) : 1;

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            <Trophy className="h-3.5 w-3.5" /> Leaderboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">Player Rankings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Top performers across all matches</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No match data available yet.</div>
        ) : (
          <Tabs defaultValue="batting" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-card border border-border">
              <TabsTrigger value="batting" className="text-xs sm:text-sm gap-1"><TrendingUp className="h-3.5 w-3.5 hidden sm:block" />Batting</TabsTrigger>
              <TabsTrigger value="bowling" className="text-xs sm:text-sm gap-1"><Target className="h-3.5 w-3.5 hidden sm:block" />Bowling</TabsTrigger>
              <TabsTrigger value="fielding" className="text-xs sm:text-sm gap-1"><Shield className="h-3.5 w-3.5 hidden sm:block" />Fielding</TabsTrigger>
            </TabsList>

            <TabsContent value="batting" className="mt-4 space-y-2">
              {topBatsmen.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">No batting data yet</p>}
              {topBatsmen.map((p, i) => {
                const avg = p.innings_batted - p.not_outs > 0
                  ? (p.total_runs / (p.innings_batted - p.not_outs)).toFixed(1) : "—";
                const sr = p.balls_faced > 0 ? ((p.total_runs / p.balls_faced) * 100).toFixed(1) : "—";
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className={`rounded-xl border p-3 sm:p-4 ${getRankStyle(i)}`}>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-xs font-mono font-black w-5 text-center">{i + 1}</span>
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        {p.player?.photo_url && <AvatarImage src={p.player.photo_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{getInitials(p.player?.name || "?")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{p.player?.name || "Unknown"}</p>
                        <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          <span>{p.matches_played}M</span>
                          <span>{p.innings_batted}Inn</span>
                          <span>HS {p.highest_score}</span>
                          <span className="hidden sm:inline">Avg {avg}</span>
                          <span className="hidden sm:inline">SR {sr}</span>
                          <span className="text-primary font-semibold">{p.hundreds}×💯</span>
                          <span className="text-accent font-semibold">{p.fifties}×50</span>
                        </div>
                        <div className="w-full bg-muted/40 rounded-full h-1 mt-1.5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(p.total_runs / maxRuns) * 100}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="bg-gradient-to-r from-primary to-primary/50 h-1 rounded-full" />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-display font-black text-foreground">{p.total_runs}</p>
                        <p className="text-[9px] text-muted-foreground">runs</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            <TabsContent value="bowling" className="mt-4 space-y-2">
              {topBowlers.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">No bowling data yet</p>}
              {topBowlers.map((p, i) => {
                const econ = Number(p.overs_bowled) > 0 ? (p.runs_conceded / Number(p.overs_bowled)).toFixed(1) : "—";
                const bbDisplay = p.best_bowling_runs < 999 ? `${p.best_bowling_wickets}/${p.best_bowling_runs}` : "—";
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className={`rounded-xl border p-3 sm:p-4 ${getRankStyle(i)}`}>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-xs font-mono font-black w-5 text-center">{i + 1}</span>
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        {p.player?.photo_url && <AvatarImage src={p.player.photo_url} />}
                        <AvatarFallback className="bg-info/10 text-info text-[10px] font-bold">{getInitials(p.player?.name || "?")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{p.player?.name || "Unknown"}</p>
                        <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          <span>{p.matches_played}M</span>
                          <span>{p.overs_bowled}Ov</span>
                          <span>BB {bbDisplay}</span>
                          <span className="hidden sm:inline">Econ {econ}</span>
                          <span className="text-primary font-semibold">{p.five_wickets}×5W</span>
                        </div>
                        <div className="w-full bg-muted/40 rounded-full h-1 mt-1.5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(p.wickets_taken / maxWickets) * 100}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="bg-gradient-to-r from-info to-info/50 h-1 rounded-full" />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-display font-black text-foreground">{p.wickets_taken}</p>
                        <p className="text-[9px] text-muted-foreground">wickets</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            <TabsContent value="fielding" className="mt-4 space-y-2">
              {topFielders.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">No fielding data yet</p>}
              {topFielders.map((p, i) => {
                const total = p.catches + p.run_outs + p.stumpings;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className={`rounded-xl border p-3 sm:p-4 ${getRankStyle(i)}`}>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-xs font-mono font-black w-5 text-center">{i + 1}</span>
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        {p.player?.photo_url && <AvatarImage src={p.player.photo_url} />}
                        <AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">{getInitials(p.player?.name || "?")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{p.player?.name || "Unknown"}</p>
                        <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          <span>{p.catches}Ct</span>
                          <span>{p.run_outs}RO</span>
                          <span>{p.stumpings}St</span>
                        </div>
                        <div className="w-full bg-muted/40 rounded-full h-1 mt-1.5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(total / maxDismissals) * 100}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="bg-gradient-to-r from-accent to-accent/50 h-1 rounded-full" />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-display font-black text-foreground">{total}</p>
                        <p className="text-[9px] text-muted-foreground">dismissals</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PublicLayout>
  );
};

export default PublicLeaderboard;
