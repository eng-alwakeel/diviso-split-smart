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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ad_impressions: {
        Row: {
          ad_category: string | null
          ad_type: string
          affiliate_partner: string | null
          clicked: boolean | null
          clicked_at: string | null
          created_at: string
          expense_category: string | null
          group_id: string | null
          id: string
          impression_count: number | null
          placement: string
          product_id: string | null
          revenue_amount: number | null
          updated_at: string
          user_id: string | null
          user_location: string | null
        }
        Insert: {
          ad_category?: string | null
          ad_type: string
          affiliate_partner?: string | null
          clicked?: boolean | null
          clicked_at?: string | null
          created_at?: string
          expense_category?: string | null
          group_id?: string | null
          id?: string
          impression_count?: number | null
          placement: string
          product_id?: string | null
          revenue_amount?: number | null
          updated_at?: string
          user_id?: string | null
          user_location?: string | null
        }
        Update: {
          ad_category?: string | null
          ad_type?: string
          affiliate_partner?: string | null
          clicked?: boolean | null
          clicked_at?: string | null
          created_at?: string
          expense_category?: string | null
          group_id?: string | null
          id?: string
          impression_count?: number | null
          placement?: string
          product_id?: string | null
          revenue_amount?: number | null
          updated_at?: string
          user_id?: string | null
          user_location?: string | null
        }
        Relationships: []
      }
      ad_interactions: {
        Row: {
          ad_category: string
          ad_id: string
          context: string
          created_at: string
          id: string
          interaction_type: string
          success_score: number
          user_id: string
        }
        Insert: {
          ad_category: string
          ad_id: string
          context: string
          created_at?: string
          id?: string
          interaction_type: string
          success_score?: number
          user_id: string
        }
        Update: {
          ad_category?: string
          ad_id?: string
          context?: string
          created_at?: string
          id?: string
          interaction_type?: string
          success_score?: number
          user_id?: string
        }
        Relationships: []
      }
      affiliate_products: {
        Row: {
          active: boolean | null
          affiliate_partner: string
          affiliate_url: string
          category: string
          commission_rate: number | null
          conversion_rate: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          keywords: string[] | null
          price_range: string | null
          product_id: string
          rating: number | null
          subcategory: string | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          affiliate_partner?: string
          affiliate_url: string
          category: string
          commission_rate?: number | null
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          price_range?: string | null
          product_id: string
          rating?: number | null
          subcategory?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          affiliate_partner?: string
          affiliate_url?: string
          category?: string
          commission_rate?: number | null
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          price_range?: string | null
          product_id?: string
          rating?: number | null
          subcategory?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          confidence_score: number | null
          content: Json
          created_at: string
          expires_at: string | null
          id: string
          status: string
          suggestion_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          suggestion_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          suggestion_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          allocated_amount: number
          budget_id: string
          category_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          allocated_amount?: number
          budget_id: string
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          budget_id?: string
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "v_budget_summary"
            referencedColumns: ["budget_id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount_limit: number | null
          budget_type: Database["public"]["Enums"]["budget_type"] | null
          category_id: string | null
          created_at: string
          created_by: string
          end_date: string | null
          group_id: string
          id: string
          name: string
          period: Database["public"]["Enums"]["budget_period"]
          start_date: string
          starts_on: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_limit?: number | null
          budget_type?: Database["public"]["Enums"]["budget_type"] | null
          category_id?: string | null
          created_at?: string
          created_by: string
          end_date?: string | null
          group_id: string
          id?: string
          name: string
          period?: Database["public"]["Enums"]["budget_period"]
          start_date?: string
          starts_on?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_limit?: number | null
          budget_type?: Database["public"]["Enums"]["budget_type"] | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          end_date?: string | null
          group_id?: string
          id?: string
          name?: string
          period?: Database["public"]["Enums"]["budget_period"]
          start_date?: string
          starts_on?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_referrals: {
        Row: {
          batch_name: string | null
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_invites: number | null
          id: string
          status: string | null
          successful_invites: number | null
          total_invites: number | null
          user_id: string
        }
        Insert: {
          batch_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_invites?: number | null
          id?: string
          status?: string | null
          successful_invites?: number | null
          total_invites?: number | null
          user_id: string
        }
        Update: {
          batch_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_invites?: number | null
          id?: string
          status?: string | null
          successful_invites?: number | null
          total_invites?: number | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          name_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description_ar: string | null
          id: string
          metadata: Json | null
          source: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description_ar?: string | null
          id?: string
          metadata?: Json | null
          source: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description_ar?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          country_code: string | null
          created_at: string
          flag_emoji: string | null
          id: string
          is_active: boolean
          name: string
          region: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          country_code?: string | null
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          name: string
          region?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          country_code?: string | null
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          region?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          check_in_date: string
          created_at: string
          id: string
          reward_type: string
          reward_value: Json | null
          user_id: string
        }
        Insert: {
          check_in_date?: string
          created_at?: string
          id?: string
          reward_type: string
          reward_value?: Json | null
          user_id: string
        }
        Update: {
          check_in_date?: string
          created_at?: string
          id?: string
          reward_type?: string
          reward_value?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          date: string
          from_currency: string
          id: string
          rate: number
          to_currency: string
        }
        Insert: {
          created_at?: string
          date?: string
          from_currency: string
          id?: string
          rate: number
          to_currency: string
        }
        Update: {
          created_at?: string
          date?: string
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
        }
        Relationships: []
      }
      expense_approvals: {
        Row: {
          approved_at: string
          approved_by: string
          expense_id: string
          id: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          expense_id: string
          id?: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_approvals_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_budget_links: {
        Row: {
          budget_category_id: string
          created_at: string
          expense_id: string
          id: string
        }
        Insert: {
          budget_category_id: string
          created_at?: string
          expense_id: string
          id?: string
        }
        Update: {
          budget_category_id?: string
          created_at?: string
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_budget_links_budget_category_id_fkey"
            columns: ["budget_category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_budget_links_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_category_links: {
        Row: {
          budget_category_id: string
          created_at: string
          expense_id: string
          id: string
        }
        Insert: {
          budget_category_id: string
          created_at?: string
          expense_id: string
          id?: string
        }
        Update: {
          budget_category_id?: string
          created_at?: string
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_category_links_budget_category_id_fkey"
            columns: ["budget_category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_category_links_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_receipts: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          storage_path: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      expense_rejections: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          rejected_at: string
          rejected_by: string
          rejection_reason: string | null
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          rejected_at?: string
          rejected_by: string
          rejection_reason?: string | null
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          rejected_at?: string
          rejected_by?: string
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_rejections_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          created_at: string
          expense_id: string
          member_id: string
          share_amount: number
        }
        Insert: {
          created_at?: string
          expense_id: string
          member_id: string
          share_amount: number
        }
        Update: {
          created_at?: string
          expense_id?: string
          member_id?: string
          share_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          created_by: string
          currency: string
          description: string | null
          group_id: string
          id: string
          note_ar: string | null
          payer_id: string | null
          spent_at: string
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          created_by: string
          currency?: string
          description?: string | null
          group_id: string
          id?: string
          note_ar?: string | null
          payer_id?: string | null
          spent_at?: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string
          description?: string | null
          group_id?: string
          id?: string
          note_ar?: string | null
          payer_id?: string | null
          spent_at?: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          encrypted_token: string | null
          expires_at: string
          family_owner_id: string
          id: string
          invitation_code: string
          invited_email: string | null
          invited_phone: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          encrypted_token?: string | null
          expires_at?: string
          family_owner_id: string
          id?: string
          invitation_code?: string
          invited_email?: string | null
          invited_phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          encrypted_token?: string | null
          expires_at?: string
          family_owner_id?: string
          id?: string
          invitation_code?: string
          invited_email?: string | null
          invited_phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          family_owner_id: string
          id: string
          joined_at: string
          member_user_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_owner_id: string
          id?: string
          joined_at?: string
          member_user_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_owner_id?: string
          id?: string
          joined_at?: string
          member_user_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_join_tokens: {
        Row: {
          created_at: string
          created_by: string
          current_uses: number | null
          expires_at: string
          group_id: string
          id: string
          link_type: string | null
          max_uses: number | null
          role: Database["public"]["Enums"]["member_role"]
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          current_uses?: number | null
          expires_at?: string
          group_id: string
          id?: string
          link_type?: string | null
          max_uses?: number | null
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          current_uses?: number | null
          expires_at?: string
          group_id?: string
          id?: string
          link_type?: string | null
          max_uses?: number | null
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_join_tokens_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          can_approve_expenses: boolean
          group_id: string
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          can_approve_expenses?: boolean
          group_id: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          can_approve_expenses?: boolean
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          archived_at: string | null
          created_at: string | null
          currency: string
          group_type: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          currency?: string
          group_type?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          currency?: string
          group_type?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          group_id: string
          id: string
          note_ar: string | null
          received_at: string
          received_by: string | null
          status: Database["public"]["Enums"]["income_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          group_id: string
          id?: string
          note_ar?: string | null
          received_at?: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["income_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          group_id?: string
          id?: string
          note_ar?: string | null
          received_at?: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["income_status"]
          updated_at?: string
        }
        Relationships: []
      }
      income_approvals: {
        Row: {
          approved_at: string
          approved_by: string
          id: string
          income_id: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          id?: string
          income_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          id?: string
          income_id?: string
        }
        Relationships: []
      }
      income_receipts: {
        Row: {
          created_at: string
          id: string
          income_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          income_id: string
          storage_path: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          id?: string
          income_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      income_rejections: {
        Row: {
          created_at: string
          id: string
          income_id: string
          rejected_at: string
          rejected_by: string
          rejection_reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          income_id: string
          rejected_at?: string
          rejected_by: string
          rejection_reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          income_id?: string
          rejected_at?: string
          rejected_by?: string
          rejection_reason?: string | null
        }
        Relationships: []
      }
      income_splits: {
        Row: {
          created_at: string
          income_id: string
          member_id: string
          share_amount: number
        }
        Insert: {
          created_at?: string
          income_id: string
          member_id: string
          share_amount: number
        }
        Update: {
          created_at?: string
          income_id?: string
          member_id?: string
          share_amount?: number
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          group_id: string
          id: string
          invite_source: string | null
          invite_token: string | null
          invite_type: string | null
          invited_role: Database["public"]["Enums"]["member_role"]
          phone_or_email: string
          referral_id: string | null
          status: Database["public"]["Enums"]["invite_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          group_id: string
          id?: string
          invite_source?: string | null
          invite_token?: string | null
          invite_type?: string | null
          invited_role?: Database["public"]["Enums"]["member_role"]
          phone_or_email: string
          referral_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          invite_source?: string | null
          invite_token?: string | null
          invite_type?: string | null
          invited_role?: Database["public"]["Enums"]["member_role"]
          phone_or_email?: string
          referral_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      lifetime_offer_tracking: {
        Row: {
          created_at: string
          id: string
          max_limit: number
          offer_active: boolean
          started_at: string
          total_purchased: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_limit?: number
          offer_active?: boolean
          started_at?: string
          total_purchased?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_limit?: number
          offer_active?: boolean
          started_at?: string
          total_purchased?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      places_cache: {
        Row: {
          category: string | null
          city: string | null
          created_at: string | null
          data: Json
          expires_at: string
          id: string
          place_id: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          data: Json
          expires_at?: string
          id?: string
          place_id: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
          place_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean
          name: string | null
          phone: string | null
          privacy_policy_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean
          name?: string | null
          phone?: string | null
          privacy_policy_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          name?: string | null
          phone?: string | null
          privacy_policy_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receipt_ocr: {
        Row: {
          ai_analysis: Json | null
          confidence_scores: Json | null
          created_at: string
          created_by: string
          currency: string
          id: string
          items: Json | null
          merchant: string | null
          processing_status: string | null
          raw_text: string | null
          receipt_date: string | null
          storage_path: string
          suggested_category_id: string | null
          total: number | null
          vat: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_scores?: Json | null
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          items?: Json | null
          merchant?: string | null
          processing_status?: string | null
          raw_text?: string | null
          receipt_date?: string | null
          storage_path: string
          suggested_category_id?: string | null
          total?: number | null
          vat?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          confidence_scores?: Json | null
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          items?: Json | null
          merchant?: string | null
          processing_status?: string | null
          raw_text?: string | null
          receipt_date?: string | null
          storage_path?: string
          suggested_category_id?: string | null
          total?: number | null
          vat?: number | null
        }
        Relationships: []
      }
      recommendation_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          recommendation_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          recommendation_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          recommendation_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_analytics_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          affiliate_url: string | null
          category: string | null
          context: Json | null
          converted_at: string | null
          created_at: string | null
          currency: string | null
          estimated_price: number | null
          external_id: string | null
          group_id: string | null
          id: string
          interacted_at: string | null
          is_partner: boolean | null
          location: Json | null
          name: string
          name_ar: string | null
          place_id: string | null
          price_range: string | null
          rating: number | null
          recommendation_type: string
          relevance_reason: string | null
          relevance_reason_ar: string | null
          shown_at: string | null
          source: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_url?: string | null
          category?: string | null
          context?: Json | null
          converted_at?: string | null
          created_at?: string | null
          currency?: string | null
          estimated_price?: number | null
          external_id?: string | null
          group_id?: string | null
          id?: string
          interacted_at?: string | null
          is_partner?: boolean | null
          location?: Json | null
          name: string
          name_ar?: string | null
          place_id?: string | null
          price_range?: string | null
          rating?: number | null
          recommendation_type: string
          relevance_reason?: string | null
          relevance_reason_ar?: string | null
          shown_at?: string | null
          source?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_url?: string | null
          category?: string | null
          context?: Json | null
          converted_at?: string | null
          created_at?: string | null
          currency?: string | null
          estimated_price?: number | null
          external_id?: string | null
          group_id?: string | null
          id?: string
          interacted_at?: string | null
          is_partner?: boolean | null
          location?: Json | null
          name?: string
          name_ar?: string | null
          place_id?: string | null
          price_range?: string | null
          rating?: number | null
          recommendation_type?: string
          relevance_reason?: string | null
          relevance_reason_ar?: string | null
          shown_at?: string | null
          source?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_analytics: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          date: string | null
          id: string
          invites_accepted: number | null
          invites_sent: number | null
          rewards_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          invites_accepted?: number | null
          invites_sent?: number | null
          rewards_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          invites_accepted?: number | null
          invites_sent?: number | null
          rewards_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          applied_at: string | null
          applied_to_subscription: boolean | null
          created_at: string
          days_earned: number
          id: string
          referral_id: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_to_subscription?: boolean | null
          created_at?: string
          days_earned?: number
          id?: string
          referral_id: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          applied_to_subscription?: boolean | null
          created_at?: string
          days_earned?: number
          id?: string
          referral_id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_security: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          last_attempt: string | null
          phone_number: string
          reason: string | null
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          phone_number: string
          reason?: string | null
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          phone_number?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_sources: {
        Row: {
          clicked_at: string | null
          converted_at: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          referral_id: string
          source_details: Json | null
          source_type: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          referral_id: string
          source_details?: Json | null
          source_type?: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          referral_id?: string
          source_details?: Json | null
          source_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_sources_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tiers: {
        Row: {
          bonus_multiplier: number | null
          created_at: string | null
          days_reward: number
          id: string
          max_referrals: number | null
          min_referrals: number
          tier_color: string | null
          tier_icon: string | null
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          bonus_multiplier?: number | null
          created_at?: string | null
          days_reward?: number
          id?: string
          max_referrals?: number | null
          min_referrals: number
          tier_color?: string | null
          tier_icon?: string | null
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          bonus_multiplier?: number | null
          created_at?: string | null
          days_reward?: number
          id?: string
          max_referrals?: number | null
          min_referrals?: number
          tier_color?: string | null
          tier_icon?: string | null
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_applied: boolean | null
          created_at: string
          expires_at: string
          group_id: string | null
          group_name: string | null
          id: string
          invitee_name: string | null
          invitee_phone: string
          inviter_id: string
          joined_at: string | null
          original_reward_days: number | null
          referral_code: string | null
          referral_source: string | null
          reward_days: number | null
          status: Database["public"]["Enums"]["referral_status"]
          tier_at_time: string | null
        }
        Insert: {
          bonus_applied?: boolean | null
          created_at?: string
          expires_at?: string
          group_id?: string | null
          group_name?: string | null
          id?: string
          invitee_name?: string | null
          invitee_phone: string
          inviter_id: string
          joined_at?: string | null
          original_reward_days?: number | null
          referral_code?: string | null
          referral_source?: string | null
          reward_days?: number | null
          status?: Database["public"]["Enums"]["referral_status"]
          tier_at_time?: string | null
        }
        Update: {
          bonus_applied?: boolean | null
          created_at?: string
          expires_at?: string
          group_id?: string | null
          group_name?: string | null
          id?: string
          invitee_name?: string | null
          invitee_phone?: string
          inviter_id?: string
          joined_at?: string | null
          original_reward_days?: number | null
          referral_code?: string | null
          referral_source?: string | null
          reward_days?: number | null
          status?: Database["public"]["Enums"]["referral_status"]
          tier_at_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_types: {
        Row: {
          created_at: string
          description_ar: string | null
          icon: string | null
          id: string
          name: string
          name_ar: string
          type: string
          value: Json
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ar: string
          type: string
          value?: Json
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string
          type?: string
          value?: Json
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          from_user_id: string
          group_id: string
          id: string
          note: string | null
          to_user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          from_user_id: string
          group_id: string
          id?: string
          note?: string | null
          to_user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          from_user_id?: string
          group_id?: string
          id?: string
          note?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_share_analytics: {
        Row: {
          action: string
          browser: string | null
          converted_at: string | null
          created_at: string | null
          device_type: string | null
          id: string
          platform: string
          referral_code: string
          shared_at: string | null
          user_id: string | null
          utm_source: string | null
        }
        Insert: {
          action: string
          browser?: string | null
          converted_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          platform: string
          referral_code: string
          shared_at?: string | null
          user_id?: string | null
          utm_source?: string | null
        }
        Update: {
          action?: string
          browser?: string | null
          converted_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          platform?: string
          referral_code?: string
          shared_at?: string | null
          user_id?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          limit_value: number
          plan: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          limit_value: number
          plan: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          limit_value?: number
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      temporary_unlocks: {
        Row: {
          created_at: string
          expires_at: string
          feature_type: string
          granted_at: string
          id: string
          is_used: boolean | null
          restrictions: Json | null
          source: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          feature_type: string
          granted_at?: string
          id?: string
          is_used?: boolean | null
          restrictions?: Json | null
          source: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          feature_type?: string
          granted_at?: string
          id?: string
          is_used?: boolean | null
          restrictions?: Json | null
          source?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ad_preferences: {
        Row: {
          blocked_categories: string[] | null
          created_at: string
          id: string
          max_ads_per_session: number | null
          personalized_ads: boolean | null
          preferred_categories: string[] | null
          show_ads: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_categories?: string[] | null
          created_at?: string
          id?: string
          max_ads_per_session?: number | null
          personalized_ads?: boolean | null
          preferred_categories?: string[] | null
          show_ads?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_categories?: string[] | null
          created_at?: string
          id?: string
          max_ads_per_session?: number | null
          personalized_ads?: boolean | null
          preferred_categories?: string[] | null
          show_ads?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ad_profiles: {
        Row: {
          avoided_categories: string[] | null
          best_times: string[] | null
          click_through_rate: number | null
          created_at: string
          engagement_patterns: Json | null
          id: string
          preferred_categories: string[] | null
          successful_placements: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avoided_categories?: string[] | null
          best_times?: string[] | null
          click_through_rate?: number | null
          created_at?: string
          engagement_patterns?: Json | null
          id?: string
          preferred_categories?: string[] | null
          successful_placements?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avoided_categories?: string[] | null
          best_times?: string[] | null
          click_through_rate?: number | null
          created_at?: string
          engagement_patterns?: Json | null
          id?: string
          preferred_categories?: string[] | null
          successful_placements?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_recommendation_settings: {
        Row: {
          blocked_categories: string[] | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_notification_at: string | null
          max_per_day: number | null
          notifications_today: number | null
          preferred_categories: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          blocked_categories?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_notification_at?: string | null
          max_per_day?: number | null
          notifications_today?: number | null
          preferred_categories?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          blocked_categories?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_notification_at?: string | null
          max_per_day?: number | null
          notifications_today?: number | null
          preferred_categories?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendation_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referral_codes: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          currency: string
          dark_mode: boolean
          email_notifications: boolean
          expense_reminders: boolean
          id: string
          language: string
          push_notifications: boolean
          two_factor_auth: boolean
          updated_at: string
          user_id: string
          weekly_reports: boolean
        }
        Insert: {
          created_at?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          expense_reminders?: boolean
          id?: string
          language?: string
          push_notifications?: boolean
          two_factor_auth?: boolean
          updated_at?: string
          user_id: string
          weekly_reports?: boolean
        }
        Update: {
          created_at?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          expense_reminders?: boolean
          id?: string
          language?: string
          push_notifications?: boolean
          two_factor_auth?: boolean
          updated_at?: string
          user_id?: string
          weekly_reports?: boolean
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          coins: number | null
          created_at: string
          current_streak: number
          last_check_in: string | null
          longest_streak: number
          points: number
          total_check_ins: number
          total_coins_earned: number | null
          total_coins_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number | null
          created_at?: string
          current_streak?: number
          last_check_in?: string | null
          longest_streak?: number
          points?: number
          total_check_ins?: number
          total_coins_earned?: number | null
          total_coins_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number | null
          created_at?: string
          current_streak?: number
          last_check_in?: string | null
          longest_streak?: number
          points?: number
          total_check_ins?: number
          total_coins_earned?: number | null
          total_coins_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          expires_at: string
          first_trial_started_at: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          total_trial_days_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string
          first_trial_started_at?: string | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          total_trial_days_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string
          first_trial_started_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          total_trial_days_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_budget_summary: {
        Row: {
          budget_id: string | null
          categories_count: number | null
          end_date: string | null
          group_id: string | null
          name: string | null
          period: Database["public"]["Enums"]["budget_period"] | null
          start_date: string | null
          total_allocated: number | null
          total_amount: number | null
          total_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      v_member_balance: {
        Row: {
          amount_owed: number | null
          amount_paid: number | null
          group_id: string | null
          net_balance: number | null
          settlements_in: number | null
          settlements_out: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_phone_invite: {
        Args: { p_phone: string; p_token: string }
        Returns: {
          group_id: string
          message: string
          needs_phone_confirmation: boolean
          success: boolean
        }[]
      }
      add_coins: {
        Args: {
          p_amount: number
          p_description_ar?: string
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_delete_group: { Args: { p_group_id: string }; Returns: boolean }
      admin_toggle_user_admin: {
        Args: { p_is_admin: boolean; p_user_id: string }
        Returns: boolean
      }
      archive_group: { Args: { p_group_id: string }; Returns: boolean }
      archive_old_notifications: {
        Args: { p_days_old?: number; p_user_id: string }
        Returns: number
      }
      assert_quota: {
        Args: { p_action: string; p_group_id: string; p_user_id: string }
        Returns: undefined
      }
      can_approve_group_expenses: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      check_budget_alerts: {
        Args: { p_group_id: string }
        Returns: {
          alert_type: string
          budgeted_amount: number
          category_id: string
          category_name: string
          spent_amount: number
          spent_percentage: number
        }[]
      }
      check_lifetime_offer_availability: {
        Args: never
        Returns: {
          available: boolean
          remaining: number
        }[]
      }
      check_recommendation_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_referral_spam_protection: {
        Args: { p_phone: string; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_places_cache: { Args: never; Returns: number }
      cleanup_old_archived_notifications: {
        Args: { p_months_old?: number }
        Returns: number
      }
      cleanup_old_referrals: {
        Args: { p_months_old?: number }
        Returns: number
      }
      create_group_join_token: {
        Args: {
          p_group_id: string
          p_link_type?: string
          p_role?: Database["public"]["Enums"]["member_role"]
        }
        Returns: {
          expires_at: string
          max_uses: number
          token: string
        }[]
      }
      create_notification: {
        Args: { p_payload?: Json; p_type: string; p_user_id: string }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      get_admin_activity_stats: {
        Args: never
        Returns: {
          active_users: number
          date: string
          new_expenses: number
          new_groups: number
          new_users: number
          ocr_usage: number
        }[]
      }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          active_subscriptions: number
          active_users_today: number
          monthly_revenue: number
          new_users_this_month: number
          total_amount: number
          total_expenses: number
          total_groups: number
          total_users: number
        }[]
      }
      get_admin_subscription_stats: {
        Args: never
        Returns: {
          active_users: number
          conversion_rate: number
          expired_users: number
          monthly_revenue: number
          plan_type: string
          total_users: number
          trial_users: number
        }[]
      }
      get_balance_summary: {
        Args: { p_group_id: string }
        Returns: {
          confirmed_net: number
          confirmed_owed: number
          confirmed_paid: number
          pending_net: number
          pending_owed: number
          pending_paid: number
          total_net: number
          user_id: string
        }[]
      }
      get_budget_warnings: {
        Args: { p_amount: number; p_category_id: string; p_group_id: string }
        Returns: {
          budget_limit: number
          current_spent: number
          message: string
          remaining_amount: number
          warning_type: string
        }[]
      }
      get_current_count: {
        Args: { p_action: string; p_group_id: string; p_user_id: string }
        Returns: number
      }
      get_family_quota_limits: {
        Args: { p_user_id: string }
        Returns: {
          expenses_limit: number
          groups_limit: number
          invites_limit: number
          members_limit: number
          ocr_limit: number
          plan_type: string
        }[]
      }
      get_group_balance: {
        Args: { p_group_id: string }
        Returns: {
          amount_owed: number
          amount_paid: number
          net_balance: number
          settlements_in: number
          settlements_out: number
          user_id: string
        }[]
      }
      get_group_budget_tracking: {
        Args: { p_group_id: string }
        Returns: {
          budgeted_amount: number
          category_id: string
          category_name: string
          expense_count: number
          remaining_amount: number
          spent_amount: number
          spent_percentage: number
          status: string
        }[]
      }
      get_group_budget_tracking_v2: {
        Args: { p_group_id: string }
        Returns: {
          budget_id: string
          budget_name: string
          budgeted_amount: number
          category_id: string
          category_name: string
          expense_count: number
          remaining_amount: number
          spent_amount: number
          spent_percentage: number
          status: string
        }[]
      }
      get_group_income_balance: {
        Args: { p_group_id: string }
        Returns: {
          amount_received: number
          amount_shared: number
          net_income_balance: number
          user_id: string
        }[]
      }
      get_groups_for_admin: {
        Args: never
        Returns: {
          created_at: string
          currency: string
          expenses_count: number
          id: string
          members_count: number
          name: string
          owner_name: string
          total_amount: number
        }[]
      }
      get_pending_amounts: {
        Args: { p_group_id: string }
        Returns: {
          pending_net: number
          pending_owed: number
          pending_paid: number
          user_id: string
        }[]
      }
      get_profit_loss_summary: {
        Args: { p_group_id: string }
        Returns: {
          net_profit: number
          profit_margin: number
          total_expenses: number
          total_income: number
        }[]
      }
      get_referral_stats: {
        Args: { p_user_id: string }
        Returns: {
          available_rewards_days: number
          expired_referrals: number
          last_referral_date: string
          pending_referrals: number
          success_rate: number
          successful_referrals: number
          total_referrals: number
          total_rewards_days: number
        }[]
      }
      get_remaining_trial_days: { Args: { p_user_id: string }; Returns: number }
      get_user_dashboard: {
        Args: { p_user_id: string }
        Returns: {
          groups_count: number
          total_spent_30d: number
          unread_notifications: number
        }[]
      }
      get_user_plan: { Args: { p_user_id: string }; Returns: string }
      get_user_referral_tier: {
        Args: { p_user_id: string }
        Returns: {
          current_referrals: number
          next_tier_name: string
          referrals_needed: number
          tier_color: string
          tier_icon: string
          tier_name: string
          total_reward_days: number
        }[]
      }
      get_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          current_plan: string
          display_name: string
          expenses_count: number
          groups_count: number
          id: string
          is_admin: boolean
          name: string
          phone: string
        }[]
      }
      grant_temporary_unlock: {
        Args: {
          p_duration_days: number
          p_feature_type: string
          p_restrictions?: Json
          p_source: string
          p_user_id: string
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
      increment_lifetime_purchases: { Args: never; Returns: boolean }
      increment_recommendation_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_usage: {
        Args: { p_action: string; p_user_id: string }
        Returns: undefined
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_family_member_of: {
        Args: { p_family_owner_id: string; p_user_id: string }
        Returns: boolean
      }
      is_family_owner: { Args: { p_user_id: string }; Returns: boolean }
      is_group_admin: { Args: { p_group_id: string }; Returns: boolean }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      is_valid_phone: { Args: { phone_input: string }; Returns: boolean }
      join_group_with_token: { Args: { p_token: string }; Returns: string }
      log_security_event: {
        Args: { p_action: string; p_details?: Json; p_table_name?: string }
        Returns: undefined
      }
      log_suspicious_referral: {
        Args: { p_phone: string; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      process_daily_checkin: {
        Args: { p_reward_type: string; p_reward_value: Json; p_user_id: string }
        Returns: Json
      }
      seed_demo_for_user: { Args: never; Returns: string }
      spend_coins: {
        Args: {
          p_amount: number
          p_description_ar?: string
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      unarchive_group: { Args: { p_group_id: string }; Returns: boolean }
      update_daily_referral_analytics: { Args: never; Returns: number }
      update_expired_referrals: { Args: never; Returns: number }
      validate_family_invitation_token: {
        Args: { p_token: string }
        Returns: {
          family_owner_id: string
          invitation_id: string
          role: string
        }[]
      }
      validate_password_strength: {
        Args: { password_input: string }
        Returns: Json
      }
      verify_user_password: {
        Args: { current_password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      budget_period: "weekly" | "monthly" | "quarterly" | "yearly" | "custom"
      budget_type:
        | "monthly"
        | "trip"
        | "event"
        | "project"
        | "emergency"
        | "savings"
      expense_status: "pending" | "approved" | "rejected"
      income_status: "pending" | "approved" | "rejected"
      invite_status: "pending" | "sent" | "accepted" | "revoked"
      member_role: "owner" | "admin" | "member"
      referral_status: "pending" | "joined" | "blocked" | "expired"
      subscription_plan: "personal" | "family" | "lifetime"
      subscription_status: "trialing" | "active" | "expired" | "canceled"
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
      budget_period: ["weekly", "monthly", "quarterly", "yearly", "custom"],
      budget_type: [
        "monthly",
        "trip",
        "event",
        "project",
        "emergency",
        "savings",
      ],
      expense_status: ["pending", "approved", "rejected"],
      income_status: ["pending", "approved", "rejected"],
      invite_status: ["pending", "sent", "accepted", "revoked"],
      member_role: ["owner", "admin", "member"],
      referral_status: ["pending", "joined", "blocked", "expired"],
      subscription_plan: ["personal", "family", "lifetime"],
      subscription_status: ["trialing", "active", "expired", "canceled"],
    },
  },
} as const
