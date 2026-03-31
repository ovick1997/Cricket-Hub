import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, MapPin, Calendar, Loader2, Share2, Check, Award } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import type { Tables } from "@/integrations/supabase/types";

type Ball = Tables<"balls">;

interface ComputedBatting {
  playerId: string; name: string; runs: number; balls: number; fours: number; sixes: number; sr: number; dismissal: string;
}
interface ComputedBowling {
  playerId: string; name: string; overs: number; maidens: number; runs: number; wickets: number; economy: number; dots: number;
}
interface ComputedFoW {
  wicket: number; score: number; batsman: string; overs: number;
}

function computeInningsStats(balls: Ball[], playerMap: Record<string, string>) {
  const batsmen: Record<string, ComputedBatting> = {};
  let runningTotal = 0;
  const fow: ComputedFoW[] = [];
  let wicketNum = 0;
  let legalBallCount = 0;

  balls.forEach(b => {
    const id = b.batsman_id;
    if (!batsmen[id]) batsmen[id] = { playerId: id, name: playerMap[id] || "Unknown", runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, dismissal: "not out" };
    batsmen[id].runs += b.runs_scored;
    batsmen[id].balls += 1;
    if (b.runs_scored === 4) batsmen[id].fours += 1;
    if (b.runs_scored === 6) batsmen[id].sixes += 1;
    runningTotal += b.runs_scored + b.extra_runs;
    const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
    if (isLegal) legalBallCount += 1;
    if (b.is_wicket) {
      const outBatsman = b.wicket_batsman_id || b.batsman_id;
      if (batsmen[outBatsman]) batsmen[outBatsman].dismissal = b.wicket_type || "out";
      wicketNum += 1;
      fow.push({ wicket: wicketNum, score: runningTotal, batsman: playerMap[outBatsman] || "Unknown", overs: parseFloat(`${Math.floor(legalBallCount / 6)}.${legalBallCount % 6}`) });
    }
  });

  Object.values(batsmen).forEach(b => { b.sr = b.balls > 0 ? (b.runs / b.balls) * 100 : 0; });

  const bowlers: Record<string, ComputedBowling> = {};
  const bowlerBalls: Record<string, number> = {};
  balls.forEach(b => {
    const id = b.bowler_id;
    if (!bowlers[id]) bowlers[id] = { playerId: id, name: playerMap[id] || "Unknown", overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0, dots: 0 };
    bowlers[id].runs += b.runs_scored + b.extra_runs;
    bowlers[id].dots += (b.runs_scored === 0 && !b.extra_type) ? 1 : 0;
    if (b.is_wicket) bowlers[id].wickets += 1;
    const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
    if (isLegal) bowlerBalls[id] = (bowlerBalls[id] || 0) + 1;
  });
  Object.entries(bowlerBalls).forEach(([id, count]) => {
    if (bowlers[id]) {
      bowlers[id].overs = parseFloat(`${Math.floor(count / 6)}.${count % 6}`);
      bowlers[id].economy = count > 0 ? bowlers[id].runs / (count / 6) : 0;
    }
  });

  const extras = { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0 };
  balls.forEach(b => {
    if (b.extra_type === "wide") { extras.wides += b.extra_runs; extras.total += b.extra_runs; }
    else if (b.extra_type === "no-ball") { extras.noBalls += b.extra_runs; extras.total += b.extra_runs; }
    else if (b.extra_type === "bye") { extras.byes += b.extra_runs; extras.total += b.extra_runs; }
    else if (b.extra_type === "leg-bye") { extras.legByes += b.extra_runs; extras.total += b.extra_runs; }
  });

  const totalRuns = balls.reduce((s, b) => s + b.runs_scored + b.extra_runs, 0);
  const totalWickets = balls.filter(b => b.is_wicket).length;
  const legalTotal = balls.filter(b => !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye").length;
  const oversStr = `${Math.floor(legalTotal / 6)}.${legalTotal % 6}`;

  return { batting: Object.values(batsmen), bowling: Object.values(bowlers), fow, extras, totalRuns, totalWickets, oversStr };
}

function InningsSection({ teamName, shortName, color, totalRuns, totalWickets, oversStr, batting, bowling, fow, extras, defaultOpen = true }: {
  teamName: string; shortName: string; color: string;
  totalRuns: number; totalWickets: number; oversStr: string;
  batting: ComputedBatting[]; bowling: ComputedBowling[]; fow: ComputedFoW[]; extras: any;
  defaultOpen?: boolean;
}) {
  const [tab, setTab] = useState<"batting" | "bowling" | "fow">("batting");
  const [open, setOpen] = useState(defaultOpen);
  const tabs = [
    { key: "batting" as const, label: "Batting" },
    { key: "bowling" as const, label: "Bowling" },
    { key: "fow" as const, label: "FoW" },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>{shortName}</div>
          <div className="text-left">
            <p className="text-sm font-display font-bold text-foreground">{teamName}</p>
            <p className="text-[10px] text-muted-foreground">{oversStr} overs</p>
          </div>
        </div>
        <p className="text-xl font-display font-black text-foreground tracking-tight">{totalRuns}/{totalWickets}</p>
      </button>

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/30">
          {/* Tabs */}
          <div className="flex bg-muted/20 p-1 mx-3 mt-2 rounded-lg gap-0.5">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{t.label}</button>
            ))}
          </div>

          <div className="p-3">
            {tab === "batting" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30">
                      <TableHead className="text-[10px] font-bold text-foreground min-w-[100px]">Batter</TableHead>
                      <TableHead className="text-[10px] text-muted-foreground min-w-[80px] hidden sm:table-cell">Dismissal</TableHead>
                      <TableHead className="text-[10px] text-center font-bold text-foreground w-9">R</TableHead>
                      <TableHead className="text-[10px] text-center text-muted-foreground w-9">B</TableHead>
                      <TableHead className="text-[10px] text-center text-muted-foreground w-8">4s</TableHead>
                      <TableHead className="text-[10px] text-center text-muted-foreground w-8">6s</TableHead>
                      <TableHead className="text-[10px] text-center text-muted-foreground w-10">SR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batting.map((b, i) => {
                      const isTop = b.runs === Math.max(...batting.map(x => x.runs));
                      return (
                        <TableRow key={i} className="border-border/20">
                          <TableCell className="py-1.5 px-3">
                            <span className={`text-xs font-semibold ${isTop ? "text-primary" : "text-foreground"}`}>{b.name}</span>
                            {isTop && <span className="text-[7px] bg-primary/15 text-primary px-1 rounded font-bold ml-1">★</span>}
                            <span className="text-[9px] text-muted-foreground sm:hidden block mt-0.5 truncate">{b.dismissal}</span>
                          </TableCell>
                          <TableCell className="py-1.5 px-3 text-[10px] text-muted-foreground hidden sm:table-cell">{b.dismissal}</TableCell>
                          <TableCell className={`py-1.5 text-center text-xs font-bold ${b.runs >= 50 ? "text-accent" : b.runs >= 30 ? "text-primary" : "text-foreground"}`}>{b.runs}</TableCell>
                          <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{b.balls}</TableCell>
                          <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{b.fours}</TableCell>
                          <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{b.sixes}</TableCell>
                          <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{b.sr.toFixed(1)}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-border/30 bg-muted/20">
                      <TableCell colSpan={2} className="py-1.5 px-3 text-[10px] text-muted-foreground">
                        Extras <span className="text-foreground font-semibold ml-1">{extras.total}</span>
                        <span className="ml-1 text-[9px]">(w{extras.wides} nb{extras.noBalls} b{extras.byes} lb{extras.legByes})</span>
                      </TableCell>
                      <TableCell className="py-1.5 text-center text-xs font-bold text-foreground">{batting.reduce((s, b) => s + b.runs, 0) + extras.total}</TableCell>
                      <TableCell colSpan={4} className="py-1.5 px-3 text-right text-[10px] text-muted-foreground">({oversStr} ov)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
            {tab === "bowling" && (
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
                    {bowling.map((b, i) => {
                      const isTop = b.wickets === Math.max(...bowling.map(x => x.wickets)) && b.wickets > 0;
                      return (
                        <TableRow key={i} className="border-border/20">
                          <TableCell className="py-1.5 px-3">
                            <span className={`text-xs font-semibold ${isTop ? "text-primary" : "text-foreground"}`}>{b.name}</span>
                          </TableCell>
                          <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{b.overs}</TableCell>
                          <TableCell className="py-1.5 text-center text-[10px] text-muted-foreground">{b.runs}</TableCell>
                          <TableCell className={`py-1.5 text-center text-xs font-bold ${b.wickets >= 3 ? "text-accent" : b.wickets >= 2 ? "text-primary" : "text-foreground"}`}>{b.wickets}</TableCell>
                          <TableCell className={`py-1.5 text-center text-[10px] ${b.economy <= 7 ? "text-primary" : b.economy >= 10 ? "text-destructive" : "text-muted-foreground"}`}>{b.economy.toFixed(1)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {tab === "fow" && (
              <div className="flex flex-wrap gap-1.5">
                {fow.map((f, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg px-2.5 py-1.5 border border-border/30">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-destructive">{f.wicket}</span>
                      <span className="text-[9px] text-muted-foreground">-</span>
                      <span className="text-xs font-bold text-foreground">{f.score}</span>
                    </div>
                    <p className="text-[8px] text-muted-foreground truncate max-w-[80px]">{f.batsman} ({f.overs})</p>
                  </div>
                ))}
                {fow.length === 0 && <p className="text-sm text-muted-foreground">No wickets fell</p>}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const PublicScorecard = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: match, isLoading } = useQuery({
    queryKey: ["public-match", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(id, name, short_name, color), team2:teams!matches_team2_id_fkey(id, name, short_name, color), motm:players!matches_man_of_match_id_fkey(name)")
        .eq("id", matchId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  const { data: inningsData = [] } = useQuery({
    queryKey: ["public-innings", matchId],
    queryFn: async () => {
      const { data, error } = await supabase.from("innings").select("*").eq("match_id", matchId!).order("innings_number");
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  const { data: allBalls = [] } = useQuery({
    queryKey: ["public-scorecard-balls", matchId],
    queryFn: async () => {
      if (inningsData.length === 0) return [];
      const { data, error } = await supabase.from("balls").select("*").in("innings_id", inningsData.map(i => i.id)).order("over_number").order("ball_number");
      if (error) throw error;
      return data || [];
    },
    enabled: inningsData.length > 0,
  });

  const playerIds = useMemo(() => {
    const ids = new Set<string>();
    allBalls.forEach(b => { ids.add(b.batsman_id); ids.add(b.bowler_id); if (b.wicket_batsman_id) ids.add(b.wicket_batsman_id); });
    return Array.from(ids);
  }, [allBalls]);

  const { data: playerMap = {} } = useQuery({
    queryKey: ["public-players-map", playerIds.join(",")],
    queryFn: async () => {
      if (playerIds.length === 0) return {};
      const { data } = await supabase.from("players").select("id, name").in("id", playerIds);
      const map: Record<string, string> = {};
      data?.forEach(p => { map[p.id] = p.name; });
      return map;
    },
    enabled: playerIds.length > 0,
  });

  const inningsStats = useMemo(() => {
    return inningsData.map(inn => {
      const innBalls = allBalls.filter(b => b.innings_id === inn.id);
      const stats = computeInningsStats(innBalls, playerMap);
      const battingTeam = inn.batting_team_id === match?.team1_id ? match?.team1 : match?.team2;
      return {
        inningsNumber: inn.innings_number,
        teamName: (battingTeam as any)?.name || "Unknown",
        shortName: (battingTeam as any)?.short_name || "??",
        color: (battingTeam as any)?.color || "#22c55e",
        ...stats,
      };
    });
  }, [inningsData, allBalls, playerMap, match]);

  const shareUrl = window.location.href;
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${(match?.team1 as any)?.name} vs ${(match?.team2 as any)?.name} — Scorecard`, url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true); toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <PublicLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PublicLayout>;
  }

  if (!match) {
    return <PublicLayout><div className="flex items-center justify-center py-20 text-muted-foreground"><p>Match not found.</p></div></PublicLayout>;
  }

  const team1Name = (match.team1 as any)?.name || "Team 1";
  const team2Name = (match.team2 as any)?.name || "Team 2";
  const motmName = (match as any).motm?.name;

  return (
    <PublicLayout>
      <div className="space-y-0">
        {/* Match Header */}
        <div className="border-b border-border/40 bg-card">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => navigate("/live")} className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors">
                <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={handleShare} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground text-[10px] font-semibold hover:text-foreground transition-colors">
                {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                {copied ? "Copied" : "Share"}
              </button>
            </div>

            <h1 className="text-lg font-display font-bold text-foreground tracking-tight">{team1Name} vs {team2Name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              {match.venue && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{match.venue}</span>}
              {match.match_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{format(new Date(match.match_date), "MMM d, yyyy")}</span>}
            </div>

            {/* Result */}
            {match.result && (
              <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs font-semibold text-primary">{match.result}</p>
              </div>
            )}

            {/* MOTM */}
            {motmName && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <Award className="h-3.5 w-3.5 text-accent" />
                <span className="text-muted-foreground">Player of the Match:</span>
                <span className="font-semibold text-accent">{motmName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Innings Cards */}
        <div className="px-4 py-4 space-y-4">
          {inningsStats.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">No innings data available</p>
            </div>
          ) : (
            inningsStats.map((inn, i) => (
              <InningsSection
                key={inn.inningsNumber}
                teamName={inn.teamName}
                shortName={inn.shortName}
                color={inn.color}
                totalRuns={inn.totalRuns}
                totalWickets={inn.totalWickets}
                oversStr={inn.oversStr}
                batting={inn.batting}
                bowling={inn.bowling}
                fow={inn.fow}
                extras={inn.extras}
                defaultOpen={i === 0}
              />
            ))
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicScorecard;
