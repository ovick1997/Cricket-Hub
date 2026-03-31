import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radio, Share2, MapPin, Calendar, Copy, Check, Loader2, Target, FileText, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WicketCelebration } from "@/components/scoring/WicketCelebration";
import { BoundaryCelebration } from "@/components/scoring/BoundaryCelebration";
import { HattrickCelebration } from "@/components/scoring/HattrickCelebration";
import { MilestoneCelebration } from "@/components/scoring/MilestoneCelebration";
import { playBoundarySound } from "@/lib/boundary-sound";
import { PublicLayout } from "@/components/PublicLayout";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Ball = Tables<"balls">;
type Innings = Tables<"innings">;

function BallDot({ ball }: { ball: Ball }) {
  const isW = ball.is_wicket;
  const isE = !!ball.extra_type;
  return (
    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
      isW ? "bg-destructive/20 text-destructive" : isE ? "bg-warning/20 text-warning"
      : ball.runs_scored >= 4 ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
    }`}>
      {isW ? "W" : isE ? ball.extra_type?.[0]?.toUpperCase() : ball.runs_scored}
    </div>
  );
}

const PublicLiveMatch = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState<any>(null);
  const [innings, setInnings] = useState<Innings[]>([]);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [players, setPlayers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [lastFlash, setLastFlash] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWicketCelebration, setShowWicketCelebration] = useState(false);
  const [lastWicketType, setLastWicketType] = useState<string | null>(null);
  const [lastWicketBatsman, setLastWicketBatsman] = useState<string>("");
  const [boundaryType, setBoundaryType] = useState<"four" | "six" | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "commentary" | "stats">("summary");
  const [showHattrick, setShowHattrick] = useState(false);
  const [hattrickBowler, setHattrickBowler] = useState("");
  const [milestoneType, setMilestoneType] = useState<"fifty" | "century" | null>(null);
  const [milestoneBatsman, setMilestoneBatsman] = useState("");
  const [milestoneRuns, setMilestoneRuns] = useState(0);

  // Fetch data function (reusable for initial load + polling)
  const fetchData = useCallback(async (showLoader = true) => {
    if (!matchId) return;
    if (showLoader) setLoading(true);
    const { data: matchData } = await supabase
      .from("matches")
      .select("*, team1:teams!matches_team1_id_fkey(id, name, short_name, color), team2:teams!matches_team2_id_fkey(id, name, short_name, color)")
      .eq("id", matchId)
      .single();
    if (!matchData) { setLoading(false); return; }
    setMatch(matchData);

    const { data: inningsData } = await supabase
      .from("innings").select("*").eq("match_id", matchId).order("innings_number");
    setInnings(inningsData || []);

    if (inningsData && inningsData.length > 0) {
      const inningsIds = inningsData.map((i) => i.id);
      const { data: ballsData } = await supabase
        .from("balls").select("*").in("innings_id", inningsIds).order("over_number").order("ball_number");
      setBalls(ballsData || []);

      const playerIds = new Set<string>();
      ballsData?.forEach((b) => {
        playerIds.add(b.batsman_id); playerIds.add(b.bowler_id);
        if (b.wicket_batsman_id) playerIds.add(b.wicket_batsman_id);
      });
      if (playerIds.size > 0) {
        const { data: playerData } = await supabase.from("players").select("id, name").in("id", Array.from(playerIds));
        const map: Record<string, string> = {};
        playerData?.forEach((p) => { map[p.id] = p.name; });
        setPlayers(map);
      }
    }
    setLoading(false);
  }, [matchId]);

  // Initial fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s as fallback for realtime
  useEffect(() => {
    if (!matchId || match?.status === "completed") return;
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [matchId, match?.status, fetchData]);

  // Realtime
  useEffect(() => {
    if (!innings.length) return;
    const inningsIds = innings.map((i) => i.id);
    const channel = supabase
      .channel(`live-balls-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "balls" }, async (payload) => {
        const newBall = payload.new as Ball;
        if (!inningsIds.includes(newBall.innings_id)) return;
        setBalls((prev) => [...prev, newBall]);
        const unknownIds = [newBall.batsman_id, newBall.bowler_id].filter((id) => !players[id]);
        if (unknownIds.length > 0) {
          const { data } = await supabase.from("players").select("id, name").in("id", unknownIds);
          if (data) setPlayers((prev) => { const n = { ...prev }; data.forEach((p) => { n[p.id] = p.name; }); return n; });
        }
        if (newBall.is_wicket) {
          setLastFlash("WICKET! 🔴"); setLastWicketType(newBall.wicket_type || null);
          setLastWicketBatsman(players[newBall.wicket_batsman_id || newBall.batsman_id] || "");
          setShowWicketCelebration(true);
          // Hattrick detection
          setBalls((prev) => {
            const allBalls = [...prev];
            const bowlerBalls = allBalls.filter(
              (b) => b.bowler_id === newBall.bowler_id && (!b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye")
            );
            if (bowlerBalls.length >= 2 && bowlerBalls.slice(-2).every((b) => b.is_wicket)) {
              setTimeout(() => {
                setHattrickBowler(players[newBall.bowler_id] || "");
                setShowHattrick(true);
              }, 2600);
            }
            return prev;
          });
        } else if (newBall.runs_scored === 6) { setLastFlash("SIX! 🔥"); playBoundarySound(true); setBoundaryType("six"); }
        else if (newBall.runs_scored === 4) { setLastFlash("FOUR! 💥"); playBoundarySound(false); setBoundaryType("four"); }

        // Milestone detection
        if (!newBall.is_wicket && !newBall.extra_type) {
          setBalls((prev) => {
            const batsmanBalls = prev.filter((b) => b.batsman_id === newBall.batsman_id);
            const oldRuns = batsmanBalls.reduce((s, b) => s + b.runs_scored, 0);
            const newRuns = oldRuns + newBall.runs_scored;
            if (oldRuns < 100 && newRuns >= 100) {
              setTimeout(() => { setMilestoneType("century"); setMilestoneBatsman(players[newBall.batsman_id] || ""); setMilestoneRuns(newRuns); }, newBall.runs_scored >= 4 ? 2000 : 300);
            } else if (oldRuns < 50 && newRuns >= 50) {
              setTimeout(() => { setMilestoneType("fifty"); setMilestoneBatsman(players[newBall.batsman_id] || ""); setMilestoneRuns(newRuns); }, newBall.runs_scored >= 4 ? 2000 : 300);
            }
            return prev;
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "innings" }, (payload) => {
        const updated = payload.new as Innings;
        if (updated.match_id === matchId) setInnings((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (payload) => {
        const updated = payload.new as any;
        if (updated.id === matchId) setMatch((prev: any) => ({ ...prev, ...updated, team1: prev?.team1, team2: prev?.team2 }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId, innings.length]);

  useEffect(() => {
    if (!lastFlash) return;
    const t = setTimeout(() => setLastFlash(""), 2000);
    return () => clearTimeout(t);
  }, [lastFlash]);

  // Computed
  const currentInnings = innings.find((i) => i.status === "in_progress") || innings[innings.length - 1];
  const firstInnings = innings.find((i) => i.innings_number === 1);
  const isSecondInnings = currentInnings?.innings_number === 2;
  const target = isSecondInnings && firstInnings ? firstInnings.total_runs + 1 : null;

  const currentBalls = useMemo(
    () => (currentInnings ? balls.filter((b) => b.innings_id === currentInnings.id) : []),
    [balls, currentInnings]
  );

  const totalRuns = currentInnings?.total_runs ?? 0;
  const totalWickets = currentInnings?.total_wickets ?? 0;
  const legalBalls = currentBalls.filter((b) => !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye").length;
  const overs = Math.floor(legalBalls / 6);
  const ballsInOver = legalBalls % 6;
  const runRate = legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00";

  const maxBalls = (match?.overs || 20) * 6;
  const runsNeeded = target ? target - totalRuns : null;
  const ballsRemaining = target ? maxBalls - legalBalls : null;
  const requiredRate = (ballsRemaining && ballsRemaining > 0 && runsNeeded !== null && runsNeeded > 0)
    ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : null;

  const lastSixBalls = currentBalls.slice(-6);

  // Batting stats
  const batsmanStats = useMemo(() => {
    const stats: Record<string, { id: string; runs: number; balls: number; fours: number; sixes: number; isOut: boolean; dismissal: string }> = {};
    currentBalls.forEach((b) => {
      const name = players[b.batsman_id] || "Unknown";
      if (!stats[name]) stats[name] = { id: b.batsman_id, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: "batting" };
      stats[name].runs += b.runs_scored;
      stats[name].balls += 1;
      if (b.runs_scored === 4) stats[name].fours += 1;
      if (b.runs_scored === 6) stats[name].sixes += 1;
      if (b.is_wicket && (b.wicket_batsman_id === b.batsman_id || !b.wicket_batsman_id)) {
        stats[name].isOut = true;
        stats[name].dismissal = b.wicket_type || "out";
      }
    });
    return Object.entries(stats).sort(([, a], [, b]) => b.runs - a.runs);
  }, [currentBalls, players]);

  // Bowling stats
  const bowlerStatsArr = useMemo(() => {
    const stats: Record<string, { runs: number; balls: number; wickets: number; legalBalls: number }> = {};
    currentBalls.forEach((b) => {
      const name = players[b.bowler_id] || "Unknown";
      if (!stats[name]) stats[name] = { runs: 0, balls: 0, wickets: 0, legalBalls: 0 };
      stats[name].runs += b.runs_scored + b.extra_runs;
      stats[name].balls += 1;
      if (b.is_wicket) stats[name].wickets += 1;
      const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
      if (isLegal) stats[name].legalBalls += 1;
    });
    return Object.entries(stats).sort(([, a], [, b]) => b.wickets - a.wickets || a.runs - b.runs);
  }, [currentBalls, players]);

  // Partnership
  const partnerships = useMemo(() => {
    if (currentBalls.length === 0) return [];
    const parts: { bat1: string; bat2: string; runs: number; balls: number }[] = [];
    let currentPair: [string, string] | null = null;
    let pRuns = 0, pBalls = 0;
    currentBalls.forEach((b) => {
      const pair: [string, string] = [b.batsman_id, b.non_striker_id || ""].sort() as [string, string];
      const pairKey = pair.join("-");
      const curKey = currentPair ? currentPair.join("-") : null;
      if (curKey !== pairKey) {
        if (currentPair && pBalls > 0) parts.push({ bat1: players[currentPair[0]] || "?", bat2: players[currentPair[1]] || "?", runs: pRuns, balls: pBalls });
        currentPair = pair; pRuns = 0; pBalls = 0;
      }
      pRuns += b.runs_scored + b.extra_runs; pBalls += 1;
    });
    if (currentPair && pBalls > 0) parts.push({ bat1: players[currentPair[0]] || "?", bat2: players[currentPair[1]] || "?", runs: pRuns, balls: pBalls });
    return parts;
  }, [currentBalls, players]);

  // Over-by-over
  const overGroups = useMemo(() => {
    const groups: { overNum: number; balls: Ball[]; runs: number }[] = [];
    currentBalls.forEach((ball) => {
      const existing = groups.find((g) => g.overNum === ball.over_number);
      if (existing) { existing.balls.push(ball); existing.runs += ball.runs_scored + ball.extra_runs; }
      else groups.push({ overNum: ball.over_number, balls: [ball], runs: ball.runs_scored + ball.extra_runs });
    });
    return groups;
  }, [currentBalls]);

  const team1Name = (match?.team1 as any)?.name || "Team 1";
  const team2Name = (match?.team2 as any)?.name || "Team 2";
  const team1Short = (match?.team1 as any)?.short_name || "T1";
  const team2Short = (match?.team2 as any)?.short_name || "T2";
  const team1Color = (match?.team1 as any)?.color || "#22c55e";
  const team2Color = (match?.team2 as any)?.color || "#22c55e";
  const battingTeamName = currentInnings ? (currentInnings.batting_team_id === match?.team1_id ? team1Name : team2Name) : team1Name;
  const bowlingTeamName = currentInnings ? (currentInnings.bowling_team_id === match?.team1_id ? team1Name : team2Name) : team2Name;
  const battingShort = currentInnings ? (currentInnings.batting_team_id === match?.team1_id ? team1Short : team2Short) : team1Short;
  const battingColor = currentInnings ? (currentInnings.batting_team_id === match?.team1_id ? team1Color : team2Color) : team1Color;

  const shareUrl = window.location.href;
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${team1Name} vs ${team2Name}`, text: `${totalRuns}/${totalWickets} — Live`, url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true); toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [team1Name, team2Name, totalRuns, totalWickets, shareUrl]);

  if (loading) {
    return <PublicLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PublicLayout>;
  }
  if (!match) {
    return <PublicLayout><div className="flex items-center justify-center py-20 text-muted-foreground"><p>Match not found.</p></div></PublicLayout>;
  }

  const tabs = [
    { key: "summary" as const, label: "Summary" },
    { key: "commentary" as const, label: "Commentary" },
    { key: "stats" as const, label: "Stats" },
  ];

  return (
    <PublicLayout>
      <WicketCelebration show={showWicketCelebration} wicketType={lastWicketType} batsmanName={lastWicketBatsman} onComplete={() => setShowWicketCelebration(false)} />
      <BoundaryCelebration type={boundaryType} onComplete={() => setBoundaryType(null)} />
      <HattrickCelebration show={showHattrick} bowlerName={hattrickBowler} onComplete={() => setShowHattrick(false)} />
      <MilestoneCelebration type={milestoneType} batsmanName={milestoneBatsman} runs={milestoneRuns} onComplete={() => setMilestoneType(null)} />

      <div className="space-y-0">
        {/* Score Header — ESPN style full-width */}
        <div className="border-b border-border/40 bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
          <div className="relative px-4 py-4">
            {/* Status row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {match.status === "live" ? (
                  <div className="flex items-center gap-1.5 bg-destructive/15 rounded-md px-2 py-0.5">
                    <Radio className="h-2.5 w-2.5 text-destructive animate-pulse" />
                    <span className="text-[9px] font-bold text-destructive uppercase tracking-widest">Live</span>
                  </div>
                ) : (
                  <div className="bg-muted rounded-md px-2 py-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Completed</span>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground">{match.overs} overs</span>
                {match.venue && <span className="text-[10px] text-muted-foreground hidden sm:inline">· {match.venue}</span>}
              </div>
              <button onClick={handleShare} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground text-[10px] font-semibold hover:text-foreground transition-colors">
                {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                {copied ? "Copied" : "Share"}
              </button>
            </div>

            {/* Score display */}
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold ring-1"
                style={{ backgroundColor: battingColor + "15", color: battingColor, borderColor: battingColor + "30" }}
              >
                {battingShort}
              </div>
              <div className="flex-1">
                <p className="text-sm font-display font-bold text-foreground">{battingTeamName}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tighter leading-none">{totalRuns}/{totalWickets}</span>
                  <span className="text-sm font-mono text-muted-foreground">({overs}.{ballsInOver})</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span>CRR: <span className="font-semibold text-foreground">{runRate}</span></span>
                  {isSecondInnings && requiredRate && (
                    <span>RRR: <span className="font-semibold text-accent">{requiredRate}</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* Target info */}
            {isSecondInnings && target && (
              <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-accent" />
                  <span className="text-accent font-bold">Need {runsNeeded! > 0 ? runsNeeded : 0} runs</span>
                  <span className="text-muted-foreground">from {ballsRemaining} balls</span>
                </div>
                <span className="text-muted-foreground">Target: {target}</span>
              </div>
            )}

            {/* First innings ref */}
            {isSecondInnings && firstInnings && (
              <div className="mt-1 text-[10px] text-muted-foreground">
                1st Inn: {firstInnings.total_runs}/{firstInnings.total_wickets} ({firstInnings.total_overs} ov)
              </div>
            )}

            {/* Result banner */}
            {match.status === "completed" && match.result && (
              <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs font-semibold text-primary">{match.result}</p>
              </div>
            )}

            {/* This Over */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">This Over</span>
              <div className="flex gap-1">
                {lastSixBalls.map((ball) => <BallDot key={ball.id} ball={ball} />)}
                {lastSixBalls.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Flash */}
        <AnimatePresence>
          {lastFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`text-center py-2.5 font-display font-black text-xl ${
                lastFlash.includes("WICKET") ? "bg-destructive/10 text-destructive"
                : lastFlash.includes("SIX") ? "bg-primary/10 text-primary"
                : "bg-accent/10 text-accent"
              }`}
            >{lastFlash}</motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="border-b border-border/40 bg-card/50">
          <div className="flex px-4">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative px-4 py-2.5 text-xs font-semibold transition-colors ${
                  activeTab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {t.label}
                {activeTab === t.key && <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4 space-y-4">
          {activeTab === "summary" && (
            <>
              {/* Batting Table */}
              {batsmanStats.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Batting — {battingTeamName}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30">
                          <TableHead className="text-[10px] font-bold text-foreground min-w-[100px]">Batter</TableHead>
                          <TableHead className="text-[10px] text-center font-bold text-foreground w-9">R</TableHead>
                          <TableHead className="text-[10px] text-center text-muted-foreground w-9">B</TableHead>
                          <TableHead className="text-[10px] text-center text-muted-foreground w-8">4s</TableHead>
                          <TableHead className="text-[10px] text-center text-muted-foreground w-8">6s</TableHead>
                          <TableHead className="text-[10px] text-center text-muted-foreground w-10">SR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batsmanStats.map(([name, stats]) => {
                          const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                          const isTop = stats.runs === Math.max(...batsmanStats.map(([, s]) => s.runs));
                          return (
                            <TableRow key={name} className="border-border/20">
                              <TableCell className="py-1.5 px-3">
                                <span className={`text-xs font-semibold ${isTop ? "text-primary" : "text-foreground"}`}>{name}</span>
                                {isTop && <span className="text-[7px] bg-primary/15 text-primary px-1 rounded font-bold ml-1">★</span>}
                                <span className={`block text-[9px] ${stats.isOut ? "text-destructive" : "text-primary"}`}>
                                  {stats.isOut ? stats.dismissal : "batting"}
                                </span>
                              </TableCell>
                              <TableCell className={`py-1.5 text-center text-xs font-bold ${stats.runs >= 50 ? "text-accent" : stats.runs >= 30 ? "text-primary" : "text-foreground"}`}>{stats.runs}</TableCell>
                              <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{stats.balls}</TableCell>
                              <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{stats.fours}</TableCell>
                              <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{stats.sixes}</TableCell>
                              <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{sr}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Bowling Table */}
              {bowlerStatsArr.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bowling — {bowlingTeamName}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30">
                          <TableHead className="text-[10px] font-bold text-foreground min-w-[100px]">Bowler</TableHead>
                          <TableHead className="text-[10px] text-center text-muted-foreground w-9">O</TableHead>
                          <TableHead className="text-[10px] text-center text-muted-foreground w-9">R</TableHead>
                          <TableHead className="text-[10px] text-center font-bold text-foreground w-8">W</TableHead>
                          <TableHead className="text-[10px] text-center text-muted-foreground w-10">Econ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bowlerStatsArr.map(([name, stats]) => {
                          const oversStr = `${Math.floor(stats.legalBalls / 6)}.${stats.legalBalls % 6}`;
                          const econ = stats.legalBalls > 0 ? (stats.runs / (stats.legalBalls / 6)).toFixed(1) : "0.0";
                          return (
                            <TableRow key={name} className="border-border/20">
                              <TableCell className="py-1.5 px-3 text-xs font-semibold text-foreground">{name}</TableCell>
                              <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{oversStr}</TableCell>
                              <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{stats.runs}</TableCell>
                              <TableCell className={`py-1.5 text-center text-xs font-bold ${stats.wickets >= 3 ? "text-accent" : stats.wickets >= 2 ? "text-primary" : "text-foreground"}`}>{stats.wickets}</TableCell>
                              <TableCell className={`py-1.5 text-center text-[10px] ${parseFloat(econ) <= 7 ? "text-primary" : parseFloat(econ) >= 10 ? "text-destructive" : "text-muted-foreground"}`}>{econ}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Current Partnership */}
              {partnerships.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Partnership
                  </span>
                  <div className="mt-2">
                    {(() => {
                      const current = partnerships[partnerships.length - 1];
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{current.bat1} & {current.bat2}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-display font-bold text-foreground">{current.runs}</span>
                            <span className="text-[10px] text-muted-foreground">({current.balls}b)</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "commentary" && (
            <div className="space-y-2">
              {overGroups.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No balls bowled yet</p>
              )}
              {overGroups.slice().reverse().map((group) => (
                <div key={group.overNum} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Over {group.overNum + 1}</span>
                    <span className="text-[10px] font-mono font-bold text-foreground">{group.runs} runs</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {group.balls.map((ball) => <BallDot key={ball.id} ball={ball} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "stats" && (
            <>
              {/* Run Distribution */}
              {currentBalls.length > 0 && (() => {
                const dist: Record<string, { count: number; color: string }> = {
                  "Dots": { count: 0, color: "hsl(var(--muted-foreground))" },
                  "1s": { count: 0, color: "hsl(var(--foreground) / 0.6)" },
                  "2s": { count: 0, color: "hsl(210, 60%, 55%)" },
                  "3s": { count: 0, color: "hsl(280, 50%, 55%)" },
                  "4s": { count: 0, color: "hsl(var(--accent))" },
                  "6s": { count: 0, color: "hsl(var(--primary))" },
                  "Extras": { count: 0, color: "hsl(var(--warning))" },
                };
                currentBalls.forEach((b) => {
                  if (b.extra_type) dist["Extras"].count += 1;
                  else if (b.runs_scored === 0) dist["Dots"].count += 1;
                  else if (b.runs_scored === 1) dist["1s"].count += 1;
                  else if (b.runs_scored === 2) dist["2s"].count += 1;
                  else if (b.runs_scored === 3) dist["3s"].count += 1;
                  else if (b.runs_scored === 4) dist["4s"].count += 1;
                  else if (b.runs_scored >= 6) dist["6s"].count += 1;
                });
                const total = currentBalls.length;
                const segments = Object.entries(dist).filter(([, v]) => v.count > 0).sort((a, b) => b[1].count - a[1].count);
                const maxOverRuns = Math.max(...overGroups.map(o => o.runs), 1);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Donut */}
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Run Distribution</h3>
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0" style={{ width: 90, height: 90 }}>
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            {(() => {
                              let offset = 0;
                              return segments.map(([label, { count, color }]) => {
                                const pct = (count / total) * 100;
                                const el = <circle key={label} cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} strokeLinecap="round" />;
                                offset += pct;
                                return el;
                              });
                            })()}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-display font-black text-foreground leading-none">{total}</span>
                            <span className="text-[7px] text-muted-foreground uppercase">balls</span>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1">
                          {segments.map(([label, { count, color }]) => (
                            <div key={label} className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-[9px] text-muted-foreground">{label}</span>
                              <span className="text-[9px] font-bold text-foreground ml-auto">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Over-by-Over */}
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Runs per Over</h3>
                      <div className="flex items-end gap-1 h-20">
                        {overGroups.map((o, i) => {
                          const height = (o.runs / maxOverRuns) * 100;
                          const isHigh = o.runs >= 10;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                              <span className={`text-[7px] font-bold ${isHigh ? "text-primary" : "text-muted-foreground"}`}>{o.runs}</span>
                              <div className={`w-full rounded-t-sm ${isHigh ? "bg-primary" : "bg-primary/30"}`} style={{ height: `${Math.max(height, 4)}%` }} />
                              <span className="text-[6px] text-muted-foreground">{o.overNum + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* All Partnerships */}
              {partnerships.length > 1 && (
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> All Partnerships
                  </h3>
                  <div className="space-y-1.5">
                    {partnerships.map((p, i) => {
                      const isCurrent = i === partnerships.length - 1 && match.status === "live";
                      const best = partnerships.reduce((b, x) => x.runs > b.runs ? x : b, partnerships[0]);
                      const isBest = p === best && partnerships.length > 1;
                      return (
                        <div key={i} className={`rounded-lg px-3 py-2 flex items-center justify-between ${
                          isBest ? "bg-accent/8 border border-accent/20" : isCurrent ? "bg-primary/8 border border-primary/15" : "bg-muted/20"
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {isBest && <span className="text-[7px] font-bold text-accent bg-accent/15 rounded px-1 py-0.5 uppercase shrink-0">Best</span>}
                            {isCurrent && !isBest && <span className="text-[7px] font-bold text-primary bg-primary/15 rounded px-1 py-0.5 uppercase shrink-0">Live</span>}
                            <span className="text-[11px] text-foreground truncate">{p.bat1} & {p.bat2}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-bold ${isBest ? "text-accent" : "text-foreground"}`}>{p.runs}</span>
                            <span className="text-[9px] text-muted-foreground">({p.balls}b)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Scorecard link */}
          <Link
            to={`/scorecard/${matchId}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-3 hover:bg-muted/20 transition-colors"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">View Full Scorecard</span>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicLiveMatch;
