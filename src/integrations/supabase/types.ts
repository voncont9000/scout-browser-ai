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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ingestion_runs: {
        Row: {
          apify_run_id: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          items_found: number
          items_imported: number
          search_query: string
          source_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
        }
        Insert: {
          apify_run_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_found?: number
          items_imported?: number
          search_query: string
          source_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
        }
        Update: {
          apify_run_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_found?: number
          items_imported?: number
          search_query?: string
          source_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      job_state: {
        Row: {
          cursor: string | null
          job_name: string
          lease_until: string | null
          pause_reason: string | null
          status: Database["public"]["Enums"]["run_status"]
          updated_at: string
        }
        Insert: {
          cursor?: string | null
          job_name: string
          lease_until?: string | null
          pause_reason?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          updated_at?: string
        }
        Update: {
          cursor?: string | null
          job_name?: string
          lease_until?: string | null
          pause_reason?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          updated_at?: string
        }
        Relationships: []
      }
      listing_tags: {
        Row: {
          attribution: string | null
          category: string
          condition_notes: string | null
          created_at: string
          dealer_note: string | null
          decade_range: string | null
          embedding: string | null
          embedding_model: string | null
          is_furniture: boolean
          is_reproduction: string
          listing_id: string
          materials: string[]
          model_id: string
          origin_country: string | null
          period: string
          period_confidence: number | null
          red_flags: string[]
          resale_high_gbp: number | null
          resale_low_gbp: number | null
          secondary_period: string | null
          style: string | null
          subcategory: string | null
          valuation_confidence: number | null
        }
        Insert: {
          attribution?: string | null
          category: string
          condition_notes?: string | null
          created_at?: string
          dealer_note?: string | null
          decade_range?: string | null
          embedding?: string | null
          embedding_model?: string | null
          is_furniture?: boolean
          is_reproduction?: string
          listing_id: string
          materials?: string[]
          model_id?: string
          origin_country?: string | null
          period: string
          period_confidence?: number | null
          red_flags?: string[]
          resale_high_gbp?: number | null
          resale_low_gbp?: number | null
          secondary_period?: string | null
          style?: string | null
          subcategory?: string | null
          valuation_confidence?: number | null
        }
        Update: {
          attribution?: string | null
          category?: string
          condition_notes?: string | null
          created_at?: string
          dealer_note?: string | null
          decade_range?: string | null
          embedding?: string | null
          embedding_model?: string | null
          is_furniture?: boolean
          is_reproduction?: string
          listing_id?: string
          materials?: string[]
          model_id?: string
          origin_country?: string | null
          period?: string
          period_confidence?: number | null
          red_flags?: string[]
          resale_high_gbp?: number | null
          resale_low_gbp?: number | null
          secondary_period?: string | null
          style?: string | null
          subcategory?: string | null
          valuation_confidence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_tags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          auction_end_time: string | null
          country: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_urls: string[]
          ingestion_run_id: string | null
          listing_url: string
          location: string | null
          posted_date: string | null
          price: number | null
          price_gbp: number | null
          price_kind: Database["public"]["Enums"]["price_type"]
          raw_json: Json
          rejection_reason: string | null
          screening_status: Database["public"]["Enums"]["screening_status"]
          seller_type: string | null
          source_id: string | null
          stored_image_paths: string[]
          title: string
        }
        Insert: {
          auction_end_time?: string | null
          country: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[]
          ingestion_run_id?: string | null
          listing_url: string
          location?: string | null
          posted_date?: string | null
          price?: number | null
          price_gbp?: number | null
          price_kind?: Database["public"]["Enums"]["price_type"]
          raw_json?: Json
          rejection_reason?: string | null
          screening_status?: Database["public"]["Enums"]["screening_status"]
          seller_type?: string | null
          source_id?: string | null
          stored_image_paths?: string[]
          title: string
        }
        Update: {
          auction_end_time?: string | null
          country?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[]
          ingestion_run_id?: string | null
          listing_url?: string
          location?: string | null
          posted_date?: string | null
          price?: number | null
          price_gbp?: number | null
          price_kind?: Database["public"]["Enums"]["price_type"]
          raw_json?: Json
          rejection_reason?: string | null
          screening_status?: Database["public"]["Enums"]["screening_status"]
          seller_type?: string | null
          source_id?: string | null
          stored_image_paths?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_ingestion_run_id_fkey"
            columns: ["ingestion_run_id"]
            isOneToOne: false
            referencedRelation: "ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      period_terms: {
        Row: {
          id: string
          language_code: string
          period_name: string
          terms: string[]
        }
        Insert: {
          id?: string
          language_code: string
          period_name: string
          terms: string[]
        }
        Update: {
          id?: string
          language_code?: string
          period_name?: string
          terms?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          onboarding_complete: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_complete?: boolean
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_complete?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      screening_overrides: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["screening_status"]
          id: string
          listing_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["screening_status"]
          id?: string
          listing_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["screening_status"]
          id?: string
          listing_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_overrides_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_profiles: {
        Row: {
          categories: Json
          countries: Json
          hide_reproductions: boolean
          id: string
          max_price_gbp: number
          min_margin_gbp: number
          min_price_gbp: number
          periods: Json
          sources: Json
          taste_bargain_blend: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          countries?: Json
          hide_reproductions?: boolean
          id?: string
          max_price_gbp?: number
          min_margin_gbp?: number
          min_price_gbp?: number
          periods?: Json
          sources?: Json
          taste_bargain_blend?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          countries?: Json
          hide_reproductions?: boolean
          id?: string
          max_price_gbp?: number
          min_margin_gbp?: number
          min_price_gbp?: number
          periods?: Json
          sources?: Json
          taste_bargain_blend?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shortlist: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          actor_id: string | null
          browser_fallback_enabled: boolean
          browser_fallback_status: string
          country: string
          created_at: string
          enabled: boolean
          field_mapping: Json
          id: string
          input_template: Json
          marketplace_code: string | null
          name: string
        }
        Insert: {
          actor_id?: string | null
          browser_fallback_enabled?: boolean
          browser_fallback_status?: string
          country: string
          created_at?: string
          enabled?: boolean
          field_mapping?: Json
          id?: string
          input_template?: Json
          marketplace_code?: string | null
          name: string
        }
        Update: {
          actor_id?: string | null
          browser_fallback_enabled?: boolean
          browser_fallback_status?: string
          country?: string
          created_at?: string
          enabled?: boolean
          field_mapping?: Json
          id?: string
          input_template?: Json
          marketplace_code?: string | null
          name?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          action: Database["public"]["Enums"]["swipe_action"]
          created_at: string
          id: string
          listing_id: string
          ordered_by: string
          ranker_a_score: number | null
          ranker_b_score: number | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["swipe_action"]
          created_at?: string
          id?: string
          listing_id: string
          ordered_by: string
          ranker_a_score?: number | null
          ranker_b_score?: number | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["swipe_action"]
          created_at?: string
          id?: string
          listing_id?: string
          ordered_by?: string
          ranker_a_score?: number | null
          ranker_b_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      price_type: "fixed" | "offer" | "current_bid"
      run_status: "queued" | "running" | "completed" | "failed" | "paused"
      screening_status:
        | "pending"
        | "rejected_text"
        | "rejected_vision"
        | "maybe"
        | "passed"
      swipe_action: "like" | "pass" | "super_like"
      tri_state: "include" | "exclude" | "neutral"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      price_type: ["fixed", "offer", "current_bid"],
      run_status: ["queued", "running", "completed", "failed", "paused"],
      screening_status: [
        "pending",
        "rejected_text",
        "rejected_vision",
        "maybe",
        "passed",
      ],
      swipe_action: ["like", "pass", "super_like"],
      tri_state: ["include", "exclude", "neutral"],
    },
  },
} as const
