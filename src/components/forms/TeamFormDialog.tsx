import { useState, useEffect } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye } from "lucide-react";

const teamSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be under 50 characters"),
  shortName: z.string().trim().min(1, "Short name is required").max(4, "Short name must be 1-4 characters").toUpperCase(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
});

export type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamFormData) => void;
  initialData?: Partial<TeamFormData>;
  mode?: "create" | "edit";
}

const presetColors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

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

export function TeamFormDialog({ open, onOpenChange, onSubmit, initialData, mode = "create" }: TeamFormDialogProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [shortName, setShortName] = useState(initialData?.shortName ?? "");
  const [color, setColor] = useState(initialData?.color ?? "#22c55e");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setShortName(initialData?.shortName ?? "");
      setColor(initialData?.color ?? "#22c55e");
      setErrors({});
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = teamSchema.safeParse({ name, shortName, color });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Accent header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">{mode === "create" ? "Create Team" : "Edit Team"}</DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Set up your team identity</p>
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
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
            <Label htmlFor="team-name" className="text-xs font-semibold text-muted-foreground">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
              placeholder="e.g. Royal Strikers"
              className={`bg-muted/40 border-border/60 transition-all focus-visible:ring-primary/40 ${errors.name ? "border-destructive/50 bg-destructive/5" : ""}`}
              maxLength={50}
              autoFocus
            />
            <ErrorMsg msg={errors.name} />
          </motion.div>

          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="team-short" className="text-xs font-semibold text-muted-foreground">Short Name</Label>
              <Input
                id="team-short"
                value={shortName}
                onChange={(e) => { setShortName(e.target.value.toUpperCase().slice(0, 4)); setErrors((prev) => ({ ...prev, shortName: "" })); }}
                placeholder="e.g. RS"
                className={`bg-muted/40 border-border/60 uppercase tracking-widest font-bold transition-all ${errors.shortName ? "border-destructive/50 bg-destructive/5" : ""}`}
                maxLength={4}
              />
              <ErrorMsg msg={errors.shortName} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Team Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {presetColors.map((c) => (
                  <motion.button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className={`h-7 w-7 rounded-lg transition-all ${color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Live preview */}
          <motion.div
            custom={2}
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/60 bg-muted/10 p-4"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Preview</span>
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                layout
                className="h-12 w-12 rounded-xl flex items-center justify-center font-display font-bold text-sm ring-1"
                style={{ backgroundColor: color + "20", color: color, borderColor: color + "30" }}
              >
                {shortName || "??"}
              </motion.div>
              <div>
                <p className="text-sm font-bold text-foreground">{name || "Team Name"}</p>
                <p className="text-[10px] text-muted-foreground">{shortName || "??"} • 0 players</p>
              </div>
            </div>
          </motion.div>

          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="flex gap-2 pt-1">
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
              {mode === "create" ? "Create Team" : "Save Changes"}
            </motion.button>
          </motion.div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
