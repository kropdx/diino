// Auto-generated via `supabase gen types typescript --linked` on 2025-07-07
/* eslint-disable */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      AdminUser: {
        Row: {
          admin_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string
          created_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "AdminUser_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      // ... existing code ...
      UserTagFollow: {
        Row: {
          created_at: string
          followed_user_tag_id: string
          follower_user_id: string
        }
        Insert: {
          created_at?: string
          followed_user_tag_id: string
          follower_user_id: string
        }
        Update: {
          created_at?: string
          followed_user_tag_id?: string
          follower_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserTagFollow_followed_user_tag_id_fkey"
            columns: ["followed_user_tag_id"]
            isOneToOne: false
            referencedRelation: "UserTag"
            referencedColumns: ["user_tag_id"]
          },
          {
            foreignKeyName: "UserTagFollow_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      // ... existing code ...
      urlencode: {
        Args: { data: Json } | { string: string }
        Returns: string
      }
    }
    Enums: {
      report_status: "PENDING" | "REVIEWED" | "RESOLVED"
      story_type: "TEXT" | "URL" | "REPOST"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      // ... existing code ...
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

// Helper utility types (Tables, Insert, Update, Enums, CompositeTypes)
// ... existing code ...
export const Constants = {
  public: {
    Enums: {
      report_status: ["PENDING", "REVIEWED", "RESOLVED"],
      story_type: ["TEXT", "URL", "REPOST"],
    },
  },
} as const 