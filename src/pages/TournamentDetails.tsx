import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, Plus, Trash2, Loader2, Calendar, Users, Swords, X, BarChart3, GitBranch, MapPin, DollarSign, CircleDot, FileText } from "lucide-react";
import { TournamentFormDialog, type TournamentFormData } from "@/components/forms/TournamentFormDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { TournamentBracket } from "@/components/TournamentBracket";

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  upcoming: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  ongoing: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary animate-pulse-glow" },
  completed: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tournamentTeams = [] } = useQuery({
    queryKey: ["tournament_teams", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournament_teams").select("*, team:teams(*)").eq("tournament_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tournamentMatches = [] } = useQuery({
    queryKey: ["tournament_matches", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, team1:teams!matches_team1_id_fkey(name, short_name, color), team2:teams!matches_team2_id_fkey(name, short_name, color)")
        .eq("tournament_id", id!)
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch innings for NRR calculation
  const matchIds = tournamentMatches.filter((m: any) => m.status === "completed").map((m: any) => m.id);
  const { data: tournamentInnings = [] } = useQuery({
    queryKey: ["tournament_innings", id, matchIds],
    queryFn: async () => {
      if (matchIds.length === 0) return [];
      const { data, error } = await supabase
        .from("innings")
        .select("*")
        .in("match_id", matchIds);
      if (error) throw error;
      return data;
    },
    enabled: matchIds.length > 0,
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ["teams", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").eq("organization_id", organizationId!);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const updateTournament = useMutation({
    mutationFn: async (formData: TournamentFormData) => {
      const { error } = await supabase.from("tournaments").update({
        name: formData.name,
        format: formData.format as any,
        status: formData.status as any,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        overs_per_match: formData.overs_per_match,
        prize_money: formData.prize_money || null,
        players_per_team: formData.players_per_team,
        venue: formData.venue || null,
        description: formData.description || null,
        batting_option: formData.batting_option ?? 2,
        max_overs_per_bowler: formData.max_overs_per_bowler || null,
      } as any).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tournament", id] }); toast.success("Tournament updated!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteTournament = useMutation({
    mutationFn: async () => {
      await supabase.from("tournament_teams").delete().eq("tournament_id", id!);
      await supabase.from("matches").update({ tournament_id: null }).eq("tournament_id", id!);
      const { error } = await supabase.from("tournaments").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tournament deleted!"); navigate("/tournaments"); },
    onError: (e) => toast.error(e.message),
  });

  const addTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("tournament_teams").insert({ tournament_id: id!, team_id: teamId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tournament_teams", id] }); toast.success("Team added!"); },
    onError: (e) => toast.error(e.message),
  });

  const removeTeam = useMutation({
    mutationFn: async (ttId: string) => {
      const { error } = await supabase.from("tournament_teams").delete().eq("id", ttId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tournament_teams", id] }); toast.success("Team removed!"); },
    onError: (e) => toast.error(e.message),
  });

  const addedTeamIds = tournamentTeams.map((tt: any) => tt.team_id);
  const availableTeams = allTeams.filter((t) => !addedTeamIds.includes(t.id));

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></DashboardLayout>;
  if (!tournament) return <DashboardLayout><div className="text-center py-20 text-muted-foreground">Tournament not found</div></DashboardLayout>;

  const sc = statusConfig[tournament.status] || statusConfig.upcoming;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button onClick={() => navigate("/tournaments")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Tournaments
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 md:p-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15">
                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-display font-bold text-foreground tracking-tight">{tournament.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${sc.bg} ${sc.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{tournament.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">{tournament.format}</span>
                  {tournament.start_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(tournament.start_date), "MMM d, yyyy")}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditOpen(true)} className="px-3 py-2 rounded-xl bg-muted/60 text-muted-foreground text-xs font-semibold hover:bg-muted hover:text-foreground transition-colors">Edit</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (confirm("Delete this tournament?")) deleteTournament.mutate(); }} className="px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tournament Info Cards */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-1.5 mb-1">
              <CircleDot className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-semibold">Overs</span>
            </div>
            <p className="text-lg font-bold text-foreground">{tournament.overs_per_match ?? 20}</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-semibold">Players/Team</span>
            </div>
            <p className="text-lg font-bold text-foreground">{tournament.players_per_team ?? 11}</p>
          </div>
          {tournament.prize_money && (
            <div className="p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3 w-3 text-accent" />
                <span className="text-[10px] text-muted-foreground font-semibold">Prize</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{tournament.prize_money}</p>
            </div>
          )}
          {tournament.venue && (
            <div className="p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="h-3 w-3 text-info" />
                <span className="text-[10px] text-muted-foreground font-semibold">Venue</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{tournament.venue}</p>
            </div>
          )}
        </motion.div>

        {tournament.description && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Description</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tournament.description}</p>
          </motion.div>
        )}

        {/* Teams Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Teams ({tournamentTeams.length})</h2>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAddTeamOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Team
            </motion.button>
          </div>
          {tournamentTeams.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No teams added yet</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {tournamentTeams.map((tt: any) => (
                <div key={tt.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card group hover:border-primary/15 transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: (tt.team?.color || "#22c55e") + "15", color: tt.team?.color || "#22c55e" }}>
                      {tt.team?.short_name || "??"}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{tt.team?.name || "Unknown"}</span>
                  </div>
                  <button onClick={() => removeTeam.mutate(tt.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Points Table / Standings */}
        {tournamentTeams.length > 0 && (() => {
          const standings = tournamentTeams.map((tt: any) => {
            const teamId = tt.team_id;
            let played = 0, won = 0, lost = 0, drawn = 0, nr = 0;
            let runsScored = 0, oversFaced = 0, runsConceded = 0, oversBowled = 0;
            tournamentMatches.forEach((m: any) => {
              if (m.status !== "completed") return;
              if (m.team1_id !== teamId && m.team2_id !== teamId) return;
              played++;
              const result = (m.result || "").toLowerCase();
              if (!result || result.includes("no result") || result.includes("abandoned")) { nr++; return; }
              if (result.includes("draw") || result.includes("tie")) { drawn++; return; }
              const team1Name = (m.team1?.name || "").toLowerCase();
              const team2Name = (m.team2?.name || "").toLowerCase();
              const isTeam1 = m.team1_id === teamId;
              const teamName = isTeam1 ? team1Name : team2Name;
              if (result.includes(teamName) && (result.includes("won") || result.includes("win"))) { won++; }
              else { lost++; }

              // NRR: gather innings data for this match
              const matchInnings = tournamentInnings.filter((inn: any) => inn.match_id === m.id);
              matchInnings.forEach((inn: any) => {
                if (inn.batting_team_id === teamId) {
                  runsScored += inn.total_runs || 0;
                  oversFaced += inn.total_overs || 0;
                } else if (inn.bowling_team_id === teamId) {
                  runsConceded += inn.total_runs || 0;
                  oversBowled += inn.total_overs || 0;
                }
              });
            });
            const points = won * 2 + nr * 1;
            const nrr = (oversFaced > 0 && oversBowled > 0)
              ? (runsScored / oversFaced) - (runsConceded / oversBowled)
              : 0;
            return { ...tt, played, won, lost, drawn, nr, points, nrr };
          }).sort((a: any, b: any) => b.points - a.points || b.nrr - a.nrr || b.won - a.won);

          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-3">
              <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Points Table
              </h2>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left px-3 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">#</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Team</th>
                        <th className="text-center px-2 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">P</th>
                        <th className="text-center px-2 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">W</th>
                        <th className="text-center px-2 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">L</th>
                        <th className="text-center px-2 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest hidden sm:table-cell">D</th>
                        <th className="text-center px-2 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest hidden sm:table-cell">NR</th>
                        <th className="text-center px-2 py-2.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">NRR</th>
                        <th className="text-center px-3 py-2.5 text-[10px] font-bold text-primary uppercase tracking-widest">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {standings.map((s: any, i: number) => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 + i * 0.03 }}
                          className={`transition-colors ${i < 2 ? "bg-primary/[0.03]" : ""}`}
                        >
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded flex items-center justify-center text-[8px] font-bold shrink-0" style={{ backgroundColor: (s.team?.color || "#22c55e") + "15", color: s.team?.color }}>
                                {s.team?.short_name}
                              </div>
                              <span className="font-semibold text-foreground truncate">{s.team?.name || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="text-center px-2 py-2.5 text-muted-foreground">{s.played}</td>
                          <td className="text-center px-2 py-2.5 font-semibold text-primary">{s.won}</td>
                          <td className="text-center px-2 py-2.5 text-muted-foreground">{s.lost}</td>
                          <td className="text-center px-2 py-2.5 text-muted-foreground hidden sm:table-cell">{s.drawn}</td>
                          <td className="text-center px-2 py-2.5 text-muted-foreground hidden sm:table-cell">{s.nr}</td>
                          <td className={`text-center px-2 py-2.5 font-semibold ${s.nrr > 0 ? "text-primary" : s.nrr < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {s.nrr > 0 ? "+" : ""}{s.nrr.toFixed(3)}
                          </td>
                          <td className="text-center px-3 py-2.5 font-bold text-foreground">{s.points}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground px-1">Win = 2 pts • No Result = 1 pt • Loss = 0 pts • NRR = (Runs Scored/Overs Faced) − (Runs Conceded/Overs Bowled)</p>
            </motion.div>
          );
        })()}

        {/* Bracket View for Knockout */}
        {tournament.format === "knockout" && tournamentTeams.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="space-y-3">
            <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" /> Bracket
            </h2>
            <div className="rounded-2xl border border-border bg-card p-4 overflow-hidden">
              <TournamentBracket matches={tournamentMatches} teams={tournamentTeams} />
            </div>
          </motion.div>
        )}

        {/* Matches Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><Swords className="h-4 w-4 text-primary" /> Matches ({tournamentMatches.length})</h2>
          {tournamentMatches.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No matches linked to this tournament. When creating a match, assign it to a tournament.</p>
          ) : (
            <div className="space-y-2">
              {tournamentMatches.map((m: any) => (
                <div key={m.id} onClick={() => m.status === "completed" ? navigate(`/scorecard/${m.id}`) : undefined} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/15 transition-all cursor-pointer gap-2">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <div className="h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: (m.team1?.color || "#22c55e") + "15", color: m.team1?.color }}>
                        {m.team1?.short_name}
                      </div>
                      <span className="text-xs font-semibold truncate">{m.team1?.name || "TBD"}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">vs</span>
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <div className="h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: (m.team2?.color || "#f59e0b") + "15", color: m.team2?.color }}>
                        {m.team2?.short_name}
                      </div>
                      <span className="text-xs font-semibold truncate">{m.team2?.name || "TBD"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-8 sm:ml-0">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${m.status === "live" ? "bg-primary/15 text-primary" : m.status === "completed" ? "bg-muted text-muted-foreground" : "bg-info/15 text-info"}`}>{m.status}</span>
                    {m.match_date && <span className="text-[10px] text-muted-foreground">{format(new Date(m.match_date), "MMM d")}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Edit Dialog */}
        <TournamentFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          initialData={{
            name: tournament.name,
            format: tournament.format as any,
            status: tournament.status,
            start_date: tournament.start_date || "",
            end_date: tournament.end_date || "",
            overs_per_match: tournament.overs_per_match ?? 20,
            prize_money: tournament.prize_money || "",
            players_per_team: tournament.players_per_team ?? 11,
            venue: tournament.venue || "",
            description: tournament.description || "",
            batting_option: (tournament as any).batting_option ?? 2,
            max_overs_per_bowler: (tournament as any).max_overs_per_bowler ?? null,
          }}
          onSubmit={(data) => updateTournament.mutate(data)}
        />

        {/* Add Team Dialog */}
        <Dialog open={addTeamOpen} onOpenChange={setAddTeamOpen}>
          <DialogContent className="sm:max-w-sm bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="font-display">Add Team to Tournament</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableTeams.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No more teams available to add</p>
              ) : (
                availableTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => { addTeam.mutate(team.id); setAddTeamOpen(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: team.color + "15", color: team.color }}>
                      {team.short_name}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{team.name}</span>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TournamentDetails;
