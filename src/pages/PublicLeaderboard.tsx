import { useMemo } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, TrendingUp, Star, Loader2, Crown, Medal, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calcICCBattingRating, calcICCBowlingRating, calcICCAllRounderRating } from "@/lib/ranking-utils";

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
  player?: { name: string; role: string; photo_url: string | null; organization_id: string };
  org_name?: string;
}

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const rankBadge = (i: number) => {
  if (i === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (i === 1) return <Medal className="h-5 w-5 text-gray-300" />;
  if (i === 2) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>;
};

const getRankBg = (i: number) => {
  if (i === 0) return "border-yellow-500/30 bg-yellow-500/5";
  if (i === 1) return "border-gray-400/20 bg-gray-400/5";
  if (i === 2) return "border-amber-600/20 bg-amber-700/5";
  return "border-border/40 bg-card/50";
};

const getRatingColor = (i: number) => {
  if (i === 0) return "text-yellow-400";
  if (i === 1) return "text-gray-300";
  if (i === 2) return "text-amber-500";
  return "text-foreground";
};

const getBarColor = (i: number) => {
  if (i === 0) return "bg-gradient-to-r from-yellow-500 to-yellow-400";
  if (i === 1) return "bg-gradient-to-r from-gray-400 to-gray-300";
  if (i === 2) return "bg-gradient-to-r from-amber-600 to-amber-500";
  return "bg-primary/60";
};

type RankedStat = PlayerStat & { rating: number };

const RankingList = ({ items, tab, maxRating }: { items: RankedStat[]; tab: string; maxRating: number }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {items.map((item, i) => (
          <motion.div
            key={item.player_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            className={`rounded-xl border transition-all ${getRankBg(i)}`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4">
              <div className="w-7 flex items-center justify-center shrink-0">
                {rankBadge(i)}
              </div>
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                {item.player?.photo_url && <AvatarImage src={item.player.photo_url} />}
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {getInitials(item.player?.name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{item.player?.name || "Unknown"}</p>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {item.org_name && (
                    <span className="text-primary/70 mr-1.5">{item.org_name} •</span>
                  )}
                  {tab === "batting" && (
                    <span>
                      {item.total_runs} runs • Avg {(item.total_runs / Math.max(item.innings_batted - item.not_outs, 1)).toFixed(1)} • SR {item.balls_faced > 0 ? ((item.total_runs / item.balls_faced) * 100).toFixed(1) : "—"}
                      <span className="hidden sm:inline"> • {item.fifties}×50 {item.hundreds}×100</span>
                    </span>
                  )}
                  {tab === "bowling" && (
                    <span>
                      {item.wickets_taken} wkts • Econ {Number(item.overs_bowled) > 0 ? (item.runs_conceded / Number(item.overs_bowled)).toFixed(2) : "—"} • Avg {item.wickets_taken > 0 ? (item.runs_conceded / item.wickets_taken).toFixed(1) : "—"}
                      <span className="hidden sm:inline"> • {item.five_wickets}×5W</span>
                    </span>
                  )}
                  {tab === "all-rounder" && (
                    <span>{item.total_runs} runs • {item.wickets_taken} wkts • {item.matches_played}M</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-lg sm:text-xl font-display font-black tabular-nums ${getRatingColor(i)}`}>
                  {item.rating}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Rating</p>
              </div>
            </div>
            <div className="px-3 sm:px-4 pb-3">
              <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.rating / maxRating) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`h-full rounded-full ${getBarColor(i)}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const PublicLeaderboard = () => {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["public-leaderboard"],
    queryFn: async () => {
      const [statsRes, orgsRes] = await Promise.all([
        supabase
          .from("player_stats")
          .select("*, player:players(name, role, photo_url, organization_id)")
          .gt("matches_played", 0),
        supabase.from("organizations").select("id, name"),
      ]);
      if (statsRes.error) throw statsRes.error;
      const orgMap = new Map((orgsRes.data || []).map(o => [o.id, o.name]));
      return ((statsRes.data || []) as unknown as PlayerStat[]).map(s => ({
        ...s,
        org_name: s.player?.organization_id ? orgMap.get(s.player.organization_id) || "" : "",
      }));
    },
  });

  const battingRanked = useMemo(
    () => stats.filter(s => s.innings_batted > 0).map(s => ({ ...s, rating: calcICCBattingRating(s) })).sort((a, b) => b.rating - a.rating).slice(0, 25),
    [stats]
  );
  const bowlingRanked = useMemo(
    () => stats.filter(s => s.innings_bowled > 0 && s.overs_bowled > 0).map(s => ({ ...s, rating: calcICCBowlingRating(s) })).sort((a, b) => b.rating - a.rating).slice(0, 25),
    [stats]
  );
  const allRounderRanked = useMemo(
    () => stats.filter(s => s.innings_batted > 0 && s.innings_bowled > 0).map(s => ({ ...s, rating: calcICCAllRounderRating(s) })).filter(s => s.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 25),
    [stats]
  );

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            <Trophy className="h-3.5 w-3.5" /> ICC-Style Rankings
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">Player Rankings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">ICC-inspired performance ratings across all organizations</p>
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
              <TabsTrigger value="batting" className="text-xs sm:text-sm gap-1">
                <Target className="h-3.5 w-3.5 hidden sm:block" />Batting
              </TabsTrigger>
              <TabsTrigger value="bowling" className="text-xs sm:text-sm gap-1">
                <TrendingUp className="h-3.5 w-3.5 hidden sm:block" />Bowling
              </TabsTrigger>
              <TabsTrigger value="all-rounder" className="text-xs sm:text-sm gap-1">
                <Star className="h-3.5 w-3.5 hidden sm:block" />All-Rounder
              </TabsTrigger>
            </TabsList>

            <TabsContent value="batting" className="mt-4">
              <RankingList items={battingRanked} tab="batting" maxRating={battingRanked[0]?.rating || 1} />
            </TabsContent>
            <TabsContent value="bowling" className="mt-4">
              <RankingList items={bowlingRanked} tab="bowling" maxRating={bowlingRanked[0]?.rating || 1} />
            </TabsContent>
            <TabsContent value="all-rounder" className="mt-4">
              <RankingList items={allRounderRanked} tab="all-rounder" maxRating={allRounderRanked[0]?.rating || 1} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PublicLayout>
  );
};

export default PublicLeaderboard;