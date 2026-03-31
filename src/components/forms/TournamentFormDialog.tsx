import { useState, useEffect } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Eye, MapPin, Users, DollarSign, CircleDot, Zap } from "lucide-react";

const currencies = [
  { code: "BDT", symbol: "৳", label: "BDT (৳)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "AUD", symbol: "A$", label: "AUD (A$)" },
  { code: "PKR", symbol: "₨", label: "PKR (₨)" },
  { code: "LKR", symbol: "Rs", label: "LKR (Rs)" },
];
const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  format: z.enum(["league", "knockout", "round-robin", "short-chris"]),
  status: z.enum(["upcoming", "ongoing", "completed"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  overs_per_match: z.number().int().min(1, "At least 1 over").max(50, "Max 50 overs"),
  prize_money: z.string().optional(),
  players_per_team: z.number().int().min(2, "At least 2 players").max(30, "Max 30 players"),
  venue: z.string().optional(),
  description: z.string().optional(),
  batting_option: z.number().int().min(1).max(2).optional(),
  max_overs_per_bowler: z.number().int().min(1).max(50).nullable().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return data.end_date >= data.start_date;
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["end_date"],
});

export type TournamentFormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TournamentFormData) => void;
  initialData?: Partial<TournamentFormData>;
  mode?: "create" | "edit";
}

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3 } }),
};

const ErrorMsg = ({ msg }: { msg?: string }) => (
  <AnimatePresence mode="wait">
    {msg && (
      <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} className="text-[10px] text-destructive font-medium">
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

const formatLabels: Record<string, string> = { league: "League", knockout: "Knockout", "round-robin": "Round Robin", "short-chris": "Short Chris Cricket" };
const statusLabels: Record<string, string> = { upcoming: "Upcoming", ongoing: "Ongoing", completed: "Completed" };

export function TournamentFormDialog({ open, onOpenChange, onSubmit, initialData, mode = "create" }: Props) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<string>("league");
  const [status, setStatus] = useState<string>("upcoming");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [oversPerMatch, setOversPerMatch] = useState(20);
  const [prizeMoney, setPrizeMoney] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState(11);
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [battingOption, setBattingOption] = useState(2);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setFormat(initialData?.format ?? "league");
      setStatus(initialData?.status ?? "upcoming");
      setStartDate(initialData?.start_date ?? "");
      setEndDate(initialData?.end_date ?? "");
      setOversPerMatch(initialData?.overs_per_match ?? 20);
      // Parse currency from prize_money if editing (e.g. "৳50,000")
      const pm = initialData?.prize_money ?? "";
      const matchedCurrency = currencies.find(c => pm.startsWith(c.symbol));
      if (matchedCurrency) {
        setCurrency(matchedCurrency.code);
        setPrizeMoney(pm.slice(matchedCurrency.symbol.length));
      } else {
        setCurrency("BDT");
        setPrizeMoney(pm);
      }
      setPlayersPerTeam(initialData?.players_per_team ?? 11);
      setVenue(initialData?.venue ?? "");
      setDescription(initialData?.description ?? "");
      setBattingOption(initialData?.batting_option ?? 2);
      setMaxOversPerBowler(initialData?.max_overs_per_bowler ?? null);
      setErrors({});
    }
  }, [open, initialData]);

  const isShortChris = format === "short-chris";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({
      name, format, status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      overs_per_match: oversPerMatch,
      prize_money: prizeMoney ? `${currencies.find(c => c.code === currency)?.symbol || ""}${prizeMoney}` : undefined,
      players_per_team: playersPerTeam,
      venue: venue || undefined,
      description: description || undefined,
      batting_option: isShortChris ? battingOption : 2,
      max_overs_per_bowler: maxOversPerBowler || null,
    });
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fe[err.path[0] as string] = err.message; });
      setErrors(fe);
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
      <DialogContent className="sm:max-w-lg bg-card border-border/60 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">{mode === "create" ? "Create Tournament" : "Edit Tournament"}</DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Set up your tournament details</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <motion.form onSubmit={handleSubmit} animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
          {/* Tournament Name */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Tournament Name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }} placeholder="e.g. Premier League 2025" className={`bg-muted/40 border-border/60 ${errors.name ? "border-destructive/50 bg-destructive/5" : ""}`} maxLength={80} autoFocus />
            <ErrorMsg msg={errors.name} />
          </motion.div>

          {/* Format & Status */}
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(formatLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Short Chris Batting Option */}
          <AnimatePresence>
            {isShortChris && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overs & Players per team */}
          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <CircleDot className="h-3 w-3" /> Overs Per Match
              </Label>
              <Input type="number" value={oversPerMatch} onChange={(e) => setOversPerMatch(Number(e.target.value))} min={1} max={50} className={`bg-muted/40 border-border/60 ${errors.overs_per_match ? "border-destructive/50 bg-destructive/5" : ""}`} />
              <ErrorMsg msg={errors.overs_per_match} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Players Per Team
              </Label>
              <Input type="number" value={playersPerTeam} onChange={(e) => setPlayersPerTeam(Number(e.target.value))} min={2} max={30} className={`bg-muted/40 border-border/60 ${errors.players_per_team ? "border-destructive/50 bg-destructive/5" : ""}`} />
              <ErrorMsg msg={errors.players_per_team} />
            </div>
          </motion.div>

          {/* Max Overs Per Bowler */}
          <motion.div custom={2.5} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
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
          </motion.div>

          {/* Prize Money & Venue */}
          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Prize Money
              </Label>
              <div className="flex gap-1.5">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-muted/40 border-border/60 w-[90px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c.code} value={c.code} className="text-xs">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={prizeMoney} onChange={(e) => setPrizeMoney(e.target.value)} placeholder="e.g. 50,000" className="bg-muted/40 border-border/60" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Venue
              </Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Sher-e-Bangla" className="bg-muted/40 border-border/60" />
            </div>
          </motion.div>

          {/* Dates */}
          <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted/40 border-border/60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-muted/40 border-border/60" />
            </div>
          </motion.div>

          {/* Description */}
          <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Description (Optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tournament rules, details..." className="bg-muted/40 border-border/60 min-h-[60px] resize-none" maxLength={500} />
          </motion.div>

          {/* Preview */}
          <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="rounded-xl border border-border/60 bg-muted/10 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Preview</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15 ring-1 ring-primary/15">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{name || "Tournament Name"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatLabels[format]} • {oversPerMatch} overs • {playersPerTeam} players/team
                  {isShortChris ? ` • ${battingOption === 1 ? "Solo" : "Pair"} Batting` : ""}
                  {maxOversPerBowler ? ` • Max ${maxOversPerBowler} ov/bowler` : ""}
                  {prizeMoney ? ` • ${currencies.find(c => c.code === currency)?.symbol || ""}${prizeMoney}` : ""}
                  {venue ? ` • ${venue}` : ""}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible" className="flex gap-2 pt-1">
            <motion.button type="button" onClick={() => onOpenChange(false)} whileTap={{ scale: 0.97 }} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
              Cancel
            </motion.button>
            <motion.button type="submit" whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              {mode === "create" ? "Create Tournament" : "Save Changes"}
            </motion.button>
          </motion.div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
