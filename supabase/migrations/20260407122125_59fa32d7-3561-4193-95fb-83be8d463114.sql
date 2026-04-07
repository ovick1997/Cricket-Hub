
CREATE OR REPLACE FUNCTION public.selective_reset_organization_data(
  _org_id uuid,
  _delete_matches boolean DEFAULT false,
  _delete_tournaments boolean DEFAULT false,
  _delete_teams boolean DEFAULT false,
  _delete_player_stats boolean DEFAULT false,
  _delete_players boolean DEFAULT false,
  _delete_notifications boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin of ANY org
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reset organization data';
  END IF;

  -- Matches: balls → innings → match_summaries → matches
  IF _delete_matches THEN
    DELETE FROM balls WHERE innings_id IN (
      SELECT i.id FROM innings i JOIN matches m ON m.id = i.match_id WHERE m.organization_id = _org_id
    );
    DELETE FROM innings WHERE match_id IN (SELECT id FROM matches WHERE organization_id = _org_id);
    DELETE FROM match_summaries WHERE organization_id = _org_id;
    DELETE FROM matches WHERE organization_id = _org_id;
  END IF;

  -- Tournaments: tournament_teams → tournaments
  IF _delete_tournaments THEN
    DELETE FROM tournament_teams WHERE tournament_id IN (SELECT id FROM tournaments WHERE organization_id = _org_id);
    DELETE FROM tournaments WHERE organization_id = _org_id;
  END IF;

  -- Teams: team_players → teams
  IF _delete_teams THEN
    DELETE FROM team_players WHERE team_id IN (SELECT id FROM teams WHERE organization_id = _org_id);
    DELETE FROM teams WHERE organization_id = _org_id;
  END IF;

  -- Players: player_stats + players (deleting players implies deleting their stats too)
  IF _delete_players THEN
    DELETE FROM player_stats WHERE organization_id = _org_id;
    DELETE FROM players WHERE organization_id = _org_id;
  ELSIF _delete_player_stats THEN
    -- Only reset stats, keep players
    DELETE FROM player_stats WHERE organization_id = _org_id;
  END IF;

  -- Notifications
  IF _delete_notifications THEN
    DELETE FROM notifications WHERE organization_id = _org_id;
  END IF;
END;
$$;