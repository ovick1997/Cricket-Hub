import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, KeyRound, User, Building2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const Account = () => {
  const { user, organizationId, userRole } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgName = async () => {
      if (!organizationId) return;
      const { data } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .maybeSingle();
      setOrgName(data?.name ?? null);
    };
    fetchOrgName();
  }, [organizationId]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 max-w-lg">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg md:text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 md:h-7 md:w-7 text-primary" /> My Account
          </h1>
          <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5">Manage your account settings</p>
        </motion.div>

        {/* Account Info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl md:rounded-2xl border border-border bg-card p-4 md:p-5">
          <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Account Info
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
              <span className="text-xs text-muted-foreground w-14 shrink-0">Email</span>
              <span className="text-sm font-medium text-foreground truncate">{user?.email}</span>
            </div>
            {orgName && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-14 shrink-0">Org</span>
                <span className="text-sm font-medium text-foreground truncate">{orgName}</span>
              </div>
            )}
            {userRole && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-14 shrink-0">Role</span>
                <Badge variant="secondary" className="capitalize text-xs">{userRole}</Badge>
              </div>
            )}
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl md:rounded-2xl border border-border bg-card p-4 md:p-5">
          <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" /> Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="bg-muted/40 border-border/60"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="bg-muted/40 border-border/60"
                required
                minLength={6}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update Password
            </motion.button>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Account;