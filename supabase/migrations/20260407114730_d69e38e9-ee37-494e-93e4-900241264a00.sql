CREATE OR REPLACE FUNCTION public.reset_organization_data(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin of ANY org (system-wide admin access)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reset organization data';
  END IF;

  DELETE FROM balls WHERE innings_id IN (
    SELECT i.id FROM innings i JOIN matches m ON m.id = i.match_id WHERE m.organization_id = _org_id
  );
  DELETE FROM innings WHERE match_id IN (SELECT id FROM matches WHERE organization_id = _org_id);
  DELETE FROM match_summaries WHERE organization_id = _org_id;
  DELETE FROM matches WHERE organization_id = _org_id;
  DELETE FROM tournament_teams WHERE tournament_id IN (SELECT id FROM tournaments WHERE organization_id = _org_id);
  DELETE FROM tournaments WHERE organization_id = _org_id;
  DELETE FROM team_players WHERE team_id IN (SELECT id FROM teams WHERE organization_id = _org_id);
  DELETE FROM teams WHERE organization_id = _org_id;
  DELETE FROM notifications WHERE organization_id = _org_id;
END;
$$;