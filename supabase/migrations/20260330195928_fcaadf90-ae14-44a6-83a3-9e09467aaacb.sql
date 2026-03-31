
-- Player career statistics table
CREATE TABLE public.player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matches_played integer NOT NULL DEFAULT 0,
  innings_batted integer NOT NULL DEFAULT 0,
  total_runs integer NOT NULL DEFAULT 0,
  balls_faced integer NOT NULL DEFAULT 0,
  fours integer NOT NULL DEFAULT 0,
  sixes integer NOT NULL DEFAULT 0,
  highest_score integer NOT NULL DEFAULT 0,
  not_outs integer NOT NULL DEFAULT 0,
  innings_bowled integer NOT NULL DEFAULT 0,
  overs_bowled numeric NOT NULL DEFAULT 0,
  runs_conceded integer NOT NULL DEFAULT 0,
  wickets_taken integer NOT NULL DEFAULT 0,
  best_bowling_wickets integer NOT NULL DEFAULT 0,
  best_bowling_runs integer NOT NULL DEFAULT 999,
  catches integer NOT NULL DEFAULT 0,
  run_outs integer NOT NULL DEFAULT 0,
  stumpings integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, organization_id)
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view player stats"
  ON public.player_stats FOR SELECT
  TO authenticated
  USING (user_in_org(auth.uid(), organization_id));

CREATE POLICY "Public can view player stats"
  ON public.player_stats FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can manage player stats"
  ON public.player_stats FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'scorer'::app_role));

-- Match summaries for archived matches (beyond last 10)
CREATE TABLE public.match_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team1_name text NOT NULL,
  team1_short text NOT NULL,
  team1_color text NOT NULL DEFAULT '#22c55e',
  team1_score text,
  team2_name text NOT NULL,
  team2_short text NOT NULL,
  team2_color text NOT NULL DEFAULT '#22c55e',
  team2_score text,
  result text,
  venue text,
  overs integer NOT NULL DEFAULT 20,
  match_date timestamptz,
  toss_winner text,
  toss_decision text,
  man_of_match text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view match summaries"
  ON public.match_summaries FOR SELECT
  TO authenticated
  USING (user_in_org(auth.uid(), organization_id));

CREATE POLICY "Public can view match summaries"
  ON public.match_summaries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can manage match summaries"
  ON public.match_summaries FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role) OR has_role(auth.uid(), organization_id, 'scorer'::app_role));

-- Function to archive a completed match and update player stats
CREATE OR REPLACE FUNCTION public.archive_completed_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inn RECORD;
  _ball RECORD;
  _t1 RECORD;
  _t2 RECORD;
  _t1_score text;
  _t2_score text;
  _completed_count integer;
  _oldest_match_id uuid;
BEGIN
  -- Only run when match status changes to 'completed'
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get team info
  SELECT name, short_name, color INTO _t1 FROM teams WHERE id = NEW.team1_id;
  SELECT name, short_name, color INTO _t2 FROM teams WHERE id = NEW.team2_id;

  -- Get scores
  SELECT total_runs || '/' || total_wickets || ' (' || total_overs || ' ov)' INTO _t1_score
    FROM innings WHERE match_id = NEW.id AND batting_team_id = NEW.team1_id AND innings_number = 1;
  SELECT total_runs || '/' || total_wickets || ' (' || total_overs || ' ov)' INTO _t2_score
    FROM innings WHERE match_id = NEW.id AND batting_team_id = NEW.team2_id;
  IF _t2_score IS NULL THEN
    SELECT total_runs || '/' || total_wickets || ' (' || total_overs || ' ov)' INTO _t2_score
      FROM innings WHERE match_id = NEW.id AND innings_number = 2;
  END IF;

  -- Create summary
  INSERT INTO match_summaries (match_id, organization_id, team1_name, team1_short, team1_color, team1_score,
    team2_name, team2_short, team2_color, team2_score, result, venue, overs, match_date, toss_decision)
  VALUES (NEW.id, NEW.organization_id, _t1.name, _t1.short_name, _t1.color, _t1_score,
    _t2.name, _t2.short_name, _t2.color, _t2_score, NEW.result, NEW.venue, NEW.overs, NEW.match_date, NEW.toss_decision)
  ON CONFLICT (match_id) DO UPDATE SET
    team1_score = EXCLUDED.team1_score, team2_score = EXCLUDED.team2_score, result = EXCLUDED.result;

  -- Update player batting stats from this match
  FOR _ball IN
    SELECT batsman_id, 
           SUM(runs_scored) as total_runs,
           COUNT(*) as balls,
           SUM(CASE WHEN runs_scored = 4 THEN 1 ELSE 0 END) as fours,
           SUM(CASE WHEN runs_scored = 6 THEN 1 ELSE 0 END) as sixes
    FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = NEW.id)
    GROUP BY batsman_id
  LOOP
    INSERT INTO player_stats (player_id, organization_id, matches_played, innings_batted, total_runs, balls_faced, fours, sixes, highest_score)
    VALUES (_ball.batsman_id, NEW.organization_id, 1, 1, _ball.total_runs, _ball.balls, _ball.fours, _ball.sixes, _ball.total_runs)
    ON CONFLICT (player_id, organization_id) DO UPDATE SET
      matches_played = player_stats.matches_played + 1,
      innings_batted = player_stats.innings_batted + 1,
      total_runs = player_stats.total_runs + _ball.total_runs,
      balls_faced = player_stats.balls_faced + _ball.balls,
      fours = player_stats.fours + _ball.fours,
      sixes = player_stats.sixes + _ball.sixes,
      highest_score = GREATEST(player_stats.highest_score, _ball.total_runs),
      updated_at = now();
  END LOOP;

  -- Update player bowling stats
  FOR _ball IN
    SELECT bowler_id,
           COUNT(*) FILTER (WHERE extra_type IS NULL OR extra_type IN ('bye', 'leg-bye')) as legal_balls,
           SUM(runs_scored + extra_runs) as runs_given,
           COUNT(*) FILTER (WHERE is_wicket = true) as wickets
    FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = NEW.id)
    GROUP BY bowler_id
  LOOP
    INSERT INTO player_stats (player_id, organization_id, innings_bowled, overs_bowled, runs_conceded, wickets_taken, best_bowling_wickets, best_bowling_runs)
    VALUES (_ball.bowler_id, NEW.organization_id, 1, 
            ROUND(_ball.legal_balls::numeric / 6, 1), _ball.runs_given, _ball.wickets, _ball.wickets, _ball.runs_given)
    ON CONFLICT (player_id, organization_id) DO UPDATE SET
      innings_bowled = player_stats.innings_bowled + 1,
      overs_bowled = player_stats.overs_bowled + ROUND(_ball.legal_balls::numeric / 6, 1),
      runs_conceded = player_stats.runs_conceded + _ball.runs_given,
      wickets_taken = player_stats.wickets_taken + _ball.wickets,
      best_bowling_wickets = CASE WHEN _ball.wickets > player_stats.best_bowling_wickets THEN _ball.wickets
                              WHEN _ball.wickets = player_stats.best_bowling_wickets AND _ball.runs_given < player_stats.best_bowling_runs THEN _ball.wickets
                              ELSE player_stats.best_bowling_wickets END,
      best_bowling_runs = CASE WHEN _ball.wickets > player_stats.best_bowling_wickets THEN _ball.runs_given
                           WHEN _ball.wickets = player_stats.best_bowling_wickets AND _ball.runs_given < player_stats.best_bowling_runs THEN _ball.runs_given
                           ELSE player_stats.best_bowling_runs END,
      updated_at = now();
  END LOOP;

  -- Update fielding stats (catches, run outs, stumpings)
  FOR _ball IN
    SELECT wicket_fielder_id, wicket_type,
           COUNT(*) as cnt
    FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = NEW.id)
      AND is_wicket = true AND wicket_fielder_id IS NOT NULL
    GROUP BY wicket_fielder_id, wicket_type
  LOOP
    INSERT INTO player_stats (player_id, organization_id,
      catches, run_outs, stumpings)
    VALUES (_ball.wicket_fielder_id, NEW.organization_id,
      CASE WHEN _ball.wicket_type = 'Caught' THEN _ball.cnt ELSE 0 END,
      CASE WHEN _ball.wicket_type = 'Run Out' THEN _ball.cnt ELSE 0 END,
      CASE WHEN _ball.wicket_type = 'Stumped' THEN _ball.cnt ELSE 0 END)
    ON CONFLICT (player_id, organization_id) DO UPDATE SET
      catches = player_stats.catches + CASE WHEN _ball.wicket_type = 'Caught' THEN _ball.cnt ELSE 0 END,
      run_outs = player_stats.run_outs + CASE WHEN _ball.wicket_type = 'Run Out' THEN _ball.cnt ELSE 0 END,
      stumpings = player_stats.stumpings + CASE WHEN _ball.wicket_type = 'Stumped' THEN _ball.cnt ELSE 0 END,
      updated_at = now();
  END LOOP;

  -- Clean up ball-by-ball data for matches beyond the last 10
  SELECT COUNT(*) INTO _completed_count FROM matches 
    WHERE organization_id = NEW.organization_id AND status = 'completed';
  
  IF _completed_count > 10 THEN
    FOR _oldest_match_id IN
      SELECT m.id FROM matches m
      WHERE m.organization_id = NEW.organization_id AND m.status = 'completed'
      ORDER BY m.match_date ASC NULLS FIRST, m.created_at ASC
      LIMIT (_completed_count - 10)
    LOOP
      DELETE FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = _oldest_match_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER archive_match_on_complete
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION archive_completed_match();
