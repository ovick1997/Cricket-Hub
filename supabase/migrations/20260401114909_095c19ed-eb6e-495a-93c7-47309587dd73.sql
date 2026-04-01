
-- Truncate and recalculate all player_stats from ball data
TRUNCATE player_stats;

-- Insert per-innings batting stats aggregated per player
INSERT INTO player_stats (player_id, organization_id, matches_played, innings_batted, total_runs, balls_faced, fours, sixes, highest_score, not_outs, fifties, hundreds, innings_bowled, overs_bowled, runs_conceded, wickets_taken, best_bowling_wickets, best_bowling_runs, five_wickets, ten_wickets, catches, run_outs, stumpings)
SELECT 
  agg.player_id,
  agg.organization_id,
  agg.matches_played,
  agg.innings_batted,
  agg.total_runs,
  agg.balls_faced,
  agg.fours,
  agg.sixes,
  agg.highest_score,
  0, -- not_outs
  agg.fifties,
  agg.hundreds,
  COALESCE(bowl.innings_bowled, 0),
  COALESCE(bowl.overs_bowled, 0),
  COALESCE(bowl.runs_conceded, 0),
  COALESCE(bowl.wickets_taken, 0),
  COALESCE(bowl.best_bowling_wickets, 0),
  COALESCE(bowl.best_bowling_runs, 999),
  COALESCE(bowl.five_wickets, 0),
  0, -- ten_wickets
  COALESCE(field.catches, 0),
  COALESCE(field.run_outs, 0),
  COALESCE(field.stumpings, 0)
FROM (
  -- Aggregate per-innings batting into per-player totals
  SELECT 
    player_id, organization_id,
    (SELECT COUNT(DISTINCT sub_m.id) FROM balls sub_b JOIN innings sub_i ON sub_i.id = sub_b.innings_id JOIN matches sub_m ON sub_m.id = sub_i.match_id WHERE sub_b.batsman_id = bat_inn.player_id AND sub_m.organization_id = bat_inn.organization_id AND sub_m.status = 'completed')::int as matches_played,
    COUNT(*)::int as innings_batted,
    SUM(inn_runs)::int as total_runs,
    SUM(inn_balls)::int as balls_faced,
    SUM(inn_fours)::int as fours,
    SUM(inn_sixes)::int as sixes,
    MAX(inn_runs)::int as highest_score,
    SUM(CASE WHEN inn_runs >= 50 AND inn_runs < 100 THEN 1 ELSE 0 END)::int as fifties,
    SUM(CASE WHEN inn_runs >= 100 THEN 1 ELSE 0 END)::int as hundreds
  FROM (
    SELECT b.batsman_id as player_id, m.organization_id,
      SUM(b.runs_scored)::int as inn_runs,
      COUNT(*)::int as inn_balls,
      SUM(CASE WHEN b.runs_scored = 4 THEN 1 ELSE 0 END)::int as inn_fours,
      SUM(CASE WHEN b.runs_scored = 6 THEN 1 ELSE 0 END)::int as inn_sixes
    FROM balls b
    JOIN innings i ON i.id = b.innings_id
    JOIN matches m ON m.id = i.match_id
    WHERE m.status = 'completed'
    GROUP BY b.batsman_id, m.organization_id, i.id
  ) bat_inn
  GROUP BY player_id, organization_id
) agg
LEFT JOIN (
  -- Bowling stats per player (aggregated across all matches)
  SELECT bowler_id as player_id, m.organization_id,
    COUNT(DISTINCT m.id)::int as innings_bowled,
    ROUND(SUM(CASE WHEN b.extra_type IS NULL OR b.extra_type IN ('bye', 'leg-bye') THEN 1 ELSE 0 END)::numeric / 6, 1) as overs_bowled,
    SUM(b.runs_scored + b.extra_runs)::int as runs_conceded,
    COUNT(*) FILTER (WHERE b.is_wicket = true)::int as wickets_taken,
    0 as best_bowling_wickets,
    999 as best_bowling_runs,
    0 as five_wickets
  FROM balls b
  JOIN innings i ON i.id = b.innings_id
  JOIN matches m ON m.id = i.match_id
  WHERE m.status = 'completed'
  GROUP BY b.bowler_id, m.organization_id
) bowl ON bowl.player_id = agg.player_id AND bowl.organization_id = agg.organization_id
LEFT JOIN (
  -- Fielding stats
  SELECT b.wicket_fielder_id as player_id, m.organization_id,
    COUNT(*) FILTER (WHERE b.wicket_type = 'Caught')::int as catches,
    COUNT(*) FILTER (WHERE b.wicket_type = 'Run Out')::int as run_outs,
    COUNT(*) FILTER (WHERE b.wicket_type = 'Stumped')::int as stumpings
  FROM balls b
  JOIN innings i ON i.id = b.innings_id
  JOIN matches m ON m.id = i.match_id
  WHERE m.status = 'completed' AND b.is_wicket = true AND b.wicket_fielder_id IS NOT NULL
  GROUP BY b.wicket_fielder_id, m.organization_id
) field ON field.player_id = agg.player_id AND field.organization_id = agg.organization_id;

-- Now insert bowler-only players (who bowled but never batted)
INSERT INTO player_stats (player_id, organization_id, matches_played, innings_bowled, overs_bowled, runs_conceded, wickets_taken, best_bowling_wickets, best_bowling_runs, catches, run_outs, stumpings)
SELECT 
  b.bowler_id,
  m.organization_id,
  COUNT(DISTINCT m.id)::int,
  COUNT(DISTINCT m.id)::int,
  ROUND(SUM(CASE WHEN b.extra_type IS NULL OR b.extra_type IN ('bye', 'leg-bye') THEN 1 ELSE 0 END)::numeric / 6, 1),
  SUM(b.runs_scored + b.extra_runs)::int,
  COUNT(*) FILTER (WHERE b.is_wicket = true)::int,
  0, 999,
  0, 0, 0
FROM balls b
JOIN innings i ON i.id = b.innings_id
JOIN matches m ON m.id = i.match_id
WHERE m.status = 'completed'
  AND NOT EXISTS (SELECT 1 FROM player_stats ps WHERE ps.player_id = b.bowler_id AND ps.organization_id = m.organization_id)
GROUP BY b.bowler_id, m.organization_id;

-- Update best bowling figures per bowler per match
DO $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT b.bowler_id, m.organization_id, m.id as match_id,
      COUNT(*) FILTER (WHERE b.is_wicket = true)::int as wkts,
      SUM(b.runs_scored + b.extra_runs)::int as runs
    FROM balls b
    JOIN innings i ON i.id = b.innings_id
    JOIN matches m ON m.id = i.match_id
    WHERE m.status = 'completed'
    GROUP BY b.bowler_id, m.organization_id, m.id
    ORDER BY COUNT(*) FILTER (WHERE b.is_wicket = true) DESC, SUM(b.runs_scored + b.extra_runs) ASC
  LOOP
    UPDATE player_stats SET
      best_bowling_wickets = GREATEST(best_bowling_wickets, _rec.wkts),
      best_bowling_runs = CASE 
        WHEN _rec.wkts > best_bowling_wickets THEN _rec.runs
        WHEN _rec.wkts = best_bowling_wickets AND _rec.runs < best_bowling_runs THEN _rec.runs
        ELSE best_bowling_runs
      END,
      five_wickets = five_wickets + CASE WHEN _rec.wkts >= 5 THEN 1 ELSE 0 END
    WHERE player_id = _rec.bowler_id AND organization_id = _rec.organization_id;
  END LOOP;
END $$;