import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  organizationId: string | null;
  profileOrganizationId: string | null;
  isApproved: boolean | null;
  userRole: string | null;
  isAdmin: boolean;
  allOrganizations: Organization[];
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string) => void;
  signOut: () => Promise<void>;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  organizationId: null,
  profileOrganizationId: null,
  isApproved: null,
  userRole: null,
  isAdmin: false,
  allOrganizations: [],
  activeOrganizationId: null,
  setActiveOrganizationId: () => {},
  signOut: async () => {},
  refetchProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOrgId, setProfileOrgId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const isAdmin = userRole === "admin";

  useEffect(() => {
    let initialSessionResolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialSessionResolved) return;
      
      setSession(session);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfileOrgId(null);
        setIsApproved(null);
        setUserRole(null);
        setAllOrganizations([]);
        setActiveOrgId(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      initialSessionResolved = true;
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
    const orgId = data?.organization_id ?? null;
    setProfileOrgId(orgId);
    setIsApproved(data?.is_approved ?? false);

    // Fetch role
    let role: string | null = null;
    if (orgId) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("organization_id", orgId)
        .maybeSingle();
      role = roleData?.role ?? null;
      setUserRole(role);
    } else {
      setUserRole(null);
    }

    // If admin, fetch all organizations
    if (role === "admin") {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url")
        .order("name");
      setAllOrganizations(orgs ?? []);
      // Default active org to user's own org
      setActiveOrgId((prev) => prev ?? orgId);
    } else {
      setAllOrganizations([]);
      setActiveOrgId(orgId);
    }
  };

  const setActiveOrganizationId = useCallback((id: string) => {
    setActiveOrgId(id);
  }, []);

  const refetchProfile = () => {
    if (session?.user) fetchProfile(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfileOrgId(null);
    setIsApproved(null);
    setUserRole(null);
    setAllOrganizations([]);
    setActiveOrgId(null);
  };

  // organizationId = activeOrgId for admins, profileOrgId for others
  const organizationId = isAdmin ? activeOrgId : profileOrgId;

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      organizationId,
      profileOrganizationId: profileOrgId,
      isApproved,
      userRole,
      isAdmin,
      allOrganizations,
      activeOrganizationId: activeOrgId,
      setActiveOrganizationId,
      signOut,
      refetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};