
-- Allow anon to view completed matches
CREATE POLICY "Public can view completed matches"
ON public.matches FOR SELECT TO anon
USING (status = 'completed'::match_status);

-- Allow anon to view completed match innings
CREATE POLICY "Public can view completed match innings"
ON public.innings FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM matches m
  WHERE m.id = innings.match_id AND m.status = 'completed'::match_status
));

-- Allow anon to view completed match balls
CREATE POLICY "Public can view completed match balls"
ON public.balls FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM innings i
  JOIN matches m ON m.id = i.match_id
  WHERE i.id = balls.innings_id AND m.status = 'completed'::match_status
));
