import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, Calendar, MapPin, Trophy, Search, X, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 10;

const MatchHistory = () => {
  const { organizationId } = useAuth();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [oversFilter, setOversFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ["match_summaries", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("match_summaries")
        .select("*")
        .eq("organization_id", organizationId)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { teams, oversOptions } = useMemo(() => {
    const teamSet = new Set<string>();
    const oversSet = new Set<number>();
    summaries.forEach((m: any) => {
      teamSet.add(m.team1_name);
      teamSet.add(m.team2_name);
      oversSet.add(m.overs);
    });
    return { teams: Array.from(teamSet).sort(), oversOptions: Array.from(oversSet).sort((a, b) => a - b) };
  }, [summaries]);

  const filtered = useMemo(() => {
    let result = [...summaries];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m: any) =>
        m.team1_name.toLowerCase().includes(q) || m.team2_name.toLowerCase().includes(q) ||
        m.team1_short.toLowerCase().includes(q) || m.team2_short.toLowerCase().includes(q) ||
        (m.venue && m.venue.toLowerCase().includes(q)) || (m.result && m.result.toLowerCase().includes(q)) ||
        (m.man_of_match && m.man_of_match.toLowerCase().includes(q))
      );
    }
    if (teamFilter !== "all") result = result.filter((m: any) => m.team1_name === teamFilter || m.team2_name === teamFilter);
    if (oversFilter !== "all") result = result.filter((m: any) => m.overs === Number(oversFilter));
    result.sort((a: any, b: any) => {
      if (sortBy === "date-asc") return new Date(a.match_date || 0).getTime() - new Date(b.match_date || 0).getTime();
      if (sortBy === "date-desc") return new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime();
      if (sortBy === "overs-asc") return a.overs - b.overs;
      if (sortBy === "overs-desc") return b.overs - a.overs;
      return 0;
    });
    return result;
  }, [summaries, search, teamFilter, oversFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => setPage(1), [search, teamFilter, oversFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = teamFilter !== "all" || oversFilter !== "all" || search.trim() !== "";
  const clearFilters = () => { setSearch(""); setTeamFilter("all"); setOversFilter("all"); setSortBy("date-desc"); };

  return (
    <DashboardLayout>
      <div className="space-y-3 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Match History</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{summaries.length} completed matches</p>
        </motion.div>

        {/* Search & Filter Bar */}
        {summaries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 bg-muted/30 border-border/50 h-8 text-xs" />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowFilters(!showFilters)}
                className={`h-8 px-2.5 rounded-lg border text-[10px] font-medium flex items-center gap-1 transition-colors shrink-0 ${
                  showFilters || hasActiveFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground"
                }`}>
                <SlidersHorizontal className="h-3 w-3" />
                {hasActiveFilters && <span className="h-3.5 min-w-[14px] px-0.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                  {[teamFilter !== "all", oversFilter !== "all"].filter(Boolean).length}
                </span>}
              </motion.button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40">
                    <div className="min-w-[120px] flex-1">
                      <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Team</label>
                      <Select value={teamFilter} onValueChange={setTeamFilter}>
                        <SelectTrigger className="h-7 text-[10px] bg-card border-border/50"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Teams</SelectItem>
                          {teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[100px]">
                      <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Overs</label>
                      <Select value={oversFilter} onValueChange={setOversFilter}>
                        <SelectTrigger className="h-7 text-[10px] bg-card border-border/50"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {oversOptions.map((o) => <SelectItem key={o} value={String(o)}>{o} ov</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[120px]">
                      <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Sort</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-7 text-[10px] bg-card border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Newest</SelectItem>
                          <SelectItem value="date-asc">Oldest</SelectItem>
                          <SelectItem value="overs-desc">Most Overs</SelectItem>
                          <SelectItem value="overs-asc">Fewest Overs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {hasActiveFilters && (
                      <div className="flex items-end">
                        <button onClick={clearFilters} className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive transition-colors">Clear</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {hasActiveFilters && <p className="text-[10px] text-muted-foreground">{filtered.length} of {summaries.length} matches</p>}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-xs">No match history yet</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-xs">No matches found</p>
            <button onClick={clearFilters} className="mt-2 text-[10px] text-primary hover:text-primary/80">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              {paged.map((match: any, i: number) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/15 transition-all"
                >
                  {/* Team color strip */}
                  <div className="h-[2px] flex">
                    <div className="flex-1" style={{ backgroundColor: match.team1_color }} />
                    <div className="flex-1" style={{ backgroundColor: match.team2_color }} />
                  </div>

                  <div className="px-3 py-2.5">
                    {/* Teams row */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center font-display font-bold text-[9px] ring-1 shrink-0"
                          style={{ backgroundColor: match.team1_color + "15", color: match.team1_color, borderColor: match.team1_color + "30" }}>
                          {match.team1_short}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{match.team1_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{match.team1_score || "–"}</p>
                        </div>
                      </div>

                      <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">vs</span>

                      <div className="flex-1 min-w-0 flex items-center gap-2 justify-end">
                        <div className="min-w-0 text-right">
                          <p className="text-xs font-semibold text-foreground truncate">{match.team2_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{match.team2_score || "–"}</p>
                        </div>
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center font-display font-bold text-[9px] ring-1 shrink-0"
                          style={{ backgroundColor: match.team2_color + "15", color: match.team2_color, borderColor: match.team2_color + "30" }}>
                          {match.team2_short}
                        </div>
                      </div>
                    </div>

                    {/* Result */}
                    {match.result && (
                      <p className="mt-1.5 text-[10px] font-semibold text-primary text-center px-2 py-1 rounded-md bg-primary/5 border border-primary/10 truncate">
                        {match.result}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-2.5 mt-1.5 text-[9px] text-muted-foreground">
                      {match.match_date && (
                        <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{format(new Date(match.match_date), "dd MMM yyyy")}</span>
                      )}
                      {match.venue && (
                        <span className="flex items-center gap-0.5 truncate"><MapPin className="h-2.5 w-2.5 shrink-0" />{match.venue}</span>
                      )}
                      <span className="ml-auto shrink-0">{match.overs} ov</span>
                      {match.man_of_match && (
                        <span className="flex items-center gap-0.5 shrink-0"><Trophy className="h-2.5 w-2.5 text-amber-500" />{match.man_of_match}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-7 min-w-[28px] px-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                      p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MatchHistory;
