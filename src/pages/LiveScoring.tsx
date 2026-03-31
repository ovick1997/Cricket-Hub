import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { Radio, RotateCcw, AlertTriangle, X, ArrowLeftRight, Loader2, ChevronRight, Swords, Trophy, Target, Flag, Coins, Award, Search, UserRoundPlus, BarChart3 } from "lucide-react";
import { LiveScoreboardDialog } from "@/components/scoring/LiveScoreboardDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BatsmanSelectDialog } from "@/components/scoring/BatsmanSelectDialog";
import { BowlerSelectDialog } from "@/components/scoring/BowlerSelectDialog";
import { WicketCelebration } from "@/components/scoring/WicketCelebration";
import { BoundaryCelebration } from "@/components/scoring/BoundaryCelebration";
import { HattrickCelebration } from "@/components/scoring/HattrickCelebration";
import { MilestoneCelebration } from "@/components/scoring/MilestoneCelebration";
import { useLongPress } from "@/hooks/use-long-press";
import { ImpactSubDialog } from "@/components/scoring/ImpactSubDialog";
import { supabase } from "@/integrations/supabase/client";
import { playBoundarySound } from "@/lib/boundary-sound";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type ExtraType = Database["public"]["Enums"]["extra_type"];

const wicketTypes = ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"];
const runOutOptions = [
  { label: "Run Out (S)", isNonStrikerOut: false },
  { label: "Run Out (NS)", isNonStrikerOut: true },
];

interface BallRecord {
  id: string;
  runs_scored: number;
  extra_type: ExtraType | null;
  extra_runs: number;
  is_wicket: boolean;
  wicket_type: string | null;
}

// Run button with long-press support
const RunButton = ({ run, onTap, onLongPress, variant = "default", className = "" }: {
  run: number; onTap: () => void; onLongPress: () => void;
  variant?: "default" | "wide" | "accent" | "primary"; className?: string;
}) => {
  const lp = useLongPress({ onLongPress, onClick: onTap, delay: 500 });
  const variantClass = {
    default: "bg-secondary text-secondary-foreground",
    wide: "bg-warning/15 text-warning border border-warning/30",
    accent: "bg-accent/15 text-accent border-2 border-accent/30",
    primary: "bg-primary/15 text-primary border-2 border-primary/30",
  }[variant];

  return (
    <button
      {...lp}
      className={`rounded-2xl font-display font-black text-xl sm:text-2xl md:text-3xl select-none touch-manipulation active:scale-[0.92] transition-transform min-h-[36px] sm:min-h-[44px] md:min-h-[52px] ${variantClass} ${className}`}
    >
      {run}
    </button>
  );
};

// ============ MATCH SELECTION ============
function MatchSelector({ onSelect }: { onSelect: (matchId: string) => void }) {
  const { organizationId } = useAuth();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["scoring-matches", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(name, short_name, color), team2:teams!matches_team2_id_fkey(name, short_name, color)")
        .eq("organization_id", organizationId)
        .in("status", ["upcoming", "live"])
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

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
      <div className="max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Start Scoring</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Select a match to begin live scoring</p>
        </motion.div>

        {matches.length === 0 ? (
          <div className="text-center py-16">
            <Swords className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No upcoming or live matches</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Create a match first from the Matches page</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {matches.map((m: any, i: number) => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onSelect(m.id)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/20 active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    m.status === "live" ? "bg-primary/15 text-primary" : "bg-info/15 text-info"
                  }`}>
                    {m.status === "live" && <Radio className="h-2.5 w-2.5 inline mr-1 animate-pulse-glow" />}
                    {m.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{m.overs} ov</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: (m.team1?.color || "#22c55e") + "15", color: m.team1?.color || "#22c55e" }}>
                        {m.team1?.short_name}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{m.team1?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: (m.team2?.color || "#f59e0b") + "15", color: m.team2?.color || "#f59e0b" }}>
                        {m.team2?.short_name}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{m.team2?.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {m.match_date && (
                  <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                    {format(new Date(m.match_date), "MMM d, yyyy")} {m.venue && `• ${m.venue}`}
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ============ INNINGS SUMMARY / BREAK SCREEN ============
function InningsSummary({ match, innings, onStartSecondInnings }: {
  match: any;
  innings: any;
  onStartSecondInnings: () => void;
}) {
  const team1 = (match?.team1 as any);
  const team2 = (match?.team2 as any);
  if (!team1 || !team2) return null;
  const battingTeam = innings.batting_team_id === team1?.id ? team1 : team2;
  const bowlingTeam = innings.bowling_team_id === team1?.id ? team1 : team2;

  const target = innings.total_runs + 1;
  const legalBalls = Math.round(innings.total_overs * 10) % 10 + Math.floor(innings.total_overs) * 6;
  const totalExtras = innings.extras_wides + innings.extras_no_balls + innings.extras_byes + innings.extras_leg_byes;

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto py-8 space-y-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Innings Complete</h1>
          <p className="text-xs text-muted-foreground mt-1">1st innings summary</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-primary/20 bg-card overflow-hidden"
        >
          <div className="px-4 py-3 bg-gradient-to-r from-primary/8 to-transparent border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                style={{ backgroundColor: (battingTeam?.color || "#22c55e") + "15", color: battingTeam?.color || "#22c55e" }}>
                {battingTeam?.short_name}
              </div>
              <span className="text-sm font-bold text-foreground">{battingTeam?.name}</span>
            </div>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-foreground">{innings.total_runs}</span>
                <span className="text-xl font-display font-bold text-muted-foreground">/{innings.total_wickets}</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">({innings.total_overs} ov)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Extras</p>
                <p className="text-sm font-bold text-foreground">{totalExtras}</p>
                <p className="text-[9px] text-muted-foreground">
                  W:{innings.extras_wides} NB:{innings.extras_no_balls} B:{innings.extras_byes} LB:{innings.extras_leg_byes}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Run Rate</p>
                <p className="text-sm font-bold text-foreground">
                  {legalBalls > 0 ? ((innings.total_runs / legalBalls) * 6).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Target</span>
          </div>
          <p className="text-3xl font-display font-black text-accent">{target}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {bowlingTeam?.name} need {target} runs from {match.overs} overs
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onStartSecondInnings}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform"
        >
          Start 2nd Innings →
        </motion.button>
      </div>
    </DashboardLayout>
  );
}

// ============ MATCH RESULT SCREEN ============
function MatchResult({ match, inningsData, onBack }: {
  match: any;
  inningsData: any[];
  onBack: () => void;
}) {
  const innings1 = inningsData.find(i => i.innings_number === 1);
  const innings2 = inningsData.find(i => i.innings_number === 2);

  const inningsIds = [innings1?.id, innings2?.id].filter(Boolean) as string[];

  // Fetch balls for both innings
  const { data: allBalls = [] } = useQuery({
    queryKey: ["result-balls", match.id],
    queryFn: async () => {
      const { data } = await supabase.from("balls").select("*").in("innings_id", inningsIds).order("over_number").order("ball_number");
      return data || [];
    },
    enabled: inningsIds.length === 2,
  });

  // Fetch player names
  const playerIds = useMemo(() => {
    const ids = new Set<string>();
    allBalls.forEach((b: any) => { ids.add(b.batsman_id); ids.add(b.bowler_id); if (b.wicket_batsman_id) ids.add(b.wicket_batsman_id); });
    return Array.from(ids);
  }, [allBalls]);

  const { data: playerMap = {} } = useQuery({
    queryKey: ["result-players", playerIds.join(",")],
    queryFn: async () => {
      if (playerIds.length === 0) return {};
      const { data } = await supabase.from("players").select("id, name").in("id", playerIds);
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.id] = p.name; });
      return map;
    },
    enabled: playerIds.length > 0,
  });

  const [expandedInnings, setExpandedInnings] = useState<number | null>(null);
  const [motmId, setMotmId] = useState<string | null>(null);
  const [motmSaved, setMotmSaved] = useState(false);
  const [motmSearch, setMotmSearch] = useState("");
  const [showMotmPicker, setShowMotmPicker] = useState(false);

  if (!innings1 || !innings2) return null;

  const team1 = (match.team1 as any);
  const team2 = (match.team2 as any);
  const bat1Team = innings1.batting_team_id === team1?.id ? team1 : team2;
  const bat2Team = innings2.batting_team_id === team1?.id ? team1 : team2;

  let resultText = "";
  if (innings2.total_runs > innings1.total_runs) {
    const wicketsLeft = 10 - innings2.total_wickets;
    resultText = `${bat2Team?.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`;
  } else if (innings1.total_runs > innings2.total_runs) {
    const margin = innings1.total_runs - innings2.total_runs;
    resultText = `${bat1Team?.name} won by ${margin} run${margin !== 1 ? "s" : ""}`;
  } else {
    resultText = "Match Tied!";
  }

  const computeStats = (innId: string) => {
    const balls = allBalls.filter((b: any) => b.innings_id === innId);
    const batsmen: Record<string, { name: string; runs: number; balls: number; fours: number; sixes: number; sr: number; dismissal: string }> = {};
    const bowlers: Record<string, { name: string; runs: number; legalBalls: number; wickets: number; dots: number }> = {};

    balls.forEach((b: any) => {
      const batId = b.batsman_id;
      if (!batsmen[batId]) batsmen[batId] = { name: playerMap[batId] || "Unknown", runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, dismissal: "not out" };
      batsmen[batId].runs += b.runs_scored;
      batsmen[batId].balls += 1;
      if (b.runs_scored === 4) batsmen[batId].fours += 1;
      if (b.runs_scored === 6) batsmen[batId].sixes += 1;

      if (b.is_wicket) {
        const outId = b.wicket_batsman_id || b.batsman_id;
        if (batsmen[outId]) batsmen[outId].dismissal = b.wicket_type || "out";
      }

      const bowId = b.bowler_id;
      if (!bowlers[bowId]) bowlers[bowId] = { name: playerMap[bowId] || "Unknown", runs: 0, legalBalls: 0, wickets: 0, dots: 0 };
      bowlers[bowId].runs += b.runs_scored + b.extra_runs;
      if (b.runs_scored === 0 && !b.extra_type) bowlers[bowId].dots += 1;
      if (b.is_wicket) bowlers[bowId].wickets += 1;
      const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
      if (isLegal) bowlers[bowId].legalBalls += 1;
    });

    Object.values(batsmen).forEach(b => { b.sr = b.balls > 0 ? (b.runs / b.balls) * 100 : 0; });

    return {
      batting: Object.values(batsmen).sort((a, b) => b.runs - a.runs),
      bowling: Object.values(bowlers).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs),
    };
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto py-6 space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Match Complete</h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-bold text-primary mt-2"
          >
            {resultText}
          </motion.p>
        </motion.div>

        {[innings1, innings2].map((inn, idx) => {
          const batTeam = inn.batting_team_id === team1?.id ? team1 : team2;
          const isExpanded = expandedInnings === idx;
          const stats = isExpanded ? computeStats(inn.id) : null;

          return (
            <motion.div
              key={inn.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.1 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedInnings(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-4 active:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: (batTeam?.color || "#22c55e") + "15", color: batTeam?.color || "#22c55e" }}>
                    {batTeam?.short_name}
                  </div>
                  <span className="text-sm font-bold text-foreground">{batTeam?.name}</span>
                  <span className="text-[10px] text-muted-foreground">{idx === 0 ? "1st" : "2nd"} Inn</span>
                </div>
                <div className="text-right flex items-baseline gap-0.5">
                  <span className="text-2xl font-display font-black text-foreground">{inn.total_runs}</span>
                  <span className="text-base font-display font-bold text-muted-foreground">/{inn.total_wickets}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-1">({inn.total_overs})</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-1 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && stats && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border/40"
                  >
                    <div className="p-3 space-y-3">
                      {/* Batting */}
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Batting</p>
                        <div className="space-y-1">
                          {stats.batting.map((b, i) => (
                            <div key={i} className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/20">
                              <div className="min-w-0 flex-1">
                                <span className={`text-xs font-semibold ${b.runs >= 30 ? "text-primary" : "text-foreground"}`}>{b.name}</span>
                                <span className="text-[9px] text-muted-foreground ml-1.5">{b.dismissal}</span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0 text-right">
                                <span className={`text-sm font-display font-bold ${b.runs >= 50 ? "text-accent" : b.runs >= 30 ? "text-primary" : "text-foreground"}`}>{b.runs}</span>
                                <span className="text-[10px] text-muted-foreground w-7 text-right">({b.balls})</span>
                                <span className="text-[9px] text-muted-foreground w-14 text-right">{b.fours}×4 {b.sixes}×6</span>
                                <span className="text-[9px] text-muted-foreground w-10 text-right">{b.sr.toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bowling */}
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Bowling</p>
                        <div className="space-y-1">
                          {stats.bowling.map((b, i) => (
                            <div key={i} className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/20">
                              <span className={`text-xs font-semibold ${b.wickets >= 3 ? "text-accent" : b.wickets >= 2 ? "text-primary" : "text-foreground"}`}>{b.name}</span>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>{Math.floor(b.legalBalls / 6)}.{b.legalBalls % 6} ov</span>
                                <span>{b.runs}r</span>
                                <span className="font-bold text-foreground">{b.wickets}W</span>
                                <span>{b.legalBalls > 0 ? (b.runs / (b.legalBalls / 6)).toFixed(1) : "0.0"} econ</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Man of the Match */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-accent/20 bg-card overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Man of the Match</span>
            </div>

            {motmSaved && motmId ? (
              <div className="flex items-center gap-3 rounded-xl bg-accent/8 border border-accent/15 p-3">
                <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center text-sm font-bold text-accent">
                  {(playerMap[motmId] || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{playerMap[motmId]}</p>
                  <p className="text-[10px] text-accent font-semibold">⭐ Player of the Match</p>
                </div>
                <button onClick={() => { setMotmSaved(false); setShowMotmPicker(true); }} className="text-[10px] text-muted-foreground hover:text-foreground">Change</button>
              </div>
            ) : showMotmPicker ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search player..."
                    value={motmSearch}
                    onChange={(e) => setMotmSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {Object.entries(playerMap)
                    .filter(([, name]) => name.toLowerCase().includes(motmSearch.toLowerCase()))
                    .sort(([, a], [, b]) => a.localeCompare(b))
                    .map(([id, name]) => (
                      <button
                        key={id}
                        onClick={async () => {
                          setMotmId(id);
                          setShowMotmPicker(false);
                          setMotmSearch("");
                          await supabase.from("matches").update({ man_of_match_id: id } as any).eq("id", match.id);
                          setMotmSaved(true);
                          toast.success(`${name} selected as Man of the Match!`);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40 active:scale-[0.98] transition-all text-left"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{name}</span>
                      </button>
                    ))}
                </div>
                <button onClick={() => { setShowMotmPicker(false); setMotmSearch(""); }} className="w-full text-[10px] text-muted-foreground py-1.5 hover:text-foreground">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setShowMotmPicker(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-accent/30 text-xs font-semibold text-accent hover:bg-accent/5 active:scale-[0.98] transition-all"
              >
                Select Man of the Match
              </button>
            )}
          </div>
        </motion.div>

        <div className="flex gap-2">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => window.open(`/scorecard/${match.id}`, "_blank")}
            className="flex-1 py-3 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            Full Scorecard ↗
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            onClick={onBack}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Back to Matches
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============ SORTABLE BATTING ORDER ITEM ============
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

function SortablePlayer({ id, player, index, teamColor }: { id: string; player: any; index: number; teamColor: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const initials = player.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 h-11 rounded-xl px-3 transition-all ${
        isDragging ? "bg-primary/20 border border-primary/40 shadow-lg z-50 scale-[1.02]" : "bg-secondary border border-border/30"
      }`}
    >
      <button {...attributes} {...listeners} className="touch-none p-0.5 -ml-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="text-[10px] font-bold text-muted-foreground w-5 text-center shrink-0">{index + 1}</span>
      <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
        style={{ backgroundColor: teamColor + "15", color: teamColor }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <span className="text-xs font-semibold text-foreground truncate block">{player.name}</span>
      </div>
      <span className="text-[9px] text-muted-foreground capitalize shrink-0">{player.role}</span>
    </div>
  );
}

// ============ SQUAD SELECTION ============
function SquadSelection({ match, team1AllPlayers, team2AllPlayers, team1Squad, team2Squad, setTeam1Squad, setTeam2Squad, onComplete }: {
  match: any; team1AllPlayers: any[]; team2AllPlayers: any[];
  team1Squad: string[]; team2Squad: string[];
  setTeam1Squad: (ids: string[] | ((prev: string[]) => string[])) => void;
  setTeam2Squad: (ids: string[] | ((prev: string[]) => string[])) => void;
  onComplete: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"team1" | "team2">("team1");
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<"select" | "order">("select");
  const team1 = match?.team1 as any;
  const team2 = match?.team2 as any;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const squadLimit = match?.players_per_team || 11;

  const togglePlayer = (playerId: string, isTeam1: boolean) => {
    const setter = isTeam1 ? setTeam1Squad : setTeam2Squad;
    const currentSquad = isTeam1 ? team1Squad : team2Squad;
    if (!currentSquad.includes(playerId) && currentSquad.length >= squadLimit) {
      toast.error(`Squad limit ${squadLimit} — আগে কাউকে remove করুন`);
      return;
    }
    setter((prev: string[]) => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
  };

  const selectAll = (isTeam1: boolean) => {
    const players = isTeam1 ? team1AllPlayers : team2AllPlayers;
    const ids = players.slice(0, squadLimit).map((p: any) => p.id);
    if (isTeam1) setTeam1Squad(ids); else setTeam2Squad(ids);
  };

  const activeTeam = activeTab === "team1" ? team1 : team2;
  const allActivePlayers = activeTab === "team1" ? team1AllPlayers : team2AllPlayers;
  const activePlayers = searchQuery ? allActivePlayers.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : allActivePlayers;
  const activeSquad = activeTab === "team1" ? team1Squad : team2Squad;
  const activeSetter = activeTab === "team1" ? setTeam1Squad : setTeam2Squad;
  const canContinue = (team1Squad.length >= 2 && team2Squad.length >= 1) || (team1Squad.length === 0 && team2Squad.length === 0);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      activeSetter((prev: string[]) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const squadPlayers = activeSquad.map(id => allActivePlayers.find((p: any) => p.id === id)).filter(Boolean);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-5 py-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
            {step === "select" ? "Select Squad" : "Set Batting Order"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {step === "select" ? "Choose players for each team" : "Drag to reorder batting position"}
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center">
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step === "select" ? "bg-primary" : "bg-primary/30"}`} />
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step === "order" ? "bg-primary" : "bg-primary/30"}`} />
        </div>

        {/* Team tabs */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
          {[{ key: "team1" as const, team: team1, squad: team1Squad }, { key: "team2" as const, team: team2, squad: team2Squad }].map(({ key, team: t, squad }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearchQuery(""); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="h-4 w-4 rounded" style={{ backgroundColor: t?.color || "#22c55e" }} />
              {t?.short_name || "??"}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${squad.length >= squadLimit ? "bg-primary/20 text-primary font-bold" : squad.length > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {squad.length}/{squadLimit}
              </span>
            </button>
          ))}
        </div>

        {step === "select" ? (
          /* ===== STEP 1: Select Players ===== */
          <motion.div key={`select-${activeTab}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{activeTeam?.name} Squad</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${activeSquad.length >= squadLimit ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {activeSquad.length}/{squadLimit}
                </span>
              </div>
              <button onClick={() => selectAll(activeTab === "team1")} className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors">
                Select {squadLimit > team1AllPlayers.length ? "All" : `Top ${squadLimit}`}
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {activePlayers.map((p: any) => {
                const isSelected = activeSquad.includes(p.id);
                const isDisabled = !isSelected && activeSquad.length >= squadLimit;
                return (
                  <motion.button
                    key={p.id}
                    whileTap={isDisabled ? undefined : { scale: 0.97 }}
                    onClick={() => !isDisabled && togglePlayer(p.id, activeTab === "team1")}
                    className={`w-full h-12 rounded-xl text-sm font-bold px-4 flex items-center gap-3 transition-all ${
                      isSelected
                        ? "bg-primary/15 border border-primary/30 text-foreground"
                        : isDisabled
                        ? "bg-secondary/40 text-muted-foreground/50 cursor-not-allowed"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-primary border-primary" : isDisabled ? "border-muted-foreground/15" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: (activeTeam?.color || "#22c55e") + "15", color: activeTeam?.color || "#22c55e" }}>
                      {p.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="text-left flex-1">
                      <span>{p.name}</span>
                      {p.jersey_number !== null && <span className="text-muted-foreground text-[10px] font-mono ml-2">#{p.jersey_number}</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground capitalize">{p.role}</span>
                  </motion.button>
                );
              })}
              {activePlayers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No players in this team. Add players first.</p>
              )}
            </div>
          </motion.div>
        ) : (
          /* ===== STEP 2: Reorder Batting Order ===== */
          <motion.div key={`order-${activeTab}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {activeTeam?.name} — Batting Order
              </p>
              <span className="text-[10px] text-muted-foreground">{squadPlayers.length} players</span>
            </div>
            {squadPlayers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No players selected. Go back to select players first.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeSquad} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                    {activeSquad.map((id, index) => {
                      const player = allActivePlayers.find((p: any) => p.id === id);
                      if (!player) return null;
                      return (
                        <SortablePlayer
                          key={id}
                          id={id}
                          player={player}
                          index={index}
                          teamColor={activeTeam?.color || "#22c55e"}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {step === "select" ? (
            <>
              <button
                onClick={() => { setTeam1Squad([]); setTeam2Squad([]); onComplete(); }}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Skip (Use All)
              </button>
              <button
                onClick={() => setStep("order")}
                disabled={!canContinue}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                Set Batting Order →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("select")}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={onComplete}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform"
              >
                Confirm Squads ✓
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============ MAIN SCORING INTERFACE ============
function ScoringInterface({ matchId, onBack }: { matchId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [lastAction, setLastAction] = useState<string>("");
  const [showWicket, setShowWicket] = useState(false);
  const [boundaryType, setBoundaryType] = useState<"four" | "six" | null>(null);
  const [wideNbRuns, setWideNbRuns] = useState<"Wide" | "No Ball" | null>(null);
  const [longPressRun, setLongPressRun] = useState<number | null>(null);
  const [swipeHint, setSwipeHint] = useState(false);
  const [showBatsmanDialog, setShowBatsmanDialog] = useState(false);
  const [showBowlerDialog, setShowBowlerDialog] = useState(false);
  const [pendingNewBatsman, setPendingNewBatsman] = useState(false);
  const [nonStrikerRunOut, setNonStrikerRunOut] = useState(false);
  const [isEndOfOver, setIsEndOfOver] = useState(false);
  const [showInningsSummary, setShowInningsSummary] = useState(false);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showWicketCelebration, setShowWicketCelebration] = useState(false);
  const [lastWicketType, setLastWicketType] = useState<string | null>(null);
  const [lastWicketBatsman, setLastWicketBatsman] = useState<string>("");
  const [showHattrick, setShowHattrick] = useState(false);
  const [milestoneType, setMilestoneType] = useState<"fifty" | "century" | null>(null);
  const [milestoneBatsman, setMilestoneBatsman] = useState("");
  const [milestoneRuns, setMilestoneRuns] = useState(0);
  const [prevStrikerRuns, setPrevStrikerRuns] = useState(0);
  const [showFielderSelect, setShowFielderSelect] = useState(false);
  const [pendingWicket, setPendingWicket] = useState<{ wicketType: string; isNonStrikerOut?: boolean; runs: number; extraType?: string } | null>(null);

  // Player state (IDs + names)
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [strikerName, setStrikerName] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [nonStrikerName, setNonStrikerName] = useState("");
  const [bowlerId, setBowlerId] = useState<string | null>(null);
  const [bowlerName, setBowlerName] = useState("");
  const [lastBowlerId, setLastBowlerId] = useState<string | undefined>();
  const [outBatsmenIds, setOutBatsmenIds] = useState<string[]>([]);
  const [retiredBatsmenIds, setRetiredBatsmenIds] = useState<string[]>([]);
  const [inningsId, setInningsId] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(true);
  const [tossWinnerId, setTossWinnerId] = useState<string | null>(null);
  const [tossDecision, setTossDecision] = useState<"bat" | "bowl" | null>(null);
  const [tossCompleted, setTossCompleted] = useState(false);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<string | null>(null);
  const [squadCompleted, setSquadCompleted] = useState(false);
  const [team1Squad, setTeam1Squad] = useState<string[]>([]);
  const [team2Squad, setTeam2Squad] = useState<string[]>([]);
  const [showImpactSub, setShowImpactSub] = useState(false);

  const flashTimer = useRef<ReturnType<typeof setTimeout>>();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch match data
  const { data: match } = useQuery({
    queryKey: ["scoring-match", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(id, name, short_name, color), team2:teams!matches_team2_id_fkey(id, name, short_name, color)")
        .eq("id", matchId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Short Chris: solo batting mode, max overs per bowler, 6 = out
  const isShortChris = !!match?.is_short_chris;
  const isSoloBatting = match?.batting_option === 1;
  const maxOversPerBowler = match?.max_overs_per_bowler || null;

  // Fetch innings for this match
  const { data: inningsData = [], refetch: refetchInnings } = useQuery({
    queryKey: ["scoring-innings", matchId],
    queryFn: async () => {
      const { data, error } = await supabase.from("innings").select("*").eq("match_id", matchId).order("innings_number");
      if (error) throw error;
      return data;
    },
  });

  // Current innings (latest in_progress or first)
  const currentInnings = useMemo(() => {
    const inProgress = inningsData.find(i => i.status === "in_progress");
    if (inProgress) return inProgress;
    // If first innings is completed and no second exists, return first
    return inningsData[inningsData.length - 1] || null;
  }, [inningsData]);

  // First innings data (for target calculation)
  const firstInnings = useMemo(() => inningsData.find(i => i.innings_number === 1), [inningsData]);
  const isSecondInnings = currentInnings?.innings_number === 2;
  const target = firstInnings ? firstInnings.total_runs + 1 : null;

  // Set innings ID when we have data
  useEffect(() => {
    if (currentInnings && currentInnings.status === "in_progress" && inningsId !== currentInnings.id) {
      setInningsId(currentInnings.id);
    }
  }, [currentInnings]);

  // Detect if first innings completed and show summary
  useEffect(() => {
    if (firstInnings?.status === "completed" && !inningsData.find(i => i.innings_number === 2) && !showInningsSummary) {
      setShowInningsSummary(true);
    }
  }, [firstInnings, inningsData]);

  // Detect match result
  useEffect(() => {
    const inn2 = inningsData.find(i => i.innings_number === 2);
    if (inn2?.status === "completed") {
      setShowMatchResult(true);
    }
  }, [inningsData]);

  // Auto-detect toss from match data (for resuming)
  useEffect(() => {
    if (match?.toss_winner_id && !tossCompleted) {
      setTossWinnerId(match.toss_winner_id);
      setTossDecision(match.toss_decision as "bat" | "bowl");
      setTossCompleted(true);
      setSquadCompleted(true); // Skip squad selection when resuming
    }
  }, [match]);

  // Determine batting/bowling team based on toss or current innings
  const battingTeamId = currentInnings?.batting_team_id
    || (tossCompleted && tossDecision === "bat" ? tossWinnerId : tossCompleted && tossDecision === "bowl" ? ((match?.team1 as any)?.id === tossWinnerId ? (match?.team2 as any)?.id : (match?.team1 as any)?.id) : (match?.team1 as any)?.id);
  const bowlingTeamId = currentInnings?.bowling_team_id
    || (tossCompleted && tossDecision === "bowl" ? tossWinnerId : tossCompleted && tossDecision === "bat" ? ((match?.team1 as any)?.id === tossWinnerId ? (match?.team2 as any)?.id : (match?.team1 as any)?.id) : (match?.team2 as any)?.id);

  // Fetch ALL players for both teams (for squad selection)
  const team1Id = (match?.team1 as any)?.id;
  const team2Id = (match?.team2 as any)?.id;

  const { data: team1AllPlayers = [] } = useQuery({
    queryKey: ["team-players", team1Id],
    queryFn: async () => {
      if (!team1Id) return [];
      const { data, error } = await supabase.from("team_players").select("player_id, players(id, name, jersey_number, role)").eq("team_id", team1Id);
      if (error) throw error;
      return data?.map((tp: any) => tp.players).filter(Boolean) || [];
    },
    enabled: !!team1Id,
  });

  const { data: team2AllPlayers = [] } = useQuery({
    queryKey: ["team-players", team2Id],
    queryFn: async () => {
      if (!team2Id) return [];
      const { data, error } = await supabase.from("team_players").select("player_id, players(id, name, jersey_number, role)").eq("team_id", team2Id);
      if (error) throw error;
      return data?.map((tp: any) => tp.players).filter(Boolean) || [];
    },
    enabled: !!team2Id,
  });

  // Filter players by squad selection (or use all if squad not used)
  const filterBySquad = (allPlayers: any[], squadIds: string[]) => {
    if (squadIds.length === 0) return allPlayers;
    return allPlayers.filter((p: any) => squadIds.includes(p.id));
  };

  const battingPlayers = battingTeamId === team1Id
    ? filterBySquad(team1AllPlayers, team1Squad)
    : filterBySquad(team2AllPlayers, team2Squad);

  const bowlingPlayers = bowlingTeamId === team1Id
    ? filterBySquad(team1AllPlayers, team1Squad)
    : filterBySquad(team2AllPlayers, team2Squad);

  // Impact substitute: bench players = all team players NOT in squad
  const battingAllPlayers = battingTeamId === team1Id ? team1AllPlayers : team2AllPlayers;
  const bowlingAllPlayers = bowlingTeamId === team1Id ? team1AllPlayers : team2AllPlayers;
  const battingSquadIds = battingTeamId === team1Id ? team1Squad : team2Squad;
  const bowlingSquadIds = bowlingTeamId === team1Id ? team1Squad : team2Squad;
  const battingBenchPlayers = battingSquadIds.length > 0
    ? battingAllPlayers.filter((p: any) => !battingSquadIds.includes(p.id))
    : [];
  const bowlingBenchPlayers = bowlingSquadIds.length > 0
    ? bowlingAllPlayers.filter((p: any) => !bowlingSquadIds.includes(p.id))
    : [];
  const hasBenchPlayers = battingBenchPlayers.length > 0 || bowlingBenchPlayers.length > 0;

  // Determine which team is currently active for substitution (batting team)
  const activeBattingTeamColor = battingTeamId === team1Id
    ? (match?.team1 as any)?.color || "#22c55e"
    : (match?.team2 as any)?.color || "#22c55e";
  const activeBattingTeamName = battingTeamId === team1Id
    ? (match?.team1 as any)?.name || "Team"
    : (match?.team2 as any)?.name || "Team";

  const handleImpactSub = (outPlayerId: string, inPlayerId: string) => {
    const setter = battingTeamId === team1Id ? setTeam1Squad : setTeam2Squad;
    setter((prev: string[]) => prev.map(id => id === outPlayerId ? inPlayerId : id));

    const outPlayer = battingAllPlayers.find((p: any) => p.id === outPlayerId);
    const inPlayer = battingAllPlayers.find((p: any) => p.id === inPlayerId);
    toast.success(`Impact Sub: ${inPlayer?.name || "Player"} replaces ${outPlayer?.name || "Player"}`);

    // If the subbed-out player is current striker/non-striker, update
    if (strikerId === outPlayerId) {
      setStrikerId(inPlayerId);
      setStrikerName(inPlayer?.name || "Batsman");
    }
    if (nonStrikerId === outPlayerId) {
      setNonStrikerId(inPlayerId);
      setNonStrikerName(inPlayer?.name || "Batsman");
    }
  };

  // Fetch balls for current innings
  const { data: balls = [], refetch: refetchBalls } = useQuery({
    queryKey: ["scoring-balls", inningsId || currentInnings?.id],
    queryFn: async () => {
      const id = inningsId || currentInnings?.id;
      if (!id) return [];
      const { data, error } = await supabase
        .from("balls")
        .select("*")
        .eq("innings_id", id)
        .order("over_number")
        .order("ball_number");
      if (error) throw error;
      return data || [];
    },
    enabled: !!(inningsId || currentInnings?.id),
  });

  // Computed stats
  const totalRuns = balls.reduce((sum, b) => sum + b.runs_scored + b.extra_runs, 0);
  const totalWickets = balls.filter(b => b.is_wicket).length;
  const legalBalls = balls.filter(b => !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye").length;
  const overs = Math.floor(legalBalls / 6);
  const ballsInOver = legalBalls % 6;
  const runRate = legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : "0.00";
  const lastBallsList = balls.slice(-6);
  const maxOvers = match?.overs || 20;

  // Compute bowler overs for max_overs_per_bowler enforcement
  const bowlerOversMap = useMemo(() => {
    const map: Record<string, number> = {};
    balls.forEach(b => {
      const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
      if (isLegal) {
        map[b.bowler_id] = (map[b.bowler_id] || 0) + 1;
      }
    });
    // Convert balls to overs (floor)
    const oversMap: Record<string, number> = {};
    Object.entries(map).forEach(([id, legalBalls]) => {
      oversMap[id] = legalBalls / 6;
    });
    return oversMap;
  }, [balls]);

  // Chase stats
  const runsNeeded = target ? target - totalRuns : null;
  const ballsRemaining = target ? (maxOvers * 6) - legalBalls : null;
  const requiredRate = (runsNeeded && ballsRemaining && ballsRemaining > 0)
    ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : null;

  // Extras computed for scoreboard
  const extrasComputed = useMemo(() => ({
    wides: balls.filter(b => b.extra_type === "wide").reduce((s, b) => s + b.extra_runs, 0),
    noBalls: balls.filter(b => b.extra_type === "no-ball").reduce((s, b) => s + b.extra_runs, 0),
    byes: balls.filter(b => b.extra_type === "bye").reduce((s, b) => s + b.extra_runs, 0),
    legByes: balls.filter(b => b.extra_type === "leg-bye").reduce((s, b) => s + b.extra_runs, 0),
  }), [balls]);

  // Team colors for scoreboard
  const battingTeamColor = currentInnings?.batting_team_id === (match?.team1 as any)?.id
    ? (match?.team1 as any)?.color || "#22c55e" : (match?.team2 as any)?.color || "#22c55e";
  const bowlingTeamColor = currentInnings?.bowling_team_id === (match?.team1 as any)?.id
    ? (match?.team1 as any)?.color || "#22c55e" : (match?.team2 as any)?.color || "#22c55e";

  const flash = (msg: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setLastAction(msg);
    flashTimer.current = setTimeout(() => setLastAction(""), 1000);
  };

  // Create innings
  const createInnings = useMutation({
    mutationFn: async (inningsNumber: number) => {
      if (!match) throw new Error("No match");
      const team1Id = (match.team1 as any)?.id;
      const team2Id = (match.team2 as any)?.id;

      let battingId: string;
      let bowlingId: string;

      if (inningsNumber === 1) {
        // Use toss result to determine batting order
        if (tossWinnerId && tossDecision) {
          if (tossDecision === "bat") {
            battingId = tossWinnerId;
            bowlingId = tossWinnerId === team1Id ? team2Id : team1Id;
          } else {
            bowlingId = tossWinnerId;
            battingId = tossWinnerId === team1Id ? team2Id : team1Id;
          }
        } else {
          battingId = team1Id;
          bowlingId = team2Id;
        }
      } else {
        // 2nd innings: swap from 1st innings
        battingId = firstInnings ? firstInnings.bowling_team_id : team2Id;
        bowlingId = firstInnings ? firstInnings.batting_team_id : team1Id;
      }

      const finalBattingId = battingId;
      const finalBowlingId = bowlingId;

      const { data, error } = await supabase.from("innings").insert({
        match_id: matchId,
        batting_team_id: finalBattingId,
        bowling_team_id: finalBowlingId,
        innings_number: inningsNumber,
        status: "in_progress" as const,
      }).select().single();
      if (error) throw error;

      if (inningsNumber === 1) {
        const updateData: any = { status: "live" as const };
        if (tossWinnerId) {
          updateData.toss_winner_id = tossWinnerId;
          updateData.toss_decision = tossDecision;
        }
        await supabase.from("matches").update(updateData).eq("id", matchId);
      }

      setInningsId(data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-innings", matchId] });
      queryClient.invalidateQueries({ queryKey: ["scoring-match", matchId] });
    },
  });

  // End innings mutation
  const endInnings = useMutation({
    mutationFn: async (activeInningsId: string) => {
      const { error } = await supabase.from("innings")
        .update({ status: "completed" as const })
        .eq("id", activeInningsId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchInnings();
      queryClient.invalidateQueries({ queryKey: ["scoring-innings", matchId] });
    },
  });

  // End match mutation
  const endMatch = useMutation({
    mutationFn: async (result: string) => {
      await supabase.from("matches").update({
        status: "completed" as const,
        result,
      }).eq("id", matchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-match", matchId] });
    },
  });

  // Check for innings end conditions
  const checkInningsEnd = useCallback(async (newTotalRuns: number, newTotalWickets: number, newLegalBalls: number) => {
    const activeId = inningsId || currentInnings?.id;
    if (!activeId) return;

    // Use players_per_team from match config, fallback to squad size
    const squadSize = (match as any)?.players_per_team || battingPlayers.length || 11;
    const allOutThreshold = isSoloBatting ? squadSize : Math.max(squadSize - 1, 1);
    const isAllOut = newTotalWickets >= allOutThreshold;
    const isOversComplete = newLegalBalls >= maxOvers * 6;

    // Second innings: check if target reached
    if (isSecondInnings && target && newTotalRuns >= target) {
      await endInnings.mutateAsync(activeId);
      const bat2Team = currentInnings?.batting_team_id === (match?.team1 as any)?.id
        ? (match?.team1 as any) : (match?.team2 as any);
      const ppt = (match as any)?.players_per_team || 11;
      const wicketsLeft = (isSoloBatting ? ppt : ppt - 1) - newTotalWickets;
      await endMatch.mutateAsync(`${bat2Team?.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`);
      return;
    }

    if (isAllOut || isOversComplete) {
      await endInnings.mutateAsync(activeId);

      if (isSecondInnings) {
        // Second innings over — batting team didn't reach target
        const bat1Team = firstInnings?.batting_team_id === (match?.team1 as any)?.id
          ? (match?.team1 as any) : (match?.team2 as any);
        if (newTotalRuns === (firstInnings?.total_runs || 0)) {
          await endMatch.mutateAsync("Match Tied!");
        } else {
          const margin = (firstInnings?.total_runs || 0) - newTotalRuns;
          await endMatch.mutateAsync(`${bat1Team?.name} won by ${margin} run${margin !== 1 ? "s" : ""}`);
        }
      }
      // First innings: the summary screen will show via useEffect
    }
  }, [inningsId, currentInnings, maxOvers, isSecondInnings, target, firstInnings, match, battingPlayers, isSoloBatting]);

  // Save ball mutation
  const saveBall = useMutation({
    mutationFn: async (params: {
      runs: number; extraType?: string; wicketType?: string; isNonStrikerOut?: boolean; wicketFielderId?: string | null;
    }) => {
      const activeInningsId = inningsId || currentInnings?.id;
      if (!activeInningsId || !strikerId || !bowlerId) throw new Error("Missing data");

      // Prevent scoring beyond max overs
      const isExtra = params.extraType === "wide" || params.extraType === "no-ball";
      if (!isExtra && legalBalls >= maxOvers * 6) throw new Error("Overs complete");

      // Prevent bowler from exceeding max overs per bowler
      if (maxOversPerBowler && bowlerId && !isExtra) {
        const currentBowlerBalls = balls.filter(b => b.bowler_id === bowlerId && (!b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye")).length;
        const currentBowlerOvers = Math.floor((currentBowlerBalls + 1) / 6); // +1 for this ball
        if (Math.floor(currentBowlerBalls / 6) >= maxOversPerBowler) {
          throw new Error(`Bowler has completed maximum ${maxOversPerBowler} overs. Please change the bowler.`);
        }
      }
      const extraTypeMap: Record<string, ExtraType> = {
        "wide": "wide", "no-ball": "no-ball", "bye": "bye", "leg-bye": "leg-bye",
      };

      const { data: ball, error } = await supabase.from("balls").insert({
        innings_id: activeInningsId,
        over_number: overs,
        ball_number: isExtra ? ballsInOver : ballsInOver + 1,
        batsman_id: strikerId,
        bowler_id: bowlerId,
        non_striker_id: nonStrikerId,
        runs_scored: isExtra ? 0 : params.runs,
        extra_type: params.extraType ? extraTypeMap[params.extraType.toLowerCase().replace(" ", "-")] : null,
        extra_runs: isExtra ? 1 + params.runs : 0,
        is_wicket: !!params.wicketType,
        wicket_type: params.wicketType || null,
        wicket_batsman_id: params.wicketType ? (params.isNonStrikerOut ? nonStrikerId : strikerId) : null,
        wicket_fielder_id: params.wicketFielderId || null,
      }).select().single();
      if (error) throw error;

      // Compute accurate totals from database (avoids stale state issues)
      const { data: totalsData } = await supabase
        .from("balls")
        .select("runs_scored, extra_runs, extra_type, is_wicket")
        .eq("innings_id", activeInningsId);

      const allBalls = totalsData || [];
      const newTotalRuns = allBalls.reduce((s, b) => s + b.runs_scored + b.extra_runs, 0);
      const newTotalWickets = allBalls.filter(b => b.is_wicket).length;
      const newLegalBalls = allBalls.filter(b => !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye").length;
      const newOversDecimal = parseFloat(`${Math.floor(newLegalBalls / 6)}.${newLegalBalls % 6}`);

      const newExtrasWides = allBalls.filter(b => b.extra_type === "wide").reduce((s, b) => s + b.extra_runs, 0);
      const newExtrasNoBalls = allBalls.filter(b => b.extra_type === "no-ball").reduce((s, b) => s + b.extra_runs, 0);
      const newExtrasByes = allBalls.filter(b => b.extra_type === "bye").reduce((s, b) => s + b.extra_runs, 0);
      const newExtrasLegByes = allBalls.filter(b => b.extra_type === "leg-bye").reduce((s, b) => s + b.extra_runs, 0);

      await supabase.from("innings").update({
        total_runs: newTotalRuns,
        total_wickets: newTotalWickets,
        total_overs: newOversDecimal,
        extras_wides: newExtrasWides,
        extras_no_balls: newExtrasNoBalls,
        extras_byes: newExtrasByes,
        extras_leg_byes: newExtrasLegByes,
      }).eq("id", activeInningsId);

      return { ball, isExtra, runs: params.runs, wicketType: params.wicketType, isNonStrikerOut: params.isNonStrikerOut, newTotalRuns, newTotalWickets, newLegalBalls };
    },
    onSuccess: (result) => {
      refetchBalls();
      queryClient.invalidateQueries({ queryKey: ["scoring-innings", matchId] });
      setShowWicket(false);
      setWideNbRuns(null);

      // Check innings end
      checkInningsEnd(result.newTotalRuns, result.newTotalWickets, result.newLegalBalls);

      if (result.wicketType) {
        flash(`WICKET! ${result.wicketType}`);
        setLastWicketType(result.wicketType);
        const outId = result.isNonStrikerOut ? nonStrikerId! : strikerId!;
        const outName = result.isNonStrikerOut ? nonStrikerName : strikerName;
        setLastWicketBatsman(outName);
        setShowWicketCelebration(true);
        setOutBatsmenIds(prev => [...prev, outId]);

        // Hat-trick detection: check if last 3 balls by this bowler are all wickets
        const bowlerBalls = [...balls, result.ball].filter(
          (b: any) => b.bowler_id === bowlerId && (!b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye")
        );
        if (bowlerBalls.length >= 3) {
          const last3 = bowlerBalls.slice(-3);
          if (last3.every((b: any) => b.is_wicket)) {
            setTimeout(() => setShowHattrick(true), 2600);
          }
        }

        // Only prompt for new batsman if not all out
        const squadSize = (match as any)?.players_per_team || battingPlayers.length || 11;
        const allOutThreshold = isSoloBatting ? squadSize : Math.max(squadSize - 1, 1);
        if (result.newTotalWickets < allOutThreshold) {
          if (result.isNonStrikerOut) setNonStrikerRunOut(true);
          setPendingNewBatsman(true);
          setTimeout(() => setShowBatsmanDialog(true), showHattrick ? 6200 : 2600);
        }
      } else {
        // Rotate strike on odd runs (skip in solo mode)
        if (!isSoloBatting && result.runs % 2 === 1) {
          const tmpId = strikerId;
          const tmpName = strikerName;
          setStrikerId(nonStrikerId);
          setStrikerName(nonStrikerName);
          setNonStrikerId(tmpId);
          setNonStrikerName(tmpName);
        }
        if (result.runs === 6) { flash("SIX! 🔥"); playBoundarySound(true); setBoundaryType("six"); }
        else if (result.runs === 4) { flash("FOUR! 💥"); playBoundarySound(false); setBoundaryType("four"); }
        else if (result.isExtra) flash(`${wideNbRuns || "Extra"}${result.runs > 0 ? ` +${result.runs}` : ""}`);
        else flash(`${result.runs}`);

        // Batsman milestone detection (50 / 100)
        if (!result.isExtra && strikerId) {
          const strikerBallRuns = balls
            .filter((b: any) => b.batsman_id === strikerId)
            .reduce((sum: number, b: any) => sum + b.runs_scored, 0);
          const newTotal = strikerBallRuns + result.runs;
          const oldTotal = strikerBallRuns;

          if (oldTotal < 100 && newTotal >= 100) {
            setTimeout(() => {
              setMilestoneType("century");
              setMilestoneBatsman(strikerName);
              setMilestoneRuns(newTotal);
            }, boundaryType ? 2000 : 300);
          } else if (oldTotal < 50 && newTotal >= 50) {
            setTimeout(() => {
              setMilestoneType("fifty");
              setMilestoneBatsman(strikerName);
              setMilestoneRuns(newTotal);
            }, boundaryType ? 2000 : 300);
          }
        }
      }

      // End of over check
      const newLegal = legalBalls + (result.isExtra ? 0 : 1);
      const squadSize2 = (match as any)?.players_per_team || battingPlayers.length || 11;
      const allOutThreshold2 = isSoloBatting ? squadSize2 : Math.max(squadSize2 - 1, 1);
      const isOversNowComplete = newLegal >= maxOvers * 6;

      // Check if current bowler hit max overs limit after this ball
      if (maxOversPerBowler && bowlerId && !result.isExtra) {
        const bowlerLegalBalls = balls.filter(b => b.bowler_id === bowlerId && (!b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye")).length + 1;
        if (bowlerLegalBalls >= maxOversPerBowler * 6 && bowlerLegalBalls % 6 === 0) {
          toast.warning(`⚠️ ${bowlerName} has completed ${maxOversPerBowler} overs — max limit reached!`, { duration: 4000 });
        }
      }

      if (!result.isExtra && newLegal % 6 === 0 && !result.wicketType && result.newTotalWickets < allOutThreshold2 && !isOversNowComplete) {
        // Rotate strike at end of over (skip in solo mode)
        if (!isSoloBatting) {
          const tmpId = strikerId;
          const tmpName = strikerName;
          setStrikerId(nonStrikerId);
          setStrikerName(nonStrikerName);
          setNonStrikerId(tmpId);
          setNonStrikerName(tmpName);
        }
        setTimeout(() => {
          setLastBowlerId(bowlerId!);
          setIsEndOfOver(true);
          setShowBowlerDialog(true);
        }, 800);
      }

      requestAnimationFrame(() => {
        timelineRef.current?.scrollTo({ left: timelineRef.current.scrollWidth, behavior: "smooth" });
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const needsFielder = (wicketType?: string) => 
    wicketType && ["Caught", "Run Out", "Stumped"].includes(wicketType);

  const addBall = useCallback((runs: number, extra?: string, wicket?: string, isNonStrikerOut?: boolean, wicketFielderId?: string | null) => {
    // Prevent rapid duplicate submissions
    if (saveBall.isPending) return;
    // Short Chris rule: hitting a 6 means batsman is out
    if (isShortChris && runs === 6 && !extra && !wicket) {
      wicket = "Hit Wicket";
    }
    if (needsFielder(wicket) && !wicketFielderId) {
      setPendingWicket({ wicketType: wicket!, isNonStrikerOut, runs, extraType: extra });
      setShowFielderSelect(true);
      setShowWicket(false);
      setLongPressRun(null);
      return;
    }
    saveBall.mutate({ runs, extraType: extra, wicketType: wicket, isNonStrikerOut, wicketFielderId });
  }, [saveBall, isShortChris]);

  const handleFielderSelected = useCallback((fielderId: string) => {
    if (pendingWicket) {
      saveBall.mutate({
        runs: pendingWicket.runs,
        extraType: pendingWicket.extraType,
        wicketType: pendingWicket.wicketType,
        isNonStrikerOut: pendingWicket.isNonStrikerOut,
        wicketFielderId: fielderId,
      });
      setPendingWicket(null);
      setShowFielderSelect(false);
    }
  }, [pendingWicket, saveBall]);

  const handleSkipFielder = useCallback(() => {
    if (pendingWicket) {
      saveBall.mutate({
        runs: pendingWicket.runs,
        extraType: pendingWicket.extraType,
        wicketType: pendingWicket.wicketType,
        isNonStrikerOut: pendingWicket.isNonStrikerOut,
        wicketFielderId: null,
      });
      setPendingWicket(null);
      setShowFielderSelect(false);
    }
  }, [pendingWicket, saveBall]);

  const swapStrike = () => {
    const tmpId = strikerId;
    const tmpName = strikerName;
    setStrikerId(nonStrikerId);
    setStrikerName(nonStrikerName);
    setNonStrikerId(tmpId);
    setNonStrikerName(tmpName);
    flash("⇄ Strike swapped");
  };

  const handleNewBatsman = (playerId: string, name: string) => {
    if (nonStrikerRunOut) {
      setNonStrikerId(playerId);
      setNonStrikerName(name);
    } else {
      setStrikerId(playerId);
      setStrikerName(name);
    }
    setPendingNewBatsman(false);
    setNonStrikerRunOut(false);
  };

  const handleRetireHurt = (isStriker: boolean) => {
    const retiredId = isStriker ? strikerId : nonStrikerId;
    if (retiredId) {
      setRetiredBatsmenIds(prev => [...prev, retiredId]);
      flash("RETIRED HURT");
    }
    // Clear the retired batsman and prompt for replacement
    if (isStriker) {
      setStrikerId(null);
      setStrikerName("");
    } else {
      setNonStrikerId(null);
      setNonStrikerName("");
    }
    setPendingNewBatsman(true);
    setTimeout(() => setShowBatsmanDialog(true), 300);
  };

  const undoLast = useCallback(async () => {
    if (balls.length === 0) return;
    const lastBall = balls[balls.length - 1];
    const { error } = await supabase.from("balls").delete().eq("id", lastBall.id);
    if (error) { toast.error("Failed to undo"); return; }

    // If the undone ball was a wicket, restore the dismissed batsman to available list
    if (lastBall.is_wicket) {
      const restoredId = lastBall.wicket_batsman_id || lastBall.batsman_id;
      if (restoredId) {
        setOutBatsmenIds(prev => prev.filter(id => id !== restoredId));
      }
    }

    const id = inningsId || currentInnings?.id;
    if (id) {
      // Recompute from DB to avoid stale state
      const { data: remainingBalls } = await supabase
        .from("balls")
        .select("runs_scored, extra_runs, extra_type, is_wicket")
        .eq("innings_id", id);
      const rem = remainingBalls || [];
      const newRuns = rem.reduce((s, b) => s + b.runs_scored + b.extra_runs, 0);
      const newWickets = rem.filter(b => b.is_wicket).length;
      const newLegal = rem.filter(b => !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye").length;
      await supabase.from("innings").update({
        total_runs: newRuns,
        total_wickets: newWickets,
        total_overs: parseFloat(`${Math.floor(newLegal / 6)}.${newLegal % 6}`),
        extras_wides: rem.filter(b => b.extra_type === "wide").reduce((s, b) => s + b.extra_runs, 0),
        extras_no_balls: rem.filter(b => b.extra_type === "no-ball").reduce((s, b) => s + b.extra_runs, 0),
        extras_byes: rem.filter(b => b.extra_type === "bye").reduce((s, b) => s + b.extra_runs, 0),
        extras_leg_byes: rem.filter(b => b.extra_type === "leg-bye").reduce((s, b) => s + b.extra_runs, 0),
      }).eq("id", id);
    }
    refetchBalls();
    queryClient.invalidateQueries({ queryKey: ["scoring-innings", matchId] });
    flash("↩ Undo");
  }, [balls, inningsId, currentInnings, matchId]);

  const handleExtra = (type: "Wide" | "No Ball") => {
    if (wideNbRuns === type) addBall(0, type);
    else { setWideNbRuns(type); setShowWicket(false); }
  };

  const handlePanEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x < -80 && Math.abs(info.offset.y) < 60) undoLast();
    setSwipeHint(false);
  }, [undoLast]);

  const handlePan = useCallback((_: any, info: PanInfo) => {
    setSwipeHint(info.offset.x < -40 && Math.abs(info.offset.y) < 60);
  }, []);

  const handleLongPressRun = useCallback((runs: number) => {
    setLongPressRun(runs);
    setShowWicket(false);
    setWideNbRuns(null);
  }, []);

  const handleRunWithWicket = useCallback((wicketType: string, isNonStrikerOut?: boolean) => {
    if (longPressRun !== null) {
      addBall(longPressRun, undefined, wicketType, isNonStrikerOut);
      setLongPressRun(null);
    }
  }, [longPressRun, addBall]);

  const handleStartSecondInnings = async () => {
    setShowInningsSummary(false);
    // Reset player state
    setStrikerId(null); setStrikerName("");
    setNonStrikerId(null); setNonStrikerName("");
    setBowlerId(null); setBowlerName("");
    setLastBowlerId(undefined);
    setOutBatsmenIds([]);
    setRetiredBatsmenIds([]);
    setNonStrikerRunOut(false);
    setInningsId(null);
    setNeedsSetup(true);
    await createInnings.mutateAsync(2);
    setNeedsSetup(true); // Re-trigger setup for 2nd innings
  };

  // ============ MATCH RESULT SCREEN ============
  if (showMatchResult) {
    return <MatchResult match={match} inningsData={inningsData} onBack={onBack} />;
  }

  // ============ INNINGS SUMMARY SCREEN ============
  if (showInningsSummary && firstInnings?.status === "completed" && !inningsData.find(i => i.innings_number === 2)) {
    return <InningsSummary match={match} innings={firstInnings} onStartSecondInnings={handleStartSecondInnings} />;
  }

  // ============ TOSS SCREEN ============

  const playCoinSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Metallic "clink" sound
      const playTone = (freq: number, start: number, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      // Series of metallic bounces getting faster
      playTone(2800, 0, 0.12, 0.3);
      playTone(3200, 0.05, 0.08, 0.2);
      playTone(2400, 0.15, 0.1, 0.25);
      playTone(3000, 0.18, 0.06, 0.15);
      playTone(2600, 0.28, 0.08, 0.2);
      playTone(3400, 0.30, 0.05, 0.1);
      // Final settle
      playTone(2200, 0.38, 0.15, 0.3);
      playTone(2800, 0.40, 0.1, 0.15);
    } catch {}
  };

  const handleFlipCoin = () => {
    setCoinFlipping(true);
    setCoinResult(null);
    setTimeout(() => {
      setCoinFlipping(false);
      playCoinSound();
      // Randomly pick a team as toss winner
      const team1Id = (match?.team1 as any)?.id;
      const team2Id = (match?.team2 as any)?.id;
      const winnerId = Math.random() < 0.5 ? team1Id : team2Id;
      setTossWinnerId(winnerId);
      setCoinResult("done");
    }, 1800);
  };

  if (needsSetup && inningsData.length === 0 && !tossCompleted && (!currentInnings || currentInnings.status !== "in_progress")) {
    const team1 = match?.team1 as any;
    const team2 = match?.team2 as any;

    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto space-y-5 py-8">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            {/* Coin Animation */}
            <div className="relative mx-auto mb-4" style={{ perspective: "600px", width: 80, height: 80 }}>
              <motion.div
                animate={coinFlipping ? {
                  rotateY: [0, 1800],
                  y: [0, -60, -80, -60, 0, -30, -40, -30, 0],
                } : coinResult ? { rotateY: 0, scale: [1.1, 1] } : {}}
                transition={coinFlipping ? {
                  rotateY: { duration: 1.8, ease: "easeOut" },
                  y: { duration: 1.8, ease: "easeOut" },
                } : { duration: 0.3 }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-20 h-20 mx-auto relative"
              >
                {/* Front face */}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{
                    backfaceVisibility: "hidden",
                    background: "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.7) 100%)",
                    boxShadow: "0 4px 20px hsl(var(--accent) / 0.3), inset 0 2px 4px rgba(255,255,255,0.3)",
                  }}
                >
                  <Coins className="h-8 w-8 text-accent-foreground drop-shadow-md" />
                </div>
                {/* Back face */}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)",
                    boxShadow: "0 4px 20px hsl(var(--primary) / 0.3), inset 0 2px 4px rgba(255,255,255,0.3)",
                  }}
                >
                  <Trophy className="h-7 w-7 text-primary-foreground drop-shadow-md" />
                </div>
              </motion.div>
              {/* Shadow */}
              <motion.div
                animate={coinFlipping ? {
                  scaleX: [1, 0.6, 0.5, 0.6, 1, 0.7, 0.6, 0.7, 1],
                  opacity: [0.15, 0.08, 0.06, 0.08, 0.15, 0.1, 0.08, 0.1, 0.15],
                } : {}}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="mx-auto mt-2 h-2 w-14 rounded-full bg-foreground/15 blur-sm"
              />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Toss</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {team1?.name} vs {team2?.name}
            </p>
          </motion.div>

          {/* Flip button — shown before toss */}
          {!tossWinnerId && !coinFlipping && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <button
                onClick={handleFlipCoin}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-bold text-sm active:scale-[0.95] transition-transform shadow-lg shadow-accent/20 hover:shadow-accent/30"
              >
                🪙 Flip the Coin
              </button>
            </motion.div>
          )}

          {/* Flipping state */}
          {coinFlipping && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center text-sm font-semibold text-accent"
            >
              Flipping...
            </motion.p>
          )}

          {/* After flip — show winner + decision */}
          {tossWinnerId && !tossDecision && coinResult && !coinFlipping && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
              <div className="rounded-2xl border border-accent/25 bg-accent/8 p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">🎉 Toss Won By</p>
                <div className="h-14 w-14 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: ((tossWinnerId === team1?.id ? team1 : team2)?.color || "#22c55e") + "20",
                    color: (tossWinnerId === team1?.id ? team1 : team2)?.color || "#22c55e",
                  }}>
                  {(tossWinnerId === team1?.id ? team1 : team2)?.short_name}
                </div>
                <p className="text-base font-display font-bold text-foreground">
                  {(tossWinnerId === team1?.id ? team1 : team2)?.name}
                </p>
              </div>

              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Elected to…</p>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTossDecision("bat")}
                  className="rounded-2xl border border-border bg-card p-5 text-center hover:border-primary/30 transition-all"
                >
                  <Swords className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-bold text-foreground">Bat First</p>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTossDecision("bowl")}
                  className="rounded-2xl border border-border bg-card p-5 text-center hover:border-accent/30 transition-all"
                >
                  <Target className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-sm font-bold text-foreground">Bowl First</p>
                </motion.button>
              </div>
              <button
                onClick={() => { setTossWinnerId(null); setCoinResult(null); }}
                className="w-full text-[10px] text-muted-foreground py-1 hover:text-foreground transition-colors"
              >
                🪙 Flip again
              </button>
            </motion.div>
          )}



          {tossWinnerId && tossDecision && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Toss Result</p>
                <p className="text-sm font-bold text-foreground">
                  {tossWinnerId === team1?.id ? team1?.name : team2?.name} won the toss and elected to{" "}
                  <span className="text-primary">{tossDecision === "bat" ? "bat" : "bowl"} first</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setTossWinnerId(null); setTossDecision(null); setCoinResult(null); }}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Redo Toss
                </button>
                <button
                  onClick={() => setTossCompleted(true)}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform"
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    );
  }
  // ============ SQUAD SELECTION SCREEN ============
  if (tossCompleted && !squadCompleted && inningsData.length === 0) {
    return <SquadSelection match={match} team1AllPlayers={team1AllPlayers} team2AllPlayers={team2AllPlayers} team1Squad={team1Squad} team2Squad={team2Squad} setTeam1Squad={setTeam1Squad} setTeam2Squad={setTeam2Squad} onComplete={() => setSquadCompleted(true)} />;
  }

  // ============ SETUP: create innings and pick openers ============
  if (needsSetup && (!currentInnings || currentInnings.status === "yet_to_bat" || currentInnings.status === "completed") && !inningsData.find(i => i.status === "in_progress")) {
    if (inningsData.length === 0) {
      // Need to create first innings + pick openers
      const battingTeamName = tossDecision === "bat"
        ? (tossWinnerId === (match?.team1 as any)?.id ? (match?.team1 as any)?.name : (match?.team2 as any)?.name)
        : (tossWinnerId === (match?.team1 as any)?.id ? (match?.team2 as any)?.name : (match?.team1 as any)?.name);
      return (
        <DashboardLayout>
          <div className="max-w-md mx-auto space-y-5 py-8">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Setup Innings</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {battingTeamName || (match?.team1 as any)?.name} batting first
              </p>
            </motion.div>

            {!strikerId && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Opening Striker</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {battingPlayers.map((p: any) => (
                    <button key={p.id} onClick={() => { setStrikerId(p.id); setStrikerName(p.name); }}
                      className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold px-4 flex items-center gap-3 active:scale-[0.97] transition-transform">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {p.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </div>
                      {p.name}
                      {p.jersey_number !== null && <span className="ml-auto text-muted-foreground text-[10px] font-mono">#{p.jersey_number}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {strikerId && !nonStrikerId && !isSoloBatting && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Non-Striker</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {battingPlayers.filter((p: any) => p.id !== strikerId).map((p: any) => (
                    <button key={p.id} onClick={() => { setNonStrikerId(p.id); setNonStrikerName(p.name); }}
                      className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold px-4 flex items-center gap-3 active:scale-[0.97] transition-transform">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {p.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </div>
                      {p.name}
                      {p.jersey_number !== null && <span className="ml-auto text-muted-foreground text-[10px] font-mono">#{p.jersey_number}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {strikerId && (nonStrikerId || isSoloBatting) && !bowlerId && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Opening Bowler</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {bowlingPlayers.map((p: any) => (
                    <button key={p.id} onClick={() => { setBowlerId(p.id); setBowlerName(p.name); }}
                      className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold px-4 flex items-center gap-3 active:scale-[0.97] transition-transform">
                      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                        {p.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </div>
                      {p.name}
                      <span className="ml-auto text-[10px] text-muted-foreground capitalize">{p.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {strikerId && (nonStrikerId || isSoloBatting) && bowlerId && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={async () => {
                  await createInnings.mutateAsync(1);
                  setNeedsSetup(false);
                }}
                disabled={createInnings.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                {createInnings.isPending ? "Starting..." : "Start Innings →"}
              </motion.button>
            )}
          </div>
        </DashboardLayout>
      );
    }
  }

  // If innings exists but we haven't set up players locally, prompt for them
  if (needsSetup && currentInnings && currentInnings.status === "in_progress" && (!strikerId || (!nonStrikerId && !isSoloBatting) || !bowlerId)) {
    // Auto-advance past setup if we have ball data already
    if (balls.length > 0) {
      const lastBall = balls[balls.length - 1];
      if (!strikerId && lastBall) {
        setStrikerId(lastBall.batsman_id);
        const p = battingPlayers.find((p: any) => p.id === lastBall.batsman_id);
        setStrikerName(p?.name || "Batsman");
      }
      if (!nonStrikerId && lastBall?.non_striker_id) {
        setNonStrikerId(lastBall.non_striker_id);
        const p = battingPlayers.find((p: any) => p.id === lastBall.non_striker_id);
        setNonStrikerName(p?.name || "Non-striker");
      }
      if (!bowlerId && lastBall) {
        setBowlerId(lastBall.bowler_id);
        const p = bowlingPlayers.find((p: any) => p.id === lastBall.bowler_id);
        setBowlerName(p?.name || "Bowler");
      }
      setNeedsSetup(false);
    }
    // If still no players set, show the setup screen for an existing innings
    if (!strikerId || (!nonStrikerId && !isSoloBatting) || !bowlerId) {
      const inningsLabel = currentInnings.innings_number === 2 ? "2nd" : "1st";
      return (
        <DashboardLayout>
          <div className="max-w-md mx-auto space-y-5 py-8">
            <h1 className="text-xl font-display font-bold text-foreground">
              {currentInnings.innings_number === 2 ? "2nd Innings Setup" : "Resume Scoring"}
            </h1>
            <p className="text-xs text-muted-foreground">Select the current batsmen and bowler to continue</p>
            {isSecondInnings && target && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-center">
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Target: {target}</span>
              </div>
            )}
            {!strikerId && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Striker</p>
                {battingPlayers.map((p: any) => (
                  <button key={p.id} onClick={() => { setStrikerId(p.id); setStrikerName(p.name); }}
                    className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold px-4 flex items-center gap-3 active:scale-[0.97]">
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {strikerId && !nonStrikerId && !isSoloBatting && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Non-Striker</p>
                {battingPlayers.filter((p: any) => p.id !== strikerId).map((p: any) => (
                  <button key={p.id} onClick={() => { setNonStrikerId(p.id); setNonStrikerName(p.name); setNeedsSetup(false); }}
                    className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold px-4 flex items-center gap-3 active:scale-[0.97]">
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {strikerId && (nonStrikerId || isSoloBatting) && !bowlerId && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Bowler</p>
                {bowlingPlayers.map((p: any) => (
                  <button key={p.id} onClick={() => { setBowlerId(p.id); setBowlerName(p.name); setNeedsSetup(false); }}
                    className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold px-4 flex items-center gap-3 active:scale-[0.97]">
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DashboardLayout>
      );
    }
  }

  const battingTeamName = currentInnings?.batting_team_id === (match?.team1 as any)?.id
    ? (match?.team1 as any)?.name : (match?.team2 as any)?.name;
  const bowlingTeamName = currentInnings?.bowling_team_id === (match?.team1 as any)?.id
    ? (match?.team1 as any)?.name : (match?.team2 as any)?.name;




  return (
    <DashboardLayout>
      <WicketCelebration
        show={showWicketCelebration}
        wicketType={lastWicketType}
        batsmanName={lastWicketBatsman}
        onComplete={() => setShowWicketCelebration(false)}
      />
      <BoundaryCelebration type={boundaryType} onComplete={() => setBoundaryType(null)} />
      <HattrickCelebration show={showHattrick} bowlerName={bowlerName} onComplete={() => setShowHattrick(false)} />
      <MilestoneCelebration type={milestoneType} batsmanName={milestoneBatsman} runs={milestoneRuns} onComplete={() => setMilestoneType(null)} />
      <LiveScoreboardDialog
        open={showScoreboard}
        onOpenChange={setShowScoreboard}
        balls={balls as any}
        battingPlayers={battingPlayers}
        bowlingPlayers={bowlingPlayers}
        battingTeamName={battingTeamName}
        bowlingTeamName={bowlingTeamName}
        battingTeamColor={battingTeamColor}
        bowlingTeamColor={bowlingTeamColor}
        totalRuns={totalRuns}
        totalWickets={totalWickets}
        overs={overs}
        ballsInOver={ballsInOver}
        extras={extrasComputed}
        inningsLabel={isSecondInnings ? "2nd Innings" : "1st Innings"}
      />
      <div className="max-w-md mx-auto flex flex-col gap-1" style={{ height: "calc(100dvh - 7.5rem)" }}>
        {/* Score strip */}
        <div className="rounded-xl border border-primary/15 bg-card px-3 py-2 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-end mb-1">
            <button
              onClick={() => setShowScoreboard(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider hover:bg-primary/20 active:scale-95 transition-all"
            >
              <BarChart3 className="h-3 w-3" /> Scoreboard
            </button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/4 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Radio className="h-2.5 w-2.5 text-destructive animate-pulse-glow" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-destructive">Live</span>
                  <span className="text-[9px] text-muted-foreground font-mono ml-1">
                    {isSecondInnings ? "2nd" : "1st"} Inn
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono">RR {runRate}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{battingTeamName} vs {bowlingTeamName}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-display font-black text-foreground tracking-tighter leading-none">{totalRuns}</span>
                  <span className="text-lg font-display font-bold text-muted-foreground leading-none">/{totalWickets}</span>
                  <span className="text-[11px] font-mono text-muted-foreground ml-1">({overs}.{ballsInOver})</span>
                </div>
              </div>
            </div>

            {/* Target bar for 2nd innings */}
            {isSecondInnings && target && (
              <div className="mt-1.5 pt-1.5 border-t border-border/30">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-accent" />
                    <span className="font-bold text-accent">Need {runsNeeded! > 0 ? runsNeeded : 0}</span>
                    <span className="text-muted-foreground">from {ballsRemaining} balls</span>
                  </div>
                  {requiredRate && (
                    <span className="text-muted-foreground font-mono">RRR {requiredRate}</span>
                  )}
                </div>
              </div>
            )}

            {/* First innings score reference during 2nd innings */}
            {isSecondInnings && firstInnings && (
              <div className="mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <span>1st Inn:</span>
                <span className="font-bold text-foreground/70">{firstInnings.total_runs}/{firstInnings.total_wickets}</span>
                <span>({firstInnings.total_overs} ov)</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-1.5">
              <button onClick={() => setShowBatsmanDialog(true)} className="text-[10px] bg-muted/40 rounded px-1.5 py-0.5 text-foreground font-medium truncate active:bg-muted/60 transition-colors">
                🏏 {strikerName}*
              </button>
              <button onClick={() => setShowBowlerDialog(true)} className="text-[10px] bg-muted/40 rounded px-1.5 py-0.5 text-foreground font-medium truncate active:bg-muted/60 transition-colors">
                ⚾ {bowlerName}
              </button>
              {!isSoloBatting && (
                <button onClick={swapStrike} className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform shrink-0">
                  <ArrowLeftRight className="h-2.5 w-2.5" />
                </button>
              )}
              <div className="ml-auto flex gap-0.5 shrink-0">
                {lastBallsList.map((ball, i) => {
                  const isW = ball.is_wicket;
                  const isE = !!ball.extra_type;
                  return (
                    <div key={i} className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isW ? "bg-destructive/20 text-destructive" : isE ? "bg-warning/20 text-warning"
                      : ball.runs_scored >= 4 ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                    }`}>
                      {isW ? "W" : isE ? ball.extra_type?.[0]?.toUpperCase() : ball.runs_scored}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Flash */}
        <AnimatePresence>
          {lastAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className={`text-center py-0.5 sm:py-1 rounded-lg font-display font-black text-base sm:text-lg shrink-0 ${
                lastAction.includes("WICKET") ? "bg-destructive/20 text-destructive"
                : lastAction.includes("SIX") ? "bg-primary/20 text-primary"
                : lastAction.includes("FOUR") ? "bg-accent/20 text-accent"
                : "bg-card text-foreground"
              }`}
            >{lastAction}</motion.div>
          )}
        </AnimatePresence>

        {/* SCORING PAD */}
        <motion.div
          className="flex-1 flex flex-col gap-1 min-h-0 relative overflow-hidden"
          onPan={handlePan}
          onPanEnd={handlePanEnd}
        >
          <AnimatePresence>
            {swipeHint && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="bg-destructive/20 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-bold text-destructive">Release to Undo</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-4 gap-1 flex-1">
            {[0, 1, 2, 3].map((run) => (
              <RunButton key={run} run={run}
                onTap={() => wideNbRuns ? addBall(run, wideNbRuns) : addBall(run)}
                onLongPress={() => handleLongPressRun(run)}
                variant={wideNbRuns ? "wide" : "default"}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1 flex-1">
            <RunButton run={4} onTap={() => wideNbRuns ? addBall(4, wideNbRuns) : addBall(4)} onLongPress={() => handleLongPressRun(4)} variant="accent" />
            <RunButton run={6} onTap={() => wideNbRuns ? addBall(6, wideNbRuns) : addBall(6)} onLongPress={() => handleLongPressRun(6)} variant="primary" />
          </div>

          <div className="grid grid-cols-4 gap-1 shrink-0">
            <button onClick={() => handleExtra("Wide")}
              className={`h-8 sm:h-9 md:h-10 rounded-xl font-bold text-[10px] sm:text-[11px] select-none touch-manipulation active:scale-[0.92] transition-all flex items-center justify-center ${
                wideNbRuns === "Wide" ? "bg-warning text-warning-foreground ring-2 ring-warning/50" : "bg-warning/10 text-warning border border-warning/20"
              }`}>WD</button>
            <button onClick={() => handleExtra("No Ball")}
              className={`h-8 sm:h-9 md:h-10 rounded-xl font-bold text-[10px] sm:text-[11px] select-none touch-manipulation active:scale-[0.92] transition-all flex items-center justify-center ${
                wideNbRuns === "No Ball" ? "bg-warning text-warning-foreground ring-2 ring-warning/50" : "bg-warning/10 text-warning border border-warning/20"
              }`}>NB</button>
            <button onClick={() => addBall(0, "Bye")}
              className="h-8 sm:h-9 md:h-10 rounded-xl font-bold text-[10px] sm:text-[11px] bg-muted/60 text-muted-foreground select-none touch-manipulation active:scale-[0.92] transition-transform">BYE</button>
            <button onClick={() => addBall(0, "Leg Bye")}
              className="h-8 sm:h-9 md:h-10 rounded-xl font-bold text-[10px] sm:text-[11px] bg-muted/60 text-muted-foreground select-none touch-manipulation active:scale-[0.92] transition-transform">LB</button>
          </div>

          <AnimatePresence>
            {wideNbRuns && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 24 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden shrink-0">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-warning font-medium">{wideNbRuns} + runs — tap above</span>
                  <button onClick={() => setWideNbRuns(null)}><X className="h-3 w-3 text-muted-foreground" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-6 gap-1 shrink-0">
            <button
              onClick={() => { setShowWicket(!showWicket); setWideNbRuns(null); setLongPressRun(null); }}
              className={`col-span-3 h-8 sm:h-9 md:h-10 rounded-xl font-bold text-[10px] sm:text-[11px] select-none touch-manipulation active:scale-[0.95] transition-all flex items-center justify-center gap-1 ${
                showWicket ? "bg-destructive text-destructive-foreground" : "bg-destructive/12 text-destructive border border-destructive/25"
              }`}
            ><AlertTriangle className="h-3 w-3" />WICKET</button>
            <RunButton run={5} onTap={() => addBall(5)} onLongPress={() => handleLongPressRun(5)} variant="default" className="col-span-2 h-8 sm:h-9 md:h-10 text-base" />
            <button onClick={undoLast}
              className="h-8 sm:h-9 md:h-10 rounded-xl bg-muted/40 text-muted-foreground select-none touch-manipulation active:scale-[0.92] transition-transform flex items-center justify-center">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Wicket drawer */}
        <AnimatePresence>
          {(showWicket || longPressRun !== null) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden shrink-0">
              <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-2 space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[9px] font-bold text-destructive uppercase tracking-widest">
                    {longPressRun !== null ? `${longPressRun} runs + Wicket` : "Wicket Type"}
                  </span>
                  <button onClick={() => { setShowWicket(false); setLongPressRun(null); }}><X className="h-3 w-3 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {wicketTypes.map((type) => (
                    <button key={type} onClick={() => longPressRun !== null ? handleRunWithWicket(type) : addBall(0, undefined, type)}
                      className="h-10 rounded-lg bg-destructive/12 text-destructive text-[11px] font-bold active:bg-destructive/25 select-none touch-manipulation border border-destructive/15"
                    >{type}</button>
                  ))}
                  {runOutOptions
                    .filter(ro => !isSoloBatting || !ro.isNonStrikerOut)
                    .map((ro) => (
                    <button key={ro.label} onClick={() => longPressRun !== null ? handleRunWithWicket("Run Out", ro.isNonStrikerOut) : addBall(0, undefined, "Run Out", ro.isNonStrikerOut)}
                      className="h-10 rounded-lg bg-destructive/12 text-destructive text-[11px] font-bold active:bg-destructive/25 select-none touch-manipulation border border-destructive/15"
                    >{ro.label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline + Declare */}
        <div className="flex gap-1 shrink-0">
          <div className="flex-1 min-w-0 rounded-lg border border-border/40 bg-card/50 px-1.5 py-1 sm:px-2 sm:py-1.5">
            <div ref={timelineRef} className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {balls.map((ball, i) => {
                const isW = ball.is_wicket;
                const isE = !!ball.extra_type;
                return (
                  <div key={ball.id} className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-bold shrink-0 ${
                    isW ? "bg-destructive/20 text-destructive" : isE ? "bg-warning/20 text-warning"
                    : ball.runs_scored >= 4 ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"
                  }`}>{isW ? "W" : isE ? ball.extra_type?.[0]?.toUpperCase() : ball.runs_scored}</div>
                );
              })}
            </div>
          </div>
          {hasBenchPlayers && (
            <button
              onClick={() => setShowImpactSub(true)}
              className="h-7 sm:h-9 px-2 sm:px-3 rounded-lg bg-info/10 text-info border border-info/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 active:scale-[0.95] transition-transform shrink-0"
            >
              <UserRoundPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />Sub
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="h-7 sm:h-9 px-2 sm:px-3 rounded-lg bg-warning/10 text-warning border border-warning/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 active:scale-[0.95] transition-transform shrink-0">
                <Flag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />End
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Declare / End Innings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end the current innings at {totalRuns}/{totalWickets} ({overs}.{ballsInOver} overs). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-warning text-warning-foreground hover:bg-warning/90"
                  onClick={async () => {
                    const activeId = inningsId || currentInnings?.id;
                    if (!activeId) return;
                    await endInnings.mutateAsync(activeId);
                    if (isSecondInnings) {
                      const bat1Team = firstInnings?.batting_team_id === (match?.team1 as any)?.id
                        ? (match?.team1 as any) : (match?.team2 as any);
                      if (totalRuns >= (firstInnings?.total_runs || 0) + 1) {
                        const bat2Team = currentInnings?.batting_team_id === (match?.team1 as any)?.id
                          ? (match?.team1 as any) : (match?.team2 as any);
                        const wicketsLeft = 10 - totalWickets;
                        await endMatch.mutateAsync(`${bat2Team?.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`);
                      } else if (totalRuns === (firstInnings?.total_runs || 0)) {
                        await endMatch.mutateAsync("Match Tied!");
                      } else {
                        const margin = (firstInnings?.total_runs || 0) - totalRuns;
                        await endMatch.mutateAsync(`${bat1Team?.name} won by ${margin} run${margin !== 1 ? "s" : ""}`);
                      }
                    }
                    toast.success("Innings ended");
                  }}
                >
                  End Innings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <BatsmanSelectDialog
        open={showBatsmanDialog}
        onOpenChange={setShowBatsmanDialog}
        striker={strikerName}
        nonStriker={nonStrikerName}
        onSwapStrike={swapStrike}
        onSelectBatsman={handleNewBatsman}
        players={battingPlayers}
        outBatsmenIds={outBatsmenIds}
        retiredBatsmenIds={retiredBatsmenIds}
        currentBatsmenIds={[strikerId, nonStrikerId].filter(Boolean) as string[]}
        isWicketPrompt={pendingNewBatsman}
        onRetireHurt={handleRetireHurt}
      />

      <BowlerSelectDialog
        open={showBowlerDialog}
        onOpenChange={(open) => { setShowBowlerDialog(open); if (!open) setIsEndOfOver(false); }}
        currentBowler={bowlerName}
        onSelectBowler={(id, name) => { setBowlerId(id); setBowlerName(name); setIsEndOfOver(false); }}
        players={bowlingPlayers}
        lastBowlerId={lastBowlerId}
        isEndOfOver={isEndOfOver}
        overNumber={overs}
        maxOversPerBowler={maxOversPerBowler}
        bowlerOversMap={bowlerOversMap}
      />

      <ImpactSubDialog
        open={showImpactSub}
        onOpenChange={setShowImpactSub}
        squadPlayers={battingPlayers}
        benchPlayers={battingBenchPlayers}
        teamColor={activeBattingTeamColor}
        teamName={activeBattingTeamName}
        onSubstitute={handleImpactSub}
        disabledPlayerIds={[strikerId, nonStrikerId].filter(Boolean) as string[]}
      />

      {/* Fielder Select Dialog */}
      <Dialog open={showFielderSelect} onOpenChange={(open) => { if (!open) { setShowFielderSelect(false); setPendingWicket(null); } }}>
        <DialogContent className="max-w-sm bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="px-4 pt-4 pb-2 relative">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-warning/8 to-transparent" />
            <DialogHeader className="relative">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
                  <span className="text-sm">🧤</span>
                </div>
                <div>
                  <DialogTitle className="font-display text-base">Select Fielder</DialogTitle>
                  <p className="text-[10px] text-warning font-medium mt-0.5">
                    {pendingWicket?.wicketType} — who took the catch/effected the dismissal?
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="px-4 pb-4 space-y-2">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                id="fielder-search"
                placeholder="Search fielders..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                onChange={(e) => {
                  const el = document.getElementById("fielder-list");
                  if (el) el.dataset.search = e.target.value.toLowerCase();
                  // force re-render by toggling attribute
                  el?.querySelectorAll("[data-player-name]").forEach((item) => {
                    const name = (item as HTMLElement).dataset.playerName || "";
                    (item as HTMLElement).style.display = name.includes(e.target.value.toLowerCase()) ? "" : "none";
                  });
                }}
              />
            </div>
            <div id="fielder-list" className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
              {bowlingPlayers.map((p: any) => (
                <button
                  key={p.id}
                  data-player-name={p.name.toLowerCase()}
                  onClick={() => handleFielderSelected(p.id)}
                  className="h-11 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold active:scale-[0.97] transition-transform px-3 flex items-center gap-3 group"
                >
                  <div className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-warning">{p.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}</span>
                  </div>
                  <span className="truncate flex-1 text-left">{p.name}</span>
                  {p.jersey_number !== null && <span className="text-muted-foreground font-mono text-[10px]">#{p.jersey_number}</span>}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
            <button
              onClick={handleSkipFielder}
              className="w-full py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Skip — No fielder
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ============ ROOT COMPONENT ============
const LiveScoring = () => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  if (!selectedMatchId) {
    return <MatchSelector onSelect={setSelectedMatchId} />;
  }

  return <ScoringInterface matchId={selectedMatchId} onBack={() => setSelectedMatchId(null)} />;
};

export default LiveScoring;
