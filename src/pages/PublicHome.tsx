import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Radio, Trophy, BarChart3, ChevronRight, Loader2, MapPin, Swords, ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";

const PublicHome = () => {
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const [liveRes, recentRes] = await Promise.all([
      supabase
        .from("matches")
        .select("id, venue, match_date, overs, status, result, team1:teams!matches_team1_id_fkey(name, short_name, color), team2:teams!matches_team2_id_fkey(name, short_name, color)")
        .eq("status", "live")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("matches")
        .select("id, venue, match_date, overs, status, result, team1:teams!matches_team1_id_fkey(name, short_name, color), team2:teams!matches_team2_id_fkey(name, short_name, color)")
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);
    setLiveMatches(liveRes.data || []);
    setRecentMatches(recentRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <PublicLayout>
      <div className="px-4 space-y-0">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Radio className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Live Cricket Scores</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-black text-foreground tracking-tight leading-tight">
              Follow Every Ball,<br />
              <span className="text-primary">Live.</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md mx-auto">
              Real-time scores, detailed scorecards, and complete match coverage — all in one place.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link
                to="/live"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Radio className="h-4 w-4" /> Live Matches
              </Link>
              <Link
                to="/results"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/80 transition-colors"
              >
                <Trophy className="h-4 w-4" /> Results
              </Link>
            </div>
          </motion.div>
        </section>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Live Matches */}
        {!loading && liveMatches.length > 0 && (
          <section className="pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-destructive animate-pulse" />
                <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Live Now</h2>
              </div>
              <Link to="/live" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {liveMatches.map((m: any, i: number) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Link to={`/live/${m.id}`} className="block rounded-2xl border border-destructive/20 bg-card p-4 hover:border-destructive/40 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-[10px] font-bold uppercase tracking-widest">
                        <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{m.overs} ov</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                          style={{ backgroundColor: (m.team1?.color || "#22c55e") + "15", color: m.team1?.color || "#22c55e" }}>{m.team1?.short_name}</div>
                        <span className="text-sm font-semibold text-foreground">{m.team1?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                          style={{ backgroundColor: (m.team2?.color || "#f59e0b") + "15", color: m.team2?.color || "#f59e0b" }}>{m.team2?.short_name}</div>
                        <span className="text-sm font-semibold text-foreground">{m.team2?.name}</span>
                      </div>
                    </div>
                    {m.venue && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" /> {m.venue}
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Results */}
        {!loading && recentMatches.length > 0 && (
          <section className="pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Recent Results</h2>
              </div>
              <Link to="/results" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentMatches.map((m: any, i: number) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                  <Link to={`/scorecard/${m.id}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 hover:border-primary/20 transition-all group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-foreground truncate">{m.team1?.short_name}</span>
                        <span className="text-muted-foreground text-[10px]">vs</span>
                        <span className="font-bold text-foreground truncate">{m.team2?.short_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto shrink-0">{m.overs} ov</span>
                      </div>
                      {m.result && <p className="text-[11px] text-primary font-medium mt-0.5 truncate">{m.result}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* No matches */}
        {!loading && liveMatches.length === 0 && recentMatches.length === 0 && (
          <div className="text-center py-16">
            <Swords className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No matches available yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Check back soon for live scores and results</p>
          </div>
        )}

        {/* Quick Links */}
        <section className="pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: "/live", icon: Radio, label: "Live Matches", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
              { to: "/results", icon: Trophy, label: "Results", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
              { to: "/leaderboard", icon: BarChart3, label: "Leaderboard", color: "text-accent", bg: "bg-accent/10 border-accent/20" },
              { to: "/auth", icon: Swords, label: "Scorer Login", color: "text-muted-foreground", bg: "bg-muted/30 border-border/40" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-xl border ${item.bg} p-4 text-center hover:scale-[1.02] transition-transform`}
              >
                <item.icon className={`h-5 w-5 ${item.color} mx-auto mb-2`} />
                <span className="text-[11px] font-bold text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PublicHome;