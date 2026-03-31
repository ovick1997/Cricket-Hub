import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Radio, Eye, Loader2, Swords, MapPin, Clock } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";

const PublicLiveList = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data } = await supabase
      .from("matches")
      .select("id, venue, match_date, overs, status, result, team1:teams!matches_team1_id_fkey(name, short_name, color), team2:teams!matches_team2_id_fkey(name, short_name, color)")
      .in("status", ["live", "completed"])
      .order("updated_at", { ascending: false })
      .limit(20);
    setMatches(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchMatches(false), 30000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const liveMatches = matches.filter((m) => m.status === "live");
  const recentMatches = matches.filter((m) => m.status === "completed").slice(0, 5);

  return (
    <PublicLayout>
      <div className="px-4 py-4 space-y-5">

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Live Ticker Strip */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="h-3.5 w-3.5 text-destructive animate-pulse" />
              <h2 className="text-xs font-bold text-destructive uppercase tracking-widest">Live Now</h2>
              <div className="flex-1 h-px bg-destructive/20" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {liveMatches.map((m: any, i: number) => (
                <LiveMatchCard key={m.id} match={m} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* No live banner */}
        {!loading && liveMatches.length === 0 && (
          <div className="rounded-xl border border-border/60 bg-card/50 p-6 text-center">
            <Radio className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No live matches right now</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">This page auto-refreshes every 30 seconds</p>
          </div>
        )}

        {/* Recent Results */}
        {recentMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Results</h2>
                <div className="flex-1 h-px bg-border/40" />
              </div>
              <Link to="/results" className="text-[10px] font-semibold text-primary hover:underline">
                View All →
              </Link>
            </div>
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
              {recentMatches.map((m: any, i: number) => (
                <RecentMatchRow key={m.id} match={m} index={i} />
              ))}
            </div>
          </section>
        )}

        {!loading && liveMatches.length === 0 && recentMatches.length === 0 && (
          <div className="text-center py-20">
            <Swords className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No matches available</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

function LiveMatchCard({ match: m, index }: { match: any; index: number }) {
  const t1 = m.team1 as any;
  const t2 = m.team2 as any;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/live/${m.id}`}
        className="block rounded-xl border border-destructive/20 bg-card overflow-hidden hover:border-destructive/40 transition-all group"
      >
        <div className="h-[2px] bg-gradient-to-r from-destructive/60 via-destructive to-destructive/60" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-[9px] font-bold text-destructive uppercase tracking-widest">LIVE</span>
            </div>
            <span className="text-[9px] text-muted-foreground">{m.overs} overs</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold ring-1 ring-border/40"
                  style={{ backgroundColor: (t1?.color || "#22c55e") + "15", color: t1?.color || "#22c55e" }}>{t1?.short_name}</div>
                <span className="text-sm font-semibold text-foreground">{t1?.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold ring-1 ring-border/40"
                  style={{ backgroundColor: (t2?.color || "#22c55e") + "15", color: t2?.color || "#22c55e" }}>{t2?.short_name}</div>
                <span className="text-sm font-semibold text-foreground">{t2?.name}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
            {m.venue && (
              <span className="text-[9px] text-muted-foreground flex items-center gap-1 truncate">
                <MapPin className="h-2.5 w-2.5 shrink-0" />{m.venue}
              </span>
            )}
            <div className="flex items-center gap-1 text-primary text-[10px] font-bold group-hover:translate-x-0.5 transition-transform shrink-0 ml-auto">
              <Eye className="h-3 w-3" /> Watch Live
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RecentMatchRow({ match: m, index }: { match: any; index: number }) {
  const t1 = m.team1 as any;
  const t2 = m.team2 as any;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}>
      <Link to={`/scorecard/${m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
        <div className="flex -space-x-1.5 shrink-0">
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-[8px] font-bold ring-1 ring-background"
            style={{ backgroundColor: (t1?.color || "#22c55e") + "20", color: t1?.color || "#22c55e" }}>{t1?.short_name}</div>
          <div className="h-7 w-7 rounded-md flex items-center justify-center text-[8px] font-bold ring-1 ring-background"
            style={{ backgroundColor: (t2?.color || "#22c55e") + "20", color: t2?.color || "#22c55e" }}>{t2?.short_name}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{t1?.name} vs {t2?.name}</p>
          {m.result && <p className="text-[10px] text-primary font-medium truncate mt-0.5">{m.result}</p>}
        </div>
        <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </Link>
    </motion.div>
  );
}

export default PublicLiveList;
