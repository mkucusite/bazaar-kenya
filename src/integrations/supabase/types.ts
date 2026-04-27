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
      ad_reports: {
        Row: {
          ad_id: string
          ai_confidence: number | null
          ai_label: string | null
          ai_summary: string | null
          created_at: string
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          ai_confidence?: number | null
          ai_label?: string | null
          ai_summary?: string | null
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          ai_confidence?: number | null
          ai_label?: string | null
          ai_summary?: string | null
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_reports_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_code: string | null
          ai_generated: boolean | null
          attributes: Json
          badge: string | null
          category_id: string | null
          condition: string | null
          contacts_count: number | null
          county: string
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          images: string[] | null
          is_negotiable: boolean | null
          phone: string
          price: number | null
          slug: string | null
          status: string | null
          subcategory_id: string | null
          title: string
          town: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          ad_code?: string | null
          ai_generated?: boolean | null
          attributes?: Json
          badge?: string | null
          category_id?: string | null
          condition?: string | null
          contacts_count?: number | null
          county: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          phone: string
          price?: number | null
          slug?: string | null
          status?: string | null
          subcategory_id?: string | null
          title: string
          town?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          ad_code?: string | null
          ai_generated?: boolean | null
          attributes?: Json
          badge?: string | null
          category_id?: string | null
          condition?: string | null
          contacts_count?: number | null
          county?: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          phone?: string
          price?: number | null
          slug?: string | null
          status?: string | null
          subcategory_id?: string | null
          title?: string
          town?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_requests: {
        Row: {
          business_name: string
          contact_person: string
          created_at: string
          email: string
          id: string
          message: string | null
          note: string | null
          phone: string
          preferred_package: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_name: string
          contact_person: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          note?: string | null
          phone: string
          preferred_package?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          note?: string | null
          phone?: string
          preferred_package?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      alert_requests: {
        Row: {
          category: string | null
          county: string | null
          created_at: string
          id: string
          keyword: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          county?: string | null
          created_at?: string
          id?: string
          keyword: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          county?: string | null
          created_at?: string
          id?: string
          keyword?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          category: string | null
          county: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          user_id: string
        }
        Insert: {
          category?: string | null
          county?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          user_id: string
        }
        Update: {
          category?: string | null
          county?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          user_id?: string
        }
        Relationships: []
      }
      banner_campaigns: {
        Row: {
          amount_paid: number
          banner_image: string
          business_name: string
          category: string | null
          clicks: number
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          impressions: number
          is_voting_enabled: boolean
          package_type: string
          payment_id: string | null
          position: string
          slug: string | null
          starts_at: string | null
          status: string
          target_url: string
          updated_at: string
          user_id: string
          votes_count: number
        }
        Insert: {
          amount_paid?: number
          banner_image: string
          business_name: string
          category?: string | null
          clicks?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          impressions?: number
          is_voting_enabled?: boolean
          package_type?: string
          payment_id?: string | null
          position?: string
          slug?: string | null
          starts_at?: string | null
          status?: string
          target_url: string
          updated_at?: string
          user_id: string
          votes_count?: number
        }
        Update: {
          amount_paid?: number
          banner_image?: string
          business_name?: string
          category?: string | null
          clicks?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          impressions?: number
          is_voting_enabled?: boolean
          package_type?: string
          payment_id?: string | null
          position?: string
          slug?: string | null
          starts_at?: string | null
          status?: string
          target_url?: string
          updated_at?: string
          user_id?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "banner_campaigns_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_votes: {
        Row: {
          banner_id: string
          created_at: string
          id: string
          user_id: string | null
          voter_identifier: string
        }
        Insert: {
          banner_id: string
          created_at?: string
          id?: string
          user_id?: string | null
          voter_identifier: string
        }
        Update: {
          banner_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
          voter_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "banner_votes_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banner_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          image: string | null
          is_published: boolean | null
          read_time: string | null
          slug: string
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image?: string | null
          is_published?: boolean | null
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image?: string | null
          is_published?: boolean | null
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          business_name: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          business_name: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          business_name?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      category_suggestions: {
        Row: {
          category_name: string
          created_at: string
          id: string
          note: string | null
          parent_category_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          note?: string | null
          parent_category_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          note?: string | null
          parent_category_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_suggestions_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ad_id: string | null
          buyer_id: string
          created_at: string | null
          id: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          ad_id?: string | null
          buyer_id: string
          created_at?: string | null
          id?: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          ad_id?: string | null
          buyer_id?: string
          created_at?: string | null
          id?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_purchases: {
        Row: {
          created_at: string | null
          credits_amount: number
          id: string
          payment_id: string | null
          price: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_amount: number
          id?: string
          payment_id?: string | null
          price: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_amount?: number
          id?: string
          payment_id?: string | null
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          balance: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          id: string
          name: string
          payment_id: string | null
          phone: string
          status: string
          ticket_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          name: string
          payment_id?: string | null
          phone: string
          status?: string
          ticket_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          name?: string
          payment_id?: string | null
          phone?: string
          status?: string
          ticket_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendee_count: number | null
          capacity: number | null
          category: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          end_at: string | null
          host_name: string | null
          id: string
          is_paid: boolean | null
          is_published: boolean | null
          is_virtual: boolean | null
          location: string | null
          slug: string
          start_at: string
          theme: string | null
          ticket_price: number | null
          timezone: string | null
          title: string
          updated_at: string
          user_id: string
          virtual_link: string | null
          visibility: string | null
        }
        Insert: {
          attendee_count?: number | null
          capacity?: number | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          host_name?: string | null
          id?: string
          is_paid?: boolean | null
          is_published?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          slug: string
          start_at: string
          theme?: string | null
          ticket_price?: number | null
          timezone?: string | null
          title: string
          updated_at?: string
          user_id: string
          virtual_link?: string | null
          visibility?: string | null
        }
        Update: {
          attendee_count?: number | null
          capacity?: number | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          host_name?: string | null
          id?: string
          is_paid?: boolean | null
          is_published?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          slug?: string
          start_at?: string
          theme?: string | null
          ticket_price?: number | null
          timezone?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          virtual_link?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      favourites: {
        Row: {
          ad_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_blocks: {
        Row: {
          blocked_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          created_at: string
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_ad_expiry: boolean
          email_messages: boolean
          email_promotions: boolean
          id: string
          push_ad_expiry: boolean
          push_messages: boolean
          push_promotions: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_ad_expiry?: boolean
          email_messages?: boolean
          email_promotions?: boolean
          id?: string
          push_ad_expiry?: boolean
          push_messages?: boolean
          push_promotions?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_ad_expiry?: boolean
          email_messages?: boolean
          email_promotions?: boolean
          id?: string
          push_ad_expiry?: boolean
          push_messages?: boolean
          push_promotions?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          ad_id: string | null
          amount: number
          created_at: string | null
          id: string
          mpesa_code: string | null
          package_type: string | null
          payment_status: string | null
          phone_number: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ad_id?: string | null
          amount: number
          created_at?: string | null
          id?: string
          mpesa_code?: string | null
          package_type?: string | null
          payment_status?: string | null
          phone_number: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          mpesa_code?: string | null
          package_type?: string | null
          payment_status?: string | null
          phone_number?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          id: string
          show_email: boolean
          show_phone: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          show_email?: boolean
          show_phone?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          show_email?: boolean
          show_phone?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempts: number
          created_at: string
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          action: string
          attempts?: number
          created_at?: string
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          action?: string
          attempts?: number
          created_at?: string
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          ad_id: string | null
          body: string | null
          created_at: string | null
          guest_name: string | null
          id: string
          parent_id: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          ad_id?: string | null
          body?: string | null
          created_at?: string | null
          guest_name?: string | null
          id?: string
          parent_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string | null
          body?: string | null
          created_at?: string | null
          guest_name?: string | null
          id?: string
          parent_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          id: string
          json_ld: Json | null
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          page_name: string
          page_slug: string
          robots: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          canonical_url?: string | null
          id?: string
          json_ld?: Json | null
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          page_name: string
          page_slug: string
          robots?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          canonical_url?: string | null
          id?: string
          json_ld?: Json | null
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          page_name?: string
          page_slug?: string
          robots?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content: string
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          credits_cost: number | null
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          credits_cost?: number | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          credits_cost?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cast_banner_vote: {
        Args: { target_banner_id: string; voter: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          is_verified: boolean
          phone: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_views: { Args: { target_ad_id: string }; Returns: undefined }
      increment_banner_clicks: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      increment_banner_impressions: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      increment_blog_post_views: {
        Args: { target_post_id: string }
        Returns: undefined
      }
      increment_event_attendees: {
        Args: { target_event_id: string }
        Returns: undefined
      }
      is_ip_blocked: { Args: { check_ip: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
