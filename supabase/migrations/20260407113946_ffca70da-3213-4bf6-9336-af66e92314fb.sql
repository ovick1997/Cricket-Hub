
CREATE OR REPLACE FUNCTION public.reset_organization_data(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin of this org
  IF NOT has_role(auth.uid(), _org_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can reset organization data';
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
  -- Delete notifications
  DELETE FROM notifications WHERE organization_id = _org_id;
END;
$$;