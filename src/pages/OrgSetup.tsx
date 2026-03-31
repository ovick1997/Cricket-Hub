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
import { Loader2, Building2 } from "lucide-react";

const OrgSetup = () => {
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");

  // If org already exists, go to dashboard
  useEffect(() => {
    if (organizationId) {
      navigate("/", { replace: true });
    }
  }, [organizationId, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug })
      .select()
      .single();

    if (orgError) {
      // If INSERT not allowed, we need a different approach
      toast.error("Failed to create organization: " + orgError.message);
      setLoading(false);
      return;
    }

    // Link profile to org and auto-approve (first user / org creator)
    await supabase
      .from("profiles")
      .update({ organization_id: org.id, is_approved: true })
      .eq("user_id", user.id);

    // Assign admin role
    await supabase
      .from("user_roles")
      .insert({ user_id: user.id, organization_id: org.id, role: "admin" });

    toast.success("Organization created!");
    setLoading(false);
    // Force page reload to refresh org context
    window.location.href = "/dashboard";
  };

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
          <p className="text-sm text-muted-foreground mt-1">Create your cricket organization to get started</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Organization Details</CardTitle>
            <CardDescription>This will be your team management workspace</CardDescription>
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