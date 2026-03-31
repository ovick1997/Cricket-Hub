
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS fifties integer NOT NULL DEFAULT 0;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS hundreds integer NOT NULL DEFAULT 0;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS five_wickets integer NOT NULL DEFAULT 0;
