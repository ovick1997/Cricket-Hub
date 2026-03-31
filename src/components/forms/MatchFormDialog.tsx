import { useState, useEffect } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, MapPin, Calendar, Trophy, Zap, Users } from "lucide-react";

const matchSchema = z.object({
  team1: z.string().min(1, "Select team 1"),
  team2: z.string().min(1, "Select team 2"),
  overs: z.coerce.number().int().min(1, "Minimum 1 over").max(50, "Maximum 50 overs"),
  venue: z.string().trim().min(2, "Venue is required").max(100, "Venue must be under 100 characters"),
  date: z.string().min(1, "Date is required"),
  tournamentId: z.string().optional(),
  isShortChris: z.boolean().optional(),
  battingOption: z.number().int().min(1).max(2).optional(),
  maxOversPerBowler: z.number().int().min(1).max(50).nullable().optional(),
  playersPerTeam: z.coerce.number().int().min(2, "Minimum 2 players").max(15, "Maximum 15 players"),
}).refine((data) => data.team1 !== data.team2, {
  message: "Teams must be different",
  path: ["team2"],
});

export type MatchFormData = z.infer<typeof matchSchema>;

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MatchFormData) => void;
  initialData?: Partial<MatchFormData>;
  mode?: "create" | "edit";
}

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

const oversPresets = [5, 10, 15, 20, 25, 30, 50];

export function MatchFormDialog({ open, onOpenChange, onSubmit, initialData, mode = "create" }: MatchFormDialogProps) {
  const { organizationId } = useAuth();
  const [team1, setTeam1] = useState(initialData?.team1 ?? "");
  const [team2, setTeam2] = useState(initialData?.team2 ?? "");
  const [overs, setOvers] = useState(initialData?.overs?.toString() ?? "20");
  const [venue, setVenue] = useState(initialData?.venue ?? "");
  const [date, setDate] = useState(initialData?.date ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const [tournamentId, setTournamentId] = useState(initialData?.tournamentId ?? "");
  const [isShortChris, setIsShortChris] = useState(initialData?.isShortChris ?? false);
  const [battingOption, setBattingOption] = useState(initialData?.battingOption ?? 2);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState<number | null>(initialData?.maxOversPerBowler ?? null);
  const [playersPerTeam, setPlayersPerTeam] = useState(initialData?.playersPerTeam?.toString() ?? "11");

  const { data: teams = [] } = useQuery({
    queryKey: ["teams", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase.from("teams").select("id, name, short_name, color").eq("organization_id", organizationId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && open,
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase.from("tournaments").select("id, name").eq("organization_id", organizationId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && open,
  });

  useEffect(() => {
    if (open) {
      setTeam1(initialData?.team1 ?? "");
      setTeam2(initialData?.team2 ?? "");
      setOvers(initialData?.overs?.toString() ?? "20");
      setVenue(initialData?.venue ?? "");
      setDate(initialData?.date ?? "");
      setTournamentId(initialData?.tournamentId ?? "");
      setIsShortChris(initialData?.isShortChris ?? false);
      setBattingOption(initialData?.battingOption ?? 2);
      setMaxOversPerBowler(initialData?.maxOversPerBowler ?? null);
      setPlayersPerTeam(initialData?.playersPerTeam?.toString() ?? "11");
      setErrors({});
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = matchSchema.safeParse({
      team1, team2, overs: Number(overs), venue, date,
      tournamentId: tournamentId || undefined,
      isShortChris,
      battingOption: isShortChris ? battingOption : 2,
      maxOversPerBowler: maxOversPerBowler || null,
      playersPerTeam: Number(playersPerTeam),
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

  const team1Data = teams.find((t) => t.id === team1);
  const team2Data = teams.find((t) => t.id === team2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Accent header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-info/8 to-transparent pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-info/15 flex items-center justify-center">
                <Swords className="h-4 w-4 text-info" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">{mode === "create" ? "New Match" : "Edit Match"}</DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Set up the match details</p>
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
          {/* Team selectors */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Teams</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Select value={team1} onValueChange={(v) => { setTeam1(v); setErrors((prev) => ({ ...prev, team1: "" })); }}>
                  <SelectTrigger className={`bg-muted/40 border-border/60 h-12 ${errors.team1 ? "border-destructive/50" : ""}`}>
                    <SelectValue placeholder="Team 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorMsg msg={errors.team1} />
              </div>
              <span className="text-xs font-display font-bold text-muted-foreground shrink-0 pb-1">VS</span>
              <div className="flex-1 space-y-1">
                <Select value={team2} onValueChange={(v) => { setTeam2(v); setErrors((prev) => ({ ...prev, team2: "" })); }}>
                  <SelectTrigger className={`bg-muted/40 border-border/60 h-12 ${errors.team2 ? "border-destructive/50" : ""}`}>
                    <SelectValue placeholder="Team 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.filter((t) => t.id !== team1).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorMsg msg={errors.team2} />
              </div>
            </div>
          </motion.div>

          {/* Match preview badge */}
          <AnimatePresence>
            {team1Data && team2Data && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border/60 bg-muted/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: team1Data.color + "20", color: team1Data.color }}>
                      {team1Data.short_name}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{team1Data.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-display font-bold">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{team2Data.name}</span>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: team2Data.color + "20", color: team2Data.color }}>
                      {team2Data.short_name}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overs as pill selector + custom input */}
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Overs</Label>
            <div className="flex gap-1.5 flex-wrap items-center">
              {oversPresets.map((o) => (
                <motion.button
                  key={o}
                  type="button"
                  onClick={() => setOvers(o.toString())}
                  whileTap={{ scale: 0.9 }}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    overs === o.toString()
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {o}
                </motion.button>
              ))}
              <Input
                type="number"
                min={1}
                max={50}
                value={!oversPresets.includes(Number(overs)) ? overs : ""}
                placeholder="Custom"
                onChange={(e) => { setOvers(e.target.value); setErrors((prev) => ({ ...prev, overs: "" })); }}
                className={`h-9 w-20 rounded-xl text-xs font-bold text-center bg-muted/40 border-border/60 placeholder:text-muted-foreground/50 ${
                  !oversPresets.includes(Number(overs)) && overs ? "ring-1 ring-primary/30 bg-primary/15 text-primary" : ""
                } ${errors.overs ? "border-destructive/50" : ""}`}
              />
            </div>
            <ErrorMsg msg={errors.overs} />
          </motion.div>

          {/* Players per team */}
          <motion.div custom={1.5} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Players Per Team
            </Label>
            <div className="flex gap-1.5 flex-wrap items-center">
              {[5, 6, 7, 8, 9, 10, 11].map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  onClick={() => setPlayersPerTeam(n.toString())}
                  whileTap={{ scale: 0.9 }}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    playersPerTeam === n.toString()
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {n}
                </motion.button>
              ))}
              <Input
                type="number"
                min={2}
                max={15}
                value={![5,6,7,8,9,10,11].includes(Number(playersPerTeam)) ? playersPerTeam : ""}
                placeholder="Custom"
                onChange={(e) => { setPlayersPerTeam(e.target.value); setErrors((prev) => ({ ...prev, playersPerTeam: "" })); }}
                className={`h-9 w-20 rounded-xl text-xs font-bold text-center bg-muted/40 border-border/60 placeholder:text-muted-foreground/50 ${
                  ![5,6,7,8,9,10,11].includes(Number(playersPerTeam)) && playersPerTeam ? "ring-1 ring-primary/30 bg-primary/15 text-primary" : ""
                } ${errors.playersPerTeam ? "border-destructive/50" : ""}`}
              />
            </div>
            <ErrorMsg msg={errors.playersPerTeam} />
          </motion.div>

          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="match-venue" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Venue
              </Label>
              <Input
                id="match-venue"
                value={venue}
                onChange={(e) => { setVenue(e.target.value); setErrors((prev) => ({ ...prev, venue: "" })); }}
                placeholder="National Stadium"
                className={`bg-muted/40 border-border/60 ${errors.venue ? "border-destructive/50 bg-destructive/5" : ""}`}
                maxLength={100}
              />
              <ErrorMsg msg={errors.venue} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="match-date" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date
              </Label>
              <Input
                id="match-date"
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setErrors((prev) => ({ ...prev, date: "" })); }}
                className={`bg-muted/40 border-border/60 ${errors.date ? "border-destructive/50 bg-destructive/5" : ""}`}
              />
              <ErrorMsg msg={errors.date} />
            </div>
          </motion.div>

          {/* Short Chris Cricket Toggle */}
          <motion.div custom={2.5} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
            <button
              type="button"
              onClick={() => setIsShortChris(!isShortChris)}
              className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                isShortChris
                  ? "bg-accent/15 border-accent/50 text-accent"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:border-border"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Short Chris Cricket
              {isShortChris && <span className="text-[9px] bg-accent/20 rounded-full px-2 py-0.5">ON</span>}
            </button>
          </motion.div>

          {/* Short Chris Options */}
          <AnimatePresence>
            {isShortChris && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Batting Option */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-accent" /> Batting Style
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBattingOption(1)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        battingOption === 1
                          ? "bg-accent/15 border-accent/50 text-accent"
                          : "bg-muted/40 border-border/60 text-muted-foreground hover:border-border"
                      }`}
                    >
                      🏏 Solo Batting (1 জন)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBattingOption(2)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        battingOption === 2
                          ? "bg-accent/15 border-accent/50 text-accent"
                          : "bg-muted/40 border-border/60 text-muted-foreground hover:border-border"
                      }`}
                    >
                      🏏🏏 Pair Batting (2 জন)
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {battingOption === 1 ? "একজন করে ব্যাটিং করবে" : "দুইজন করে ব্যাটিং করবে (স্ট্রাইকার + নন-স্ট্রাইকার)"}
                  </p>
                </div>

                {/* Max Overs Per Bowler */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    🎳 Best Overs Per Bowler <span className="text-[9px] text-muted-foreground/60">(Optional)</span>
                  </Label>
                  <Input
                    type="number"
                    value={maxOversPerBowler ?? ""}
                    onChange={(e) => setMaxOversPerBowler(e.target.value ? Number(e.target.value) : null)}
                    min={1}
                    max={50}
                    placeholder="e.g. 4"
                    className="bg-muted/40 border-border/60 w-1/2"
                  />
                  <p className="text-[10px] text-muted-foreground">একজন বলার সর্বোচ্চ কত ওভার করতে পারবে</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tournament (optional) */}
          {tournaments.length > 0 && (
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Tournament (optional)
              </Label>
              <Select value={tournamentId} onValueChange={setTournamentId}>
                <SelectTrigger className="bg-muted/40 border-border/60"><SelectValue placeholder="No tournament" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No tournament</SelectItem>
                  {tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </motion.div>
          )}

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
              {mode === "create" ? "Create Match" : "Save Changes"}
            </motion.button>
          </motion.div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
