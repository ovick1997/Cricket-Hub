
-- Add Short Chris Cricket fields to matches table
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_short_chris boolean NOT NULL DEFAULT false;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS batting_option integer NOT NULL DEFAULT 2;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS max_overs_per_bowler integer NULL;
