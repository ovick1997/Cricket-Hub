
-- Allow admins to delete their organization
CREATE POLICY "Admins can delete their organization"
ON public.organizations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), id, 'admin'::app_role));

-- Create a function to cascade-delete an organization and all related data
CREATE OR REPLACE FUNCTION public.delete_organization_cascade(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin of this org
  IF NOT has_role(auth.uid(), _org_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete an organization';
  END IF;

  -- Delete balls for matches in this org
  DELETE FROM balls WHERE innings_id IN (
    SELECT i.id FROM innings i JOIN matches m ON m.id = i.match_id WHERE m.organization_id = _org_id
  );
  -- Delete innings
  DELETE FROM innings WHERE match_id IN (SELECT id FROM matches WHERE organization_id = _org_id);
  -- Delete match summaries
  DELETE FROM match_summaries WHERE organization_id = _org_id;
  -- Delete matches
  DELETE FROM matches WHERE organization_id = _org_id;
  -- Delete tournament teams
  DELETE FROM tournament_teams WHERE tournament_id IN (SELECT id FROM tournaments WHERE organization_id = _org_id);
  -- Delete tournaments
  DELETE FROM tournaments WHERE organization_id = _org_id;
  -- Delete team players
  DELETE FROM team_players WHERE team_id IN (SELECT id FROM teams WHERE organization_id = _org_id);
  -- Delete teams
  DELETE FROM teams WHERE organization_id = _org_id;
  -- Delete player stats
  DELETE FROM player_stats WHERE organization_id = _org_id;
  -- Delete players
  DELETE FROM players WHERE organization_id = _org_id;
  -- Delete notifications
  DELETE FROM notifications WHERE organization_id = _org_id;
  -- Delete role permissions
  DELETE FROM role_permissions WHERE organization_id = _org_id;
  -- Delete user roles
  DELETE FROM user_roles WHERE organization_id = _org_id;
  -- Unlink profiles
  UPDATE profiles SET organization_id = NULL, is_approved = false WHERE organization_id = _org_id;
  -- Delete the organization
  DELETE FROM organizations WHERE id = _org_id;
END;
$$;
