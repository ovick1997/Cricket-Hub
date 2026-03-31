
-- Enable realtime for balls and innings tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.balls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.innings;

-- Allow anonymous users to view live matches (public shareable links)
CREATE POLICY "Public can view live matches"
ON public.matches FOR SELECT TO anon
USING (status = 'live'::match_status);

-- Allow anonymous users to view teams (needed for match display)
CREATE POLICY "Public can view teams"
ON public.teams FOR SELECT TO anon
USING (true);

-- Allow anonymous users to view players (needed for batsman/bowler names)
CREATE POLICY "Public can view players"
ON public.players FOR SELECT TO anon
USING (true);

-- Allow anonymous users to view innings for live matches
CREATE POLICY "Public can view live match innings"
ON public.innings FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM matches m
  WHERE m.id = innings.match_id AND m.status = 'live'::match_status
));

-- Allow anonymous users to view balls for live matches
CREATE POLICY "Public can view live match balls"
ON public.balls FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM innings i
  JOIN matches m ON m.id = i.match_id
  WHERE i.id = balls.innings_id AND m.status = 'live'::match_status
));
