import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Search, UserPlus, UserMinus, ChevronRight } from "lucide-react";

interface Player {
  id: string;
  name: string;
  role: string;
  jersey_number?: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  squadPlayers: Player[];
  benchPlayers: Player[];
  teamColor: string;
  teamName: string;
  onSubstitute: (outPlayerId: string, inPlayerId: string) => void;
  disabledPlayerIds?: string[]; // players currently batting/bowling, can't be subbed out
}

export function ImpactSubDialog({
  open,
  onOpenChange,
  squadPlayers,
  benchPlayers,
  teamColor,
  teamName,
  onSubstitute,
  disabledPlayerIds = [],
}: Props) {
  const [step, setStep] = useState<"select-out" | "select-in">("select-out");
  const [outPlayer, setOutPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const resetAndClose = () => {
    setStep("select-out");
    setOutPlayer(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleSelectOut = (player: Player) => {
    setOutPlayer(player);
    setStep("select-in");
    setSearchQuery("");
  };

  const handleSelectIn = (player: Player) => {
    if (outPlayer) {
      onSubstitute(outPlayer.id, player.id);
      resetAndClose();
    }
  };

  const filteredSquad = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return squadPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) &&
        !disabledPlayerIds.includes(p.id)
    );
  }, [squadPlayers, searchQuery, disabledPlayerIds]);

  const filteredBench = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return benchPlayers.filter((p) => p.name.toLowerCase().includes(q));
  }, [benchPlayers, searchQuery]);

  const disabledSquadPlayers = useMemo(() => {
    return squadPlayers.filter((p) => disabledPlayerIds.includes(p.id));
  }, [squadPlayers, disabledPlayerIds]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-info/8 to-transparent pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-info/15 flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-info" />
              </div>
              <div>
                <DialogTitle className="font-display text-base">Impact Substitute</DialogTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {teamName} — {step === "select-out" ? "Select player going out" : "Select replacement"}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Step indicator */}
        <div className="px-5 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
            step === "select-out" ? "bg-destructive/15 text-destructive" : "bg-muted/40 text-muted-foreground"
          }`}>
            <UserMinus className="h-3 w-3" />
            {outPlayer ? outPlayer.name : "Player Out"}
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
            step === "select-in" ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
          }`}>
            <UserPlus className="h-3 w-3" />
            Player In
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={step === "select-out" ? "Search squad player..." : "Search bench player..."}
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <AnimatePresence mode="wait">
            {step === "select-out" ? (
              <motion.div
                key="out"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-1.5 max-h-[300px] overflow-y-auto"
              >
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Select player to substitute out ({filteredSquad.length} available)
                </p>
                {filteredSquad.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectOut(p)}
                    className="w-full h-11 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold px-3 flex items-center gap-2.5 active:scale-[0.97] transition-transform hover:bg-secondary/80"
                  >
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ backgroundColor: teamColor + "15", color: teamColor }}
                    >
                      {p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="truncate block">{p.name}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground capitalize shrink-0">{p.role}</span>
                    <UserMinus className="h-3 w-3 text-destructive/60 shrink-0" />
                  </button>
                ))}
                {disabledSquadPlayers.length > 0 && (
                  <>
                    <p className="text-[9px] text-muted-foreground/60 mt-2">Currently active (can't sub out):</p>
                    {disabledSquadPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="w-full h-11 rounded-xl bg-muted/20 text-muted-foreground/50 text-xs font-semibold px-3 flex items-center gap-2.5 cursor-not-allowed"
                      >
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0 bg-muted/30">
                          {p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="flex-1 text-left truncate">{p.name}</span>
                        <span className="text-[8px]">🏏 Active</span>
                      </div>
                    ))}
                  </>
                )}
                {filteredSquad.length === 0 && disabledSquadPlayers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No players found</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="in"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-1.5 max-h-[300px] overflow-y-auto"
              >
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Select replacement from bench ({filteredBench.length} available)
                </p>
                {filteredBench.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No bench players available</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">All team players are already in the squad</p>
                  </div>
                ) : (
                  filteredBench.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectIn(p)}
                      className="w-full h-11 rounded-xl bg-primary/8 text-foreground text-xs font-semibold px-3 flex items-center gap-2.5 active:scale-[0.97] transition-transform hover:bg-primary/15 border border-primary/10"
                    >
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: teamColor + "15", color: teamColor }}
                      >
                        {p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="truncate block">{p.name}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground capitalize shrink-0">{p.role}</span>
                      <UserPlus className="h-3 w-3 text-primary/60 shrink-0" />
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {step === "select-in" && (
              <button
                onClick={() => { setStep("select-out"); setOutPlayer(null); setSearchQuery(""); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={resetAndClose}
              className={`${step === "select-in" ? "flex-1" : "w-full"} py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
