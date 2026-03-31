
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org admins can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), organization_id, 'admin'::app_role)
    OR user_id = auth.uid()
  );

-- Allow system/triggers to insert for any user in org
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_in_org(auth.uid(), organization_id)
  );

-- Function to notify all org members
CREATE OR REPLACE FUNCTION public.notify_org_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member RECORD;
  _org_id uuid;
  _title text;
  _message text;
  _type text;
  _link text;
BEGIN
  -- Match created
  IF TG_TABLE_NAME = 'matches' AND TG_OP = 'INSERT' THEN
    _org_id := NEW.organization_id;
    _title := 'New Match Created';
    _message := 'A new match has been scheduled';
    _type := 'match';
    _link := '/matches';
  -- Team created
  ELSIF TG_TABLE_NAME = 'teams' AND TG_OP = 'INSERT' THEN
    _org_id := NEW.organization_id;
    _title := 'New Team Added';
    _message := NEW.name || ' has been added';
    _type := 'team';
    _link := '/teams/' || NEW.id;
  -- Player created
  ELSIF TG_TABLE_NAME = 'players' AND TG_OP = 'INSERT' THEN
    _org_id := NEW.organization_id;
    _title := 'New Player Added';
    _message := NEW.name || ' has been registered';
    _type := 'player';
    _link := '/players';
  -- Tournament created
  ELSIF TG_TABLE_NAME = 'tournaments' AND TG_OP = 'INSERT' THEN
    _org_id := NEW.organization_id;
    _title := 'New Tournament';
    _message := NEW.name || ' has been created';
    _type := 'tournament';
    _link := '/tournaments';
  ELSE
    RETURN NEW;
  END IF;

  FOR _member IN
    SELECT p.user_id FROM profiles p WHERE p.organization_id = _org_id AND p.user_id != auth.uid()
  LOOP
    INSERT INTO notifications (organization_id, user_id, title, message, type, link)
    VALUES (_org_id, _member.user_id, _title, _message, _type, _link);
  END LOOP;

  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER notify_on_match_insert
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION notify_org_members();

CREATE TRIGGER notify_on_team_insert
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION notify_org_members();

CREATE TRIGGER notify_on_player_insert
  AFTER INSERT ON public.players
  FOR EACH ROW EXECUTE FUNCTION notify_org_members();

CREATE TRIGGER notify_on_tournament_insert
  AFTER INSERT ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION notify_org_members();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
