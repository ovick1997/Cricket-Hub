export interface Player {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicketkeeper';
  battingStyle: 'right-hand' | 'left-hand';
  bowlingStyle: string;
  jerseyNumber: number;
  matches: number;
  runs: number;
  wickets: number;
  teamIds: string[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  players: string[];
  matches: number;
  wins: number;
  losses: number;
}

export interface Match {
  id: string;
  team1: string;
  team2: string;
  overs: number;
  status: 'upcoming' | 'live' | 'completed';
  venue: string;
  date: string;
  team1Score?: string;
  team2Score?: string;
  result?: string;
  tournamentId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  format: 'league' | 'knockout' | 'round-robin';
  teams: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate: string;
  endDate: string;
  matches: number;
}

export interface BallEntry {
  id: string;
  over: number;
  ball: number;
  batsman: string;
  bowler: string;
  runs: number;
  extras: { type: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | null; runs: number };
  wicket: { type: string; fielder?: string } | null;
  timestamp: string;
}

export const players: Player[] = [
  { id: 'p1', name: 'Virat Singh', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'Right-arm medium', jerseyNumber: 18, matches: 42, runs: 1856, wickets: 3, teamIds: ['t1'] },
  { id: 'p2', name: 'Rohit Sharma', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'Right-arm off-break', jerseyNumber: 45, matches: 38, runs: 1654, wickets: 1, teamIds: ['t1'] },
  { id: 'p3', name: 'Jasprit Patel', role: 'bowler', battingStyle: 'right-hand', bowlingStyle: 'Right-arm fast', jerseyNumber: 93, matches: 35, runs: 120, wickets: 78, teamIds: ['t1'] },
  { id: 'p4', name: 'Ravindra Kumar', role: 'all-rounder', battingStyle: 'left-hand', bowlingStyle: 'Left-arm spin', jerseyNumber: 8, matches: 40, runs: 980, wickets: 52, teamIds: ['t1', 't2'] },
  { id: 'p5', name: 'MS Dhawan', role: 'wicketkeeper', battingStyle: 'right-hand', bowlingStyle: '-', jerseyNumber: 7, matches: 45, runs: 1340, wickets: 0, teamIds: ['t2'] },
  { id: 'p6', name: 'KL Pandya', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'Right-arm medium', jerseyNumber: 1, matches: 30, runs: 1120, wickets: 5, teamIds: ['t2'] },
  { id: 'p7', name: 'Hardik Chahal', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'Right-arm medium-fast', jerseyNumber: 33, matches: 28, runs: 780, wickets: 34, teamIds: ['t2'] },
  { id: 'p8', name: 'Yuzvendra Jadeja', role: 'bowler', battingStyle: 'right-hand', bowlingStyle: 'Leg-break', jerseyNumber: 63, matches: 32, runs: 210, wickets: 65, teamIds: ['t3'] },
  { id: 'p9', name: 'Shubman Iyer', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: '-', jerseyNumber: 77, matches: 25, runs: 890, wickets: 0, teamIds: ['t3'] },
  { id: 'p10', name: 'Rishabh Bumrah', role: 'wicketkeeper', battingStyle: 'left-hand', bowlingStyle: '-', jerseyNumber: 17, matches: 22, runs: 650, wickets: 0, teamIds: ['t3'] },
  { id: 'p11', name: 'Axar Thakur', role: 'bowler', battingStyle: 'left-hand', bowlingStyle: 'Left-arm orthodox', jerseyNumber: 28, matches: 20, runs: 340, wickets: 42, teamIds: ['t4'] },
  { id: 'p12', name: 'Suryakumar Gill', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: '-', jerseyNumber: 63, matches: 18, runs: 780, wickets: 0, teamIds: ['t4'] },
];

export const teams: Team[] = [
  { id: 't1', name: 'Royal Strikers', shortName: 'RS', color: '#22c55e', players: ['p1', 'p2', 'p3', 'p4'], matches: 12, wins: 9, losses: 3 },
  { id: 't2', name: 'Thunder Kings', shortName: 'TK', color: '#f59e0b', players: ['p4', 'p5', 'p6', 'p7'], matches: 12, wins: 7, losses: 5 },
  { id: 't3', name: 'Storm Riders', shortName: 'SR', color: '#3b82f6', players: ['p8', 'p9', 'p10'], matches: 10, wins: 6, losses: 4 },
  { id: 't4', name: 'Phoenix Warriors', shortName: 'PW', color: '#ef4444', players: ['p11', 'p12'], matches: 10, wins: 5, losses: 5 },
];

export const matches: Match[] = [
  { id: 'm1', team1: 'Royal Strikers', team2: 'Thunder Kings', overs: 20, status: 'live', venue: 'National Stadium', date: '2026-03-30', team1Score: '156/4 (16.2)', team2Score: '-' },
  { id: 'm2', team1: 'Storm Riders', team2: 'Phoenix Warriors', overs: 20, status: 'upcoming', venue: 'Green Park', date: '2026-03-31' },
  { id: 'm3', team1: 'Royal Strikers', team2: 'Storm Riders', overs: 20, status: 'completed', venue: 'National Stadium', date: '2026-03-28', team1Score: '189/5 (20)', team2Score: '176/8 (20)', result: 'Royal Strikers won by 13 runs' },
  { id: 'm4', team1: 'Thunder Kings', team2: 'Phoenix Warriors', overs: 10, status: 'completed', venue: 'City Ground', date: '2026-03-27', team1Score: '98/3 (10)', team2Score: '95/7 (10)', result: 'Thunder Kings won by 3 runs' },
  { id: 'm5', team1: 'Storm Riders', team2: 'Thunder Kings', overs: 20, status: 'upcoming', venue: 'Green Park', date: '2026-04-02' },
];

export const tournaments: Tournament[] = [
  { id: 'tr1', name: 'Premier Cricket League 2026', format: 'league', teams: ['t1', 't2', 't3', 't4'], status: 'ongoing', startDate: '2026-03-01', endDate: '2026-05-15', matches: 24 },
  { id: 'tr2', name: 'Champions Trophy', format: 'knockout', teams: ['t1', 't2', 't3', 't4'], status: 'upcoming', startDate: '2026-06-01', endDate: '2026-06-20', matches: 8 },
];

export const liveBalls: BallEntry[] = [
  { id: 'b1', over: 0, ball: 1, batsman: 'Virat Singh', bowler: 'Hardik Chahal', runs: 4, extras: { type: null, runs: 0 }, wicket: null, timestamp: '10:01' },
  { id: 'b2', over: 0, ball: 2, batsman: 'Virat Singh', bowler: 'Hardik Chahal', runs: 1, extras: { type: null, runs: 0 }, wicket: null, timestamp: '10:02' },
  { id: 'b3', over: 0, ball: 3, batsman: 'Rohit Sharma', bowler: 'Hardik Chahal', runs: 0, extras: { type: null, runs: 0 }, wicket: null, timestamp: '10:03' },
  { id: 'b4', over: 0, ball: 4, batsman: 'Rohit Sharma', bowler: 'Hardik Chahal', runs: 6, extras: { type: null, runs: 0 }, wicket: null, timestamp: '10:04' },
  { id: 'b5', over: 0, ball: 5, batsman: 'Rohit Sharma', bowler: 'Hardik Chahal', runs: 0, extras: { type: 'wide', runs: 1 }, wicket: null, timestamp: '10:05' },
  { id: 'b6', over: 0, ball: 5, batsman: 'Rohit Sharma', bowler: 'Hardik Chahal', runs: 2, extras: { type: null, runs: 0 }, wicket: null, timestamp: '10:06' },
  { id: 'b7', over: 0, ball: 6, batsman: 'Virat Singh', bowler: 'Hardik Chahal', runs: 1, extras: { type: null, runs: 0 }, wicket: null, timestamp: '10:07' },
];

export const pointsTable = [
  { team: 'Royal Strikers', played: 6, won: 5, lost: 1, nrr: '+1.245', points: 10 },
  { team: 'Thunder Kings', played: 6, won: 4, lost: 2, nrr: '+0.678', points: 8 },
  { team: 'Storm Riders', played: 5, won: 3, lost: 2, nrr: '+0.234', points: 6 },
  { team: 'Phoenix Warriors', played: 5, won: 1, lost: 4, nrr: '-1.456', points: 2 },
];
