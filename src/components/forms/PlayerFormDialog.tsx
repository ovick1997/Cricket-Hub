import { useState, useEffect } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";

const playerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name must be under 60 characters"),
  role: z.enum(["batsman", "bowler", "all-rounder", "wicketkeeper"], { required_error: "Select a role" }),
  battingStyle: z.enum(["right-hand", "left-hand"]),
  bowlingStyle: z.string().max(40, "Must be under 40 characters").optional().or(z.literal("")),
  jerseyNumber: z.coerce.number().int().min(0, "Must be 0+").max(999, "Must be under 1000").optional(),
});

export type PlayerFormData = z.infer<typeof playerSchema>;

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlayerFormData) => void;
  initialData?: Partial<PlayerFormData>;
  mode?: "create" | "edit";
}

const roleIcons: Record<string, string> = {
  batsman: "🏏",
  bowler: "🎯",
  "all-rounder": "⚡",
  wicketkeeper: "🧤",
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" as const } }),
};

const ErrorMsg = ({ msg }: { msg?: string }) => (
  <AnimatePresence mode="wait">
    {msg && (
      <motion.p
        initial={{ opacity: 0, y: -4, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -4, height: 0 }}
        className="text-[10px] text-destructive font-medium"
      >
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

export function PlayerFormDialog({ open, onOpenChange, onSubmit, initialData, mode = "create" }: PlayerFormDialogProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [role, setRole] = useState(initialData?.role ?? "batsman");
  const [battingStyle, setBattingStyle] = useState(initialData?.battingStyle ?? "right-hand");
  const [bowlingStyle, setBowlingStyle] = useState(initialData?.bowlingStyle ?? "");
  const [jerseyNumber, setJerseyNumber] = useState(initialData?.jerseyNumber?.toString() ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setRole(initialData?.role ?? "batsman");
      setBattingStyle(initialData?.battingStyle ?? "right-hand");
      setBowlingStyle(initialData?.bowlingStyle ?? "");
      setJerseyNumber(initialData?.jerseyNumber?.toString() ?? "");
      setErrors({});
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = playerSchema.safeParse({
      name, role, battingStyle, bowlingStyle: bowlingStyle || undefined,
      jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setErrors({});
    onSubmit(result.data);
    onOpenChange(false);
  };

  const initials = name.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Accent header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/8 to-transparent pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent/15 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-accent" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">{mode === "create" ? "Add Player" : "Edit Player"}</DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Enter player details</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4"
        >
          {/* Player avatar preview */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-3">
            <motion.div
              layout
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20 shrink-0"
            >
              <span className="text-lg font-display font-bold text-primary">{initials || "?"}</span>
            </motion.div>
            <div className="flex-1 min-w-0">
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
                placeholder="Full Name"
                className={`bg-muted/40 border-border/60 text-base font-semibold h-11 transition-all ${errors.name ? "border-destructive/50 bg-destructive/5" : ""}`}
                maxLength={60}
                autoFocus
              />
              <ErrorMsg msg={errors.name} />
            </div>
          </motion.div>

          {/* Role selector as buttons */}
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["batsman", "bowler", "all-rounder", "wicketkeeper"] as const).map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  whileTap={{ scale: 0.93 }}
                  className={`h-11 rounded-xl text-[11px] font-bold capitalize transition-all flex flex-col items-center justify-center gap-0.5 ${
                    role === r
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className="text-sm">{roleIcons[r]}</span>
                  <span className="text-[9px]">{r === "all-rounder" ? "All-Round" : r === "wicketkeeper" ? "Keeper" : r}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Batting Style</Label>
              <Select value={battingStyle} onValueChange={(v: any) => setBattingStyle(v)}>
                <SelectTrigger className="bg-muted/40 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right-hand">Right-Hand</SelectItem>
                  <SelectItem value="left-hand">Left-Hand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jersey" className="text-xs font-semibold text-muted-foreground">Jersey #</Label>
              <Input
                id="jersey"
                type="number"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="18"
                className={`bg-muted/40 border-border/60 font-mono font-bold text-center ${errors.jerseyNumber ? "border-destructive/50" : ""}`}
                min={0}
                max={999}
              />
              <ErrorMsg msg={errors.jerseyNumber} />
            </div>
          </motion.div>

          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
            <Label htmlFor="bowling-style" className="text-xs font-semibold text-muted-foreground">Bowling Style</Label>
            <Input
              id="bowling-style"
              value={bowlingStyle}
              onChange={(e) => setBowlingStyle(e.target.value)}
              placeholder="e.g. Right-arm fast"
              className="bg-muted/40 border-border/60"
              maxLength={40}
            />
          </motion.div>

          <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="flex gap-2 pt-1">
            <motion.button
              type="button"
              onClick={() => onOpenChange(false)}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              {mode === "create" ? "Add Player" : "Save Changes"}
            </motion.button>
          </motion.div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
