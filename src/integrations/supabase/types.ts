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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta_link: string | null
          id: string
          image_url: string | null
          is_published: boolean
          sort_order: number
          subtitle_en: string | null
          subtitle_hi: string | null
          title_en: string | null
          title_hi: string | null
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          subtitle_en?: string | null
          subtitle_hi?: string | null
          title_en?: string | null
          title_hi?: string | null
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          subtitle_en?: string | null
          subtitle_hi?: string | null
          title_en?: string | null
          title_hi?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content_en: string | null
          content_hi: string | null
          cover_image: string | null
          created_at: string
          excerpt_en: string | null
          excerpt_hi: string | null
          id: string
          is_published: boolean
          is_sample: boolean
          meta_desc_en: string | null
          meta_desc_hi: string | null
          meta_title_en: string | null
          meta_title_hi: string | null
          published_at: string | null
          slug: string
          title_en: string
          title_hi: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content_en?: string | null
          content_hi?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_hi?: string | null
          id?: string
          is_published?: boolean
          is_sample?: boolean
          meta_desc_en?: string | null
          meta_desc_hi?: string | null
          meta_title_en?: string | null
          meta_title_hi?: string | null
          published_at?: string | null
          slug: string
          title_en: string
          title_hi?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content_en?: string | null
          content_hi?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_hi?: string | null
          id?: string
          is_published?: boolean
          is_sample?: boolean
          meta_desc_en?: string | null
          meta_desc_hi?: string | null
          meta_title_en?: string | null
          meta_title_hi?: string | null
          published_at?: string | null
          slug?: string
          title_en?: string
          title_hi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      booking_addons: {
        Row: {
          addon_id: string | null
          booking_id: string
          id: string
          name_en: string | null
          name_hi: string | null
          price: number
          qty: number
        }
        Insert: {
          addon_id?: string | null
          booking_id: string
          id?: string
          name_en?: string | null
          name_hi?: string | null
          price?: number
          qty?: number
        }
        Update: {
          addon_id?: string | null
          booking_id?: string
          id?: string
          name_en?: string | null
          name_hi?: string | null
          price?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_travellers: {
        Row: {
          age: number | null
          booking_id: string
          full_name: string
          gender: string | null
          id: string
          id_last4: string | null
          id_number_cipher: string | null
          id_number_enc: string | null
          id_type: string | null
          meal_pref: string | null
          medical_condition: string | null
          mobile: string | null
          traveller_type: string
        }
        Insert: {
          age?: number | null
          booking_id: string
          full_name: string
          gender?: string | null
          id?: string
          id_last4?: string | null
          id_number_cipher?: string | null
          id_number_enc?: string | null
          id_type?: string | null
          meal_pref?: string | null
          medical_condition?: string | null
          mobile?: string | null
          traveller_type?: string
        }
        Update: {
          age?: number | null
          booking_id?: string
          full_name?: string
          gender?: string | null
          id?: string
          id_last4?: string | null
          id_number_cipher?: string | null
          id_number_enc?: string | null
          id_type?: string | null
          meal_pref?: string | null
          medical_condition?: string | null
          mobile?: string | null
          traveller_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_travellers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          addons_amount: number
          adults: number
          amount_paid: number
          base_amount: number
          booking_code: string
          cancelled_at: string | null
          children: number
          consent: boolean
          contact: Json
          coupon_code: string | null
          created_at: string
          created_by: string | null
          departure_id: string | null
          discount_amount: number
          gst_amount: number
          id: string
          infants: number
          internal_notes: string | null
          is_sample: boolean
          lang: string
          payment_option: string | null
          pickup_amount: number
          pickup_city_id: string | null
          refund_amount: number
          sharing: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at: string
          user_id: string | null
          yatra_id: string | null
        }
        Insert: {
          addons_amount?: number
          adults?: number
          amount_paid?: number
          base_amount?: number
          booking_code: string
          cancelled_at?: string | null
          children?: number
          consent?: boolean
          contact?: Json
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          departure_id?: string | null
          discount_amount?: number
          gst_amount?: number
          id?: string
          infants?: number
          internal_notes?: string | null
          is_sample?: boolean
          lang?: string
          payment_option?: string | null
          pickup_amount?: number
          pickup_city_id?: string | null
          refund_amount?: number
          sharing?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          yatra_id?: string | null
        }
        Update: {
          addons_amount?: number
          adults?: number
          amount_paid?: number
          base_amount?: number
          booking_code?: string
          cancelled_at?: string | null
          children?: number
          consent?: boolean
          contact?: Json
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          departure_id?: string | null
          discount_amount?: number
          gst_amount?: number
          id?: string
          infants?: number
          internal_notes?: string | null
          is_sample?: boolean
          lang?: string
          payment_option?: string | null
          pickup_amount?: number
          pickup_city_id?: string | null
          refund_amount?: number
          sharing?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          yatra_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_hi: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_published: boolean
          name_en: string
          name_hi: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name_en: string
          name_hi?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name_en?: string
          name_hi?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          amount: number
          booking_id: string | null
          coupon_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          coupon_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          coupon_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          applicable_category_ids: string[]
          applicable_yatra_ids: string[]
          code: string
          created_at: string
          description_en: string | null
          description_hi: string | null
          discount_type: string
          id: string
          min_amount: number
          per_user_limit: number | null
          usage_limit: number | null
          used_count: number
          valid_from: string | null
          valid_to: string | null
          value: number
        }
        Insert: {
          active?: boolean
          applicable_category_ids?: string[]
          applicable_yatra_ids?: string[]
          code: string
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          discount_type?: string
          id?: string
          min_amount?: number
          per_user_limit?: number | null
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
          value: number
        }
        Update: {
          active?: boolean
          applicable_category_ids?: string[]
          applicable_yatra_ids?: string[]
          code?: string
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          discount_type?: string
          id?: string
          min_amount?: number
          per_user_limit?: number | null
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Relationships: []
      }
      departures: {
        Row: {
          booked_seats: number
          created_at: string
          end_date: string
          id: string
          price_override: number | null
          start_date: string
          status: Database["public"]["Enums"]["departure_status"]
          total_seats: number
          yatra_id: string
        }
        Insert: {
          booked_seats?: number
          created_at?: string
          end_date: string
          id?: string
          price_override?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["departure_status"]
          total_seats?: number
          yatra_id: string
        }
        Update: {
          booked_seats?: number
          created_at?: string
          end_date?: string
          id?: string
          price_override?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["departure_status"]
          total_seats?: number
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departures_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          best_time_en: string | null
          best_time_hi: string | null
          created_at: string
          description_en: string | null
          description_hi: string | null
          how_to_reach_en: string | null
          how_to_reach_hi: string | null
          id: string
          image_url: string | null
          is_published: boolean
          name_en: string
          name_hi: string | null
          nearby_en: string | null
          nearby_hi: string | null
          significance_en: string | null
          significance_hi: string | null
          slug: string
          sort_order: number
          state: string | null
        }
        Insert: {
          best_time_en?: string | null
          best_time_hi?: string | null
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          how_to_reach_en?: string | null
          how_to_reach_hi?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name_en: string
          name_hi?: string | null
          nearby_en?: string | null
          nearby_hi?: string | null
          significance_en?: string | null
          significance_hi?: string | null
          slug: string
          sort_order?: number
          state?: string | null
        }
        Update: {
          best_time_en?: string | null
          best_time_hi?: string | null
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          how_to_reach_en?: string | null
          how_to_reach_hi?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name_en?: string
          name_hi?: string | null
          nearby_en?: string | null
          nearby_hi?: string | null
          significance_en?: string | null
          significance_hi?: string | null
          slug?: string
          sort_order?: number
          state?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          booking_id: string | null
          created_at: string
          error: string | null
          id: string
          provider_id: string | null
          status: string
          subject: string | null
          template: string | null
          to_email: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          status?: string
          subject?: string | null
          template?: string | null
          to_email: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          status?: string
          subject?: string | null
          template?: string | null
          to_email?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          follow_up_date: string | null
          id: string
          is_sample: boolean
          message: string | null
          mobile: string
          name: string
          notes: string | null
          preferred_month: string | null
          source: string
          status: Database["public"]["Enums"]["enquiry_status"]
          yatra_id: string | null
          yatra_interest: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          is_sample?: boolean
          message?: string | null
          mobile: string
          name: string
          notes?: string | null
          preferred_month?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          yatra_id?: string | null
          yatra_interest?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          is_sample?: boolean
          message?: string | null
          mobile?: string
          name?: string
          notes?: string | null
          preferred_month?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          yatra_id?: string | null
          yatra_interest?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer_en: string | null
          answer_hi: string | null
          created_at: string
          group_en: string | null
          group_hi: string | null
          id: string
          is_published: boolean
          question_en: string
          question_hi: string | null
          sort_order: number
        }
        Insert: {
          answer_en?: string | null
          answer_hi?: string | null
          created_at?: string
          group_en?: string | null
          group_hi?: string | null
          id?: string
          is_published?: boolean
          question_en: string
          question_hi?: string | null
          sort_order?: number
        }
        Update: {
          answer_en?: string | null
          answer_hi?: string | null
          created_at?: string
          group_en?: string | null
          group_hi?: string | null
          id?: string
          is_published?: boolean
          question_en?: string
          question_hi?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          caption_en: string | null
          caption_hi: string | null
          created_at: string
          id: string
          is_published: boolean
          sort_order: number
          url: string
          yatra_id: string | null
        }
        Insert: {
          caption_en?: string | null
          caption_hi?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          url: string
          yatra_id?: string | null
        }
        Update: {
          caption_en?: string | null
          caption_hi?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          url?: string
          yatra_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          method: string | null
          notes: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          recorded_by: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          method?: string | null
          notes?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          recorded_by?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          method?: string | null
          notes?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          recorded_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          must_change_password: boolean
          phone: string | null
          preferred_lang: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          must_change_password?: boolean
          phone?: string | null
          preferred_lang?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          phone?: string | null
          preferred_lang?: string
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          created_by: string | null
          id: string
          payment_id: string | null
          razorpay_refund_id: string | null
          reason: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payment_id?: string | null
          razorpay_refund_id?: string | null
          reason?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payment_id?: string | null
          razorpay_refund_id?: string | null
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      representatives: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_published: boolean
          name: string
          phone: string | null
          photo_url: string | null
          region_en: string | null
          region_hi: string | null
          sort_order: number
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          region_en?: string | null
          region_hi?: string | null
          sort_order?: number
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          region_en?: string | null
          region_hi?: string | null
          sort_order?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          city: string | null
          comment: string | null
          created_at: string
          id: string
          name: string
          rating: number
          reply: string | null
          status: string
          user_id: string | null
          yatra_id: string
        }
        Insert: {
          city?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          name: string
          rating?: number
          reply?: string | null
          status?: string
          user_id?: string | null
          yatra_id: string
        }
        Update: {
          city?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          name?: string
          rating?: number
          reply?: string | null
          status?: string
          user_id?: string | null
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_travellers: {
        Row: {
          age: number | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          id_last4: string | null
          id_type: string | null
          meal_pref: string | null
          mobile: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          id_last4?: string | null
          id_type?: string | null
          meal_pref?: string | null
          mobile?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          id_last4?: string | null
          id_type?: string | null
          meal_pref?: string | null
          mobile?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seat_holds: {
        Row: {
          booking_id: string | null
          created_at: string
          departure_id: string
          expires_at: string
          id: string
          released: boolean
          seats: number
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          departure_id: string
          expires_at: string
          id?: string
          released?: boolean
          seats: number
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          departure_id?: string
          expires_at?: string
          id?: string
          released?: boolean
          seats?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seat_holds_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          about_en: string | null
          about_hi: string | null
          address_en: string | null
          address_hi: string | null
          brand_name_en: string
          brand_name_hi: string
          cancellation_slabs: Json
          counters: Json
          default_advance_type: string
          default_advance_value: number
          email: string | null
          email_sender_name: string
          favicon_url: string | null
          gst_number: string | null
          gst_percent: number
          id: number
          logo_url: string | null
          phone: string | null
          razorpay_mode: string
          social: Json
          tagline_en: string | null
          tagline_hi: string | null
          updated_at: string
          video_url: string | null
          whatsapp: string | null
        }
        Insert: {
          about_en?: string | null
          about_hi?: string | null
          address_en?: string | null
          address_hi?: string | null
          brand_name_en?: string
          brand_name_hi?: string
          cancellation_slabs?: Json
          counters?: Json
          default_advance_type?: string
          default_advance_value?: number
          email?: string | null
          email_sender_name?: string
          favicon_url?: string | null
          gst_number?: string | null
          gst_percent?: number
          id?: number
          logo_url?: string | null
          phone?: string | null
          razorpay_mode?: string
          social?: Json
          tagline_en?: string | null
          tagline_hi?: string | null
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          about_en?: string | null
          about_hi?: string | null
          address_en?: string | null
          address_hi?: string | null
          brand_name_en?: string
          brand_name_hi?: string
          cancellation_slabs?: Json
          counters?: Json
          default_advance_type?: string
          default_advance_value?: number
          email?: string | null
          email_sender_name?: string
          favicon_url?: string | null
          gst_number?: string | null
          gst_percent?: number
          id?: number
          logo_url?: string | null
          phone?: string | null
          razorpay_mode?: string
          social?: Json
          tagline_en?: string | null
          tagline_hi?: string | null
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio_en: string | null
          bio_hi: string | null
          created_at: string
          id: string
          is_published: boolean
          name: string
          photo_url: string | null
          role_en: string | null
          role_hi: string | null
          sort_order: number
        }
        Insert: {
          bio_en?: string | null
          bio_hi?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          name: string
          photo_url?: string | null
          role_en?: string | null
          role_hi?: string | null
          sort_order?: number
        }
        Update: {
          bio_en?: string | null
          bio_hi?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          name?: string
          photo_url?: string | null
          role_en?: string | null
          role_hi?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          city_en: string | null
          city_hi: string | null
          created_at: string
          id: string
          is_published: boolean
          is_sample: boolean
          name: string
          photo_url: string | null
          quote_en: string | null
          quote_hi: string | null
          rating: number
          sort_order: number
          yatra_en: string | null
          yatra_hi: string | null
        }
        Insert: {
          city_en?: string | null
          city_hi?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_sample?: boolean
          name: string
          photo_url?: string | null
          quote_en?: string | null
          quote_hi?: string | null
          rating?: number
          sort_order?: number
          yatra_en?: string | null
          yatra_hi?: string | null
        }
        Update: {
          city_en?: string | null
          city_hi?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_sample?: boolean
          name?: string
          photo_url?: string | null
          quote_en?: string | null
          quote_hi?: string | null
          rating?: number
          sort_order?: number
          yatra_en?: string | null
          yatra_hi?: string | null
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
      waitlist: {
        Row: {
          booking_id: string | null
          created_at: string
          departure_id: string
          email: string | null
          id: string
          mobile: string
          name: string
          offered_until: string | null
          seats: number
          status: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          departure_id: string
          email?: string | null
          id?: string
          mobile: string
          name: string
          offered_until?: string | null
          seats?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          departure_id?: string
          email?: string | null
          id?: string
          mobile?: string
          name?: string
          offered_until?: string | null
          seats?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          user_id: string
          yatra_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          yatra_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_addons: {
        Row: {
          id: string
          name_en: string
          name_hi: string | null
          per_person: boolean
          price: number
          sort_order: number
          yatra_id: string
        }
        Insert: {
          id?: string
          name_en: string
          name_hi?: string | null
          per_person?: boolean
          price?: number
          sort_order?: number
          yatra_id: string
        }
        Update: {
          id?: string
          name_en?: string
          name_hi?: string | null
          per_person?: boolean
          price?: number
          sort_order?: number
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_addons_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_categories: {
        Row: {
          category_id: string
          yatra_id: string
        }
        Insert: {
          category_id: string
          yatra_id: string
        }
        Update: {
          category_id?: string
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yatra_categories_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_destinations: {
        Row: {
          destination_id: string
          yatra_id: string
        }
        Insert: {
          destination_id: string
          yatra_id: string
        }
        Update: {
          destination_id?: string
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_destinations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yatra_destinations_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_faqs: {
        Row: {
          answer_en: string | null
          answer_hi: string | null
          id: string
          question_en: string
          question_hi: string | null
          sort_order: number
          yatra_id: string
        }
        Insert: {
          answer_en?: string | null
          answer_hi?: string | null
          id?: string
          question_en: string
          question_hi?: string | null
          sort_order?: number
          yatra_id: string
        }
        Update: {
          answer_en?: string | null
          answer_hi?: string | null
          id?: string
          question_en?: string
          question_hi?: string | null
          sort_order?: number
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_faqs_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_images: {
        Row: {
          alt_en: string | null
          alt_hi: string | null
          id: string
          sort_order: number
          url: string
          yatra_id: string
        }
        Insert: {
          alt_en?: string | null
          alt_hi?: string | null
          id?: string
          sort_order?: number
          url: string
          yatra_id: string
        }
        Update: {
          alt_en?: string | null
          alt_hi?: string | null
          id?: string
          sort_order?: number
          url?: string
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_images_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_itinerary_days: {
        Row: {
          day_number: number
          description_en: string | null
          description_hi: string | null
          id: string
          image_url: string | null
          meals: string[]
          overnight_en: string | null
          overnight_hi: string | null
          title_en: string | null
          title_hi: string | null
          yatra_id: string
        }
        Insert: {
          day_number: number
          description_en?: string | null
          description_hi?: string | null
          id?: string
          image_url?: string | null
          meals?: string[]
          overnight_en?: string | null
          overnight_hi?: string | null
          title_en?: string | null
          title_hi?: string | null
          yatra_id: string
        }
        Update: {
          day_number?: number
          description_en?: string | null
          description_hi?: string | null
          id?: string
          image_url?: string | null
          meals?: string[]
          overnight_en?: string | null
          overnight_hi?: string | null
          title_en?: string | null
          title_hi?: string | null
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_itinerary_days_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_list_items: {
        Row: {
          id: string
          kind: Database["public"]["Enums"]["list_kind"]
          sort_order: number
          text_en: string
          text_hi: string | null
          yatra_id: string
        }
        Insert: {
          id?: string
          kind: Database["public"]["Enums"]["list_kind"]
          sort_order?: number
          text_en: string
          text_hi?: string | null
          yatra_id: string
        }
        Update: {
          id?: string
          kind?: Database["public"]["Enums"]["list_kind"]
          sort_order?: number
          text_en?: string
          text_hi?: string | null
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_list_items_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_pickup_cities: {
        Row: {
          city_en: string
          city_hi: string | null
          extra_charge: number
          id: string
          reporting_place_en: string | null
          reporting_place_hi: string | null
          reporting_time: string | null
          sort_order: number
          yatra_id: string
        }
        Insert: {
          city_en: string
          city_hi?: string | null
          extra_charge?: number
          id?: string
          reporting_place_en?: string | null
          reporting_place_hi?: string | null
          reporting_time?: string | null
          sort_order?: number
          yatra_id: string
        }
        Update: {
          city_en?: string
          city_hi?: string | null
          extra_charge?: number
          id?: string
          reporting_place_en?: string | null
          reporting_place_hi?: string | null
          reporting_time?: string | null
          sort_order?: number
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_pickup_cities_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_pricing: {
        Row: {
          child: number | null
          infant: number | null
          quad: number | null
          single: number | null
          triple: number | null
          twin: number | null
          yatra_id: string
        }
        Insert: {
          child?: number | null
          infant?: number | null
          quad?: number | null
          single?: number | null
          triple?: number | null
          twin?: number | null
          yatra_id: string
        }
        Update: {
          child?: number | null
          infant?: number | null
          quad?: number | null
          single?: number | null
          triple?: number | null
          twin?: number | null
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_pricing_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: true
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatra_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          snapshot: Json
          yatra_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot: Json
          yatra_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot?: Json
          yatra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yatra_versions_yatra_id_fkey"
            columns: ["yatra_id"]
            isOneToOne: false
            referencedRelation: "yatras"
            referencedColumns: ["id"]
          },
        ]
      }
      yatras: {
        Row: {
          advance_type: string
          advance_value: number
          brochure_url: string | null
          cancellation_slabs: Json | null
          cover_image: string | null
          created_at: string
          difficulty: string
          duration_days: number
          duration_nights: number
          featured: boolean
          gst_inclusive: boolean
          gst_percent: number
          highlights_en: string[]
          highlights_hi: string[]
          id: string
          is_sample: boolean
          map_embed_url: string | null
          meta_desc_en: string | null
          meta_desc_hi: string | null
          meta_title_en: string | null
          meta_title_hi: string | null
          min_age: number | null
          offer: boolean
          offer_ends_at: string | null
          og_image: string | null
          original_price: number | null
          overview_en: string | null
          overview_hi: string | null
          popularity: number
          price: number | null
          rating: number
          review_count: number
          senior_friendly: boolean
          short_desc_en: string | null
          short_desc_hi: string | null
          slug: string
          starting_city_en: string | null
          starting_city_hi: string | null
          states: string[]
          status: Database["public"]["Enums"]["yatra_status"]
          tags: string[]
          title_en: string
          title_hi: string | null
          transport: string[]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          advance_type?: string
          advance_value?: number
          brochure_url?: string | null
          cancellation_slabs?: Json | null
          cover_image?: string | null
          created_at?: string
          difficulty?: string
          duration_days?: number
          duration_nights?: number
          featured?: boolean
          gst_inclusive?: boolean
          gst_percent?: number
          highlights_en?: string[]
          highlights_hi?: string[]
          id?: string
          is_sample?: boolean
          map_embed_url?: string | null
          meta_desc_en?: string | null
          meta_desc_hi?: string | null
          meta_title_en?: string | null
          meta_title_hi?: string | null
          min_age?: number | null
          offer?: boolean
          offer_ends_at?: string | null
          og_image?: string | null
          original_price?: number | null
          overview_en?: string | null
          overview_hi?: string | null
          popularity?: number
          price?: number | null
          rating?: number
          review_count?: number
          senior_friendly?: boolean
          short_desc_en?: string | null
          short_desc_hi?: string | null
          slug: string
          starting_city_en?: string | null
          starting_city_hi?: string | null
          states?: string[]
          status?: Database["public"]["Enums"]["yatra_status"]
          tags?: string[]
          title_en?: string
          title_hi?: string | null
          transport?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          advance_type?: string
          advance_value?: number
          brochure_url?: string | null
          cancellation_slabs?: Json | null
          cover_image?: string | null
          created_at?: string
          difficulty?: string
          duration_days?: number
          duration_nights?: number
          featured?: boolean
          gst_inclusive?: boolean
          gst_percent?: number
          highlights_en?: string[]
          highlights_hi?: string[]
          id?: string
          is_sample?: boolean
          map_embed_url?: string | null
          meta_desc_en?: string | null
          meta_desc_hi?: string | null
          meta_title_en?: string | null
          meta_title_hi?: string | null
          min_age?: number | null
          offer?: boolean
          offer_ends_at?: string | null
          og_image?: string | null
          original_price?: number | null
          overview_en?: string | null
          overview_hi?: string | null
          popularity?: number
          price?: number | null
          rating?: number
          review_count?: number
          senior_friendly?: boolean
          short_desc_en?: string | null
          short_desc_hi?: string | null
          slug?: string
          starting_city_en?: string | null
          starting_city_hi?: string | null
          states?: string[]
          status?: Database["public"]["Enums"]["yatra_status"]
          tags?: string[]
          title_en?: string
          title_hi?: string | null
          transport?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      departure_seats_left: { Args: { _departure_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_booking_code: { Args: never; Returns: string }
      release_seats: {
        Args: { _departure_id: string; _seats: number }
        Returns: undefined
      }
      reserve_seats: {
        Args: { _departure_id: string; _seats: number }
        Returns: boolean
      }
      run_daily_maintenance: { Args: never; Returns: undefined }
      yatra_visible: { Args: { _yatra_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "customer" | "staff" | "admin" | "super_admin"
      booking_status:
        | "pending_payment"
        | "partially_paid"
        | "confirmed"
        | "cancellation_requested"
        | "cancelled"
        | "refunded"
        | "completed"
      departure_status:
        | "available"
        | "filling_fast"
        | "sold_out"
        | "closed"
        | "completed"
      enquiry_status: "new" | "contacted" | "converted" | "closed"
      list_kind: "inclusion" | "exclusion" | "carry" | "note"
      yatra_status: "draft" | "published" | "archived"
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
      app_role: ["customer", "staff", "admin", "super_admin"],
      booking_status: [
        "pending_payment",
        "partially_paid",
        "confirmed",
        "cancellation_requested",
        "cancelled",
        "refunded",
        "completed",
      ],
      departure_status: [
        "available",
        "filling_fast",
        "sold_out",
        "closed",
        "completed",
      ],
      enquiry_status: ["new", "contacted", "converted", "closed"],
      list_kind: ["inclusion", "exclusion", "carry", "note"],
      yatra_status: ["draft", "published", "archived"],
    },
  },
} as const
