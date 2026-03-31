import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeftRight, ChevronRight, Search } from "lucide-react";
import { motion } from "framer-motion";

interface PlayerData {
  id: string;
  name: string;
  jersey_number: number | null;
  role: string;
}

interface BatsmanSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  striker: string;
  nonStriker: string;
  onSwapStrike: () => void;
  onSelectBatsman: (playerId: string, name: string) => void;
  players: PlayerData[];
  outBatsmenIds: string[];
  retiredBatsmenIds?: string[];
  currentBatsmenIds: string[];
  isWicketPrompt?: boolean;
  onRetireHurt?: (isStriker: boolean) => void;
}

export const BatsmanSelectDialog = ({
  open, onOpenChange, striker, nonStriker,
  onSwapStrike, onSelectBatsman, players, outBatsmenIds, retiredBatsmenIds = [], currentBatsmenIds, isWicketPrompt, onRetireHurt,
}: BatsmanSelectDialogProps) => {
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();
  const available = players.filter(
    (p) => !currentBatsmenIds.includes(p.id) && !outBatsmenIds.includes(p.id) && !retiredBatsmenIds.includes(p.id) && p.name.toLowerCase().includes(q)
  );

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 relative">
          <div className={`absolute inset-0 pointer-events-none ${isWicketPrompt ? "bg-gradient-to-br from-destructive/8 to-transparent" : "bg-gradient-to-br from-primary/6 to-transparent"}`} />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isWicketPrompt ? "bg-destructive/15" : "bg-primary/15"}`}>
                <span className="text-sm">🏏</span>
              </div>
              <div>
                <DialogTitle className="font-display text-base">
                  {isWicketPrompt ? "Select New Batsman" : "Batting Pair"}
                </DialogTitle>
                {isWicketPrompt && (
                  <p className="text-[10px] text-destructive font-medium mt-0.5">Wicket fell — choose replacement</p>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-primary/70 uppercase tracking-widest font-bold">On Strike</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-primary">{initials(striker)}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{striker}</p>
                </div>
              </div>

              <motion.button
                onClick={onSwapStrike}
                whileTap={{ scale: 0.85, rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 hover:bg-primary/25 transition-colors"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </motion.button>

              <div className="flex-1 min-w-0 text-right">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Non-Striker</p>
                <div className="flex items-center gap-1.5 mt-1 justify-end">
                  <p className="text-xs font-bold text-foreground truncate">{nonStriker}</p>
                  <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-muted-foreground">{initials(nonStriker)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Retire Hurt buttons */}
          {!isWicketPrompt && onRetireHurt && striker && nonStriker && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="space-y-1.5"
            >
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold px-0.5">Retire Hurt</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { onRetireHurt(true); onOpenChange(false); }}
                  className="h-10 rounded-xl bg-warning/10 text-warning border border-warning/20 text-[11px] font-bold active:scale-[0.97] transition-transform"
                >
                  🚑 {striker.split(" ")[0]}
                </button>
                <button
                  onClick={() => { onRetireHurt(false); onOpenChange(false); }}
                  className="h-10 rounded-xl bg-warning/10 text-warning border border-warning/20 text-[11px] font-bold active:scale-[0.97] transition-transform"
                >
                  🚑 {nonStriker.split(" ")[0]}
                </button>
              </div>
            </motion.div>
          )}

          {available.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold px-0.5">
                {isWicketPrompt ? "Available Batsmen" : "Substitute Batsman"}
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search players..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                {available.map((p, i) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    onClick={() => { onSelectBatsman(p.id, p.name); onOpenChange(false); }}
                    className="h-12 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold active:scale-[0.97] transition-transform px-3 flex items-center gap-3 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">{initials(p.name)}</span>
                    </div>
                    <span className="truncate flex-1 text-left">{p.name}</span>
                    {p.jersey_number !== null && <span className="text-muted-foreground font-mono text-[10px]">#{p.jersey_number}</span>}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {!isWicketPrompt && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => onOpenChange(false)}
              className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Done
            </motion.button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
