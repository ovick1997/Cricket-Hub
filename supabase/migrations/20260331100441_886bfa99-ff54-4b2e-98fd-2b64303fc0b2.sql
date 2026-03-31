
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS ten_wickets integer NOT NULL DEFAULT 0;
