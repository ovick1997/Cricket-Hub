// ICC-inspired ranking system
// Produces ratings in the 0-900 range, similar to ICC player ratings

export interface PlayerStatForRanking {
  innings_batted: number;
  total_runs: number;
  balls_faced: number;
  not_outs: number;
  fours: number;
  sixes: number;
  highest_score: number;
  fifties: number;
  hundreds: number;
  matches_played: number;
  innings_bowled: number;
  overs_bowled: number;
  runs_conceded: number;
  wickets_taken: number;
  five_wickets: number;
}

export function calcICCBattingRating(s: PlayerStatForRanking): number {
  if (s.innings_batted === 0) return 0;

  const dismissals = Math.max(s.innings_batted - s.not_outs, 1);
  const avg = s.total_runs / dismissals;
  const sr = s.balls_faced > 0 ? (s.total_runs / s.balls_faced) * 100 : 0;

  // Base: Average contribution (capped at 200)
  const avgPoints = Math.min(avg * 4, 200);

  // Strike rate contribution (can be negative for very slow SR)
  const srPoints = Math.max(-50, Math.min((sr - 100) * 0.5, 80));

  // Volume bonus (capped at 150)
  const volumePoints = Math.min(s.total_runs * 0.3, 150);

  // Milestones
  const milestonePoints = s.fifties * 20 + s.hundreds * 60;

  // Consistency (capped at 100)
  const consistencyPoints = Math.min(s.matches_played * 3, 100);

  // High score bonus
  const highScorePoints = s.highest_score * 0.5;

  const total = avgPoints + srPoints + volumePoints + milestonePoints + consistencyPoints + highScorePoints;
  return Math.max(0, Math.round(Math.min(total, 900)));
}

export function calcICCBowlingRating(s: PlayerStatForRanking): number {
  if (s.innings_bowled === 0 || s.overs_bowled === 0) return 0;

  const overs = Number(s.overs_bowled);
  const bowlAvg = s.wickets_taken > 0 ? s.runs_conceded / s.wickets_taken : 999;
  const econ = s.runs_conceded / overs;
  const ballsBowled = Math.floor(overs) * 6 + (overs % 1) * 10;
  const bowlSR = s.wickets_taken > 0 ? ballsBowled / s.wickets_taken : 999;

  // Wicket points
  const wicketPoints = s.wickets_taken * 20;

  // Average bonus (lower avg = better)
  const avgBonus = bowlAvg < 999 ? Math.max(0, 150 - bowlAvg * 3) : 0;

  // Economy bonus (lower econ = better)
  const econBonus = Math.max(0, 120 - econ * 10);

  // Strike rate bonus (lower SR = better)
  const srBonus = bowlSR < 999 ? Math.max(0, 100 - bowlSR * 2) : 0;

  // Milestones
  const milestonePoints = s.five_wickets * 50;

  // Volume (capped at 100)
  const volumePoints = Math.min(s.innings_bowled * 5, 100);

  const total = wicketPoints + avgBonus + econBonus + srBonus + milestonePoints + volumePoints;
  return Math.max(0, Math.round(Math.min(total, 900)));
}

export function calcICCAllRounderRating(s: PlayerStatForRanking): number {
  const bat = calcICCBattingRating(s);
  const bowl = calcICCBowlingRating(s);

  // Both must be > 50 to qualify
  if (bat <= 50 || bowl <= 50) return 0;

  // ICC-style: geometric mean approach
  const rating = (bat * bowl) / 1000;
  return Math.round(Math.min(rating, 900));
}