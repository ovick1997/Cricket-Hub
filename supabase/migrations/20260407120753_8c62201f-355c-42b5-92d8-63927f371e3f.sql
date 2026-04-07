
CREATE OR REPLACE FUNCTION public.get_distinct_match_overs(_org_id uuid DEFAULT NULL)
RETURNS TABLE(overs int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT m.overs
  FROM matches m
  WHERE m.status = 'completed'
    AND (_org_id IS NULL OR m.organization_id = _org_id)
  ORDER BY m.overs;
$$;

CREATE OR REPLACE FUNCTION public.get_player_stats_by_format(_overs int, _org_id uuid DEFAULT NULL)
RETURNS TABLE(
  player_id uuid,
  player_name text,
  player_role player_role,
  player_photo_url text,
  player_organization_id uuid,
  matches_played bigint,
  innings_batted bigint,
  total_runs bigint,
  balls_faced bigint,
  fours bigint,
  sixes bigint,
  highest_score int,
  not_outs bigint,
  innings_bowled bigint,
  overs_bowled numeric,
  runs_conceded bigint,
  wickets_taken bigint,
  fifties bigint,
  hundreds bigint,
  five_wickets bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH match_filter AS (
    SELECT id as match_id, organization_id
    FROM matches
    WHERE status = 'completed' AND overs = _overs
      AND (_org_id IS NULL OR organization_id = _org_id)
  ),
  batting_innings AS (
    SELECT
      b.batsman_id,
      i.id as innings_id,
      SUM(b.runs_scored) as inn_runs,
      COUNT(*) as inn_balls,
      SUM(CASE WHEN b.runs_scored = 4 THEN 1 ELSE 0 END) as inn_fours,
      SUM(CASE WHEN b.runs_scored = 6 THEN 1 ELSE 0 END) as inn_sixes
    FROM balls b
    JOIN innings i ON i.id = b.innings_id
    JOIN match_filter mf ON mf.match_id = i.match_id
    GROUP BY b.batsman_id, i.id
  ),
  batting_agg AS (
    SELECT
      batsman_id as pid,
      COUNT(*) as innings_batted,
      SUM(inn_runs) as total_runs,
      SUM(inn_balls) as balls_faced,
      SUM(inn_fours) as fours,
      SUM(inn_sixes) as sixes,
      MAX(inn_runs)::int as highest_score,
      SUM(CASE WHEN inn_runs >= 50 AND inn_runs < 100 THEN 1 ELSE 0 END) as fifties,
      SUM(CASE WHEN inn_runs >= 100 THEN 1 ELSE 0 END) as hundreds
    FROM batting_innings
    GROUP BY batsman_id
  ),
  matches_per_player AS (
    SELECT DISTINCT b.batsman_id as pid, i.match_id
    FROM balls b
    JOIN innings i ON i.id = b.innings_id
    JOIN match_filter mf ON mf.match_id = i.match_id
  ),
  match_count AS (
    SELECT pid, COUNT(DISTINCT match_id) as matches_played FROM matches_per_player GROUP BY pid
  ),
  bowling_innings AS (
    SELECT
      b.bowler_id,
      i.id as innings_id,
      COUNT(*) FILTER (WHERE b.extra_type IS NULL OR b.extra_type IN ('bye', 'leg-bye')) as legal_balls,
      SUM(b.runs_scored + b.extra_runs) as runs_given,
      COUNT(*) FILTER (WHERE b.is_wicket = true) as wkts
    FROM balls b
    JOIN innings i ON i.id = b.innings_id
    JOIN match_filter mf ON mf.match_id = i.match_id
    GROUP BY b.bowler_id, i.id
  ),
  bowling_agg AS (
    SELECT
      bowler_id as pid,
      COUNT(*) as innings_bowled,
      SUM(ROUND(legal_balls::numeric / 6, 1)) as overs_bowled,
      SUM(runs_given) as runs_conceded,
      SUM(wkts) as wickets_taken,
      SUM(CASE WHEN wkts >= 5 THEN 1 ELSE 0 END) as five_wickets
    FROM bowling_innings
    GROUP BY bowler_id
  ),
  all_pids AS (
    SELECT pid FROM batting_agg
    UNION
    SELECT pid FROM bowling_agg
  )
  SELECT
    ap.pid as player_id,
    p.name as player_name,
    p.role as player_role,
    p.photo_url as player_photo_url,
    p.organization_id as player_organization_id,
    COALESCE(mc.matches_played, 0) as matches_played,
    COALESCE(ba.innings_batted, 0) as innings_batted,
    COALESCE(ba.total_runs, 0) as total_runs,
    COALESCE(ba.balls_faced, 0) as balls_faced,
    COALESCE(ba.fours, 0) as fours,
    COALESCE(ba.sixes, 0) as sixes,
    COALESCE(ba.highest_score, 0) as highest_score,
    0::bigint as not_outs,
    COALESCE(boa.innings_bowled, 0) as innings_bowled,
    COALESCE(boa.overs_bowled, 0) as overs_bowled,
    COALESCE(boa.runs_conceded, 0) as runs_conceded,
    COALESCE(boa.wickets_taken, 0) as wickets_taken,
    COALESCE(ba.fifties, 0) as fifties,
    COALESCE(ba.hundreds, 0) as hundreds,
    COALESCE(boa.five_wickets, 0) as five_wickets
  FROM all_pids ap
  JOIN players p ON p.id = ap.pid
  LEFT JOIN match_count mc ON mc.pid = ap.pid
  LEFT JOIN batting_agg ba ON ba.pid = ap.pid
  LEFT JOIN bowling_agg boa ON boa.pid = ap.pid;
$$;