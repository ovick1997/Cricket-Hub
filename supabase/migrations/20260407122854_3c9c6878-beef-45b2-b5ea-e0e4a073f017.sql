
-- Helper function: check if user is admin in ANY org
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Update SELECT policies to allow system admins cross-org access

-- matches: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view matches" ON matches;
CREATE POLICY "Org members can view matches" ON matches
  FOR SELECT TO public
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- teams: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view teams" ON teams;
CREATE POLICY "Org members can view teams" ON teams
  FOR SELECT TO public
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- players: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view players" ON players;
CREATE POLICY "Org members can view players" ON players
  FOR SELECT TO public
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- player_stats: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view player stats" ON player_stats;
CREATE POLICY "Org members can view player stats" ON player_stats
  FOR SELECT TO authenticated
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- innings: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view innings" ON innings;
CREATE POLICY "Org members can view innings" ON innings
  FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM matches m WHERE m.id = innings.match_id AND (user_in_org(auth.uid(), m.organization_id) OR is_system_admin(auth.uid())))));

-- balls: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view balls" ON balls;
CREATE POLICY "Org members can view balls" ON balls
  FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM innings i JOIN matches m ON m.id = i.match_id WHERE i.id = balls.innings_id AND (user_in_org(auth.uid(), m.organization_id) OR is_system_admin(auth.uid())))));

-- tournaments: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view tournaments" ON tournaments;
CREATE POLICY "Org members can view tournaments" ON tournaments
  FOR SELECT TO public
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- tournament_teams: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view tournament teams" ON tournament_teams;
CREATE POLICY "Org members can view tournament teams" ON tournament_teams
  FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_teams.tournament_id AND (user_in_org(auth.uid(), t.organization_id) OR is_system_admin(auth.uid())))));

-- team_players: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Org members can view team players" ON team_players;
CREATE POLICY "Org members can view team players" ON team_players
  FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM teams t WHERE t.id = team_players.team_id AND (user_in_org(auth.uid(), t.organization_id) OR is_system_admin(auth.uid())))));

-- match_summaries: drop and recreate SELECT policy for authenticated
DROP POLICY IF EXISTS "Org members can view match summaries" ON match_summaries;
CREATE POLICY "Org members can view match summaries" ON match_summaries
  FOR SELECT TO authenticated
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- notifications: update to allow admin to see all org notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_system_admin(auth.uid()));

-- role_permissions: allow admin cross-org view
DROP POLICY IF EXISTS "Org members can view role permissions" ON role_permissions;
CREATE POLICY "Org members can view role permissions" ON role_permissions
  FOR SELECT TO authenticated
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- user_roles: allow admin cross-org view
DROP POLICY IF EXISTS "Users can view roles in their org" ON user_roles;
CREATE POLICY "Users can view roles in their org" ON user_roles
  FOR SELECT TO public
  USING (user_in_org(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- profiles: allow admin to view all profiles
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;
CREATE POLICY "Users can view profiles in their org" ON profiles
  FOR SELECT TO public
  USING (organization_id = get_user_org_id(auth.uid()) OR user_id = auth.uid() OR is_system_admin(auth.uid()));

-- Also allow admin ALL access for managing other orgs' data
-- matches: update ALL policy
DROP POLICY IF EXISTS "Scorers and admins can manage matches" ON matches;
CREATE POLICY "Scorers and admins can manage matches" ON matches
  FOR ALL TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'moderator'::app_role) OR has_role(auth.uid(), organization_id, 'scorer'::app_role) OR is_system_admin(auth.uid()));

-- teams: update ALL policy
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'moderator'::app_role) OR is_system_admin(auth.uid()));

-- players: update ALL policy
DROP POLICY IF EXISTS "Admins can manage players" ON players;
CREATE POLICY "Admins can manage players" ON players
  FOR ALL TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'moderator'::app_role) OR is_system_admin(auth.uid()));

-- tournaments: update ALL policy
DROP POLICY IF EXISTS "Admins can manage tournaments" ON tournaments;
CREATE POLICY "Admins can manage tournaments" ON tournaments
  FOR ALL TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'moderator'::app_role) OR is_system_admin(auth.uid()));

-- tournament_teams: update ALL policy
DROP POLICY IF EXISTS "Admins can manage tournament teams" ON tournament_teams;
CREATE POLICY "Admins can manage tournament teams" ON tournament_teams
  FOR ALL TO public
  USING ((EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_teams.tournament_id AND (has_role(auth.uid(), t.organization_id, 'admin'::app_role) OR has_role(auth.uid(), t.organization_id, 'moderator'::app_role) OR is_system_admin(auth.uid())))));

-- team_players: update ALL policy
DROP POLICY IF EXISTS "Admins can manage team players" ON team_players;
CREATE POLICY "Admins can manage team players" ON team_players
  FOR ALL TO public
  USING ((EXISTS (SELECT 1 FROM teams t WHERE t.id = team_players.team_id AND (has_role(auth.uid(), t.organization_id, 'admin'::app_role) OR has_role(auth.uid(), t.organization_id, 'moderator'::app_role) OR is_system_admin(auth.uid())))));

-- innings: update ALL policy
DROP POLICY IF EXISTS "Scorers can manage innings" ON innings;
CREATE POLICY "Scorers can manage innings" ON innings
  FOR ALL TO public
  USING ((EXISTS (SELECT 1 FROM matches m WHERE m.id = innings.match_id AND (has_role(auth.uid(), m.organization_id, 'admin'::app_role) OR has_role(auth.uid(), m.organization_id, 'scorer'::app_role) OR is_system_admin(auth.uid())))));

-- balls: update ALL policy
DROP POLICY IF EXISTS "Scorers can manage balls" ON balls;
CREATE POLICY "Scorers can manage balls" ON balls
  FOR ALL TO public
  USING ((EXISTS (SELECT 1 FROM innings i JOIN matches m ON m.id = i.match_id WHERE i.id = balls.innings_id AND (has_role(auth.uid(), m.organization_id, 'admin'::app_role) OR has_role(auth.uid(), m.organization_id, 'scorer'::app_role) OR is_system_admin(auth.uid())))));

-- player_stats: update ALL policy
DROP POLICY IF EXISTS "Admins can manage player stats" ON player_stats;
CREATE POLICY "Admins can manage player stats" ON player_stats
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'scorer'::app_role) OR is_system_admin(auth.uid()));

-- match_summaries: update ALL policy
DROP POLICY IF EXISTS "Admins can manage match summaries" ON match_summaries;
CREATE POLICY "Admins can manage match summaries" ON match_summaries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'scorer'::app_role) OR is_system_admin(auth.uid()));

-- role_permissions: update ALL policy
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
CREATE POLICY "Admins can manage role permissions" ON role_permissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR is_system_admin(auth.uid()));

-- user_roles: update ALL policy
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR is_system_admin(auth.uid()));

-- teams DELETE policy
DROP POLICY IF EXISTS "Admins can delete teams" ON teams;
CREATE POLICY "Admins can delete teams" ON teams
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'moderator'::app_role) OR is_system_admin(auth.uid()));