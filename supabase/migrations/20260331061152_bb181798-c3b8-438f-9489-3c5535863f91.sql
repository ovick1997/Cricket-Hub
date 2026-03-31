
ALTER TABLE public.tournaments
  ADD COLUMN overs_per_match integer NOT NULL DEFAULT 20,
  ADD COLUMN prize_money text DEFAULT NULL,
  ADD COLUMN players_per_team integer NOT NULL DEFAULT 11,
  ADD COLUMN venue text DEFAULT NULL,
  ADD COLUMN description text DEFAULT NULL;
