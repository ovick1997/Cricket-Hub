
CREATE OR REPLACE FUNCTION public.archive_completed_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _inn RECORD;
  _ball RECORD;
  _t1 RECORD;
  _t2 RECORD;
  _t1_score text;
  _t2_score text;
  _completed_count integer;
  _oldest_match_id uuid;
  _motm_name text;
  _bowler_match_wickets RECORD;
  _innings_bat RECORD;
BEGIN
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT name, short_name, color INTO _t1 FROM teams WHERE id = NEW.team1_id;
  SELECT name, short_name, color INTO _t2 FROM teams WHERE id = NEW.team2_id;

  IF NEW.man_of_match_id IS NOT NULL THEN
    SELECT name INTO _motm_name FROM players WHERE id = NEW.man_of_match_id;
  END IF;

  SELECT total_runs || '/' || total_wickets || ' (' || total_overs || ' ov)' INTO _t1_score
    FROM innings WHERE match_id = NEW.id AND batting_team_id = NEW.team1_id
    ORDER BY innings_number LIMIT 1;

  SELECT total_runs || '/' || total_wickets || ' (' || total_overs || ' ov)' INTO _t2_score
    FROM innings WHERE match_id = NEW.id AND batting_team_id = NEW.team2_id
    ORDER BY innings_number LIMIT 1;

  INSERT INTO match_summaries (match_id, organization_id, team1_name, team1_short, team1_color, team1_score,
    team2_name, team2_short, team2_color, team2_score, result, venue, overs, match_date, toss_decision, man_of_match)
  VALUES (NEW.id, NEW.organization_id, _t1.name, _t1.short_name, _t1.color, _t1_score,
    _t2.name, _t2.short_name, _t2.color, _t2_score, NEW.result, NEW.venue, NEW.overs, NEW.match_date, NEW.toss_decision, _motm_name)
  ON CONFLICT (match_id) DO UPDATE SET
    team1_score = EXCLUDED.team1_score, team2_score = EXCLUDED.team2_score, result = EXCLUDED.result, man_of_match = EXCLUDED.man_of_match;

  -- Batting stats: now per-innings to correctly count fifties/hundreds
  FOR _inn IN SELECT id FROM innings WHERE match_id = NEW.id LOOP
    FOR _innings_bat IN
      SELECT batsman_id,
             SUM(runs_scored) as total_runs,
             COUNT(*) as balls,
             SUM(CASE WHEN runs_scored = 4 THEN 1 ELSE 0 END) as fours,
             SUM(CASE WHEN runs_scored = 6 THEN 1 ELSE 0 END) as sixes
      FROM balls WHERE innings_id = _inn.id
      GROUP BY batsman_id
    LOOP
      INSERT INTO player_stats (player_id, organization_id, matches_played, innings_batted, total_runs, balls_faced, fours, sixes, highest_score,
        fifties, hundreds)
      VALUES (_innings_bat.batsman_id, NEW.organization_id, 0, 1, _innings_bat.total_runs, _innings_bat.balls, _innings_bat.fours, _innings_bat.sixes, _innings_bat.total_runs,
        CASE WHEN _innings_bat.total_runs >= 50 AND _innings_bat.total_runs < 100 THEN 1 ELSE 0 END,
        CASE WHEN _innings_bat.total_runs >= 100 THEN 1 ELSE 0 END)
      ON CONFLICT (player_id, organization_id) DO UPDATE SET
        innings_batted = player_stats.innings_batted + 1,
        total_runs = player_stats.total_runs + _innings_bat.total_runs,
        balls_faced = player_stats.balls_faced + _innings_bat.balls,
        fours = player_stats.fours + _innings_bat.fours,
        sixes = player_stats.sixes + _innings_bat.sixes,
        highest_score = GREATEST(player_stats.highest_score, _innings_bat.total_runs),
        fifties = player_stats.fifties + CASE WHEN _innings_bat.total_runs >= 50 AND _innings_bat.total_runs < 100 THEN 1 ELSE 0 END,
        hundreds = player_stats.hundreds + CASE WHEN _innings_bat.total_runs >= 100 THEN 1 ELSE 0 END,
        updated_at = now();
    END LOOP;
  END LOOP;

  -- Now update matches_played once per unique batsman in this match
  FOR _ball IN
    SELECT DISTINCT batsman_id FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = NEW.id)
  LOOP
    UPDATE player_stats SET matches_played = matches_played + 1, updated_at = now()
    WHERE player_id = _ball.batsman_id AND organization_id = NEW.organization_id;
  END LOOP;

  -- Bowling stats (unchanged logic)
  FOR _ball IN
    SELECT bowler_id,
           COUNT(*) FILTER (WHERE extra_type IS NULL OR extra_type IN ('bye', 'leg-bye')) as legal_balls,
           SUM(runs_scored + extra_runs) as runs_given,
           COUNT(*) FILTER (WHERE is_wicket = true) as wickets
    FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = NEW.id)
    GROUP BY bowler_id
  LOOP
    INSERT INTO player_stats (player_id, organization_id, innings_bowled, overs_bowled, runs_conceded, wickets_taken, best_bowling_wickets, best_bowling_runs,
      five_wickets)
    VALUES (_ball.bowler_id, NEW.organization_id, 1, 
            ROUND(_ball.legal_balls::numeric / 6, 1), _ball.runs_given, _ball.wickets, _ball.wickets, _ball.runs_given,
            CASE WHEN _ball.wickets >= 5 THEN 1 ELSE 0 END)
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
      five_wickets = player_stats.five_wickets + CASE WHEN _ball.wickets >= 5 THEN 1 ELSE 0 END,
      updated_at = now();
  END LOOP;

  -- 10-wicket haul
  FOR _bowler_match_wickets IN
    SELECT bowler_id, SUM(wicket_count) as total_wickets
    FROM (
      SELECT bowler_id, COUNT(*) FILTER (WHERE is_wicket = true) as wicket_count
      FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = NEW.id)
      GROUP BY bowler_id, innings_id
    ) sub
    GROUP BY bowler_id
    HAVING SUM(wicket_count) >= 10
  LOOP
    UPDATE player_stats SET ten_wickets = ten_wickets + 1, updated_at = now()
    WHERE player_id = _bowler_match_wickets.bowler_id AND organization_id = NEW.organization_id;
  END LOOP;

  -- Fielding stats
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

  -- Cleanup old ball data
  SELECT COUNT(*) INTO _completed_count FROM matches 
    WHERE organization_id = NEW.organization_id AND status = 'completed';
  
  IF _completed_count > 20 THEN
    FOR _oldest_match_id IN
      SELECT m.id FROM matches m
      WHERE m.organization_id = NEW.organization_id AND m.status = 'completed'
      ORDER BY m.match_date ASC NULLS FIRST, m.created_at ASC
      LIMIT (_completed_count - 20)
    LOOP
      DELETE FROM balls WHERE innings_id IN (SELECT id FROM innings WHERE match_id = _oldest_match_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;