import { motion } from "framer-motion";
import { Radio, MapPin, Calendar, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export interface MatchCardData {
  id: string;
  status: string;
  overs: number;
  venue: string | null;
  match_date: string | null;
  result: string | null;
  team1: { name: string; short_name: string; color: string } | null;
  team2: { name: string; short_name: string; color: string } | null;
  team1Score?: string;
  team2Score?: string;
  motmName?: string | null;
}

interface MatchCardProps {
  match: MatchCardData;
  index?: number;
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
  const isLive = match.status === "live";
  const navigate = useNavigate();

  const team1Name = match.team1?.name || "TBD";
  const team2Name = match.team2?.name || "TBD";
  const team1Short = match.team1?.short_name || "??";
  const team2Short = match.team2?.short_name || "??";
  const team1Color = match.team1?.color || "#22c55e";
  const team2Color = match.team2?.color || "#f59e0b";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={() => {
        if (match.status === "completed") navigate(`/scorecard/${match.id}`);
        else if (match.status === "live") window.open(`/live/${match.id}`, '_blank');
      }}
      className={`relative rounded-xl md:rounded-2xl border bg-card p-3 md:p-4 transition-all cursor-pointer overflow-hidden group ${
        isLive ? "border-primary/25 glow-primary" : "border-border hover:border-primary/15"
      }`}
    >
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-md ${
          isLive ? "bg-primary/15 text-primary" : match.status === "upcoming" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"
        }`}>
          {isLive && <Radio className="h-2.5 w-2.5 inline mr-1 animate-pulse-glow" />}
          {match.status}
        </span>
        <span className="text-[9px] md:text-[10px] text-muted-foreground font-mono">{match.overs} ov</span>
      </div>

      <div className="space-y-1.5 md:space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 md:h-7 md:w-7 rounded-md md:rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-bold"
              style={{ backgroundColor: team1Color + "15", color: team1Color }}>
              {team1Short}
            </div>
            <span className="font-display font-semibold text-xs md:text-sm text-foreground">{team1Name}</span>
          </div>
          {match.team1Score && (
            <span className="text-xs md:text-sm font-mono font-bold text-foreground tracking-tight">{match.team1Score}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 md:h-7 md:w-7 rounded-md md:rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-bold"
              style={{ backgroundColor: team2Color + "15", color: team2Color }}>
              {team2Short}
            </div>
            <span className="font-display font-semibold text-xs md:text-sm text-foreground">{team2Name}</span>
          </div>
          {match.team2Score && match.team2Score !== "-" && (
            <span className="text-xs md:text-sm font-mono font-bold text-foreground tracking-tight">{match.team2Score}</span>
          )}
        </div>
      </div>

      {match.result && (
        <p className="text-[10px] md:text-xs text-primary font-medium mt-2 md:mt-3 bg-primary/5 rounded-md md:rounded-lg px-2 py-1 md:px-2.5 md:py-1.5">{match.result}</p>
      )}

      <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border/60">
        {match.match_date && (
          <span className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" /> {format(new Date(match.match_date), "MMM d, yyyy")}
          </span>
        )}
        {match.venue && (
          <span className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0" /> <span className="truncate">{match.venue}</span>
          </span>
        )}
        {match.motmName && (
          <span className="text-[9px] md:text-[10px] text-amber-500 flex items-center gap-1 ml-auto shrink-0">
            <Award className="h-2.5 w-2.5 md:h-3 md:w-3" /> {match.motmName}
          </span>
        )}
      </div>
    </motion.div>
  );
}
