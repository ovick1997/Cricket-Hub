import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { ChevronRight, Ban, Target, Search } from "lucide-react";

interface PlayerData {
  id: string;
  name: string;
  jersey_number: number | null;
  role: string;
}

interface BowlerSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBowler: string;
  onSelectBowler: (playerId: string, name: string) => void;
  players: PlayerData[];
  lastBowlerId?: string;
  isEndOfOver?: boolean;
  overNumber?: number;
  maxOversPerBowler?: number | null;
  bowlerOversMap?: Record<string, number>;
}

export const BowlerSelectDialog = ({
  open, onOpenChange, currentBowler, onSelectBowler, players, lastBowlerId, isEndOfOver, overNumber, maxOversPerBowler, bowlerOversMap = {},
}: BowlerSelectDialogProps) => {
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();
  const bowlers = players.filter((p) => (p.role === "bowler" || p.role === "all-rounder") && p.name.toLowerCase().includes(q));
  const others = players.filter((p) => p.role !== "bowler" && p.role !== "all-rounder" && p.name.toLowerCase().includes(q));

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();
  const lastBowlerName = players.find(p => p.id === lastBowlerId)?.name;

  const renderBtn = (p: PlayerData, idx: number) => {
    const isCurrent = p.name === currentBowler;
    const isLast = p.id === lastBowlerId;
    const bowlerOvers = bowlerOversMap[p.id] || 0;
    const completedOvers = Math.floor(bowlerOvers);
    const hasMaxedOut = maxOversPerBowler ? completedOvers >= maxOversPerBowler : false;
    const isDisabled = isLast || hasMaxedOut;
    return (
      <motion.button
        key={p.id}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 + idx * 0.04 }}
        disabled={isDisabled}
        onClick={() => { onSelectBowler(p.id, p.name); onOpenChange(false); }}
        className={`h-14 rounded-xl text-xs font-bold active:scale-[0.97] transition-all px-3 flex items-center gap-3 group ${
          isCurrent
            ? "bg-accent/15 text-accent border border-accent/30"
            : isDisabled
            ? "bg-muted/10 text-muted-foreground/40 cursor-not-allowed"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
          isCurrent ? "bg-accent/20" : isDisabled ? "bg-muted/20" : "bg-primary/10"
        }`}>
          {isDisabled ? (
            <Ban className="h-3.5 w-3.5 text-muted-foreground/40" />
          ) : (
            <span className={`text-[10px] font-bold ${isCurrent ? "text-accent" : "text-primary"}`}>{initials(p.name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span className={`truncate block ${isDisabled ? "line-through" : ""}`}>{p.name}</span>
          {isLast && <span className="text-[9px] text-muted-foreground/50 block">Can't bowl consecutive overs</span>}
          {hasMaxedOut && !isLast && <span className="text-[9px] text-destructive/60 block">Max overs reached ({maxOversPerBowler})</span>}
          {isCurrent && <span className="text-[9px] text-accent/70 block">Currently bowling</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {maxOversPerBowler && (
            <span className={`text-[9px] font-mono ${hasMaxedOut ? "text-destructive/50" : "text-muted-foreground"}`}>
              {completedOvers}/{maxOversPerBowler}
            </span>
          )}
          {p.jersey_number !== null && <span className="text-muted-foreground font-mono text-[10px]">#{p.jersey_number}</span>}
        </div>
        {!isDisabled && !isCurrent && (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity shrink-0" />
        )}
      </motion.button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/8 to-transparent pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <div>
                <DialogTitle className="font-display text-base">
                  {isEndOfOver ? "New Over — Select Bowler" : "Change Bowler"}
                </DialogTitle>
                {isEndOfOver && overNumber !== undefined && (
                  <p className="text-[10px] text-accent font-medium mt-0.5">
                    Over {overNumber} complete • Strike rotated
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-3 max-h-80 overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>
          {isEndOfOver && lastBowlerName && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2 flex items-center gap-2"
            >
              <div className="h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                <Ban className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-bold">{lastBowlerName}</span> bowled last over
                </p>
              </div>
            </motion.div>
          )}

          {bowlers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold px-0.5">Bowlers & All-Rounders</p>
              <div className="grid grid-cols-1 gap-1.5">{bowlers.map(renderBtn)}</div>
            </div>
          )}
          {others.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold px-0.5">Part-Time Options</p>
              <div className="grid grid-cols-1 gap-1.5">{others.map(renderBtn)}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
