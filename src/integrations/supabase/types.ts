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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          mode: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_bookmarked: boolean | null
          mode: string | null
          role: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_bookmarked?: boolean | null
          mode?: string | null
          role: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_bookmarked?: boolean | null
          mode?: string | null
          role?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          era_id: string
          event_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          era_id: string
          event_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          era_id?: string
          event_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      civilizations: {
        Row: {
          created_at: string
          description: string | null
          end_label: string | null
          end_year: number | null
          id: string
          location_id: string | null
          name: string
          slug: string | null
          start_label: string | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_label?: string | null
          end_year?: number | null
          id?: string
          location_id?: string | null
          name: string
          slug?: string | null
          start_label?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_label?: string | null
          end_year?: number | null
          id?: string
          location_id?: string | null
          name?: string
          slug?: string | null
          start_label?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "civilizations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_events: {
        Row: {
          category: string | null
          created_at: string
          description: string
          era: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          year_label: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          era?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          year_label: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          era?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          year_label?: string
        }
        Relationships: []
      }
      dynasties: {
        Row: {
          civilization_id: string | null
          coat_of_arms_url: string | null
          created_at: string
          description: string | null
          end_label: string | null
          end_year: number | null
          id: string
          location_id: string | null
          name: string
          slug: string | null
          start_label: string | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          civilization_id?: string | null
          coat_of_arms_url?: string | null
          created_at?: string
          description?: string | null
          end_label?: string | null
          end_year?: number | null
          id?: string
          location_id?: string | null
          name: string
          slug?: string | null
          start_label?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          civilization_id?: string | null
          coat_of_arms_url?: string | null
          created_at?: string
          description?: string | null
          end_label?: string | null
          end_year?: number | null
          id?: string
          location_id?: string | null
          name?: string
          slug?: string | null
          start_label?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynasties_civilization_id_fkey"
            columns: ["civilization_id"]
            isOneToOne: false
            referencedRelation: "civilizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynasties_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_figures: {
        Row: {
          event_id: string
          figure_id: string
          id: string
          role: string | null
        }
        Insert: {
          event_id: string
          figure_id: string
          id?: string
          role?: string | null
        }
        Update: {
          event_id?: string
          figure_id?: string
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_figures_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "historical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_figures_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "historical_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media: {
        Row: {
          display_order: number | null
          event_id: string
          id: string
          media_id: string
        }
        Insert: {
          display_order?: number | null
          event_id: string
          id?: string
          media_id: string
        }
        Update: {
          display_order?: number | null
          event_id?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "historical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_media: {
        Row: {
          display_order: number | null
          figure_id: string
          id: string
          media_id: string
        }
        Insert: {
          display_order?: number | null
          figure_id: string
          id?: string
          media_id: string
        }
        Update: {
          display_order?: number | null
          figure_id?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "figure_media_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "historical_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_relationships: {
        Row: {
          figure_id: string
          id: string
          related_figure_id: string
          relationship_type: string
        }
        Insert: {
          figure_id: string
          id?: string
          related_figure_id: string
          relationship_type: string
        }
        Update: {
          figure_id?: string
          id?: string
          related_figure_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "figure_relationships_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "historical_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_relationships_related_figure_id_fkey"
            columns: ["related_figure_id"]
            isOneToOne: false
            referencedRelation: "historical_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      historical_events: {
        Row: {
          category: string | null
          civilization_id: string | null
          created_at: string
          description: string | null
          detailed_description: string | null
          end_year: number | null
          end_year_label: string | null
          exact_date: string | null
          id: string
          image_url: string | null
          location_id: string | null
          significance: number | null
          slug: string | null
          tags: string[] | null
          time_period_id: string | null
          title: string
          updated_at: string
          year: number | null
          year_label: string | null
        }
        Insert: {
          category?: string | null
          civilization_id?: string | null
          created_at?: string
          description?: string | null
          detailed_description?: string | null
          end_year?: number | null
          end_year_label?: string | null
          exact_date?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          significance?: number | null
          slug?: string | null
          tags?: string[] | null
          time_period_id?: string | null
          title: string
          updated_at?: string
          year?: number | null
          year_label?: string | null
        }
        Update: {
          category?: string | null
          civilization_id?: string | null
          created_at?: string
          description?: string | null
          detailed_description?: string | null
          end_year?: number | null
          end_year_label?: string | null
          exact_date?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          significance?: number | null
          slug?: string | null
          tags?: string[] | null
          time_period_id?: string | null
          title?: string
          updated_at?: string
          year?: number | null
          year_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_events_civilization_id_fkey"
            columns: ["civilization_id"]
            isOneToOne: false
            referencedRelation: "civilizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_events_time_period_id_fkey"
            columns: ["time_period_id"]
            isOneToOne: false
            referencedRelation: "time_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_figures: {
        Row: {
          biography: string | null
          birth_label: string | null
          birth_location_id: string | null
          birth_year: number | null
          created_at: string
          death_label: string | null
          death_location_id: string | null
          death_year: number | null
          dynasty_id: string | null
          id: string
          image_url: string | null
          name: string
          slug: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          biography?: string | null
          birth_label?: string | null
          birth_location_id?: string | null
          birth_year?: number | null
          created_at?: string
          death_label?: string | null
          death_location_id?: string | null
          death_year?: number | null
          dynasty_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          biography?: string | null
          birth_label?: string | null
          birth_location_id?: string | null
          birth_year?: number | null
          created_at?: string
          death_label?: string | null
          death_location_id?: string | null
          death_year?: number | null
          dynasty_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historical_figures_birth_location_id_fkey"
            columns: ["birth_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_figures_death_location_id_fkey"
            columns: ["death_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_figures_dynasty_id_fkey"
            columns: ["dynasty_id"]
            isOneToOne: false
            referencedRelation: "dynasties"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          linked_era: string | null
          linked_event_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          linked_era?: string | null
          linked_event_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          linked_era?: string | null
          linked_event_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          alternate_names: string[] | null
          continent: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          alternate_names?: string[] | null
          continent?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          alternate_names?: string[] | null
          continent?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          created_at: string
          description: string | null
          file_size: number | null
          height: number | null
          id: string
          license: string | null
          media_type: string
          metadata: Json | null
          source: string | null
          source_url: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          license?: string | null
          media_type?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          license?: string | null
          media_type?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          font_size: string | null
          id: string
          preferred_language: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      time_periods: {
        Row: {
          created_at: string
          description: string | null
          end_label: string | null
          end_year: number | null
          id: string
          name: string
          parent_period_id: string | null
          slug: string | null
          sort_order: number | null
          start_label: string | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_label?: string | null
          end_year?: number | null
          id?: string
          name: string
          parent_period_id?: string | null
          slug?: string | null
          sort_order?: number | null
          start_label?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_label?: string | null
          end_year?: number | null
          id?: string
          name?: string
          parent_period_id?: string | null
          slug?: string | null
          sort_order?: number | null
          start_label?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_periods_parent_period_id_fkey"
            columns: ["parent_period_id"]
            isOneToOne: false
            referencedRelation: "time_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_videos: {
        Row: {
          category: string | null
          created_at: string
          duration_seconds: number | null
          era: string | null
          id: string
          is_favorite: boolean | null
          is_pinned: boolean | null
          linked_event_id: string | null
          prompt: string | null
          resolution: string | null
          scenes: Json | null
          script: string | null
          status: string | null
          style: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          duration_seconds?: number | null
          era?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          linked_event_id?: string | null
          prompt?: string | null
          resolution?: string | null
          scenes?: Json | null
          script?: string | null
          status?: string | null
          style?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          duration_seconds?: number | null
          era?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          linked_event_id?: string | null
          prompt?: string | null
          resolution?: string | null
          scenes?: Json | null
          script?: string | null
          status?: string | null
          style?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
