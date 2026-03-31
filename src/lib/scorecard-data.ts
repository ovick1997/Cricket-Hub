export interface BattingEntry {
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
}

export interface BowlingEntry {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  dots: number;
}

export interface FowEntry {
  wicket: number;
  score: number;
  batsman: string;
  overs: number;
}

export interface PartnershipEntry {
  wicket: number;
  runs: number;
  balls: number;
  batsman1: string;
  batsman1Runs: number;
  batsman2: string;
  batsman2Runs: number;
}

export interface InningsScorecard {
  teamName: string;
  shortName: string;
  color: string;
  total: string;
  overs: number;
  extras: { total: number; wides: number; noBalls: number; byes: number; legByes: number };
  batting: BattingEntry[];
  bowling: BowlingEntry[];
  fow: FowEntry[];
  partnerships: PartnershipEntry[];
}

export const scorecardMatch = {
  id: "m3",
  team1: "Royal Strikers",
  team2: "Storm Riders",
  venue: "National Stadium",
  date: "2026-03-28",
  overs: 20,
  result: "Royal Strikers won by 13 runs",
  toss: "Royal Strikers won the toss and elected to bat",
  umpires: "R. Sharma, S. Kumar",
  motm: "Virat Singh",
};

export const innings1: InningsScorecard = {
  teamName: "Royal Strikers",
  shortName: "RS",
  color: "#22c55e",
  total: "189/5",
  overs: 20,
  extras: { total: 12, wides: 5, noBalls: 2, byes: 3, legByes: 2 },
  batting: [
    { name: "Rohit Sharma", dismissal: "c Rishabh Bumrah b Yuzvendra Jadeja", runs: 42, balls: 28, fours: 5, sixes: 2, sr: 150.0 },
    { name: "Virat Singh", dismissal: "not out", runs: 78, balls: 52, fours: 7, sixes: 4, sr: 150.0 },
    { name: "Ravindra Kumar", dismissal: "b Shubman Iyer", runs: 34, balls: 22, fours: 3, sixes: 1, sr: 154.5 },
    { name: "Jasprit Patel", dismissal: "lbw b Yuzvendra Jadeja", runs: 8, balls: 10, fours: 1, sixes: 0, sr: 80.0 },
    { name: "Player 5", dismissal: "run out (Rishabh Bumrah)", runs: 12, balls: 8, fours: 1, sixes: 0, sr: 150.0 },
    { name: "Player 6", dismissal: "not out", runs: 3, balls: 2, fours: 0, sixes: 0, sr: 150.0 },
  ],
  bowling: [
    { name: "Yuzvendra Jadeja", overs: 4, maidens: 0, runs: 32, wickets: 2, economy: 8.0, dots: 8 },
    { name: "Axar Thakur", overs: 4, maidens: 0, runs: 38, wickets: 0, economy: 9.5, dots: 6 },
    { name: "Shubman Iyer", overs: 4, maidens: 0, runs: 42, wickets: 1, economy: 10.5, dots: 5 },
    { name: "Rishabh Bumrah", overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75, dots: 7 },
    { name: "Player X", overs: 4, maidens: 0, runs: 30, wickets: 1, economy: 7.5, dots: 9 },
  ],
  fow: [
    { wicket: 1, score: 68, batsman: "Rohit Sharma", overs: 6.4 },
    { wicket: 2, score: 112, batsman: "Ravindra Kumar", overs: 12.1 },
    { wicket: 3, score: 138, batsman: "Jasprit Patel", overs: 15.3 },
    { wicket: 4, score: 172, batsman: "Player 5", overs: 18.2 },
    { wicket: 5, score: 186, batsman: "Player 5", overs: 19.4 },
  ],
  partnerships: [
    { wicket: 1, runs: 68, balls: 42, batsman1: "Rohit Sharma", batsman1Runs: 42, batsman2: "Virat Singh", batsman2Runs: 24 },
    { wicket: 2, runs: 44, balls: 33, batsman1: "Virat Singh", batsman1Runs: 28, batsman2: "Ravindra Kumar", batsman2Runs: 14 },
    { wicket: 3, runs: 26, balls: 20, batsman1: "Virat Singh", batsman1Runs: 12, batsman2: "Jasprit Patel", batsman2Runs: 8 },
    { wicket: 4, runs: 34, balls: 18, batsman1: "Virat Singh", batsman1Runs: 14, batsman2: "Player 5", batsman2Runs: 12 },
    { wicket: 5, runs: 14, balls: 7, batsman1: "Player 6", batsman1Runs: 3, batsman2: "Virat Singh", batsman2Runs: 0 },
  ],
};

export const innings2: InningsScorecard = {
  teamName: "Storm Riders",
  shortName: "SR",
  color: "#3b82f6",
  total: "176/8",
  overs: 20,
  extras: { total: 8, wides: 3, noBalls: 1, byes: 2, legByes: 2 },
  batting: [
    { name: "Shubman Iyer", dismissal: "c Virat Singh b Jasprit Patel", runs: 56, balls: 38, fours: 6, sixes: 2, sr: 147.4 },
    { name: "Rishabh Bumrah", dismissal: "b Ravindra Kumar", runs: 28, balls: 22, fours: 3, sixes: 1, sr: 127.3 },
    { name: "Yuzvendra Jadeja", dismissal: "c Rohit Sharma b Jasprit Patel", runs: 22, balls: 18, fours: 2, sixes: 0, sr: 122.2 },
    { name: "Player A", dismissal: "lbw b Ravindra Kumar", runs: 18, balls: 14, fours: 1, sixes: 1, sr: 128.6 },
    { name: "Player B", dismissal: "run out (Virat Singh)", runs: 32, balls: 20, fours: 2, sixes: 2, sr: 160.0 },
    { name: "Player C", dismissal: "b Jasprit Patel", runs: 5, balls: 6, fours: 0, sixes: 0, sr: 83.3 },
    { name: "Player D", dismissal: "c & b Ravindra Kumar", runs: 4, balls: 3, fours: 0, sixes: 0, sr: 133.3 },
    { name: "Player E", dismissal: "not out", runs: 6, balls: 4, fours: 1, sixes: 0, sr: 150.0 },
    { name: "Player F", dismissal: "not out", runs: 1, balls: 1, fours: 0, sixes: 0, sr: 100.0 },
  ],
  bowling: [
    { name: "Jasprit Patel", overs: 4, maidens: 0, runs: 28, wickets: 3, economy: 7.0, dots: 10 },
    { name: "Ravindra Kumar", overs: 4, maidens: 0, runs: 34, wickets: 3, economy: 8.5, dots: 8 },
    { name: "Virat Singh", overs: 2, maidens: 0, runs: 22, wickets: 0, economy: 11.0, dots: 3 },
    { name: "Rohit Sharma", overs: 4, maidens: 0, runs: 40, wickets: 0, economy: 10.0, dots: 5 },
    { name: "Player 5", overs: 4, maidens: 0, runs: 32, wickets: 1, economy: 8.0, dots: 7 },
    { name: "Player 6", overs: 2, maidens: 0, runs: 18, wickets: 1, economy: 9.0, dots: 4 },
  ],
  fow: [
    { wicket: 1, score: 52, batsman: "Rishabh Bumrah", overs: 5.2 },
    { wicket: 2, score: 88, batsman: "Shubman Iyer", overs: 9.4 },
    { wicket: 3, score: 98, batsman: "Yuzvendra Jadeja", overs: 11.1 },
    { wicket: 4, score: 118, batsman: "Player A", overs: 13.5 },
    { wicket: 5, score: 152, batsman: "Player B", overs: 17.2 },
    { wicket: 6, score: 158, batsman: "Player C", overs: 18.0 },
    { wicket: 7, score: 168, batsman: "Player D", overs: 19.1 },
    { wicket: 8, score: 174, batsman: "Player D", overs: 19.5 },
  ],
  partnerships: [
    { wicket: 1, runs: 52, balls: 32, batsman1: "Shubman Iyer", batsman1Runs: 30, batsman2: "Rishabh Bumrah", batsman2Runs: 20 },
    { wicket: 2, runs: 36, balls: 26, batsman1: "Shubman Iyer", batsman1Runs: 26, batsman2: "Yuzvendra Jadeja", batsman2Runs: 8 },
    { wicket: 3, runs: 10, balls: 9, batsman1: "Yuzvendra Jadeja", batsman1Runs: 14, batsman2: "Player A", batsman2Runs: 0 },
    { wicket: 4, runs: 20, balls: 15, batsman1: "Player A", batsman1Runs: 18, batsman2: "Player B", batsman2Runs: 0 },
    { wicket: 5, runs: 34, balls: 22, batsman1: "Player B", batsman1Runs: 32, batsman2: "Player C", batsman2Runs: 0 },
    { wicket: 6, runs: 6, balls: 5, batsman1: "Player C", batsman1Runs: 5, batsman2: "Player D", batsman2Runs: 0 },
    { wicket: 7, runs: 10, balls: 7, batsman1: "Player D", batsman1Runs: 4, batsman2: "Player E", batsman2Runs: 5 },
    { wicket: 8, runs: 6, balls: 4, batsman1: "Player E", batsman1Runs: 1, batsman2: "Player F", batsman2Runs: 1 },
  ],
};
