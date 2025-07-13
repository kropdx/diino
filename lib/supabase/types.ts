export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AdminUser_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Bookmark: {
        Row: {
          created_at: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Bookmark_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "Story"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "Bookmark_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Bookmark_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      CanonicalTag: {
        Row: {
          created_at: string
          name: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          name: string
          tag_id?: string
        }
        Update: {
          created_at?: string
          name?: string
          tag_id?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          joined_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          client_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: number
          metadata: Json
          room_id: string
          sender_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          metadata?: Json
          room_id: string
          sender_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          metadata?: Json
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      Comment: {
        Row: {
          author_id: string
          comment_id: string
          content: string
          created_at: string
          story_id: string
          updated_at: string
          upvotes: number
        }
        Insert: {
          author_id: string
          comment_id?: string
          content: string
          created_at?: string
          story_id: string
          updated_at?: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          comment_id?: string
          content?: string
          created_at?: string
          story_id?: string
          updated_at?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "Comment_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Comment_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Comment_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "Story"
            referencedColumns: ["story_id"]
          },
        ]
      }
      CommentUpvote: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommentUpvote_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "Comment"
            referencedColumns: ["comment_id"]
          },
          {
            foreignKeyName: "CommentUpvote_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommentUpvote_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Follow: {
        Row: {
          channel_id: string
          channel_type: string
          created_at: string
          follower_user_id: string
        }
        Insert: {
          channel_id: string
          channel_type: string
          created_at?: string
          follower_user_id: string
        }
        Update: {
          channel_id?: string
          channel_type?: string
          created_at?: string
          follower_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Follow_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Follow_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Story: {
        Row: {
          author_id: string
          commentary: string | null
          content: string | null
          created_at: string
          favicon: string | null
          favicon_blob_url: string | null
          original_story_id: string | null
          short_id: string
          story_id: string
          story_type: Database["public"]["Enums"]["story_type"]
          subtag: string | null
          title: string | null
          updated_at: string
          upvotes: number
          url: string | null
          user_tag_id: string
        }
        Insert: {
          author_id: string
          commentary?: string | null
          content?: string | null
          created_at?: string
          favicon?: string | null
          favicon_blob_url?: string | null
          original_story_id?: string | null
          short_id: string
          story_id?: string
          story_type: Database["public"]["Enums"]["story_type"]
          subtag?: string | null
          title?: string | null
          updated_at?: string
          upvotes?: number
          url?: string | null
          user_tag_id: string
        }
        Update: {
          author_id?: string
          commentary?: string | null
          content?: string | null
          created_at?: string
          favicon?: string | null
          favicon_blob_url?: string | null
          original_story_id?: string | null
          short_id?: string
          story_id?: string
          story_type?: Database["public"]["Enums"]["story_type"]
          subtag?: string | null
          title?: string | null
          updated_at?: string
          upvotes?: number
          url?: string | null
          user_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Story_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Story_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Story_original_story_id_fkey"
            columns: ["original_story_id"]
            isOneToOne: false
            referencedRelation: "Story"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "Story_user_tag_id_fkey"
            columns: ["user_tag_id"]
            isOneToOne: false
            referencedRelation: "UserTag"
            referencedColumns: ["user_tag_id"]
          },
        ]
      }
      StoryReport: {
        Row: {
          created_at: string
          reason: string
          report_id: string
          reporting_user_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          story_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          reason: string
          report_id?: string
          reporting_user_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          story_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          reason?: string
          report_id?: string
          reporting_user_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          story_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "StoryReport_reporting_user_id_fkey"
            columns: ["reporting_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StoryReport_reporting_user_id_fkey"
            columns: ["reporting_user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "StoryReport_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "Story"
            referencedColumns: ["story_id"]
          },
        ]
      }
      StoryUpvote: {
        Row: {
          created_at: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "StoryUpvote_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "Story"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "StoryUpvote_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StoryUpvote_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      User: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          email: string
          onboarded: boolean
          profile_image_optimized_url: string | null
          profile_image_source_url: string | null
          updated_at: string
          url: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          onboarded?: boolean
          profile_image_optimized_url?: string | null
          profile_image_source_url?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          onboarded?: boolean
          profile_image_optimized_url?: string | null
          profile_image_source_url?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      UserTag: {
        Row: {
          created_at: string
          credibility_score: number
          follower_count: number
          tag_id: string
          updated_at: string
          user_id: string
          user_tag_id: string
        }
        Insert: {
          created_at?: string
          credibility_score?: number
          follower_count?: number
          tag_id: string
          updated_at?: string
          user_id: string
          user_tag_id?: string
        }
        Update: {
          created_at?: string
          credibility_score?: number
          follower_count?: number
          tag_id?: string
          updated_at?: string
          user_id?: string
          user_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserTag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "CanonicalTag"
            referencedColumns: ["tag_id"]
          },
          {
            foreignKeyName: "UserTag_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserTag_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          profile_image_optimized_url: string | null
          profile_image_source_url: string | null
          updated_at: string | null
          username: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          profile_image_optimized_url?: string | null
          profile_image_source_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          profile_image_optimized_url?: string | null
          profile_image_source_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
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
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never