import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Target, Star, Medal, Crown, Award, Filter } from "lucide-react";
import { calcICCBattingRating, calcICCBowlingRating, calcICCAllRounderRating, PlayerStatForRanking } from "@/lib/ranking-utils";

type PlayerStat = PlayerStatForRanking & {
  id?: string;
  player_id: string;
  player?: { name: string; role: string; photo_url: string | null };
};

const rankBadge = (i: number) => {
  if (i === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (i === 1) return <Medal className="h-5 w-5 text-gray-300" />;
  if (i === 2) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>;
};

export default function Rankings() {
  const { organizationId } = useAuth();
  const [tab, setTab] = useState("batting");
  const [formatFilter, setFormatFilter] = useState("all");

  const { data: formats = [] } = useQuery({
    queryKey: ["match-formats", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase.rpc("get_distinct_match_overs", { _org_id: organizationId });
      if (error) throw error;
      return (data || []).map((d: { overs: number }) => d.overs);
    },
    enabled: !!organizationId,
  });

  const { data: allStats = [], isLoading: loadingAll } = useQuery({
    queryKey: ["player-stats-rankings", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("player_stats")
        .select("*, player:players(name, role, photo_url)")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return (data || []) as PlayerStat[];
    },
    enabled: !!organizationId && formatFilter === "all",
  });

  const { data: formatStats = [], isLoading: loadingFormat } = useQuery({
    queryKey: ["player-stats-by-format", organizationId, formatFilter],
    queryFn: async () => {
      if (!organizationId || formatFilter === "all") return [];
      const { data, error } = await supabase.rpc("get_player_stats_by_format", {
        _overs: parseInt(formatFilter),
        _org_id: organizationId,
      });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        player_id: d.player_id,
        player: { name: d.player_name, role: d.player_role, photo_url: d.player_photo_url },
      })) as PlayerStat[];
    },
    enabled: !!organizationId && formatFilter !== "all",
  });

  const stats = formatFilter === "all" ? allStats : formatStats;
  const isLoading = formatFilter === "all" ? loadingAll : loadingFormat;

  const battingRanked = useMemo(
    () => stats.filter(s => s.innings_batted > 0).map(s => ({ ...s, rating: calcICCBattingRating(s) })).sort((a, b) => b.rating - a.rating),
    [stats]
  );
  const bowlingRanked = useMemo(
    () => stats.filter(s => s.innings_bowled > 0 && s.overs_bowled > 0).map(s => ({ ...s, rating: calcICCBowlingRating(s) })).sort((a, b) => b.rating - a.rating),
    [stats]
  );
  const allRounderRanked = useMemo(
    () => stats.filter(s => s.innings_batted > 0 && s.innings_bowled > 0).map(s => ({ ...s, rating: calcICCAllRounderRating(s) })).filter(s => s.rating > 0).sort((a, b) => b.rating - a.rating),
    [stats]
  );

  const getRankedData = () => {
    if (tab === "batting") return battingRanked;
    if (tab === "bowling") return bowlingRanked;
    return allRounderRanked;
  };

  const maxRating = Math.max(...(getRankedData().map(d => d.rating)), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Player Rankings</h1>
              <p className="text-xs text-muted-foreground">ICC-style performance ratings</p>
            </div>
          </div>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border/40">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {formats.map((f: number) => (
                <SelectItem key={f} value={String(f)}>{f} Over</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30 border border-border/40 p-1 w-full sm:w-auto">
            <TabsTrigger value="batting" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Target className="h-3.5 w-3.5" /> Batting
            </TabsTrigger>
            <TabsTrigger value="bowling" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> Bowling
            </TabsTrigger>
            <TabsTrigger value="all-rounder" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Star className="h-3.5 w-3.5" /> All-Rounder
            </TabsTrigger>
          </TabsList>

          {["batting", "bowling", "all-rounder"].map(tabKey => (
            <TabsContent key={tabKey} value={tabKey} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : getRankedData().length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">কোনো ডাটা পাওয়া যায়নি</p>
                  <p className="text-xs mt-1">ম্যাচ complete হলে ranking আপডেট হবে</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="wait">
                    {getRankedData().map((item, i) => (
                      <motion.div
                        key={item.player_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className={`rounded-xl border transition-all ${
                          i === 0 ? "border-yellow-500/30 bg-yellow-500/5" :
                          i === 1 ? "border-gray-400/20 bg-gray-400/5" :
                          i === 2 ? "border-amber-600/20 bg-amber-700/5" :
                          "border-border/40 bg-card/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 p-3 sm:p-4">
                          <div className="w-8 flex items-center justify-center shrink-0">
                            {rankBadge(i)}
                          </div>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                            i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                            i === 1 ? "bg-gray-400/20 text-gray-300" :
                            i === 2 ? "bg-amber-600/20 text-amber-500" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {item.player?.photo_url ? (
                              <img src={item.player.photo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                            ) : (
                              item.player?.name?.charAt(0) || "?"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {item.player?.name || "Unknown"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {tab === "batting" && (
                                <p className="text-[10px] text-muted-foreground">
                                  {item.total_runs} রান • গড় {(item.total_runs / Math.max(item.innings_batted - item.not_outs, 1)).toFixed(1)} • SR {item.balls_faced > 0 ? ((item.total_runs / item.balls_faced) * 100).toFixed(1) : "0.0"}
                                </p>
                              )}
                              {tab === "bowling" && (
                                <p className="text-[10px] text-muted-foreground">
                                  {item.wickets_taken} উইকেট • ইকো {Number(item.overs_bowled) > 0 ? (item.runs_conceded / Number(item.overs_bowled)).toFixed(2) : "0.00"} • গড় {item.wickets_taken > 0 ? (item.runs_conceded / item.wickets_taken).toFixed(1) : "-"}
                                </p>
                              )}
                              {tab === "all-rounder" && (
                                <p className="text-[10px] text-muted-foreground">
                                  {item.total_runs} রান • {item.wickets_taken} উইকেট • {item.matches_played} ম্যাচ
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-bold tabular-nums ${
                              i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-500" : "text-foreground"
                            }`}>
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
                              className={`h-full rounded-full ${
                                i === 0 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                                i === 1 ? "bg-gradient-to-r from-gray-400 to-gray-300" :
                                i === 2 ? "bg-gradient-to-r from-amber-600 to-amber-500" :
                                "bg-primary/60"
                              }`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}