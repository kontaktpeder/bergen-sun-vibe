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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contributions: {
        Row: {
          created_at: string
          data: Json
          id: string
          points_awarded: number
          status: string
          type: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          points_awarded?: number
          status?: string
          type: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          points_awarded?: number
          status?: string
          type?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      point_events: {
        Row: {
          created_at: string
          delta: number
          id: string
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          points: number
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          points?: number
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          points?: number
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          contribution_id: string
          created_at: string
          id: string
          reason: string
          reporter_user_id: string
        }
        Insert: {
          contribution_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_user_id: string
        }
        Update: {
          contribution_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          area: string | null
          category: string
          city: string | null
          created_at: string
          deal_text: string | null
          description: string
          family_friendly: boolean
          google_maps_url: string | null
          google_photo_name: string | null
          google_place_id: string | null
          google_rating: number | null
          google_types: string[] | null
          google_user_rating_count: number | null
          hours: string | null
          id: string
          image_url: string | null
          last_activity_at: string
          lat: number
          lng: number
          name: string
          price_level: number
          rating: number
          reviews: number
          slug: string
          source: string
          status: string
          sun_score: number
          sun_status: string
          sun_until: string | null
          tags: string[]
          trending: boolean
          website_url: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          category: string
          city?: string | null
          created_at?: string
          deal_text?: string | null
          description?: string
          family_friendly?: boolean
          google_maps_url?: string | null
          google_photo_name?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_types?: string[] | null
          google_user_rating_count?: number | null
          hours?: string | null
          id?: string
          image_url?: string | null
          last_activity_at?: string
          lat: number
          lng: number
          name: string
          price_level?: number
          rating?: number
          reviews?: number
          slug: string
          source?: string
          status?: string
          sun_score?: number
          sun_status?: string
          sun_until?: string | null
          tags?: string[]
          trending?: boolean
          website_url?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          category?: string
          city?: string | null
          created_at?: string
          deal_text?: string | null
          description?: string
          family_friendly?: boolean
          google_maps_url?: string | null
          google_photo_name?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_types?: string[] | null
          google_user_rating_count?: number | null
          hours?: string | null
          id?: string
          image_url?: string | null
          last_activity_at?: string
          lat?: number
          lng?: number
          name?: string
          price_level?: number
          rating?: number
          reviews?: number
          slug?: string
          source?: string
          status?: string
          sun_score?: number
          sun_status?: string
          sun_until?: string | null
          tags?: string[]
          trending?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_contribution: {
        Args: { _contribution_id: string }
        Returns: Json
      }
      admin_delete_venue: { Args: { _venue_id: string }; Returns: Json }
      admin_update_venue: {
        Args: {
          _description: string
          _hours: string
          _tags: string[]
          _venue_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      moderate_report: {
        Args: { _action: string; _report_id: string }
        Returns: Json
      }
      similarity_or_zero: { Args: { a: string; b: string }; Returns: number }
      submit_contribution: {
        Args: {
          _data: Json
          _is_confirm?: boolean
          _new_venue?: Json
          _type: string
          _venue_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
