import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  organizationId: string | null;
  isApproved: boolean | null;
  userRole: string | null;
  signOut: () => Promise<void>;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  organizationId: null,
  isApproved: null,
  userRole: null,
  signOut: async () => {},
  refetchProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setOrganizationId(null);
        setIsApproved(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("organization_id, is_approved")
      .eq("user_id", userId)
      .maybeSingle();
    setOrganizationId(data?.organization_id ?? null);
    setIsApproved(data?.is_approved ?? false);

    // Fetch role
    if (data?.organization_id) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("organization_id", data.organization_id)
        .maybeSingle();
      setUserRole(roleData?.role ?? null);
    } else {
      setUserRole(null);
    }
  };

  const refetchProfile = () => {
    if (session?.user) fetchProfile(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setOrganizationId(null);
    setIsApproved(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, organizationId, isApproved, userRole, signOut, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
