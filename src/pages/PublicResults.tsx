import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Trophy, Eye, Loader2, Swords, MapPin, Calendar } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";

const PublicResults = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data } = await supabase
      .from("match_summaries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setMatches(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => fetchResults(false), 60000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  return (
    <PublicLayout>
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h1 className="text-lg font-display font-bold text-foreground">Match Results</h1>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="text-center py-20">
            <Swords className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No completed matches yet</p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden divide-y divide-border/30">
            {matches.map((m: any, i: number) => (
              <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <Link to={`/scorecard/${m.match_id}`} className="block px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-md flex items-center justify-center text-[8px] font-bold shrink-0"
                            style={{ backgroundColor: m.team1_color + "20", color: m.team1_color }}>{m.team1_short}</div>
                          <span className="text-xs font-semibold text-foreground truncate">{m.team1_name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground shrink-0">{m.team1_score || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-md flex items-center justify-center text-[8px] font-bold shrink-0"
                            style={{ backgroundColor: m.team2_color + "20", color: m.team2_color }}>{m.team2_short}</div>
                          <span className="text-xs font-semibold text-foreground truncate">{m.team2_name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground shrink-0">{m.team2_score || "—"}</span>
                      </div>
                      {m.result && <p className="text-[10px] text-primary font-medium truncate pt-0.5">{m.result}</p>}
                    </div>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {m.venue && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />{m.venue}
                      </span>
                    )}
                    {m.match_date && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />{new Date(m.match_date).toLocaleDateString()}
                      </span>
                    )}
                    {m.man_of_match && <span className="text-[9px] text-accent font-medium">⭐ {m.man_of_match}</span>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default PublicResults;
