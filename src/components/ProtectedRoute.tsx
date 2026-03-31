import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionKey } from "@/hooks/usePermissions";
import { Loader2, Clock, ShieldX } from "lucide-react";
import { motion } from "framer-motion";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: PermissionKey;
}

export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { session, loading, organizationId, isApproved } = useAuth();
  const location = useLocation();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Show pending approval screen
  if (isApproved === false && location.pathname !== "/org-setup") {
    return <PendingApproval />;
  }

  // Redirect to org setup if no org (but don't loop if already there)
  if (!organizationId && location.pathname !== "/org-setup") {
    return <Navigate to="/org-setup" replace />;
  }

  // Check page-level permission
  if (requiredPermission && organizationId) {
    if (permissionsLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!hasPermission(requiredPermission)) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};

function PendingApproval() {
  const { signOut } = useAuth();

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
          <h1 className="text-xl font-display font-bold text-foreground">Approval Pending</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your account is awaiting admin approval. You'll be able to access the system once an admin approves your account.
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

function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have permission to access this page. Contact your organization admin to request access.
          </p>
        </div>
        <a
          href="/"
          className="inline-block px-6 py-2.5 rounded-xl bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors"
        >
          Go to Dashboard
        </a>
      </motion.div>
    </div>
  );
}
