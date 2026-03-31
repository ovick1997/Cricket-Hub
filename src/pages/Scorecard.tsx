import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, MapPin, Calendar, Award, Loader2 } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Ball = Tables<"balls">;

function PlayerLink({ name, playerId, className }: { name: string; playerId?: string; className?: string }) {
  if (playerId) {
    return (
      <Link to={`/player/${playerId}`} className={`${className} hover:underline hover:text-primary transition-colors cursor-pointer`}>
        {name}
      </Link>
    );
  }
  return <span className={className}>{name}</span>;
}

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
  // Batting
  const batsmen: Record<string, ComputedBatting> = {};
  let runningTotal = 0;
  const wicketBalls: Ball[] = [];

  balls.forEach(b => {
    const id = b.batsman_id;
    if (!batsmen[id]) batsmen[id] = { playerId: id, name: playerMap[id] || "Unknown", runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, dismissal: "not out" };
    batsmen[id].runs += b.runs_scored;
    batsmen[id].balls += 1;
    if (b.runs_scored === 4) batsmen[id].fours += 1;
    if (b.runs_scored === 6) batsmen[id].sixes += 1;
    runningTotal += b.runs_scored + b.extra_runs;

    if (b.is_wicket) {
      const outBatsman = b.wicket_batsman_id || b.batsman_id;
      if (batsmen[outBatsman]) batsmen[outBatsman].dismissal = b.wicket_type || "out";
      wicketBalls.push(b);
    }
  });

  Object.values(batsmen).forEach(b => { b.sr = b.balls > 0 ? (b.runs / b.balls) * 100 : 0; });
  const battingOrder = Object.values(batsmen);

  // Bowling
  const bowlers: Record<string, ComputedBowling> = {};
  balls.forEach(b => {
    const id = b.bowler_id;
    if (!bowlers[id]) bowlers[id] = { playerId: id, name: playerMap[id] || "Unknown", overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0, dots: 0 };
    bowlers[id].runs += b.runs_scored + b.extra_runs;
    bowlers[id].dots += (b.runs_scored === 0 && !b.extra_type) ? 1 : 0;
    if (b.is_wicket) bowlers[id].wickets += 1;
  });

  // Calculate overs for each bowler
  const bowlerBalls: Record<string, number> = {};
  balls.forEach(b => {
    const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
    if (isLegal) bowlerBalls[b.bowler_id] = (bowlerBalls[b.bowler_id] || 0) + 1;
  });
  Object.entries(bowlerBalls).forEach(([id, count]) => {
    if (bowlers[id]) {
      bowlers[id].overs = parseFloat(`${Math.floor(count / 6)}.${count % 6}`);
      bowlers[id].economy = bowlers[id].overs > 0 ? bowlers[id].runs / (count / 6) : 0;
    }
  });
  const bowlingOrder = Object.values(bowlers);

  // Fall of wickets
  let cumulativeRuns = 0;
  let legalBallCount = 0;
  const fow: ComputedFoW[] = [];
  let wicketNum = 0;
  balls.forEach(b => {
    cumulativeRuns += b.runs_scored + b.extra_runs;
    const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
    if (isLegal) legalBallCount += 1;
    if (b.is_wicket) {
      wicketNum += 1;
      const outId = b.wicket_batsman_id || b.batsman_id;
      fow.push({
        wicket: wicketNum,
        score: cumulativeRuns,
        batsman: playerMap[outId] || "Unknown",
        overs: parseFloat(`${Math.floor(legalBallCount / 6)}.${legalBallCount % 6}`),
      });
    }
  });

  // Extras
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

  return { batting: battingOrder, bowling: bowlingOrder, fow, extras, totalRuns, totalWickets, oversStr };
}

function BattingTable({ batting, extras, oversStr }: { batting: ComputedBatting[]; extras: any; oversStr: string }) {
  const totalRuns = batting.reduce((s, b) => s + b.runs, 0);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40">
            <TableHead className="text-[10px] md:text-xs font-bold text-foreground min-w-[120px]">Batter</TableHead>
            <TableHead className="text-[10px] md:text-xs text-muted-foreground min-w-[100px] hidden sm:table-cell">Dismissal</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center font-bold text-foreground w-10">R</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-10">B</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-10">4s</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-10">6s</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-12">SR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batting.map((b, i) => {
            const isTopScorer = b.runs === Math.max(...batting.map(x => x.runs));
            return (
              <TableRow key={i} className="border-border/20 hover:bg-muted/30">
                <TableCell className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <PlayerLink name={b.name} playerId={b.playerId} className={`text-xs md:text-sm font-semibold ${isTopScorer ? "text-primary" : "text-foreground"}`} />
                    {isTopScorer && <span className="text-[8px] bg-primary/15 text-primary px-1 rounded font-bold">★</span>}
                  </div>
                  <span className="text-[9px] text-muted-foreground sm:hidden block mt-0.5 truncate">{b.dismissal}</span>
                </TableCell>
                <TableCell className="py-2 px-3 text-[10px] md:text-xs text-muted-foreground hidden sm:table-cell">{b.dismissal}</TableCell>
                <TableCell className={`py-2 text-center text-xs md:text-sm font-bold ${b.runs >= 50 ? "text-accent" : b.runs >= 30 ? "text-primary" : "text-foreground"}`}>{b.runs}</TableCell>
                <TableCell className="py-2 text-center text-[10px] md:text-xs text-muted-foreground">{b.balls}</TableCell>
                <TableCell className="py-2 text-center text-[10px] md:text-xs text-muted-foreground">{b.fours}</TableCell>
                <TableCell className="py-2 text-center text-[10px] md:text-xs text-muted-foreground">{b.sixes}</TableCell>
                <TableCell className="py-2 text-center text-[10px] md:text-xs text-muted-foreground">{b.sr.toFixed(1)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="border-border/40 bg-muted/20">
            <TableCell colSpan={2} className="py-2 px-3 text-[10px] md:text-xs text-muted-foreground">
              Extras <span className="text-foreground font-semibold ml-1">{extras.total}</span>
              <span className="ml-1 text-[9px]">(w{extras.wides} nb{extras.noBalls} b{extras.byes} lb{extras.legByes})</span>
            </TableCell>
            <TableCell className="py-2 text-center text-xs font-bold text-foreground">{totalRuns + extras.total}</TableCell>
            <TableCell colSpan={4} className="py-2 px-3 text-right text-[10px] text-muted-foreground">({oversStr} ov)</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function BowlingTable({ bowling }: { bowling: ComputedBowling[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40">
            <TableHead className="text-[10px] md:text-xs font-bold text-foreground min-w-[120px]">Bowler</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-10">O</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-10">R</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center font-bold text-foreground w-10">W</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-12">Econ</TableHead>
            <TableHead className="text-[10px] md:text-xs text-center text-muted-foreground w-10 hidden sm:table-cell">Dots</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bowling.map((b, i) => {
            const isTop = b.wickets === Math.max(...bowling.map(x => x.wickets)) && b.wickets > 0;
            return (
              <TableRow key={i} className="border-border/20 hover:bg-muted/30">
                <TableCell className="py-2 px-3">
                  <PlayerLink name={b.name} playerId={b.playerId} className={`text-xs md:text-sm font-semibold ${isTop ? "text-primary" : "text-foreground"}`} />
                </TableCell>
                <TableCell className="py-2 text-center text-[10px] md:text-xs text-muted-foreground">{b.overs}</TableCell>
                <TableCell className="py-2 text-center text-[10px] md:text-xs text-muted-foreground">{b.runs}</TableCell>
                <TableCell className={`py-2 text-center text-xs md:text-sm font-bold ${b.wickets >= 3 ? "text-accent" : b.wickets >= 2 ? "text-primary" : "text-foreground"}`}>{b.wickets}</TableCell>
                <TableCell className={`py-2 text-center text-[10px] md:text-xs ${b.economy <= 7 ? "text-primary" : b.economy >= 10 ? "text-destructive" : "text-muted-foreground"}`}>{b.economy.toFixed(1)}</TableCell>
                <TableCell className="py-2 text-center text-[10px] md:text-xs text-muted-foreground hidden sm:table-cell">{b.dots}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function FallOfWickets({ fow }: { fow: ComputedFoW[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {fow.map((f, i) => (
        <div key={i} className="bg-muted/40 rounded-lg px-2.5 py-1.5 border border-border/30">
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
  );
}

interface InningsDisplayProps {
  teamName: string; shortName: string; color: string;
  totalRuns: number; totalWickets: number; oversStr: string;
  batting: ComputedBatting[]; bowling: ComputedBowling[]; fow: ComputedFoW[]; extras: any;
  defaultOpen?: boolean;
}

function InningsCard({ teamName, shortName, color, totalRuns, totalWickets, oversStr, batting, bowling, fow, extras, defaultOpen = true }: InningsDisplayProps) {
  const [tab, setTab] = useState<"batting" | "bowling" | "fow">("batting");
  const [open, setOpen] = useState(defaultOpen);

  const tabs = [
    { key: "batting" as const, label: "Batting" },
    { key: "bowling" as const, label: "Bowling" },
    { key: "fow" as const, label: "FoW" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 active:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>{shortName}</div>
          <div className="text-left">
            <p className="text-sm font-display font-bold text-foreground">{teamName}</p>
            <p className="text-[10px] text-muted-foreground">{oversStr} overs</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-display font-black text-foreground tracking-tight">{totalRuns}/{totalWickets}</p>
        </div>
      </button>

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/40">
          <div className="flex bg-muted/20 p-1 mx-3 mt-2 rounded-xl gap-0.5">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold transition-all ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{t.label}</button>
            ))}
          </div>
          <div className="p-3">
            {tab === "batting" && <BattingTable batting={batting} extras={extras} oversStr={oversStr} />}
            {tab === "bowling" && <BowlingTable bowling={bowling} />}
            {tab === "fow" && <FallOfWickets fow={fow} />}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const Scorecard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { organizationId } = useAuth();

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(id, name, short_name, color), team2:teams!matches_team2_id_fkey(id, name, short_name, color), man_of_match:players!matches_man_of_match_id_fkey(id, name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: inningsData = [] } = useQuery({
    queryKey: ["innings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("innings")
        .select("*")
        .eq("match_id", id!)
        .order("innings_number");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: allBalls = [] } = useQuery({
    queryKey: ["scorecard-balls", id],
    queryFn: async () => {
      if (inningsData.length === 0) return [];
      const { data, error } = await supabase
        .from("balls")
        .select("*")
        .in("innings_id", inningsData.map(i => i.id))
        .order("over_number")
        .order("ball_number");
      if (error) throw error;
      return data || [];
    },
    enabled: inningsData.length > 0,
  });

  // Fetch player names
  const playerIds = useMemo(() => {
    const ids = new Set<string>();
    allBalls.forEach(b => {
      ids.add(b.batsman_id);
      ids.add(b.bowler_id);
      if (b.wicket_batsman_id) ids.add(b.wicket_batsman_id);
    });
    return Array.from(ids);
  }, [allBalls]);

  const { data: playerMap = {} } = useQuery({
    queryKey: ["players-map", playerIds.join(",")],
    queryFn: async () => {
      if (playerIds.length === 0) return {};
      const { data, error } = await supabase.from("players").select("id, name").in("id", playerIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach(p => { map[p.id] = p.name; });
      return map;
    },
    enabled: playerIds.length > 0,
  });

  // Compute stats for each innings
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

  if (matchLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!match) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Match not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const team1Name = (match.team1 as any)?.name || "Team 1";
  const team2Name = (match.team2 as any)?.name || "Team 2";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-5">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate("/matches")} className="p-2 rounded-xl bg-muted/40 active:bg-muted transition-colors mt-0.5 shrink-0">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-display font-bold text-foreground tracking-tight">{team1Name} vs {team2Name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              {match.venue && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{match.venue}</span>}
              {match.match_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(match.match_date), "MMM d, yyyy")}</span>}
            </div>
          </div>
        </div>

        {match.result && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center gap-2.5">
            <Trophy className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs md:text-sm font-semibold text-primary">{match.result}</p>
          </div>
        )}

        {(match.man_of_match as any)?.name && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 flex items-center gap-2.5">
            <Award className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest">Man of the Match</p>
              <p className="text-xs md:text-sm font-semibold text-amber-500">{(match.man_of_match as any).name}</p>
            </div>
          </div>
        )}

        {inningsStats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No innings data available for this match</p>
          </div>
        ) : (
          inningsStats.map((inn, i) => (
            <InningsCard
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
    </DashboardLayout>
  );
};

export default Scorecard;
