
-- ============================================
-- CricketHub Multi-Tenant Database Schema
-- ============================================

-- Custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'scorer', 'viewer');
CREATE TYPE public.player_role AS ENUM ('batsman', 'bowler', 'all-rounder', 'wicketkeeper');
CREATE TYPE public.batting_style AS ENUM ('right-hand', 'left-hand');
CREATE TYPE public.match_status AS ENUM ('upcoming', 'live', 'completed', 'abandoned');
CREATE TYPE public.tournament_format AS ENUM ('league', 'knockout', 'round-robin');
CREATE TYPE public.tournament_status AS ENUM ('upcoming', 'ongoing', 'completed');
CREATE TYPE public.extra_type AS ENUM ('wide', 'no-ball', 'bye', 'leg-bye');
CREATE TYPE public.innings_status AS ENUM ('in_progress', 'completed', 'yet_to_bat');

-- ============================================
-- 1. Organizations (tenants)
-- ============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Profiles (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. User Roles (separate table per security guidelines)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Teams
-- ============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#22c55e',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Players
-- ============================================
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role player_role NOT NULL DEFAULT 'batsman',
  batting_style batting_style NOT NULL DEFAULT 'right-hand',
  bowling_style TEXT,
  jersey_number INT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Team-Player junction
-- ============================================
CREATE TABLE public.team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, player_id)
);
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Tournaments
-- ============================================
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format tournament_format NOT NULL DEFAULT 'league',
  status tournament_status NOT NULL DEFAULT 'upcoming',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. Tournament-Team junction
-- ============================================
CREATE TABLE public.tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  UNIQUE (tournament_id, team_id)
);
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. Matches
-- ============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  team1_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  overs INT NOT NULL DEFAULT 20,
  status match_status NOT NULL DEFAULT 'upcoming',
  venue TEXT,
  match_date TIMESTAMPTZ,
  toss_winner_id UUID REFERENCES public.teams(id),
  toss_decision TEXT CHECK (toss_decision IN ('bat', 'bowl')),
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. Innings
-- ============================================
CREATE TABLE public.innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  batting_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  bowling_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  innings_number INT NOT NULL CHECK (innings_number IN (1, 2)),
  total_runs INT NOT NULL DEFAULT 0,
  total_wickets INT NOT NULL DEFAULT 0,
  total_overs NUMERIC(4,1) NOT NULL DEFAULT 0,
  extras_wides INT NOT NULL DEFAULT 0,
  extras_no_balls INT NOT NULL DEFAULT 0,
  extras_byes INT NOT NULL DEFAULT 0,
  extras_leg_byes INT NOT NULL DEFAULT 0,
  status innings_status NOT NULL DEFAULT 'yet_to_bat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, innings_number)
);
ALTER TABLE public.innings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. Balls (ball-by-ball data)
-- ============================================
CREATE TABLE public.balls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES public.innings(id) ON DELETE CASCADE,
  over_number INT NOT NULL,
  ball_number INT NOT NULL,
  batsman_id UUID NOT NULL REFERENCES public.players(id),
  bowler_id UUID NOT NULL REFERENCES public.players(id),
  non_striker_id UUID REFERENCES public.players(id),
  runs_scored INT NOT NULL DEFAULT 0,
  extra_type extra_type,
  extra_runs INT NOT NULL DEFAULT 0,
  is_wicket BOOLEAN NOT NULL DEFAULT false,
  wicket_type TEXT,
  wicket_fielder_id UUID REFERENCES public.players(id),
  wicket_batsman_id UUID REFERENCES public.players(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.balls ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_teams_org ON public.teams(organization_id);
CREATE INDEX idx_players_org ON public.players(organization_id);
CREATE INDEX idx_matches_org ON public.matches(organization_id);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_innings_match ON public.innings(match_id);
CREATE INDEX idx_balls_innings ON public.balls(innings_id);
CREATE INDEX idx_balls_over ON public.balls(innings_id, over_number, ball_number);
CREATE INDEX idx_tournaments_org ON public.tournaments(organization_id);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_innings_updated_at BEFORE UPDATE ON public.innings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Security definer function for role checks
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_in_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND organization_id = _org_id
  );
$$;

-- ============================================
-- RLS Policies
-- ============================================

-- Organizations
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (public.user_in_org(auth.uid(), id));

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.has_role(auth.uid(), id, 'admin'));

-- Profiles
CREATE POLICY "Users can view profiles in their org"
  ON public.profiles FOR SELECT
  USING (organization_id = public.get_user_org_id(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Roles
CREATE POLICY "Users can view roles in their org"
  ON public.user_roles FOR SELECT
  USING (public.user_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), organization_id, 'admin'));

-- Teams
CREATE POLICY "Org members can view teams"
  ON public.teams FOR SELECT
  USING (public.user_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage teams"
  ON public.teams FOR ALL
  USING (public.has_role(auth.uid(), organization_id, 'admin')
    OR public.has_role(auth.uid(), organization_id, 'moderator'));

-- Players
CREATE POLICY "Org members can view players"
  ON public.players FOR SELECT
  USING (public.user_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage players"
  ON public.players FOR ALL
  USING (public.has_role(auth.uid(), organization_id, 'admin')
    OR public.has_role(auth.uid(), organization_id, 'moderator'));

-- Team Players
CREATE POLICY "Org members can view team players"
  ON public.team_players FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id AND public.user_in_org(auth.uid(), t.organization_id)
  ));

CREATE POLICY "Admins can manage team players"
  ON public.team_players FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
    AND (public.has_role(auth.uid(), t.organization_id, 'admin')
      OR public.has_role(auth.uid(), t.organization_id, 'moderator'))
  ));

-- Tournaments
CREATE POLICY "Org members can view tournaments"
  ON public.tournaments FOR SELECT
  USING (public.user_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage tournaments"
  ON public.tournaments FOR ALL
  USING (public.has_role(auth.uid(), organization_id, 'admin')
    OR public.has_role(auth.uid(), organization_id, 'moderator'));

-- Tournament Teams
CREATE POLICY "Org members can view tournament teams"
  ON public.tournament_teams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_id AND public.user_in_org(auth.uid(), t.organization_id)
  ));

CREATE POLICY "Admins can manage tournament teams"
  ON public.tournament_teams FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_id
    AND (public.has_role(auth.uid(), t.organization_id, 'admin')
      OR public.has_role(auth.uid(), t.organization_id, 'moderator'))
  ));

-- Matches
CREATE POLICY "Org members can view matches"
  ON public.matches FOR SELECT
  USING (public.user_in_org(auth.uid(), organization_id));

CREATE POLICY "Scorers and admins can manage matches"
  ON public.matches FOR ALL
  USING (public.has_role(auth.uid(), organization_id, 'admin')
    OR public.has_role(auth.uid(), organization_id, 'moderator')
    OR public.has_role(auth.uid(), organization_id, 'scorer'));

-- Innings
CREATE POLICY "Org members can view innings"
  ON public.innings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND public.user_in_org(auth.uid(), m.organization_id)
  ));

CREATE POLICY "Scorers can manage innings"
  ON public.innings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND (public.has_role(auth.uid(), m.organization_id, 'admin')
      OR public.has_role(auth.uid(), m.organization_id, 'scorer'))
  ));

-- Balls
CREATE POLICY "Org members can view balls"
  ON public.balls FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.innings i
    JOIN public.matches m ON m.id = i.match_id
    WHERE i.id = innings_id AND public.user_in_org(auth.uid(), m.organization_id)
  ));

CREATE POLICY "Scorers can manage balls"
  ON public.balls FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.innings i
    JOIN public.matches m ON m.id = i.match_id
    WHERE i.id = innings_id
    AND (public.has_role(auth.uid(), m.organization_id, 'admin')
      OR public.has_role(auth.uid(), m.organization_id, 'scorer'))
  ));

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
