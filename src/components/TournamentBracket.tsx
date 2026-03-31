import { motion } from "framer-motion";
import { Trophy, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchData {
  id: string;
  team1_id: string;
  team2_id: string;
  team1?: { name: string; short_name: string; color: string } | null;
  team2?: { name: string; short_name: string; color: string } | null;
  status: string;
  result?: string | null;
  match_date?: string | null;
}

interface TeamData {
  id: string;
  team_id: string;
  team?: { name: string; short_name: string; color: string } | null;
}

interface Props {
  matches: MatchData[];
  teams: TeamData[];
}

// Determine winner team_id from result string
function getWinnerId(match: MatchData): string | null {
  if (match.status !== "completed" || !match.result) return null;
  const r = match.result.toLowerCase();
  const t1 = (match.team1?.name || "").toLowerCase();
  const t2 = (match.team2?.name || "").toLowerCase();
  if (t1 && r.includes(t1) && (r.includes("won") || r.includes("win"))) return match.team1_id;
  if (t2 && r.includes(t2) && (r.includes("won") || r.includes("win"))) return match.team2_id;
  return null;
}

// Organize matches into rounds based on count
function organizeRounds(matches: MatchData[], teamCount: number) {
  // For knockout: rounds are determined by team count
  // 8 teams = QF(4) + SF(2) + F(1) = 7 matches
  // 4 teams = SF(2) + F(1) = 3 matches
  // 2 teams = F(1) = 1 match
  const rounds: { name: string; matches: (MatchData | null)[] }[] = [];

  if (teamCount >= 8) {
    const qfMatches = matches.slice(0, 4);
    const sfMatches = matches.slice(4, 6);
    const fMatches = matches.slice(6, 7);
    rounds.push({ name: "Quarter Finals", matches: padTo(qfMatches, 4) });
    rounds.push({ name: "Semi Finals", matches: padTo(sfMatches, 2) });
    rounds.push({ name: "Final", matches: padTo(fMatches, 1) });
  } else if (teamCount >= 4) {
    const sfMatches = matches.slice(0, 2);
    const fMatches = matches.slice(2, 3);
    rounds.push({ name: "Semi Finals", matches: padTo(sfMatches, 2) });
    rounds.push({ name: "Final", matches: padTo(fMatches, 1) });
  } else {
    rounds.push({ name: "Final", matches: padTo(matches.slice(0, 1), 1) });
  }

  return rounds;
}

function padTo(arr: MatchData[], count: number): (MatchData | null)[] {
  const result: (MatchData | null)[] = [...arr];
  while (result.length < count) result.push(null);
  return result;
}

const TeamSlot = ({
  team,
  isWinner,
  position,
}: {
  team?: { name: string; short_name: string; color: string } | null;
  isWinner: boolean;
  position: "top" | "bottom";
}) => {
  const color = team?.color || "#555";
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 ${
        position === "top" ? "rounded-t-lg" : "rounded-b-lg"
      } ${
        isWinner
          ? "bg-primary/10 border-primary/20"
          : "bg-card"
      } border-x border-border/60 ${position === "top" ? "border-t" : "border-b"} transition-all`}
    >
      <div
        className="h-5 w-5 rounded flex items-center justify-center text-[7px] font-bold shrink-0"
        style={{ backgroundColor: color + "20", color }}
      >
        {team?.short_name || "?"}
      </div>
      <span
        className={`text-[11px] font-semibold truncate flex-1 ${
          isWinner ? "text-primary" : team ? "text-foreground" : "text-muted-foreground/50"
        }`}
      >
        {team?.name || "TBD"}
      </span>
      {isWinner && (
        <Trophy className="h-3 w-3 text-primary shrink-0" />
      )}
    </div>
  );
};

const BracketMatch = ({
  match,
  index,
  roundIndex,
}: {
  match: MatchData | null;
  index: number;
  roundIndex: number;
}) => {
  const navigate = useNavigate();
  const winnerId = match ? getWinnerId(match) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + roundIndex * 0.15 + index * 0.05 }}
      onClick={() => match?.status === "completed" ? navigate(`/scorecard/${match.id}`) : undefined}
      className={`w-36 sm:w-44 shrink-0 ${match?.status === "completed" ? "cursor-pointer" : ""}`}
    >
      <div className="rounded-lg overflow-hidden shadow-sm border border-border/40 bg-card/50">
        <TeamSlot
          team={match?.team1}
          isWinner={winnerId === match?.team1_id}
          position="top"
        />
        <div className="h-px bg-border/80 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground bg-card px-1.5 font-bold uppercase">
              {match ? (
                match.status === "live" ? (
                  <span className="text-primary animate-pulse">LIVE</span>
                ) : match.status === "completed" ? "FT" : "vs"
              ) : "—"}
            </span>
          </div>
        </div>
        <TeamSlot
          team={match?.team2}
          isWinner={winnerId === match?.team2_id}
          position="bottom"
        />
      </div>
    </motion.div>
  );
};

// Connector lines between rounds
const Connector = ({ matchCount }: { matchCount: number }) => {
  return (
    <div className="flex flex-col justify-around shrink-0 w-6 sm:w-10">
      {Array.from({ length: matchCount }).map((_, i) => (
        <div key={i} className="flex items-center h-full">
          <svg
            className="w-full text-border/60"
            viewBox="0 0 40 60"
            preserveAspectRatio="none"
            style={{ height: "100%" }}
          >
            <path
              d="M 0 15 H 20 V 30 H 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <path
              d="M 0 45 H 20 V 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

export const TournamentBracket = ({ matches, teams }: Props) => {
  const rounds = organizeRounds(matches, teams.length);

  if (teams.length < 2) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        Add at least 2 teams to view the bracket
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex items-stretch gap-0 min-w-max">
        {rounds.map((round, ri) => (
          <div key={ri} className="flex items-stretch">
            {/* Round column */}
            <div className="flex flex-col shrink-0">
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.1 }}
                className={`text-[9px] font-bold uppercase tracking-widest mb-3 text-center ${
                  ri === rounds.length - 1 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {round.name}
              </motion.p>
              <div
                className="flex flex-col justify-around flex-1 gap-3"
                style={{ minHeight: round.matches.length === 1 ? undefined : undefined }}
              >
                {round.matches.map((m, mi) => (
                  <BracketMatch key={mi} match={m} index={mi} roundIndex={ri} />
                ))}
              </div>
            </div>

            {/* Connector to next round */}
            {ri < rounds.length - 1 && (
              <Connector matchCount={rounds[ri + 1].matches.length} />
            )}
          </div>
        ))}

        {/* Champion */}
        {rounds.length > 0 && (() => {
          const finalMatch = rounds[rounds.length - 1].matches[0];
          const champion = finalMatch ? getWinnerId(finalMatch) : null;
          const championTeam = champion
            ? (finalMatch?.team1_id === champion ? finalMatch?.team1 : finalMatch?.team2)
            : null;

          return (
            <div className="flex flex-col shrink-0 ml-2">
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (rounds.length) * 0.1 }}
                className="text-[9px] font-bold uppercase tracking-widest mb-3 text-center text-accent"
              >
                Champion
              </motion.p>
              <div className="flex items-center justify-center flex-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className={`w-36 sm:w-44 rounded-xl border-2 p-3 flex flex-col items-center gap-2 ${
                    championTeam
                      ? "border-accent/40 bg-accent/5"
                      : "border-border/30 bg-muted/10 border-dashed"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    championTeam ? "bg-accent/15" : "bg-muted/30"
                  }`}>
                    {championTeam ? (
                      <Trophy className="h-5 w-5 text-accent" />
                    ) : (
                      <Swords className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <span className={`text-xs font-bold text-center ${
                    championTeam ? "text-accent" : "text-muted-foreground/40"
                  }`}>
                    {championTeam?.name || "TBD"}
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
