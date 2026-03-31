import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from "react";

interface BallData {
  id: string;
  batsman_id: string;
  bowler_id: string;
  non_striker_id: string | null;
  runs_scored: number;
  extra_type: string | null;
  extra_runs: number;
  is_wicket: boolean;
  wicket_type: string | null;
  wicket_batsman_id: string | null;
  over_number: number;
  ball_number: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balls: BallData[];
  battingPlayers: any[];
  bowlingPlayers: any[];
  battingTeamName: string;
  bowlingTeamName: string;
  battingTeamColor: string;
  bowlingTeamColor: string;
  totalRuns: number;
  totalWickets: number;
  overs: number;
  ballsInOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  inningsLabel: string;
}

interface BatsmanStat {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  howOut: string;
  isOnStrike: boolean;
}

interface BowlerStat {
  id: string;
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: string;
}

export function LiveScoreboardDialog({
  open, onOpenChange, balls, battingPlayers, bowlingPlayers,
  battingTeamName, bowlingTeamName, battingTeamColor, bowlingTeamColor,
  totalRuns, totalWickets, overs, ballsInOver, extras, inningsLabel,
}: Props) {

  const batStats = useMemo(() => {
    const map: Record<string, BatsmanStat> = {};
    const playerNameMap: Record<string, string> = {};
    battingPlayers.forEach((p: any) => { playerNameMap[p.id] = p.name; });

    balls.forEach(b => {
      // Initialize batsman
      if (!map[b.batsman_id]) {
        map[b.batsman_id] = {
          id: b.batsman_id,
          name: playerNameMap[b.batsman_id] || "Unknown",
          runs: 0, balls: 0, fours: 0, sixes: 0,
          isOut: false, howOut: "", isOnStrike: false,
        };
      }
      const bat = map[b.batsman_id];

      // Count balls faced (not wides/no-balls)
      const isLegalDelivery = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
      if (isLegalDelivery) bat.balls++;
      // For no-balls, batsman faces the ball but it's not legal for the over
      if (b.extra_type === "no-ball") bat.balls++;

      // Runs scored by batsman (not extras)
      if (!b.extra_type || b.extra_type === "no-ball") {
        bat.runs += b.runs_scored;
        if (b.runs_scored === 4) bat.fours++;
        if (b.runs_scored === 6) bat.sixes++;
      }

      // Wicket
      if (b.is_wicket) {
        const outId = b.wicket_batsman_id || b.batsman_id;
        if (!map[outId]) {
          map[outId] = {
            id: outId,
            name: playerNameMap[outId] || "Unknown",
            runs: 0, balls: 0, fours: 0, sixes: 0,
            isOut: false, howOut: "", isOnStrike: false,
          };
        }
        map[outId].isOut = true;
        map[outId].howOut = b.wicket_type || "out";
      }
    });

    return Object.values(map).sort((a, b) => {
      // Not out batsmen at bottom, order by appearance
      if (a.isOut && !b.isOut) return -1;
      if (!a.isOut && b.isOut) return 1;
      return 0;
    });
  }, [balls, battingPlayers]);

  const bowlStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; legalBalls: number; runs: number; wickets: number; overBalls: number[][] }> = {};
    const playerNameMap: Record<string, string> = {};
    bowlingPlayers.forEach((p: any) => { playerNameMap[p.id] = p.name; });

    balls.forEach(b => {
      if (!map[b.bowler_id]) {
        map[b.bowler_id] = { id: b.bowler_id, name: playerNameMap[b.bowler_id] || "Unknown", legalBalls: 0, runs: 0, wickets: 0, overBalls: [] };
      }
      const bow = map[b.bowler_id];
      const isLegal = !b.extra_type || b.extra_type === "bye" || b.extra_type === "leg-bye";
      if (isLegal) bow.legalBalls++;
      // Runs conceded (runs + extra runs, but not byes/leg-byes)
      if (!b.extra_type) {
        bow.runs += b.runs_scored;
      } else if (b.extra_type === "wide" || b.extra_type === "no-ball") {
        bow.runs += b.runs_scored + b.extra_runs;
      }
      if (b.is_wicket && b.wicket_type !== "Run Out (S)" && b.wicket_type !== "Run Out (NS)") {
        bow.wickets++;
      }
    });

    return Object.values(map).map(bow => {
      const o = Math.floor(bow.legalBalls / 6);
      const b = bow.legalBalls % 6;
      const oversStr = `${o}.${b}`;
      const eco = bow.legalBalls > 0 ? ((bow.runs / bow.legalBalls) * 6).toFixed(1) : "0.0";
      return {
        id: bow.id, name: bow.name, overs: oversStr, maidens: 0,
        runs: bow.runs, wickets: bow.wickets, economy: eco,
      } as BowlerStat;
    });
  }, [balls, bowlingPlayers]);

  const strikeRate = (runs: number, balls: number) => balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
  const totalExtras = extras.wides + extras.noBalls + extras.byes + extras.legByes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-card border-border/60 max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/40">
          <DialogTitle className="text-base font-display font-bold flex items-center gap-2">
            <div className="h-5 w-5 rounded flex items-center justify-center text-[8px] font-bold"
              style={{ backgroundColor: battingTeamColor + "20", color: battingTeamColor }}>
              {battingTeamName.slice(0, 3).toUpperCase()}
            </div>
            Scoreboard — {inningsLabel}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-4 pb-4">
          {/* Score summary */}
          <div className="flex items-baseline justify-between py-2 border-b border-border/30 mb-3">
            <div>
              <span className="text-lg font-display font-black text-foreground">{battingTeamName}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-display font-black text-foreground">{totalRuns}/{totalWickets}</span>
              <span className="text-xs font-mono text-muted-foreground ml-1">({overs}.{ballsInOver} ov)</span>
            </div>
          </div>

          {/* Batting table */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Batting</p>
            <div className="grid grid-cols-[1fr_30px_30px_24px_24px_40px] gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
              <span>Batter</span>
              <span className="text-right">R</span>
              <span className="text-right">B</span>
              <span className="text-right">4s</span>
              <span className="text-right">6s</span>
              <span className="text-right">SR</span>
            </div>
            {batStats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No batting data yet</p>
            ) : (
              batStats.map(bat => (
                <div key={bat.id} className={`grid grid-cols-[1fr_30px_30px_24px_24px_40px] gap-1 text-xs px-1 py-1.5 rounded ${!bat.isOut ? "bg-primary/5" : ""}`}>
                  <div className="truncate">
                    <span className={`font-semibold ${!bat.isOut ? "text-foreground" : "text-muted-foreground"}`}>
                      {bat.name} {!bat.isOut && <span className="text-primary">*</span>}
                    </span>
                    {bat.isOut && (
                      <span className="text-[9px] text-destructive/70 ml-1">{bat.howOut}</span>
                    )}
                  </div>
                  <span className="text-right font-bold text-foreground">{bat.runs}</span>
                  <span className="text-right text-muted-foreground">{bat.balls}</span>
                  <span className="text-right text-muted-foreground">{bat.fours}</span>
                  <span className="text-right text-muted-foreground">{bat.sixes}</span>
                  <span className="text-right text-muted-foreground font-mono text-[10px]">{strikeRate(bat.runs, bat.balls)}</span>
                </div>
              ))
            )}
          </div>

          {/* Extras */}
          <div className="flex items-center justify-between text-xs py-2 border-t border-b border-border/30 mb-4">
            <span className="font-semibold text-muted-foreground">Extras</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{totalExtras}</span>
              <span className="text-[9px] text-muted-foreground">
                (W:{extras.wides} NB:{extras.noBalls} B:{extras.byes} LB:{extras.legByes})
              </span>
            </div>
          </div>

          {/* Bowling table */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Bowling</p>
            <div className="grid grid-cols-[1fr_32px_24px_32px_24px_36px] gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
              <span>Bowler</span>
              <span className="text-right">O</span>
              <span className="text-right">M</span>
              <span className="text-right">R</span>
              <span className="text-right">W</span>
              <span className="text-right">ECO</span>
            </div>
            {bowlStats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No bowling data yet</p>
            ) : (
              bowlStats.map(bow => (
                <div key={bow.id} className="grid grid-cols-[1fr_32px_24px_32px_24px_36px] gap-1 text-xs px-1 py-1.5">
                  <span className="font-semibold text-foreground truncate">{bow.name}</span>
                  <span className="text-right text-muted-foreground font-mono">{bow.overs}</span>
                  <span className="text-right text-muted-foreground">{bow.maidens}</span>
                  <span className="text-right text-foreground font-bold">{bow.runs}</span>
                  <span className="text-right text-primary font-bold">{bow.wickets}</span>
                  <span className="text-right text-muted-foreground font-mono text-[10px]">{bow.economy}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
