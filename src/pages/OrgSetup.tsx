import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Building2, Clock } from "lucide-react";

const OrgSetup = () => {
  const navigate = useNavigate();
  const { user, organizationId, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [existingOrg, setExistingOrg] = useState<{ id: string; name: string } | null>(null);

  // If org already exists on profile, go to dashboard
  useEffect(() => {
    if (organizationId) {
      navigate("/", { replace: true });
    }
  }, [organizationId, navigate]);

  // Check if any organization exists in the system
  useEffect(() => {
    const checkExistingOrg = async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .limit(1)
        .maybeSingle();

      setExistingOrg(data);
      setChecking(false);
    };
    checkExistingOrg();
  }, []);

  // First user: create org and become admin
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug })
      .select()
      .single();

    if (orgError) {
      toast.error("Failed to create organization: " + orgError.message);
      setLoading(false);
      return;
    }

    // Link profile to org and auto-approve (org creator = admin)
    await supabase
      .from("profiles")
      .update({ organization_id: org.id, is_approved: true })
      .eq("user_id", user.id);

    // Assign admin role
    await supabase
      .from("user_roles")
      .insert({ user_id: user.id, organization_id: org.id, role: "admin" });

    toast.success("Organization created! You are the admin.");
    setLoading(false);
    window.location.href = "/dashboard";
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If an org exists, show "Waiting for assignment" screen
  if (existingOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20">
            <Clock className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Waiting for Assignment</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your account is ready. An admin will assign you to an organization. Please check back later.
            </p>
          </div>
          <button
            onClick={signOut}
            className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  // No org exists: show create screen (first user becomes admin)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Set Up Your Organization</h1>
          <p className="text-sm text-muted-foreground mt-1">You'll be the admin of this organization</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Organization Details</CardTitle>
            <CardDescription>This will be your cricket management workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Mumbai Cricket Academy"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !orgName.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Organization
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OrgSetup;