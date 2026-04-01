import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, Users, Swords, Radio, Trophy, BarChart3, Settings, UserCircle, Shield, Zap, Search, X, Database, Cloud, Terminal, Lock, Code, Globe, Server, FileCode, GitBranch, UserCog, Copy, Check } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

interface DocSection {
  id: string;
  icon: any;
  title: string;
  category?: string;
  steps: { title: string; description: string }[];
}

const sections: DocSection[] = [
  // ===== USER GUIDE =====
  {
    id: "getting-started",
    icon: Zap,
    title: "Getting Started",
    category: "📖 User Guide",
    steps: [
      { title: "Sign Up / Login", description: "Email দিয়ে account তৈরি করুন এবং email verify করুন। তারপর login করুন।" },
      { title: "Organization তৈরি করুন", description: "Login এর পর Organization নাম ও slug দিন। আপনি automatically admin হিসেবে assign হবেন।" },
      { title: "Dashboard দেখুন", description: "Organization তৈরি হলে Dashboard এ redirect হবে। এখানে summary stats, live matches, recent results দেখতে পারবেন।" },
    ],
  },
  {
    id: "players",
    icon: UserCircle,
    title: "Players Management",
    category: "📖 User Guide",
    steps: [
      { title: "Player যোগ করুন", description: "Players page → 'Add Player' বাটন ক্লিক করুন। নাম, role (Batsman/Bowler/All-rounder/Wicketkeeper), batting style, bowling style, jersey number দিন।" },
      { title: "Player Profile দেখুন", description: "যেকোনো player এ ক্লিক করলে তার profile দেখতে পারবেন — batting/bowling stats, match history সব থাকবে।" },
      { title: "Player Search করুন", description: "Players page এর search bar দিয়ে নাম দিয়ে player খুঁজতে পারবেন।" },
    ],
  },
  {
    id: "teams",
    icon: Users,
    title: "Teams Management",
    category: "📖 User Guide",
    steps: [
      { title: "Team তৈরি করুন", description: "Teams page → 'Add Team' বাটন ক্লিক করুন। Team নাম, short name (3 অক্ষর), এবং team color select করুন।" },
      { title: "Player assign করুন", description: "Team details page এ গিয়ে 'Add Players' বাটন দিয়ে registered players দের team এ যোগ করুন।" },
      { title: "Captain/Vice-Captain ঠিক করুন", description: "Team details page এ player এর পাশে captain (C) বা vice-captain (VC) badge toggle করতে পারবেন।" },
    ],
  },
  {
    id: "matches",
    icon: Swords,
    title: "Match Management",
    category: "📖 User Guide",
    steps: [
      { title: "Match তৈরি করুন", description: "Matches page → 'New Match' বাটন ক্লিক করুন। দুটি team select করুন, overs সংখ্যা দিন, venue ও date ঠিক করুন।" },
      { title: "Short Chris Format", description: "Match create এ 'Short Chris Cricket' toggle on করলে solo batting (1 জন) বা duo batting (2 জন) option পাবেন। Max overs per bowler ও set করতে পারবেন।" },
      { title: "Toss এন্ট্রি", description: "Match তৈরি হলে toss winner ও decision (bat/bowl) select করুন।" },
      { title: "Match History", description: "সব completed match এর result, scores, man of the match — সব Match History page এ দেখতে পারবেন।" },
    ],
  },
  {
    id: "scoring",
    icon: Radio,
    title: "Live Scoring",
    category: "📖 User Guide",
    steps: [
      { title: "Match select করুন", description: "Live Scoring page এ upcoming/live match list থেকে match select করুন।" },
      { title: "Batsman ও Bowler select করুন", description: "প্রথমে opening batsmen (striker ও non-striker) select করুন, তারপর opening bowler select করুন।" },
      { title: "Run দিন", description: "0-6 বাটন ট্যাপ করে run entry করুন। Wide/No Ball বাটন দিয়ে extras দিন।" },
      { title: "Wicket দিন", description: "W বাটন ট্যাপ করে wicket type select করুন — Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket।" },
      { title: "Run + Wicket একসাথে", description: "Run বাটন long press করলে সেই run এর সাথে wicket দেওয়া যাবে (যেমন: 2 run নিতে গিয়ে run out)।" },
      { title: "Undo করুন", description: "ভুল হলে screen এ left swipe করুন অথবা undo বাটন ট্যাপ করুন।" },
      { title: "Strike swap করুন", description: "⇄ বাটন দিয়ে manually strike change করতে পারবেন।" },
      { title: "Short Chris — 6 মানে Out!", description: "Short Chris format এ 6 মারলে batsman automatically out হবে। 6 runs count হবে কিন্তু wicket ও পড়বে।" },
      { title: "Bowler Limit", description: "Max overs per bowler set থাকলে bowler তার limit এ পৌঁছালে warning আসবে এবং নতুন bowler select করতে হবে।" },
    ],
  },
  {
    id: "tournaments",
    icon: Trophy,
    title: "Tournaments",
    category: "📖 User Guide",
    steps: [
      { title: "Tournament তৈরি করুন", description: "Tournaments page → 'New Tournament' বাটন ক্লিক করুন। নাম, format (League/Knockout/Round Robin/Short Chris), overs, venue দিন।" },
      { title: "Short Chris Tournament", description: "Format এ 'Short Chris' select করলে batting option (solo/duo) ও max overs per bowler set করতে পারবেন।" },
      { title: "Teams যোগ করুন", description: "Tournament details page এ teams add করুন।" },
      { title: "Tournament Matches", description: "Tournament এর under এ matches create করুন — সেগুলো automatically tournament এর সাথে linked থাকবে।" },
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics",
    category: "📖 User Guide",
    steps: [
      { title: "Overview দেখুন", description: "Analytics page এ overall organization stats দেখতে পারবেন — total matches, players, teams, runs।" },
      { title: "Leaderboards", description: "Top batsmen, top bowlers, best fielders — সব leaderboard analytics page এ পাবেন।" },
    ],
  },
  {
    id: "rankings",
    icon: Trophy,
    title: "Player Rankings",
    category: "📖 User Guide",
    steps: [
      { title: "Rankings কিভাবে কাজ করে?", description: "Player Rankings performance-based automated system। প্রতিটি match complete হলে player_stats table automatically update হয় এবং ranking recalculate হয়।" },
      { title: "Batting Rating", description: "Batting rating এর formula:\n• Average × 3\n• Strike Rate × 0.8\n• Total Runs × 0.5\n• Boundary Bonus: Fours × 2 + Sixes × 5\n• Milestone Bonus: Fifties × 15 + Hundreds × 50\n\nসব মিলিয়ে weighted score বের হয়।" },
      { title: "Bowling Rating", description: "Bowling rating এর formula:\n• Wickets × 25\n• Low Economy Bonus\n• Low Average Bonus\n• 5-Wicket Haul Bonus × 40\n\nEconomy ও Average কম হলে bonus বেশি।" },
      { title: "All-Rounder Rating", description: "All-Rounder rating = (Batting Rating × 0.5) + (Bowling Rating × 0.5)\n\nBatting ও Bowling দুটোতেই ভালো performance দরকার।" },
      { title: "Rankings Page দেখুন", description: "Dashboard → Rankings page এ 3 টি tab আছে:\n• 🏏 Batting Rankings — Top batsmen by batting rating\n• 🎳 Bowling Rankings — Top bowlers by bowling rating\n• ⭐ All-Rounder Rankings — Combined performance\n\nপ্রতিটি player এর detailed stats (avg, SR, wickets, economy) দেখা যায়।" },
      { title: "Public Rankings", description: "Public Leaderboard page এও Rankings tab আছে। বাইরের মানুষ (without login) ও দেখতে পারবে top performers কারা।" },
      { title: "Stats Recalculation", description: "যদি stats ভুল মনে হয়, admin Settings থেকে 'Recalculate Stats' option ব্যবহার করতে পারবে। এটি সব historical ball data থেকে fresh stats rebuild করবে।" },
      { title: "Fifties ও Hundreds", description: "Fifties ও Hundreds per-innings basis এ count হয়। একটি innings এ 50-99 runs = 1 Fifty, 100+ runs = 1 Hundred।" },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings & Roles",
    category: "📖 User Guide",
    steps: [
      { title: "Member Approvals", description: "নতুন member join করলে Settings → Approvals tab এ pending request আসবে। Approve করলে তারা org এ access পাবে।" },
      { title: "Role Management", description: "Settings → Members tab এ member দের role change করতে পারবেন — Admin, Moderator, Scorer, Viewer।" },
      { title: "Permission Customize", description: "Settings → Permissions tab এ প্রতিটি role এর জন্য কোন কোন page/feature accessible তা on/off করতে পারবেন।" },
      { title: "Organization Settings", description: "Settings → Organization tab এ org নাম, logo change করতে পারবেন এবং danger zone এ org delete করতে পারবেন।" },
    ],
  },
  {
    id: "roles",
    icon: Shield,
    title: "Role Guide",
    category: "📖 User Guide",
    steps: [
      { title: "Admin", description: "Full access — সব page, সব feature, member management, settings সব কিছু। Organization owner।" },
      { title: "Moderator", description: "Match, team, player, tournament create/edit করতে পারবে। Settings access নেই।" },
      { title: "Scorer", description: "Live scoring করতে পারবে, match দেখতে পারবে। Team/player create করতে পারবে না।" },
      { title: "Viewer", description: "শুধু দেখতে পারবে — dashboard, matches, teams, players, tournaments, analytics। কিছু create/edit করতে পারবে না।" },
    ],
  },

  // ===== DEPLOYMENT GUIDE =====
  {
    id: "supabase-setup",
    icon: Database,
    title: "Supabase Project তৈরি",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "Supabase এ যান", description: "https://supabase.com/dashboard এ গিয়ে free account তৈরি করুন। 'New Project' ক্লিক করুন।" },
      { title: "Project Settings নোট করুন", description: "Project তৈরি হলে এই তথ্যগুলো সংরক্ষণ করুন:\n• Project URL → VITE_SUPABASE_URL\n• Anon (public) Key → VITE_SUPABASE_PUBLISHABLE_KEY\n• Service Role Key (admin operations এর জন্য)\n• Database Password\n• Project Reference ID" },
      { title: "Supabase CLI Install করুন", description: "Terminal এ চালান:\nnpm install -g supabase\nতারপর login করুন:\nsupabase login" },
      { title: "Project Link করুন", description: "আপনার project directory তে যান এবং চালান:\nsupabase link --project-ref YOUR_PROJECT_REF\nDatabase password দিতে হবে।" },
    ],
  },
  {
    id: "database-tables",
    icon: Server,
    title: "Database Tables তৈরি",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "Enums তৈরি করুন", description: "SQL Editor এ চালান:\n\nCREATE TYPE app_role AS ENUM ('admin', 'moderator', 'scorer', 'viewer');\nCREATE TYPE batting_style AS ENUM ('right-hand', 'left-hand');\nCREATE TYPE extra_type AS ENUM ('wide', 'no-ball', 'bye', 'leg-bye');\nCREATE TYPE innings_status AS ENUM ('in_progress', 'completed', 'yet_to_bat');\nCREATE TYPE match_status AS ENUM ('upcoming', 'live', 'completed', 'abandoned');\nCREATE TYPE player_role AS ENUM ('batsman', 'bowler', 'all-rounder', 'wicketkeeper');\nCREATE TYPE tournament_format AS ENUM ('league', 'knockout', 'round-robin', 'short-chris');\nCREATE TYPE tournament_status AS ENUM ('upcoming', 'ongoing', 'completed');" },
      { title: "organizations table", description: "CREATE TABLE organizations (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  name text NOT NULL,\n  slug text NOT NULL UNIQUE,\n  logo_url text,\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);" },
      { title: "profiles table", description: "CREATE TABLE profiles (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\n  full_name text,\n  avatar_url text,\n  organization_id uuid REFERENCES organizations(id),\n  is_approved boolean DEFAULT false,\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);" },
      { title: "user_roles table", description: "CREATE TABLE user_roles (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\n  organization_id uuid NOT NULL REFERENCES organizations(id),\n  role app_role DEFAULT 'viewer',\n  created_at timestamptz DEFAULT now(),\n  UNIQUE(user_id, organization_id)\n);" },
      { title: "teams table", description: "CREATE TABLE teams (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  organization_id uuid NOT NULL REFERENCES organizations(id),\n  name text NOT NULL,\n  short_name text NOT NULL,\n  color text DEFAULT '#22c55e',\n  logo_url text,\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);" },
      { title: "players table", description: "CREATE TABLE players (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  organization_id uuid NOT NULL REFERENCES organizations(id),\n  name text NOT NULL,\n  role player_role DEFAULT 'batsman',\n  batting_style batting_style DEFAULT 'right-hand',\n  bowling_style text,\n  jersey_number integer,\n  photo_url text,\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);" },
      { title: "team_players table", description: "CREATE TABLE team_players (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,\n  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,\n  is_captain boolean DEFAULT false,\n  is_vice_captain boolean DEFAULT false,\n  joined_at timestamptz DEFAULT now(),\n  UNIQUE(team_id, player_id)\n);" },
      { title: "matches table", description: "CREATE TABLE matches (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  organization_id uuid NOT NULL REFERENCES organizations(id),\n  team1_id uuid NOT NULL REFERENCES teams(id),\n  team2_id uuid NOT NULL REFERENCES teams(id),\n  tournament_id uuid REFERENCES tournaments(id),\n  overs integer DEFAULT 20,\n  venue text,\n  match_date timestamptz,\n  status match_status DEFAULT 'upcoming',\n  toss_winner_id uuid REFERENCES teams(id),\n  toss_decision text,\n  result text,\n  man_of_match_id uuid REFERENCES players(id),\n  is_short_chris boolean DEFAULT false,\n  batting_option integer DEFAULT 2,\n  max_overs_per_bowler integer,\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);" },
      { title: "innings table", description: "CREATE TABLE innings (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  match_id uuid NOT NULL REFERENCES matches(id),\n  batting_team_id uuid NOT NULL REFERENCES teams(id),\n  bowling_team_id uuid NOT NULL REFERENCES teams(id),\n  innings_number integer NOT NULL,\n  total_runs integer DEFAULT 0,\n  total_wickets integer DEFAULT 0,\n  total_overs numeric DEFAULT 0,\n  extras_wides integer DEFAULT 0,\n  extras_no_balls integer DEFAULT 0,\n  extras_byes integer DEFAULT 0,\n  extras_leg_byes integer DEFAULT 0,\n  status innings_status DEFAULT 'yet_to_bat',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);" },
      { title: "balls table", description: "CREATE TABLE balls (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  innings_id uuid NOT NULL REFERENCES innings(id),\n  over_number integer NOT NULL,\n  ball_number integer NOT NULL,\n  batsman_id uuid NOT NULL REFERENCES players(id),\n  bowler_id uuid NOT NULL REFERENCES players(id),\n  non_striker_id uuid REFERENCES players(id),\n  runs_scored integer DEFAULT 0,\n  extra_type extra_type,\n  extra_runs integer DEFAULT 0,\n  is_wicket boolean DEFAULT false,\n  wicket_type text,\n  wicket_batsman_id uuid REFERENCES players(id),\n  wicket_fielder_id uuid REFERENCES players(id),\n  created_at timestamptz DEFAULT now()\n);" },
      { title: "বাকি tables", description: "tournaments, tournament_teams, match_summaries, player_stats, notifications, role_permissions — এগুলো একই pattern এ তৈরি করুন। পূর্ণ SQL জানতে DEVELOPER.md দেখুন অথবা supabase/migrations/ ফোল্ডারের files দেখুন।" },
    ],
  },
  {
    id: "db-functions",
    icon: Code,
    title: "Database Functions তৈরি",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "has_role() — Role check function", description: "CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _org_id uuid, _role app_role)\nRETURNS boolean\nLANGUAGE sql STABLE SECURITY DEFINER\nSET search_path = public AS $$\n  SELECT EXISTS (\n    SELECT 1 FROM user_roles\n    WHERE user_id = _user_id AND organization_id = _org_id AND role = _role\n  );\n$$;\n\nগুরুত্বপূর্ণ: SECURITY DEFINER মানে এটি RLS bypass করে চলবে — recursive RLS error এড়াতে এটি অত্যন্ত দরকারি।" },
      { title: "user_in_org() — Org membership check", description: "CREATE OR REPLACE FUNCTION user_in_org(_user_id uuid, _org_id uuid)\nRETURNS boolean\nLANGUAGE sql STABLE SECURITY DEFINER\nSET search_path = public AS $$\n  SELECT EXISTS (\n    SELECT 1 FROM profiles WHERE user_id = _user_id AND organization_id = _org_id\n  );\n$$;" },
      { title: "get_user_org_id() — User's org ID", description: "CREATE OR REPLACE FUNCTION get_user_org_id(_user_id uuid)\nRETURNS uuid\nLANGUAGE sql STABLE SECURITY DEFINER\nSET search_path = public AS $$\n  SELECT organization_id FROM profiles WHERE user_id = _user_id LIMIT 1;\n$$;" },
      { title: "handle_new_user() — Auto profile creation", description: "CREATE OR REPLACE FUNCTION handle_new_user()\nRETURNS trigger\nLANGUAGE plpgsql SECURITY DEFINER\nSET search_path = public AS $$\nBEGIN\n  INSERT INTO profiles (user_id, full_name, avatar_url)\n  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''));\n  RETURN NEW;\nEND;\n$$;\n\nTrigger:\nCREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users\nFOR EACH ROW EXECUTE FUNCTION handle_new_user();" },
      { title: "archive_completed_match()", description: "Match complete হলে automatically match_summaries ও player_stats update করে। এই function matches table এ trigger হিসেবে কাজ করে:\n\nCREATE TRIGGER on_match_complete AFTER UPDATE ON matches\nFOR EACH ROW EXECUTE FUNCTION archive_completed_match();\n\nপূর্ণ function code DEVELOPER.md তে আছে।" },
      { title: "notify_org_members()", description: "নতুন match/team/player/tournament তৈরি হলে org এর সকল member কে notification পাঠায়:\n\nCREATE TRIGGER on_match_created AFTER INSERT ON matches FOR EACH ROW EXECUTE FUNCTION notify_org_members();\nCREATE TRIGGER on_team_created AFTER INSERT ON teams FOR EACH ROW EXECUTE FUNCTION notify_org_members();\nCREATE TRIGGER on_player_created AFTER INSERT ON players FOR EACH ROW EXECUTE FUNCTION notify_org_members();\nCREATE TRIGGER on_tournament_created AFTER INSERT ON tournaments FOR EACH ROW EXECUTE FUNCTION notify_org_members();" },
    ],
  },
  {
    id: "rls-policies",
    icon: Lock,
    title: "RLS Policies (Row Level Security)",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "RLS কী ও কেন দরকার?", description: "Row Level Security (RLS) হলো Supabase/PostgreSQL এর security feature যেটা ensure করে যে user শুধু তার authorized data ই access করতে পারবে। প্রতিটি table এ RLS enable করতে হবে:\n\nALTER TABLE organizations ENABLE ROW LEVEL SECURITY;\nALTER TABLE profiles ENABLE ROW LEVEL SECURITY;\nALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;\n... (সব table এ)" },
      { title: "organizations policies", description: "-- যেকোনো authenticated user দেখতে পারবে\nCREATE POLICY \"Users can view organizations\" ON organizations FOR SELECT TO authenticated USING (true);\n\n-- Admin update করতে পারবে\nCREATE POLICY \"Admins can update\" ON organizations FOR UPDATE USING (has_role(auth.uid(), id, 'admin'));\n\n-- নতুন org তৈরি করতে পারবে (যদি আগে কোনো org না থাকে)\nCREATE POLICY \"Users can create\" ON organizations FOR INSERT TO authenticated WITH CHECK (NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id IS NOT NULL));\n\n-- Admin delete করতে পারবে\nCREATE POLICY \"Admins can delete\" ON organizations FOR DELETE TO authenticated USING (has_role(auth.uid(), id, 'admin'));" },
      { title: "profiles policies", description: "-- নিজের org এর profiles দেখতে পারবে\nCREATE POLICY \"View profiles\" ON profiles FOR SELECT USING (organization_id = get_user_org_id(auth.uid()) OR user_id = auth.uid());\n\n-- নিজের profile update করতে পারবে\nCREATE POLICY \"Update own\" ON profiles FOR UPDATE USING (user_id = auth.uid());\n\n-- নিজের profile insert করতে পারবে\nCREATE POLICY \"Insert own\" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());" },
      { title: "user_roles policies", description: "-- Org members দেখতে পারবে\nCREATE POLICY \"View roles\" ON user_roles FOR SELECT USING (user_in_org(auth.uid(), organization_id));\n\n-- Admin manage করতে পারবে\nCREATE POLICY \"Admin manage\" ON user_roles FOR ALL USING (has_role(auth.uid(), organization_id, 'admin'));\n\n-- User নিজেকে assign করতে পারবে (org setup এর সময়)\nCREATE POLICY \"Self assign\" ON user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());" },
      { title: "teams policies", description: "-- Org member + public দেখতে পারবে\nCREATE POLICY \"Org view\" ON teams FOR SELECT USING (user_in_org(auth.uid(), organization_id));\nCREATE POLICY \"Public view\" ON teams FOR SELECT TO anon USING (true);\n\n-- Admin/Moderator manage করতে পারবে\nCREATE POLICY \"Admin manage\" ON teams FOR ALL USING (has_role(auth.uid(), organization_id, 'admin') OR has_role(auth.uid(), organization_id, 'moderator'));" },
      { title: "matches policies", description: "-- Org member দেখতে পারবে\nCREATE POLICY \"Org view\" ON matches FOR SELECT USING (user_in_org(auth.uid(), organization_id));\n\n-- Public live/completed দেখতে পারবে\nCREATE POLICY \"Public live\" ON matches FOR SELECT TO anon USING (status = 'live');\nCREATE POLICY \"Public completed\" ON matches FOR SELECT TO anon USING (status = 'completed');\n\n-- Admin/Moderator/Scorer manage করতে পারবে\nCREATE POLICY \"Manage\" ON matches FOR ALL USING (has_role(..., 'admin') OR has_role(..., 'moderator') OR has_role(..., 'scorer'));" },
      { title: "innings ও balls policies", description: "-- innings/balls: JOIN করে match table থেকে org check করবে\nCREATE POLICY \"Org view innings\" ON innings FOR SELECT USING (\n  EXISTS (SELECT 1 FROM matches m WHERE m.id = innings.match_id AND user_in_org(auth.uid(), m.organization_id))\n);\n\n-- Admin/Scorer manage করতে পারবে\nCREATE POLICY \"Scorer manage\" ON innings FOR ALL USING (\n  EXISTS (SELECT 1 FROM matches m WHERE m.id = innings.match_id AND (has_role(auth.uid(), m.organization_id, 'admin') OR has_role(auth.uid(), m.organization_id, 'scorer')))\n);\n\n-- balls table ও একই pattern follow করবে, innings_id দিয়ে join করে।\n\n-- Public live/completed match data দেখতে পারবে (anon role)।" },
      { title: "⚠️ গুরুত্বপূর্ণ নোট", description: "1. SECURITY DEFINER functions ব্যবহার করুন RLS check এ — recursive policy error এড়াতে।\n2. প্রতিটি table এ RLS enable না করলে সবাই সব data দেখতে পারবে!\n3. has_role() ও user_in_org() functions সবার আগে তৈরি করুন — এগুলো ছাড়া policies কাজ করবে না।\n4. Anon (public) policies শুধু read-only রাখুন — write access দেবেন না।" },
    ],
  },
  {
    id: "migrations",
    icon: Terminal,
    title: "Migration Commands",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "সব migrations push করুন", description: "supabase db push\n\nএটি supabase/migrations/ ফোল্ডারের সব .sql file sequence অনুযায়ী remote database এ apply করবে।" },
      { title: "নতুন migration তৈরি", description: "supabase migration new add_new_feature\n\nএটি supabase/migrations/ এ নতুন timestamp সহ .sql file তৈরি করবে। File edit করে SQL লিখুন।" },
      { title: "Migration status দেখুন", description: "supabase migration list\n\nকোন migration apply হয়েছে এবং কোনটা pending আছে দেখতে পারবেন।" },
      { title: "Schema diff দেখুন", description: "supabase db diff\n\nLocal schema vs remote database এর পার্থক্য দেখতে পারবেন।" },
      { title: "Types regenerate করুন", description: "supabase gen types typescript --project-id YOUR_PROJECT_REF > src/integrations/supabase/types.ts\n\nDatabase schema change হলে TypeScript types update করতে এই command চালান।" },
      { title: "⚠️ সতর্কতা", description: "• supabase db reset — এটি সব data মুছে দেবে! Production এ কখনো চালাবেন না।\n• Migration file তৈরির পর modify করবেন না — নতুন migration দিয়ে fix করুন।\n• প্রতিটি migration এ IF NOT EXISTS ব্যবহার করুন।" },
    ],
  },
  {
    id: "env-setup",
    icon: FileCode,
    title: "Environment Variables",
    category: "🚀 Deployment Guide",
    steps: [
      { title: ".env file তৈরি করুন", description: "Project root এ .env file তৈরি করুন:\n\nVITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...your-anon-key" },
      { title: "Supabase Client কোথায়?", description: "src/integrations/supabase/client.ts — এই file automatically configured থাকে। কখনো manually edit করবেন না।" },
      { title: "কোন key কোথায় পাবেন?", description: "Supabase Dashboard → Settings → API:\n• Project URL = VITE_SUPABASE_URL\n• anon (public) key = VITE_SUPABASE_PUBLISHABLE_KEY\n\nService Role Key শুধু server-side এ ব্যবহার করবেন। ⚠️ কখনো frontend code এ Service Role Key দেবেন না!" },
    ],
  },
  {
    id: "vercel-deploy",
    icon: Cloud,
    title: "Vercel এ Deploy",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "Vercel CLI Install", description: "npm install -g vercel\nvercel login" },
      { title: "GitHub থেকে Import (সবচেয়ে সহজ)", description: "1. Code GitHub এ push করুন\n2. vercel.com/dashboard এ যান\n3. 'Import Project' ক্লিক করে GitHub repo select করুন\n4. Framework: Vite select করুন\n5. Build Command: npm run build\n6. Output Directory: dist" },
      { title: "Environment Variables সেট করুন", description: "Vercel Dashboard → Project → Settings → Environment Variables:\n\nVITE_SUPABASE_URL = https://YOUR_PROJECT.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY = your-anon-key\n\nঅথবা CLI দিয়ে:\nvercel env add VITE_SUPABASE_URL\nvercel env add VITE_SUPABASE_PUBLISHABLE_KEY" },
      { title: "vercel.json তৈরি করুন", description: "Project root এ vercel.json তৈরি করুন:\n{\n  \"buildCommand\": \"npm run build\",\n  \"outputDirectory\": \"dist\",\n  \"framework\": \"vite\",\n  \"rewrites\": [\n    { \"source\": \"/(.*)\", \"destination\": \"/index.html\" }\n  ]\n}\n\n⚠️ rewrites rule অত্যন্ত গুরুত্বপূর্ণ — ছাড়া SPA routing কাজ করবে না।" },
      { title: "Deploy করুন", description: "vercel              → Preview URL পাবেন\nvercel --prod       → Production deploy\n\nGitHub connected থাকলে প্রতিটি push এ auto-deploy হবে।" },
      { title: "Custom Domain", description: "vercel domains add yourdomain.com\n\nVercel Dashboard → Project → Domains এ custom domain যোগ করুন। DNS settings configure করুন।" },
    ],
  },
  {
    id: "supabase-auth",
    icon: Shield,
    title: "Auth Configuration",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "Email Auth Enable", description: "Supabase Dashboard → Authentication → Providers → Email:\n• Enable Email provider\n• 'Confirm email' ON রাখুন (production এ)\n• Minimum password length: 6" },
      { title: "Site URL সেট করুন", description: "Supabase Dashboard → Authentication → URL Configuration:\n• Site URL: https://your-app.vercel.app\n• Redirect URLs: https://your-app.vercel.app/auth, https://your-app.vercel.app/reset-password" },
      { title: "Auto Profile Creation", description: "auth.users table এ নতুন user insert হলে handle_new_user() trigger automatically profiles table এ row তৈরি করে। এটি auth flow এর জন্য অত্যন্ত গুরুত্বপূর্ণ।" },
      { title: "Password Reset Flow", description: "User 'Forgot Password' এ ক্লিক করলে Supabase reset email পাঠায়। Email এর link এ ক্লিক করলে /reset-password page এ redirect হয়। সেখানে নতুন password সেট করতে পারবে।" },
    ],
  },
  {
    id: "go-live-checklist",
    icon: Globe,
    title: "Go-Live Checklist ✅",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "✅ Supabase Project তৈরি হয়েছে", description: "supabase.com এ project তৈরি করুন এবং URL, Anon Key নোট করুন।" },
      { title: "✅ সব Migrations Apply হয়েছে", description: "supabase db push চালিয়ে সব table, function, trigger তৈরি হয়েছে কিনা check করুন।" },
      { title: "✅ RLS Policies Enable আছে", description: "প্রতিটি table এ RLS enable আছে কিনা verify করুন। SQL:\nSELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';" },
      { title: "✅ Auth Trigger কাজ করছে", description: "নতুন user signup করলে profiles table এ row তৈরি হচ্ছে কিনা check করুন।" },
      { title: "✅ Environment Variables সেট আছে", description: "Vercel এ VITE_SUPABASE_URL ও VITE_SUPABASE_PUBLISHABLE_KEY সেট আছে।" },
      { title: "✅ vercel.json rewrites আছে", description: "SPA routing এর জন্য rewrites rule add হয়েছে।" },
      { title: "✅ Site URL ও Redirect URLs ঠিক আছে", description: "Supabase Auth → URL Configuration এ production URL দেওয়া আছে।" },
      { title: "✅ Test: Signup → Org → Match → Score", description: "Full flow test করুন — signup, org তৈরি, team/player add, match create, live scoring।" },
    ],
  },
  {
    id: "useful-commands",
    icon: Terminal,
    title: "Useful Commands",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "Local Dev Start", description: "npm install\nnpm run dev\n\nApp চালু হবে http://localhost:5173 এ।" },
      { title: "Build ও Preview", description: "npm run build      → Production build\nnpm run preview    → Build preview locally" },
      { title: "Supabase Status", description: "supabase status            → Connection info\nsupabase migration list    → Migration status\nsupabase logs --type api   → API logs দেখুন" },
      { title: "Database Query", description: "supabase db execute --sql \"SELECT COUNT(*) FROM matches;\"\n\nঅথবা Supabase Dashboard → SQL Editor ব্যবহার করুন।" },
      { title: "Debug Commands", description: "# Auth check:\ncurl https://YOUR_PROJECT.supabase.co/auth/v1/health\n\n# API check:\ncurl https://YOUR_PROJECT.supabase.co/rest/v1/ -H \"apikey: YOUR_ANON_KEY\"\n\n# Logs:\nsupabase logs --type postgres" },
      { title: "Types Regenerate", description: "supabase gen types typescript --project-id YOUR_REF > src/integrations/supabase/types.ts\n\nDatabase schema change করলে এটি চালান।" },
    ],
  },
  {
    id: "backup-restore",
    icon: Database,
    title: "Backup ও Restore (CLI)",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "Full Database Backup (pg_dump)", description: "pg_dump postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres > backup_$(date +%Y%m%d).sql\n\n⚠️ DB_PASSWORD = Supabase Dashboard → Settings → Database → Database password\n⚠️ PROJECT_REF = আপনার project reference ID" },
      { title: "Specific Tables Backup", description: "# শুধু নির্দিষ্ট tables backup নিন:\npg_dump postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres \\\n  -t matches -t innings -t balls -t teams -t players -t player_stats \\\n  > tables_backup_$(date +%Y%m%d).sql" },
      { title: "Data Only Backup (Schema ছাড়া)", description: "pg_dump postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres \\\n  --data-only --schema=public \\\n  > data_only_backup.sql\n\nএটি শুধু data export করবে, table structure না।" },
      { title: "Schema Only Backup (Data ছাড়া)", description: "pg_dump postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres \\\n  --schema-only --schema=public \\\n  > schema_only_backup.sql\n\nএটি শুধু table structure, functions, triggers export করবে।" },
      { title: "CSV Export (Specific Table)", description: "psql postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres \\\n  -c \"\\COPY matches TO 'matches_export.csv' WITH CSV HEADER;\"\n\n# যেকোনো table এর জন্য table name পরিবর্তন করুন।" },
      { title: "Restore — Full Database", description: "psql postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres \\\n  < backup_20260331.sql\n\n⚠️ সতর্কতা: এটি existing data overwrite করতে পারে! Production এ করার আগে staging এ test করুন।" },
      { title: "Restore — Data Only", description: "psql postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres \\\n  < data_only_backup.sql\n\n⚠️ Table structure আগে থেকে থাকতে হবে। Schema migration আগে apply করুন।" },
      { title: "Restore — CSV Import", description: "psql postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres \\\n  -c \"\\COPY matches FROM 'matches_export.csv' WITH CSV HEADER;\"\n\n⚠️ FK constraints ঠিক রাখতে import order মেনে চলুন: organizations → teams → players → matches → innings → balls" },
      { title: "Supabase CLI দিয়ে Backup", description: "# Local project link থাকলে:\nsupabase db dump -f backup.sql\n\n# Remote থেকে dump:\nsupabase db dump -f backup.sql --linked\n\n# Data only:\nsupabase db dump -f data.sql --data-only" },
      { title: "Automated Daily Backup Script", description: "#!/bin/bash\nDATE=$(date +%Y%m%d_%H%M)\nDB_URL=\"postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres\"\nBACKUP_DIR=\"./backups\"\nmkdir -p $BACKUP_DIR\n\npg_dump $DB_URL > $BACKUP_DIR/backup_$DATE.sql\n\n# পুরানো backup মুছুন (30 দিনের বেশি):\nfind $BACKUP_DIR -name '*.sql' -mtime +30 -delete\n\necho \"Backup complete: backup_$DATE.sql\"\n\n# cron এ যোগ করুন (প্রতিদিন রাত 2 টায়):\n# 0 2 * * * /path/to/backup.sh" },
      { title: "⚠️ গুরুত্বপূর্ণ সতর্কতা", description: "1. Production backup নেওয়ার সময় load কম থাকলে ভালো (রাতে)।\n2. Backup file safely store করুন — encrypted storage ব্যবহার করুন।\n3. Restore করার আগে ALWAYS staging/test environment এ verify করুন।\n4. auth.users table backup হবে না (Supabase managed)। শুধু public schema backup হবে।\n5. Storage buckets (files/images) আলাদাভাবে backup নিতে হবে — pg_dump এ আসবে না।\n6. DB password কখনো Git এ commit করবেন না!" },
    ],
  },
  {
    id: "troubleshooting-deploy",
    icon: GitBranch,
    title: "Troubleshooting",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "RLS Policy Error", description: "Error: 'new row violates row-level security policy'\n\nSolution: user_roles table এ user এর role আছে কিনা check করুন। has_role() function তৈরি আছে কিনা verify করুন।" },
      { title: "Infinite Recursion Error", description: "Error: 'infinite recursion detected in policy'\n\nSolution: RLS policy এ যে table র উপর policy, সেই table কে query করবেন না। SECURITY DEFINER function ব্যবহার করুন।" },
      { title: "Auth Redirect Loop", description: "User login করে কিন্তু বারবার auth page এ ফিরে আসে।\n\nSolution: profiles table এ organization_id set আছে কিনা check করুন। ProtectedRoute component verify করুন।" },
      { title: "404 on Direct URL", description: "Vercel এ deploy করে direct URL (e.g. /dashboard) এ 404 পাচ্ছেন।\n\nSolution: vercel.json এ rewrites rule আছে কিনা check করুন।" },
      { title: "Data Missing / Not Loading", description: "Solution:\n1. RLS policies enable আছে কিনা check করুন\n2. User এর role ঠিক আছে কিনা check করুন\n3. Browser console এ error দেখুন\n4. Supabase logs check করুন" },
    ],
  },
  {
    id: "admin-commands",
    icon: UserCog,
    title: "Admin & User Management Commands",
    category: "🚀 Deployment Guide",
    steps: [
      { title: "কাউকে Admin বানানো", description: "-- প্রথমে user এর ID বের করুন\nSELECT p.user_id, p.full_name, p.organization_id\nFROM profiles p WHERE p.full_name ILIKE '%নাম%';\n\n-- Admin role assign করুন\nINSERT INTO user_roles (user_id, organization_id, role)\nVALUES ('USER_ID_HERE', 'ORG_ID_HERE', 'admin')\nON CONFLICT (user_id, organization_id)\nDO UPDATE SET role = 'admin';" },
      { title: "Role Change করুন (Admin → Scorer etc.)", description: "UPDATE user_roles\nSET role = 'scorer'   -- options: admin, moderator, scorer, viewer\nWHERE user_id = 'USER_ID_HERE'\n  AND organization_id = 'ORG_ID_HERE';" },
      { title: "সব Members ও তাদের Role দেখুন", description: "SELECT p.full_name, p.user_id, ur.role, p.is_approved, p.organization_id\nFROM profiles p\nLEFT JOIN user_roles ur ON ur.user_id = p.user_id AND ur.organization_id = p.organization_id\nWHERE p.organization_id = 'ORG_ID_HERE'\nORDER BY ur.role;" },
      { title: "User Approve করুন", description: "UPDATE profiles\nSET is_approved = true\nWHERE user_id = 'USER_ID_HERE';" },
      { title: "User কে Org এ যোগ করুন", description: "-- Step 1: Profile এ org link করুন\nUPDATE profiles\nSET organization_id = 'ORG_ID_HERE', is_approved = true\nWHERE user_id = 'USER_ID_HERE';\n\n-- Step 2: Role assign করুন\nINSERT INTO user_roles (user_id, organization_id, role)\nVALUES ('USER_ID_HERE', 'ORG_ID_HERE', 'viewer');" },
      { title: "User Remove করুন Org থেকে", description: "-- Role মুছুন\nDELETE FROM user_roles\nWHERE user_id = 'USER_ID_HERE' AND organization_id = 'ORG_ID_HERE';\n\n-- Profile থেকে org unlink করুন\nUPDATE profiles\nSET organization_id = NULL, is_approved = false\nWHERE user_id = 'USER_ID_HERE';" },
      { title: "Organization এর সব Info দেখুন", description: "SELECT id, name, slug, created_at FROM organizations;\n\n-- Specific org:\nSELECT * FROM organizations WHERE slug = 'your-org-slug';" },
      { title: "কোন User কোন Org এ আছে?", description: "SELECT p.full_name, o.name as org_name, ur.role\nFROM profiles p\nJOIN organizations o ON o.id = p.organization_id\nLEFT JOIN user_roles ur ON ur.user_id = p.user_id AND ur.organization_id = p.organization_id\nORDER BY o.name;" },
      { title: "User Role Check Function ব্যবহার", description: "-- has_role() function দিয়ে check:\nSELECT has_role('USER_ID', 'ORG_ID', 'admin');\n\n-- user_in_org() function দিয়ে check:\nSELECT user_in_org('USER_ID', 'ORG_ID');\n\n-- get_user_org_id() দিয়ে org বের করুন:\nSELECT get_user_org_id('USER_ID');" },
      { title: "Supabase CLI দিয়ে SQL চালানো", description: "supabase db execute --sql \"SELECT * FROM user_roles;\"\n\nঅথবা Supabase Dashboard → SQL Editor এ SQL paste করে Run করুন।\n\n⚠️ Service Role Key দিয়ে API call করলে RLS bypass হবে — সাবধানে ব্যবহার করুন।" },
      { title: "Emergency: নিজেকে Admin বানানো", description: "-- যদি কোনো admin না থাকে, Supabase Dashboard → SQL Editor এ চালান:\n\n-- 1. আপনার user_id বের করুন\nSELECT id, email FROM auth.users;\n\n-- 2. Organization ID বের করুন\nSELECT id, name FROM organizations;\n\n-- 3. Admin role force-insert করুন\nINSERT INTO user_roles (user_id, organization_id, role)\nVALUES ('YOUR_USER_ID', 'YOUR_ORG_ID', 'admin')\nON CONFLICT (user_id, organization_id)\nDO UPDATE SET role = 'admin';\n\n-- 4. Profile approve করুন\nUPDATE profiles SET is_approved = true, organization_id = 'YOUR_ORG_ID'\nWHERE user_id = 'YOUR_USER_ID';" },
    ],
  },
  // ===== ALTERNATIVE DEPLOYMENT =====
  {
    id: "netlify-deploy",
    icon: Globe,
    title: "Netlify এ Deploy",
    category: "🌐 Alternative Deployment",
    steps: [
      { title: "Netlify CLI Install", description: "npm install -g netlify-cli\nnetlify login" },
      { title: "GitHub থেকে Import (সবচেয়ে সহজ)", description: "1. https://app.netlify.com এ যান\n2. 'Add new site' → 'Import an existing project'\n3. GitHub repo select করুন\n4. Build settings:\n   Build command: npm run build\n   Publish directory: dist\n5. 'Deploy site' ক্লিক করুন" },
      { title: "Environment Variables সেট করুন", description: "Netlify Dashboard → Site settings → Environment variables:\n\nVITE_SUPABASE_URL = https://YOUR_PROJECT.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY = your-anon-key\n\nঅথবা CLI দিয়ে:\nnetlify env:set VITE_SUPABASE_URL https://YOUR_PROJECT.supabase.co\nnetlify env:set VITE_SUPABASE_PUBLISHABLE_KEY your-anon-key" },
      { title: "SPA Redirect Setup (গুরুত্বপূর্ণ!)", description: "public/ ফোল্ডারে _redirects file তৈরি করুন:\n\n/*    /index.html   200\n\nঅথবা netlify.toml তৈরি করুন project root এ:\n[[redirects]]\n  from = \"/*\"\n  to = \"/index.html\"\n  status = 200\n\n⚠️ এটি ছাড়া SPA routing কাজ করবে না — direct URL এ 404 পাবেন।" },
      { title: "CLI দিয়ে Deploy", description: "netlify build          → Local build\nnetlify deploy         → Draft/preview deploy\nnetlify deploy --prod  → Production deploy\n\nGitHub connected থাকলে প্রতিটি push এ auto-deploy হবে।" },
      { title: "Custom Domain", description: "Netlify Dashboard → Domain management → Add custom domain\n\nDNS settings:\n• CNAME record: your-site.netlify.app\n• অথবা Netlify DNS ব্যবহার করুন\n\nSSL certificate automatically তৈরি হবে (Let's Encrypt)।" },
    ],
  },
  {
    id: "docker-deploy",
    icon: Server,
    title: "Docker এ Deploy",
    category: "🌐 Alternative Deployment",
    steps: [
      { title: "Dockerfile তৈরি করুন", description: "Project root এ Dockerfile তৈরি করুন:\n\n# Build stage\nFROM node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nARG VITE_SUPABASE_URL\nARG VITE_SUPABASE_PUBLISHABLE_KEY\nRUN npm run build\n\n# Production stage\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nCOPY nginx.conf /etc/nginx/conf.d/default.conf\nEXPOSE 80\nCMD [\"nginx\", \"-g\", \"daemon off;\"]" },
      { title: "nginx.conf তৈরি করুন", description: "Project root এ nginx.conf তৈরি করুন:\n\nserver {\n    listen 80;\n    server_name _;\n    root /usr/share/nginx/html;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n\n    location /assets {\n        expires 1y;\n        add_header Cache-Control \"public, immutable\";\n    }\n\n    gzip on;\n    gzip_types text/css application/javascript application/json;\n}\n\n⚠️ try_files rule অত্যন্ত গুরুত্বপূর্ণ — SPA routing এর জন্য।" },
      { title: ".dockerignore তৈরি করুন", description: "node_modules\ndist\n.git\n.env\n*.md" },
      { title: "Docker Image Build করুন", description: "docker build \\\n  --build-arg VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \\\n  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \\\n  -t crickethub:latest ." },
      { title: "Docker Container চালান", description: "docker run -d -p 3000:80 --name crickethub crickethub:latest\n\nApp চালু হবে http://localhost:3000 এ।\n\nStop করতে:\ndocker stop crickethub\n\nLogs দেখতে:\ndocker logs crickethub" },
      { title: "Docker Compose (Optional)", description: "docker-compose.yml তৈরি করুন:\n\nversion: '3.8'\nservices:\n  crickethub:\n    build:\n      context: .\n      args:\n        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}\n        VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY}\n    ports:\n      - \"3000:80\"\n    restart: unless-stopped\n\nচালান:\ndocker-compose up -d" },
      { title: "Cloud এ Deploy (AWS/GCP/DigitalOcean)", description: "# Docker Hub এ push করুন\ndocker tag crickethub:latest YOUR_DOCKER_USER/crickethub:latest\ndocker push YOUR_DOCKER_USER/crickethub:latest\n\n# AWS ECS, Google Cloud Run, বা DigitalOcean App Platform এ deploy করুন।\n\n# Google Cloud Run উদাহরণ:\ngcloud run deploy crickethub \\\n  --image YOUR_DOCKER_USER/crickethub:latest \\\n  --port 80 \\\n  --allow-unauthenticated" },
    ],
  },
  {
    id: "firebase-deploy",
    icon: Cloud,
    title: "Firebase Hosting এ Deploy",
    category: "🌐 Alternative Deployment",
    steps: [
      { title: "Firebase CLI Install", description: "npm install -g firebase-tools\nfirebase login" },
      { title: "Firebase Project তৈরি", description: "1. https://console.firebase.google.com এ যান\n2. 'Add project' ক্লিক করুন\n3. Project নাম দিন\n4. Google Analytics optional — skip করতে পারেন" },
      { title: "Firebase Init করুন", description: "firebase init hosting\n\nPrompts:\n• Select project: আপনার তৈরি করা project select করুন\n• Public directory: dist\n• Single-page app (rewrite all URLs to /index.html): Yes\n• Set up GitHub Actions for deploy: Optional (Yes করলে auto-deploy হবে)\n• Overwrite dist/index.html: No" },
      { title: "firebase.json দেখে নিন", description: "firebase init এর পর firebase.json এরকম হওয়া উচিত:\n\n{\n  \"hosting\": {\n    \"public\": \"dist\",\n    \"ignore\": [\"firebase.json\", \"**/.*\", \"**/node_modules/**\"],\n    \"rewrites\": [\n      {\n        \"source\": \"**\",\n        \"destination\": \"/index.html\"\n      }\n    ],\n    \"headers\": [\n      {\n        \"source\": \"/assets/**\",\n        \"headers\": [\n          { \"key\": \"Cache-Control\", \"value\": \"public, max-age=31536000, immutable\" }\n        ]\n      }\n    ]\n  }\n}" },
      { title: "Environment Variables সেট করুন", description: "Firebase Hosting এ env vars build-time এ দিতে হয়।\n\n.env.production file তৈরি করুন:\nVITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key\n\n⚠️ .env.production file .gitignore এ যোগ করুন!" },
      { title: "Build ও Deploy", description: "npm run build\nfirebase deploy --only hosting\n\nDeploy হলে URL পাবেন:\n✔ Hosting URL: https://your-project.web.app\n\nPreview deploy:\nfirebase hosting:channel:deploy preview_name" },
      { title: "Custom Domain", description: "Firebase Console → Hosting → Custom domains → Add custom domain\n\nDNS records:\n• TXT record (verification)\n• A records: Firebase এর IP addresses\n\nSSL certificate automatically তৈরি হবে।" },
      { title: "GitHub Actions Auto-Deploy", description: "firebase init hosting:github চালালে .github/workflows/ এ auto-deploy workflow তৈরি হবে।\n\nGitHub repo → Settings → Secrets এ add করুন:\n• VITE_SUPABASE_URL\n• VITE_SUPABASE_PUBLISHABLE_KEY\n\nতারপর workflow file এ build step এ env vars যোগ করুন:\nenv:\n  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}\n  VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}" },
    ],
  },
];

// Group sections by category
const categories = Array.from(new Set(sections.map(s => s.category || "📖 User Guide")));

function CopyableBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <div className="relative group mt-1">
      <pre className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap break-words font-mono bg-muted/50 border border-border/40 rounded-lg p-2.5 pr-9">{text}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

function StepDescription({ description }: { description: string }) {
  // Split description into text and code blocks
  // Code blocks are lines that look like SQL/commands (start with SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, --, npm, supabase, vercel, curl, cd, cat, VITE_, #, {, or contain common command patterns)
  const codePattern = /^(SELECT |INSERT |UPDATE |DELETE |CREATE |ALTER |DROP |--|npm |supabase |vercel |curl |cd |VITE_|cat |#|\{|  |FROM |WHERE |SET |VALUES |ON |WITH |RETURNS |LANGUAGE |AS |BEGIN|END|IF |FOR |DECLARE|ELSIF)/i;

  const parts: { type: "text" | "code"; content: string }[] = [];
  const lines = description.split("\n");
  let currentType: "text" | "code" | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentLines.length > 0 && currentType) {
      parts.push({ type: currentType, content: currentLines.join("\n") });
      currentLines = [];
    }
  };

  for (const line of lines) {
    const isCode = codePattern.test(line.trim()) || (line.trim().length > 0 && /[;{}()=]$/.test(line.trim()));
    const type = isCode ? "code" : "text";

    // Continue code block for blank lines between code
    if (line.trim() === "" && currentType === "code") {
      currentLines.push(line);
      continue;
    }

    if (type !== currentType) {
      flush();
      currentType = type;
    }
    currentLines.push(line);
  }
  flush();

  // Trim trailing empty lines from code blocks
  return (
    <div className="space-y-1">
      {parts.map((part, i) =>
        part.type === "code" ? (
          <CopyableBlock key={i} text={part.content.trim()} />
        ) : (
          <pre key={i} className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap break-words font-sans">{part.content}</pre>
        )
      )}
    </div>
  );
}

function AccordionSection({ section, index, defaultOpen = false }: { section: DocSection; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-border/60 rounded-xl bg-card overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-muted/30 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">{section.title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-2.5">
          {section.steps.map((step, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="flex flex-col items-center pt-0.5">
                <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                {i < section.steps.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
              </div>
              <div className="pb-2 flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{step.title}</p>
                <StepDescription description={step.description} />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const Documentation = () => {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!query) return sections;
    return sections
      .map(section => {
        const titleMatch = section.title.toLowerCase().includes(query);
        const matchedSteps = section.steps.filter(
          s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
        );
        if (titleMatch) return section;
        if (matchedSteps.length > 0) return { ...section, steps: matchedSteps };
        return null;
      })
      .filter(Boolean) as DocSection[];
  }, [query]);

  const groupedSections = useMemo(() => {
    const groups: Record<string, DocSection[]> = {};
    filtered.forEach(s => {
      const cat = s.category || "📖 User Guide";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [filtered]);

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-foreground tracking-tight">Documentation</h1>
              <p className="text-[11px] text-muted-foreground">CricketHub ব্যবহার ও deployment গাইড</p>
            </div>
          </div>
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search docs... (e.g. RLS, vercel, migration, scoring)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/40 border border-border/60 rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">কোনো result পাওয়া যায়নি "{search}"</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedSections).map(([category, secs]) => (
              <div key={category}>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{category}</h2>
                <div className="space-y-2">
                  {secs.map((section, i) => (
                    <AccordionSection key={section.id} section={section} index={i} defaultOpen={!!query} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Documentation;