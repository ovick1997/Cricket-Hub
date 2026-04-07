export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      balls: {
        Row: {
          ball_number: number
          batsman_id: string
          bowler_id: string
          created_at: string
          extra_runs: number
          extra_type: Database["public"]["Enums"]["extra_type"] | null
          id: string
          innings_id: string
          is_wicket: boolean
          non_striker_id: string | null
          over_number: number
          runs_scored: number
          wicket_batsman_id: string | null
          wicket_fielder_id: string | null
          wicket_type: string | null
        }
        Insert: {
          ball_number: number
          batsman_id: string
          bowler_id: string
          created_at?: string
          extra_runs?: number
          extra_type?: Database["public"]["Enums"]["extra_type"] | null
          id?: string
          innings_id: string
          is_wicket?: boolean
          non_striker_id?: string | null
          over_number: number
          runs_scored?: number
          wicket_batsman_id?: string | null
          wicket_fielder_id?: string | null
          wicket_type?: string | null
        }
        Update: {
          ball_number?: number
          batsman_id?: string
          bowler_id?: string
          created_at?: string
          extra_runs?: number
          extra_type?: Database["public"]["Enums"]["extra_type"] | null
          id?: string
          innings_id?: string
          is_wicket?: boolean
          non_striker_id?: string | null
          over_number?: number
          runs_scored?: number
          wicket_batsman_id?: string | null
          wicket_fielder_id?: string | null
          wicket_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "balls_batsman_id_fkey"
            columns: ["batsman_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_innings_id_fkey"
            columns: ["innings_id"]
            isOneToOne: false
            referencedRelation: "innings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_non_striker_id_fkey"
            columns: ["non_striker_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_wicket_batsman_id_fkey"
            columns: ["wicket_batsman_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balls_wicket_fielder_id_fkey"
            columns: ["wicket_fielder_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      innings: {
        Row: {
          batting_team_id: string
          bowling_team_id: string
          created_at: string
          extras_byes: number
          extras_leg_byes: number
          extras_no_balls: number
          extras_wides: number
          id: string
          innings_number: number
          match_id: string
          status: Database["public"]["Enums"]["innings_status"]
          total_overs: number
          total_runs: number
          total_wickets: number
          updated_at: string
        }
        Insert: {
          batting_team_id: string
          bowling_team_id: string
          created_at?: string
          extras_byes?: number
          extras_leg_byes?: number
          extras_no_balls?: number
          extras_wides?: number
          id?: string
          innings_number: number
          match_id: string
          status?: Database["public"]["Enums"]["innings_status"]
          total_overs?: number
          total_runs?: number
          total_wickets?: number
          updated_at?: string
        }
        Update: {
          batting_team_id?: string
          bowling_team_id?: string
          created_at?: string
          extras_byes?: number
          extras_leg_byes?: number
          extras_no_balls?: number
          extras_wides?: number
          id?: string
          innings_number?: number
          match_id?: string
          status?: Database["public"]["Enums"]["innings_status"]
          total_overs?: number
          total_runs?: number
          total_wickets?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "innings_batting_team_id_fkey"
            columns: ["batting_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innings_bowling_team_id_fkey"
            columns: ["bowling_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_summaries: {
        Row: {
          created_at: string
          id: string
          man_of_match: string | null
          match_date: string | null
          match_id: string
          organization_id: string
          overs: number
          result: string | null
          team1_color: string
          team1_name: string
          team1_score: string | null
          team1_short: string
          team2_color: string
          team2_name: string
          team2_score: string | null
          team2_short: string
          toss_decision: string | null
          toss_winner: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          man_of_match?: string | null
          match_date?: string | null
          match_id: string
          organization_id: string
          overs?: number
          result?: string | null
          team1_color?: string
          team1_name: string
          team1_score?: string | null
          team1_short: string
          team2_color?: string
          team2_name: string
          team2_score?: string | null
          team2_short: string
          toss_decision?: string | null
          toss_winner?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          man_of_match?: string | null
          match_date?: string | null
          match_id?: string
          organization_id?: string
          overs?: number
          result?: string | null
          team1_color?: string
          team1_name?: string
          team1_score?: string | null
          team1_short?: string
          team2_color?: string
          team2_name?: string
          team2_score?: string | null
          team2_short?: string
          toss_decision?: string | null
          toss_winner?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_summaries_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          batting_option: number
          created_at: string
          id: string
          is_short_chris: boolean
          man_of_match_id: string | null
          match_date: string | null
          max_overs_per_bowler: number | null
          organization_id: string
          overs: number
          players_per_team: number
          result: string | null
          status: Database["public"]["Enums"]["match_status"]
          team1_id: string
          team2_id: string
          toss_decision: string | null
          toss_winner_id: string | null
          tournament_id: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          batting_option?: number
          created_at?: string
          id?: string
          is_short_chris?: boolean
          man_of_match_id?: string | null
          match_date?: string | null
          max_overs_per_bowler?: number | null
          organization_id: string
          overs?: number
          players_per_team?: number
          result?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team1_id: string
          team2_id: string
          toss_decision?: string | null
          toss_winner_id?: string | null
          tournament_id?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          batting_option?: number
          created_at?: string
          id?: string
          is_short_chris?: boolean
          man_of_match_id?: string | null
          match_date?: string | null
          max_overs_per_bowler?: number | null
          organization_id?: string
          overs?: number
          players_per_team?: number
          result?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team1_id?: string
          team2_id?: string
          toss_decision?: string | null
          toss_winner_id?: string | null
          tournament_id?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_man_of_match_id_fkey"
            columns: ["man_of_match_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_toss_winner_id_fkey"
            columns: ["toss_winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          organization_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          organization_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          organization_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          balls_faced: number
          best_bowling_runs: number
          best_bowling_wickets: number
          catches: number
          fifties: number
          five_wickets: number
          fours: number
          highest_score: number
          hundreds: number
          id: string
          innings_batted: number
          innings_bowled: number
          matches_played: number
          not_outs: number
          organization_id: string
          overs_bowled: number
          player_id: string
          run_outs: number
          runs_conceded: number
          sixes: number
          stumpings: number
          ten_wickets: number
          total_runs: number
          updated_at: string
          wickets_taken: number
        }
        Insert: {
          balls_faced?: number
          best_bowling_runs?: number
          best_bowling_wickets?: number
          catches?: number
          fifties?: number
          five_wickets?: number
          fours?: number
          highest_score?: number
          hundreds?: number
          id?: string
          innings_batted?: number
          innings_bowled?: number
          matches_played?: number
          not_outs?: number
          organization_id: string
          overs_bowled?: number
          player_id: string
          run_outs?: number
          runs_conceded?: number
          sixes?: number
          stumpings?: number
          ten_wickets?: number
          total_runs?: number
          updated_at?: string
          wickets_taken?: number
        }
        Update: {
          balls_faced?: number
          best_bowling_runs?: number
          best_bowling_wickets?: number
          catches?: number
          fifties?: number
          five_wickets?: number
          fours?: number
          highest_score?: number
          hundreds?: number
          id?: string
          innings_batted?: number
          innings_bowled?: number
          matches_played?: number
          not_outs?: number
          organization_id?: string
          overs_bowled?: number
          player_id?: string
          run_outs?: number
          runs_conceded?: number
          sixes?: number
          stumpings?: number
          ten_wickets?: number
          total_runs?: number
          updated_at?: string
          wickets_taken?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          batting_style: Database["public"]["Enums"]["batting_style"]
          bowling_style: string | null
          created_at: string
          id: string
          jersey_number: number | null
          name: string
          organization_id: string
          photo_url: string | null
          role: Database["public"]["Enums"]["player_role"]
          updated_at: string
        }
        Insert: {
          batting_style?: Database["public"]["Enums"]["batting_style"]
          bowling_style?: string | null
          created_at?: string
          id?: string
          jersey_number?: number | null
          name: string
          organization_id: string
          photo_url?: string | null
          role?: Database["public"]["Enums"]["player_role"]
          updated_at?: string
        }
        Update: {
          batting_style?: Database["public"]["Enums"]["batting_style"]
          bowling_style?: string | null
          created_at?: string
          id?: string
          jersey_number?: number | null
          name?: string
          organization_id?: string
          photo_url?: string | null
          role?: Database["public"]["Enums"]["player_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          id: string
          is_captain: boolean
          is_vice_captain: boolean
          joined_at: string
          player_id: string
          team_id: string
        }
        Insert: {
          id?: string
          is_captain?: boolean
          is_vice_captain?: boolean
          joined_at?: string
          player_id: string
          team_id: string
        }
        Update: {
          id?: string
          is_captain?: boolean
          is_vice_captain?: boolean
          joined_at?: string
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          short_name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          short_name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          short_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_teams: {
        Row: {
          id: string
          team_id: string
          tournament_id: string
        }
        Insert: {
          id?: string
          team_id: string
          tournament_id: string
        }
        Update: {
          id?: string
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          batting_option: number
          created_at: string
          description: string | null
          end_date: string | null
          format: Database["public"]["Enums"]["tournament_format"]
          id: string
          max_overs_per_bowler: number | null
          name: string
          organization_id: string
          overs_per_match: number
          players_per_team: number
          prize_money: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          batting_option?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          id?: string
          max_overs_per_bowler?: number | null
          name: string
          organization_id: string
          overs_per_match?: number
          players_per_team?: number
          prize_money?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          batting_option?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          id?: string
          max_overs_per_bowler?: number | null
          name?: string
          organization_id?: string
          overs_per_match?: number
          players_per_team?: number
          prize_money?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_organization_cascade: {
        Args: { _org_id: string }
        Returns: undefined
      }
      get_distinct_match_overs: {
        Args: { _org_id?: string }
        Returns: {
          overs: number
        }[]
      }
      get_player_stats_by_format: {
        Args: { _org_id?: string; _overs: number }
        Returns: {
          balls_faced: number
          fifties: number
          five_wickets: number
          fours: number
          highest_score: number
          hundreds: number
          innings_batted: number
          innings_bowled: number
          matches_played: number
          not_outs: number
          overs_bowled: number
          player_id: string
          player_name: string
          player_organization_id: string
          player_photo_url: string
          player_role: Database["public"]["Enums"]["player_role"]
          runs_conceded: number
          sixes: number
          total_runs: number
          wickets_taken: number
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_system_admin: { Args: { _user_id: string }; Returns: boolean }
      reset_organization_data: { Args: { _org_id: string }; Returns: undefined }
      selective_reset_organization_data: {
        Args: {
          _delete_matches?: boolean
          _delete_notifications?: boolean
          _delete_player_stats?: boolean
          _delete_players?: boolean
          _delete_teams?: boolean
          _delete_tournaments?: boolean
          _org_id: string
        }
        Returns: undefined
      }
      user_in_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "scorer" | "viewer"
      batting_style: "right-hand" | "left-hand"
      extra_type: "wide" | "no-ball" | "bye" | "leg-bye"
      innings_status: "in_progress" | "completed" | "yet_to_bat"
      match_status: "upcoming" | "live" | "completed" | "abandoned"
      player_role: "batsman" | "bowler" | "all-rounder" | "wicketkeeper"
      tournament_format: "league" | "knockout" | "round-robin" | "short-chris"
      tournament_status: "upcoming" | "ongoing" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "scorer", "viewer"],
      batting_style: ["right-hand", "left-hand"],
      extra_type: ["wide", "no-ball", "bye", "leg-bye"],
      innings_status: ["in_progress", "completed", "yet_to_bat"],
      match_status: ["upcoming", "live", "completed", "abandoned"],
      player_role: ["batsman", "bowler", "all-rounder", "wicketkeeper"],
      tournament_format: ["league", "knockout", "round-robin", "short-chris"],
      tournament_status: ["upcoming", "ongoing", "completed"],
    },
  },
} as const