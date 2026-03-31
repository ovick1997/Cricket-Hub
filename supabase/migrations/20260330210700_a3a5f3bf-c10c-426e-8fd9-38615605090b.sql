-- Backfill missing match summaries for matches completed before trigger existed
INSERT INTO match_summaries (match_id, organization_id, team1_name, team1_short, team1_color, team1_score, team2_name, team2_short, team2_color, team2_score, result, venue, overs, match_date, man_of_match)
SELECT 
  m.id, m.organization_id,
  t1.name, t1.short_name, t1.color,
  (SELECT total_runs || '/' || total_wickets || ' (' || total_overs || ' ov)' FROM innings WHERE match_id = m.id AND batting_team_id = m.team1_id LIMIT 1),
  t2.name, t2.short_name, t2.color,
  (SELECT total_runs || '/' || total_wickets || ' (' || total_overs || ' ov)' FROM innings WHERE match_id = m.id AND batting_team_id = m.team2_id LIMIT 1),
  m.result, m.venue, m.overs, m.match_date,
  (SELECT p.name FROM players p WHERE p.id = m.man_of_match_id)
FROM matches m
JOIN teams t1 ON t1.id = m.team1_id
JOIN teams t2 ON t2.id = m.team2_id
WHERE m.status = 'completed'
  AND m.id NOT IN (SELECT match_id FROM match_summaries)
ON CONFLICT (match_id) DO NOTHING;