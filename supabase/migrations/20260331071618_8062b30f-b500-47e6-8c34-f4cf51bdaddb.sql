
-- Add 'short-chris' to tournament_format enum
ALTER TYPE public.tournament_format ADD VALUE IF NOT EXISTS 'short-chris';

-- Add batting option for Short Chris (1 or 2 batsmen at a time)
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS batting_option integer NOT NULL DEFAULT 2;

-- Add max overs per bowler
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS max_overs_per_bowler integer NULL;
