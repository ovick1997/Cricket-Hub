import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Swords, Radio, Eye } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);

  // Fetch live matches (public, no auth needed)
  useEffect(() => {
    supabase
      .from("matches")
      .select("id, venue, match_date, team1:teams!matches_team1_id_fkey(name, short_name, color), team2:teams!matches_team2_id_fkey(name, short_name, color)")
      .eq("status", "live")
      .then(({ data }) => setLiveMatches(data || []));
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a verification link!");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a password reset link!");
      setShowForgot(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Swords className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">CricketHub</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage matches, score live, win big</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardTitle className="text-lg">Welcome back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
                <form onSubmit={handleLogin} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>

                {showForgot && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-medium text-foreground mb-2">Reset Password</p>
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                      <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Send Reset Link
                      </Button>
                    </form>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <CardTitle className="text-lg">Create account</CardTitle>
                <CardDescription>Get started with CricketHub</CardDescription>
                <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Live Matches Section */}
        {liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 space-y-2.5"
          >
            <div className="flex items-center gap-2 justify-center">
              <Radio className="h-3.5 w-3.5 text-destructive animate-pulse" />
              <span className="text-sm font-bold text-foreground">Live Now</span>
            </div>
            {liveMatches.map((m: any) => (
              <Link
                key={m.id}
                to={`/live/${m.id}`}
                className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-3 hover:bg-destructive/10 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-1.5">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold ring-1 ring-border" style={{ backgroundColor: (m.team1 as any)?.color + "20", color: (m.team1 as any)?.color }}>
                      {(m.team1 as any)?.short_name}
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold ring-1 ring-border" style={{ backgroundColor: (m.team2 as any)?.color + "20", color: (m.team2 as any)?.color }}>
                      {(m.team2 as any)?.short_name}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{(m.team1 as any)?.name} vs {(m.team2 as any)?.name}</p>
                    {m.venue && <p className="text-[10px] text-muted-foreground truncate">{m.venue}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-bold">Watch</span>
                </div>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Always show a link to browse live matches */}
        <div className="mt-4 text-center">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Live Matches
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
