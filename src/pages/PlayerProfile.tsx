import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Target, Zap, Award, Swords, Calendar, Loader2, Users, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";
import { PlayerFormDialog, type PlayerFormData } from "@/components/forms/PlayerFormDialog";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const roleColors: Record<string, string> = {
  batsman: "bg-primary/15 text-primary",
  bowler: "bg-accent/15 text-accent",
  "all-rounder": "bg-blue-500/15 text-blue-400",
  wicketkeeper: "bg-purple-500/15 text-purple-400",
};

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canEdit = hasPermission("players.edit");

  const updatePlayer = useMutation({
    mutationFn: async (formData: PlayerFormData) => {
      const { error } = await supabase.from("players").update({
        name: formData.name,
        role: formData.role,
        batting_style: formData.battingStyle,
        bowling_style: formData.bowlingStyle || null,
        jersey_number: formData.jerseyNumber ?? null,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player", id] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePlayer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("players").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player deleted!");
      navigate("/players");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: player, isLoading } = useQuery({
    queryKey: ["player", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch career stats from player_stats table
  const { data: playerStats } = useQuery({
    queryKey: ["player-stats", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", id!);
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data.reduce((acc, s) => ({
        ...acc,
        matches_played: acc.matches_played + s.matches_played,
        innings_batted: acc.innings_batted + s.innings_batted,
        innings_bowled: acc.innings_bowled + s.innings_bowled,
        total_runs: acc.total_runs + s.total_runs,
        balls_faced: acc.balls_faced + s.balls_faced,
        fours: acc.fours + s.fours,
        sixes: acc.sixes + s.sixes,
        highest_score: Math.max(acc.highest_score, s.highest_score),
        not_outs: acc.not_outs + s.not_outs,
        overs_bowled: acc.overs_bowled + s.overs_bowled,
        runs_conceded: acc.runs_conceded + s.runs_conceded,
        wickets_taken: acc.wickets_taken + s.wickets_taken,
        best_bowling_wickets: Math.max(acc.best_bowling_wickets, s.best_bowling_wickets),
        best_bowling_runs: s.best_bowling_wickets > acc.best_bowling_wickets ? s.best_bowling_runs : acc.best_bowling_runs,
        catches: acc.catches + s.catches,
        run_outs: acc.run_outs + s.run_outs,
        stumpings: acc.stumpings + s.stumpings,
      }));
    },
    enabled: !!id,
  });

  // Fetch teams this player belongs to
  const { data: playerTeams = [] } = useQuery({
    queryKey: ["player-teams", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_players")
        .select("*, teams(id, name, short_name, color)")
        .eq("player_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch all balls where this player batted or bowled
  const { data: battingBalls = [] } = useQuery({
    queryKey: ["player-batting-balls", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balls")
        .select("*, innings(match_id, innings_number, batting_team_id)")
        .eq("batsman_id", id!)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: bowlingBalls = [] } = useQuery({
    queryKey: ["player-bowling-balls", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balls")
        .select("*, innings(match_id, innings_number)")
        .eq("bowler_id", id!)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch matches for context
  const matchIds = useMemo(() => {
    const ids = new Set<string>();
    battingBalls.forEach((b: any) => { if (b.innings?.match_id) ids.add(b.innings.match_id); });
    bowlingBalls.forEach((b: any) => { if (b.innings?.match_id) ids.add(b.innings.match_id); });
    return Array.from(ids);
  }, [battingBalls, bowlingBalls]);

  const { data: matches = [] } = useQuery({
    queryKey: ["player-matches", matchIds.join(",")],
    queryFn: async () => {
      if (matchIds.length === 0) return [];
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(name, short_name), team2:teams!matches_team2_id_fkey(name, short_name)")
        .in("id", matchIds)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: matchIds.length > 0,
  });

  // Compute career stats
  const careerStats = useMemo(() => {
    const totalRuns = battingBalls.reduce((s, b) => s + b.runs_scored, 0);
    const totalBallsFaced = battingBalls.length;
    const fours = battingBalls.filter(b => b.runs_scored === 4).length;
    const sixes = battingBalls.filter(b => b.runs_scored === 6).length;
    const sr = totalBallsFaced > 0 ? ((totalRuns / totalBallsFaced) * 100).toFixed(1) : "0.0";

    const totalWickets = bowlingBalls.filter(b => b.is_wicket).length;
    const bowlingRuns = bowlingBalls.reduce((s, b) => s + b.runs_scored + b.extra_runs, 0);
    const legalBowlingBalls = bowlingBalls.filter(b => !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye").length;
    const bowlingOvers = legalBowlingBalls / 6;
    const economy = bowlingOvers > 0 ? (bowlingRuns / bowlingOvers).toFixed(1) : "—";
    const bowlingAvg = totalWickets > 0 ? (bowlingRuns / totalWickets).toFixed(1) : "—";

    // Per-match batting (for innings-level stats)
    const inningsMap: Record<string, { runs: number; balls: number; fours: number; sixes: number; matchId: string }> = {};
    battingBalls.forEach((b: any) => {
      const key = b.innings_id;
      if (!inningsMap[key]) inningsMap[key] = { runs: 0, balls: 0, fours: 0, sixes: 0, matchId: b.innings?.match_id || "" };
      inningsMap[key].runs += b.runs_scored;
      inningsMap[key].balls += 1;
      if (b.runs_scored === 4) inningsMap[key].fours += 1;
      if (b.runs_scored === 6) inningsMap[key].sixes += 1;
    });

    const inningsList = Object.values(inningsMap);
    const highScore = inningsList.length > 0 ? Math.max(...inningsList.map(i => i.runs)) : 0;
    const fifties = playerStats?.fifties ?? inningsList.filter(i => i.runs >= 50 && i.runs < 100).length;
    const hundreds = playerStats?.hundreds ?? inningsList.filter(i => i.runs >= 100).length;
    const matchesPlayed = matchIds.length;
    const avg = inningsList.length > 0 ? (totalRuns / inningsList.length).toFixed(1) : "0.0";

    // Per-match bowling
    const bowlingInnings: Record<string, { wickets: number; runs: number; balls: number; matchId: string }> = {};
    bowlingBalls.forEach((b: any) => {
      const key = b.innings_id;
      if (!bowlingInnings[key]) bowlingInnings[key] = { wickets: 0, runs: 0, balls: 0, matchId: b.innings?.match_id || "" };
      bowlingInnings[key].runs += b.runs_scored + b.extra_runs;
      bowlingInnings[key].balls += 1;
      if (b.is_wicket) bowlingInnings[key].wickets += 1;
    });

    const bowlingInningsList = Object.values(bowlingInnings);
    const fiveWickets = playerStats?.five_wickets ?? bowlingInningsList.filter(i => i.wickets >= 5).length;
    // 10W from database, fallback to ball-by-ball calculation
    const tenWickets = playerStats?.ten_wickets ?? (() => {
      const matchBowlingWickets: Record<string, number> = {};
      bowlingInningsList.forEach(i => {
        matchBowlingWickets[i.matchId] = (matchBowlingWickets[i.matchId] || 0) + i.wickets;
      });
      return Object.values(matchBowlingWickets).filter(w => w >= 10).length;
    })();

    return {
      totalRuns, totalBallsFaced, fours, sixes, sr, avg, highScore, fifties, hundreds,
      totalWickets, economy, bowlingAvg, matchesPlayed, fiveWickets, tenWickets,
      recentBatting: inningsList.slice(-5).reverse(),
      recentBowling: bowlingInningsList.filter(i => i.wickets > 0 || i.runs > 0).slice(-5).reverse(),
    };
  }, [battingBalls, bowlingBalls, matchIds, playerStats]);

  // Compute team-wise stats
  const teamWiseStats = useMemo(() => {
    const teamMap: Record<string, {
      teamId: string; teamName: string; teamShort: string; teamColor: string;
      runs: number; balls: number; fours: number; sixes: number; innings: Set<string>; matches: Set<string>;
      wickets: number; bowlRuns: number; bowlLegalBalls: number; bowlInnings: Set<string>;
    }> = {};

    // Get team info from playerTeams
    const teamInfo: Record<string, { name: string; short: string; color: string }> = {};
    playerTeams.forEach((tp: any) => {
      if (tp.teams) {
        teamInfo[tp.teams.id] = { name: tp.teams.name, short: tp.teams.short_name, color: tp.teams.color };
      }
    });

    // Batting stats by team
    battingBalls.forEach((b: any) => {
      const teamId = b.innings?.batting_team_id;
      if (!teamId) return;
      if (!teamMap[teamId]) {
        const info = teamInfo[teamId] || { name: teamId, short: "?", color: "#22c55e" };
        teamMap[teamId] = {
          teamId, teamName: info.name, teamShort: info.short, teamColor: info.color,
          runs: 0, balls: 0, fours: 0, sixes: 0, innings: new Set(), matches: new Set(),
          wickets: 0, bowlRuns: 0, bowlLegalBalls: 0, bowlInnings: new Set(),
        };
      }
      teamMap[teamId].runs += b.runs_scored;
      teamMap[teamId].balls += 1;
      if (b.runs_scored === 4) teamMap[teamId].fours += 1;
      if (b.runs_scored === 6) teamMap[teamId].sixes += 1;
      teamMap[teamId].innings.add(b.innings_id);
      if (b.innings?.match_id) teamMap[teamId].matches.add(b.innings.match_id);
    });

    // Bowling stats by team (bowling team = the team the player bowled FOR, which is the bowling_team)
    // But we only have batting_team_id in innings. The player bowls for the OTHER team.
    // So we need to find which team the player belongs to from the innings context.
    // Simpler: use the teams the player is part of. If batting_team_id != player's team, the player was bowling for their team.
    bowlingBalls.forEach((b: any) => {
      const battingTeamId = b.innings?.batting_team_id;
      if (!battingTeamId) return;
      // The bowler's team is NOT the batting team — find the bowler's team from playerTeams
      const bowlerTeamId = playerTeams.find((tp: any) => tp.teams?.id !== battingTeamId)?.teams?.id;
      if (!bowlerTeamId) return;
      if (!teamMap[bowlerTeamId]) {
        const info = teamInfo[bowlerTeamId] || { name: bowlerTeamId, short: "?", color: "#22c55e" };
        teamMap[bowlerTeamId] = {
          teamId: bowlerTeamId, teamName: info.name, teamShort: info.short, teamColor: info.color,
          runs: 0, balls: 0, fours: 0, sixes: 0, innings: new Set(), matches: new Set(),
          wickets: 0, bowlRuns: 0, bowlLegalBalls: 0, bowlInnings: new Set(),
        };
      }
      teamMap[bowlerTeamId].bowlRuns += b.runs_scored + b.extra_runs;
      if (b.is_wicket) teamMap[bowlerTeamId].wickets += 1;
      if (!b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye") {
        teamMap[bowlerTeamId].bowlLegalBalls += 1;
      }
      teamMap[bowlerTeamId].bowlInnings.add(b.innings_id);
      if (b.innings?.match_id) teamMap[bowlerTeamId].matches.add(b.innings.match_id);
    });

    return Object.values(teamMap).map(t => ({
      ...t,
      matchCount: t.matches.size,
      inningsCount: t.innings.size,
      avg: t.innings.size > 0 ? (t.runs / t.innings.size).toFixed(1) : "—",
      sr: t.balls > 0 ? ((t.runs / t.balls) * 100).toFixed(1) : "—",
      bowlOvers: (t.bowlLegalBalls / 6).toFixed(1),
      economy: t.bowlLegalBalls > 0 ? ((t.bowlRuns / (t.bowlLegalBalls / 6))).toFixed(1) : "—",
    }));
  }, [battingBalls, bowlingBalls, playerTeams]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!player) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Player not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 md:space-y-6 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-start gap-4">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20 shrink-0">
              <span className="text-primary font-display font-bold text-xl md:text-2xl">
                {player.jersey_number ?? "#"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">{player.name}</h1>
                {canEdit && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setEditOpen(true)}
                      className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setDeleteOpen(true)}
                      className="h-8 w-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge className={`text-[10px] ${roleColors[player.role] || ""}`}>{player.role}</Badge>
                <span className="text-xs text-muted-foreground">{player.batting_style} bat</span>
                {player.bowling_style && <span className="text-xs text-muted-foreground">• {player.bowling_style}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {playerTeams.map((tp: any) => (
                  <span key={tp.id} className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                    {tp.teams?.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Career Statistics from player_stats table */}
        {playerStats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <h2 className="font-display font-semibold text-foreground text-base mb-3">Career Statistics</h2>
            
            {/* Batting */}
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Batting</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
              {[
                { label: "M", value: playerStats.matches_played },
                { label: "Inn", value: playerStats.innings_batted },
                { label: "Runs", value: playerStats.total_runs.toLocaleString() },
                { label: "Balls", value: playerStats.balls_faced },
                { label: "HS", value: playerStats.highest_score },
                { label: "Avg", value: playerStats.innings_batted > 0 ? (playerStats.total_runs / Math.max(1, playerStats.innings_batted - playerStats.not_outs)).toFixed(1) : "—" },
                { label: "SR", value: playerStats.balls_faced > 0 ? ((playerStats.total_runs / playerStats.balls_faced) * 100).toFixed(1) : "—" },
                { label: "4s", value: playerStats.fours },
                { label: "6s", value: playerStats.sixes },
                { label: "N.O", value: playerStats.not_outs },
                { label: "100s", value: careerStats.hundreds },
                { label: "50s", value: careerStats.fifties },
              ].map((stat, i) => (
                <Card key={i} className="border-border/40 bg-card/60">
                  <CardContent className="p-1.5 sm:p-2.5 text-center">
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm sm:text-base font-display font-bold text-foreground">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bowling */}
            {playerStats.innings_bowled > 0 && (
              <>
                <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Bowling</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
                  {[
                    { label: "Inn", value: playerStats.innings_bowled },
                    { label: "Overs", value: playerStats.overs_bowled },
                    { label: "Wkts", value: playerStats.wickets_taken },
                    { label: "Runs", value: playerStats.runs_conceded },
                    { label: "Avg", value: playerStats.wickets_taken > 0 ? (playerStats.runs_conceded / playerStats.wickets_taken).toFixed(1) : "—" },
                    { label: "Econ", value: playerStats.overs_bowled > 0 ? (playerStats.runs_conceded / playerStats.overs_bowled).toFixed(1) : "—" },
                    { label: "Best", value: `${playerStats.best_bowling_wickets}/${playerStats.best_bowling_runs}` },
                    { label: "5W", value: careerStats.fiveWickets },
                    { label: "10W", value: careerStats.tenWickets },
                  ].map((stat, i) => (
                    <Card key={i} className="border-border/40 bg-card/60">
                      <CardContent className="p-1.5 sm:p-2.5 text-center">
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <p className="text-sm sm:text-base font-display font-bold text-foreground">{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Fielding */}
            {(playerStats.catches > 0 || playerStats.run_outs > 0 || playerStats.stumpings > 0) && (
              <>
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Fielding</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
                  {[
                    { label: "Catches", value: playerStats.catches },
                    { label: "Run Outs", value: playerStats.run_outs },
                    { label: "Stumpings", value: playerStats.stumpings },
                  ].map((stat, i) => (
                    <Card key={i} className="border-border/40 bg-card/60">
                      <CardContent className="p-1.5 sm:p-2.5 text-center">
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <p className="text-sm sm:text-base font-display font-bold text-foreground">{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Team-wise Statistics */}
        {teamWiseStats.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <h2 className="font-display font-semibold text-foreground text-base mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Team-wise Statistics
            </h2>
            <div className="space-y-2.5">
              {teamWiseStats.map((t) => (
                <Card key={t.teamId} className="border-border/40 bg-card/60 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Team header */}
                    <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/30">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: t.teamColor }}
                      >
                        {t.teamShort}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{t.teamName}</p>
                        <p className="text-[10px] text-muted-foreground">{t.matchCount} match{t.matchCount !== 1 ? "es" : ""}</p>
                      </div>
                    </div>
                    {/* Stats grid */}
                    <div className="px-3 py-2.5">
                      {t.inningsCount > 0 && (
                        <>
                          <p className="text-[9px] text-primary font-semibold uppercase tracking-wider mb-1.5">Batting</p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-3 gap-y-1 mb-2.5">
                            {[
                              { l: "Inn", v: t.inningsCount },
                              { l: "Runs", v: t.runs },
                              { l: "Avg", v: t.avg },
                              { l: "SR", v: t.sr },
                              { l: "4s", v: t.fours },
                              { l: "6s", v: t.sixes },
                            ].map((s) => (
                              <div key={s.l} className="text-center">
                                <p className="text-[8px] text-muted-foreground uppercase">{s.l}</p>
                                <p className="text-xs font-bold text-foreground">{s.v}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {t.bowlInnings.size > 0 && (
                        <>
                          <p className="text-[9px] text-accent font-semibold uppercase tracking-wider mb-1.5">Bowling</p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-3 gap-y-1">
                            {[
                              { l: "Inn", v: t.bowlInnings.size },
                              { l: "Overs", v: t.bowlOvers },
                              { l: "Wkts", v: t.wickets },
                              { l: "Runs", v: t.bowlRuns },
                              { l: "Econ", v: t.economy },
                            ].map((s) => (
                              <div key={s.l} className="text-center">
                                <p className="text-[8px] text-muted-foreground uppercase">{s.l}</p>
                                <p className="text-xs font-bold text-foreground">{s.v}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Computed Stats (from ball data) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-display font-semibold text-foreground text-base mb-3">
            {playerStats ? "Live Stats (from recent data)" : "Career Stats"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
            {[
              { label: "Matches", value: careerStats.matchesPlayed, icon: Swords },
              { label: "Runs", value: careerStats.totalRuns.toLocaleString(), icon: TrendingUp },
              { label: "Avg", value: careerStats.avg, icon: Target },
              { label: "SR", value: careerStats.sr, icon: Zap },
              { label: "High Score", value: careerStats.highScore, icon: Award },
              { label: "50s / 100s", value: `${careerStats.fifties} / ${careerStats.hundreds}`, icon: Award },
              { label: "Wickets", value: careerStats.totalWickets, icon: Target },
              { label: "Bowl Avg", value: careerStats.bowlingAvg, icon: Target },
            ].map((stat, i) => (
              <Card key={i} className="border-border/40 bg-card/60">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center gap-1 mb-0.5">
                    <stat.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-base sm:text-lg font-display font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Batting Form */}
        {careerStats.recentBatting.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-display font-semibold text-foreground text-base mb-3">Recent Batting Form</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {careerStats.recentBatting.map((inn, i) => {
                const match = matches.find((m: any) => m.id === inn.matchId);
                return (
                  <Card key={i} className="border-border/40 bg-card/60 shrink-0 w-[120px] sm:w-[140px]">
                    <CardContent className="p-2 sm:p-3">
                      <p className="text-[10px] text-muted-foreground mb-1 truncate">
                        {match ? `${(match.team1 as any)?.short_name} v ${(match.team2 as any)?.short_name}` : "Match"}
                      </p>
                      <p className={`text-xl font-display font-bold ${inn.runs >= 50 ? "text-accent" : inn.runs >= 30 ? "text-primary" : "text-foreground"}`}>
                        {inn.runs}
                        <span className="text-xs text-muted-foreground font-normal ml-0.5">({inn.balls})</span>
                      </p>
                      <div className="flex gap-2 mt-1 text-[9px] text-muted-foreground">
                        <span>{inn.fours}×4</span>
                        <span>{inn.sixes}×6</span>
                      </div>
                      {match?.match_date && (
                        <p className="text-[9px] text-muted-foreground/60 mt-1">{format(new Date(match.match_date), "MMM d")}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Match History */}
        {matches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="font-display font-semibold text-foreground text-base mb-3">Match History</h2>
            <div className="space-y-2">
              {matches.map((m: any, i: number) => (
                <Card key={m.id} className="border-border/40 bg-card/60 hover:bg-card/80 transition-colors cursor-pointer" onClick={() => navigate(`/scorecard/${m.id}`)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.team1?.name} vs {m.team2?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.match_date && (
                          <>
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{format(new Date(m.match_date), "MMM d, yyyy")}</span>
                          </>
                        )}
                        {m.result && <span className={`text-[10px] ${m.result.includes("won") ? "text-primary" : "text-destructive"}`}>{m.result}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {careerStats.matchesPlayed === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No match data yet for this player</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <PlayerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={(data) => updatePlayer.mutate(data)}
        initialData={{
          name: player.name,
          role: player.role as any,
          battingStyle: player.batting_style as any,
          bowlingStyle: player.bowling_style || "",
          jerseyNumber: player.jersey_number ?? undefined,
        }}
        mode="edit"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{player.name}</strong>? This action cannot be undone and all associated stats will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlayer.mutate()}
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

export default PlayerProfile;
