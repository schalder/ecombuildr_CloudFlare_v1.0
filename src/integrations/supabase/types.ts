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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          date: string
          id: string
          orders: number | null
          page_views: number | null
          revenue: number | null
          store_id: string
          visitors: number | null
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          id?: string
          orders?: number | null
          page_views?: number | null
          revenue?: number | null
          store_id: string
          visitors?: number | null
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          orders?: number | null
          page_views?: number | null
          revenue?: number | null
          store_id?: string
          visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      career_openings: {
        Row: {
          apply_url: string | null
          created_at: string
          department: string | null
          description_html: string
          employment_type: string | null
          id: string
          is_published: boolean
          location: string | null
          requirements_html: string | null
          title: string
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          created_at?: string
          department?: string | null
          description_html: string
          employment_type?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          requirements_html?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          created_at?: string
          department?: string | null
          description_html?: string
          employment_type?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          requirements_html?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          items: Json
          session_id: string
          store_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          items?: Json
          session_id: string
          store_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          items?: Json
          session_id?: string
          store_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      category_website_visibility: {
        Row: {
          category_id: string
          created_at: string
          id: string
          website_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          website_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_website_visibility_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_website_visibility_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_published: boolean
          name: string
          settings: Json
          show_on_products_page: boolean
          slug: string
          updated_at: string
          website_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_published?: boolean
          name: string
          settings?: Json
          show_on_products_page?: boolean
          slug: string
          updated_at?: string
          website_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_published?: boolean
          name?: string
          settings?: Json
          show_on_products_page?: boolean
          slug?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_return_requests: {
        Row: {
          consignment_id: string | null
          created_at: string
          id: string
          invoice: string | null
          order_id: string | null
          provider: string
          provider_return_id: string | null
          reason: string | null
          response_payload: Json | null
          status: string | null
          store_id: string
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          consignment_id?: string | null
          created_at?: string
          id?: string
          invoice?: string | null
          order_id?: string | null
          provider: string
          provider_return_id?: string | null
          reason?: string | null
          response_payload?: Json | null
          status?: string | null
          store_id: string
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          consignment_id?: string | null
          created_at?: string
          id?: string
          invoice?: string | null
          order_id?: string | null
          provider?: string
          provider_return_id?: string | null
          reason?: string | null
          response_payload?: Json | null
          status?: string | null
          store_id?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_shipment_events: {
        Row: {
          consignment_id: string | null
          created_at: string
          event_type: string | null
          id: string
          invoice: string | null
          message: string | null
          occurred_at: string
          order_id: string
          payload: Json | null
          provider: string
          shipment_id: string | null
          status: string | null
          store_id: string
        }
        Insert: {
          consignment_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          invoice?: string | null
          message?: string | null
          occurred_at?: string
          order_id: string
          payload?: Json | null
          provider?: string
          shipment_id?: string | null
          status?: string | null
          store_id: string
        }
        Update: {
          consignment_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          invoice?: string | null
          message?: string | null
          occurred_at?: string
          order_id?: string
          payload?: Json | null
          provider?: string
          shipment_id?: string | null
          status?: string | null
          store_id?: string
        }
        Relationships: []
      }
      courier_shipments: {
        Row: {
          consignment_id: string | null
          created_at: string
          error: string | null
          id: string
          invoice: string | null
          order_id: string
          provider: string
          request_payload: Json
          response_payload: Json | null
          status: string | null
          store_id: string
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          consignment_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          invoice?: string | null
          order_id: string
          provider: string
          request_payload?: Json
          response_payload?: Json | null
          status?: string | null
          store_id: string
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          consignment_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          invoice?: string | null
          order_id?: string
          provider?: string
          request_payload?: Json
          response_payload?: Json | null
          status?: string | null
          store_id?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          created_at: string
          dns_configured: boolean
          dns_verified_at: string | null
          domain: string
          id: string
          is_verified: boolean
          last_checked_at: string | null
          ssl_status: string | null
          store_id: string
          updated_at: string
          verification_attempts: number
          verification_token: string | null
        }
        Insert: {
          created_at?: string
          dns_configured?: boolean
          dns_verified_at?: string | null
          domain: string
          id?: string
          is_verified?: boolean
          last_checked_at?: string | null
          ssl_status?: string | null
          store_id: string
          updated_at?: string
          verification_attempts?: number
          verification_token?: string | null
        }
        Update: {
          created_at?: string
          dns_configured?: boolean
          dns_verified_at?: string | null
          domain?: string
          id?: string
          is_verified?: boolean
          last_checked_at?: string | null
          ssl_status?: string | null
          store_id?: string
          updated_at?: string
          verification_attempts?: number
          verification_token?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          area: string | null
          city: string
          created_at: string
          customer_id: string
          full_name: string
          id: string
          is_default: boolean
          phone: string | null
          postal_code: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          area?: string | null
          city: string
          created_at?: string
          customer_id: string
          full_name: string
          id?: string
          is_default?: boolean
          phone?: string | null
          postal_code?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          area?: string | null
          city?: string
          created_at?: string
          customer_id?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string | null
          postal_code?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          store_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          store_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          store_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          minimum_amount: number | null
          starts_at: string | null
          store_id: string
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          minimum_amount?: number | null
          starts_at?: string | null
          store_id: string
          type: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          minimum_amount?: number | null
          starts_at?: string | null
          store_id?: string
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      domain_connections: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          domain_id: string
          id: string
          is_homepage: boolean
          path: string
          store_id: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          domain_id: string
          id?: string
          is_homepage?: boolean
          path?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          domain_id?: string
          id?: string
          is_homepage?: boolean
          path?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_connections_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "custom_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          form_type: string
          id: string
          message: string | null
          product_id: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          form_type?: string
          id?: string
          message?: string | null
          product_id?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          form_type?: string
          id?: string
          message?: string | null
          product_id?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      funnel_steps: {
        Row: {
          canonical_url: string | null
          content: Json
          created_at: string
          custom_meta_tags: Json | null
          custom_scripts: string | null
          funnel_id: string
          id: string
          is_published: boolean
          language_code: string | null
          meta_author: string | null
          meta_robots: string | null
          offer_price: number | null
          offer_product_id: string | null
          offer_quantity: number | null
          og_image: string | null
          on_accept_step_id: string | null
          on_decline_step_id: string | null
          on_success_step_id: string | null
          preview_image_url: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          social_image_url: string | null
          step_order: number
          step_type: string
          title: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          content?: Json
          created_at?: string
          custom_meta_tags?: Json | null
          custom_scripts?: string | null
          funnel_id: string
          id?: string
          is_published?: boolean
          language_code?: string | null
          meta_author?: string | null
          meta_robots?: string | null
          offer_price?: number | null
          offer_product_id?: string | null
          offer_quantity?: number | null
          og_image?: string | null
          on_accept_step_id?: string | null
          on_decline_step_id?: string | null
          on_success_step_id?: string | null
          preview_image_url?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          social_image_url?: string | null
          step_order?: number
          step_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          content?: Json
          created_at?: string
          custom_meta_tags?: Json | null
          custom_scripts?: string | null
          funnel_id?: string
          id?: string
          is_published?: boolean
          language_code?: string | null
          meta_author?: string | null
          meta_robots?: string | null
          offer_price?: number | null
          offer_product_id?: string | null
          offer_quantity?: number | null
          og_image?: string | null
          on_accept_step_id?: string | null
          on_decline_step_id?: string | null
          on_success_step_id?: string | null
          preview_image_url?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          social_image_url?: string | null
          step_order?: number
          step_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_steps_offer_product_id_fkey"
            columns: ["offer_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_on_accept_step_id_fkey"
            columns: ["on_accept_step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_on_decline_step_id_fkey"
            columns: ["on_decline_step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_on_success_step_id_fkey"
            columns: ["on_success_step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          canonical_domain: string | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          is_active: boolean
          is_published: boolean
          meta_robots: string | null
          name: string
          og_image: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          settings: Json
          slug: string
          store_id: string
          updated_at: string
          website_id: string | null
        }
        Insert: {
          canonical_domain?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          meta_robots?: string | null
          name: string
          og_image?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          settings?: Json
          slug: string
          store_id: string
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          canonical_domain?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          meta_robots?: string | null
          name?: string
          og_image?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          settings?: Json
          slug?: string
          store_id?: string
          updated_at?: string
          website_id?: string | null
        }
        Relationships: []
      }
      html_snapshots: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          custom_domain: string | null
          generated_at: string
          html_content: string
          id: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          custom_domain?: string | null
          generated_at?: string
          html_content: string
          id?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          custom_domain?: string | null
          generated_at?: string
          html_content?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      navigation_menus: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          items: Json
          name: string
          position: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          position?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          position?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          status: string | null
          store_id: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          status?: string | null
          store_id: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          status?: string | null
          store_id?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_method: string | null
          delivery_status: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          store_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          store_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          store_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          product_sku: string | null
          quantity: number
          total: number
          variation: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          product_sku?: string | null
          quantity?: number
          total: number
          variation?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total?: number
          variation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          courier_name: string | null
          created_at: string | null
          custom_fields: Json | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          discount_amount: number | null
          discount_code: string | null
          facebook_pixel_data: Json | null
          funnel_id: string | null
          google_ads_data: Json | null
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          shipping_address: string
          shipping_area: string | null
          shipping_city: string | null
          shipping_cost: number | null
          shipping_country: string | null
          shipping_method: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          store_id: string
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          website_id: string | null
        }
        Insert: {
          courier_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          discount_amount?: number | null
          discount_code?: string | null
          facebook_pixel_data?: Json | null
          funnel_id?: string | null
          google_ads_data?: Json | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          shipping_address: string
          shipping_area?: string | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_country?: string | null
          shipping_method?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          store_id: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website_id?: string | null
        }
        Update: {
          courier_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          discount_amount?: number | null
          discount_code?: string | null
          facebook_pixel_data?: Json | null
          funnel_id?: string | null
          google_ads_data?: Json | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          shipping_address?: string
          shipping_area?: string | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_country?: string | null
          shipping_method?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          store_id?: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      page_templates: {
        Row: {
          auto_generate_preview: boolean
          category: string
          content: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_premium: boolean
          is_published: boolean
          name: string
          preview_image: string | null
          template_type: string
          template_types: string[]
          updated_at: string
        }
        Insert: {
          auto_generate_preview?: boolean
          category?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean
          is_published?: boolean
          name: string
          preview_image?: string | null
          template_type: string
          template_types?: string[]
          updated_at?: string
        }
        Update: {
          auto_generate_preview?: boolean
          category?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean
          is_published?: boolean
          name?: string
          preview_image?: string | null
          template_type?: string
          template_types?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          canonical_url: string | null
          content: Json | null
          created_at: string | null
          custom_meta_tags: Json | null
          custom_scripts: string | null
          id: string
          is_homepage: boolean | null
          is_published: boolean | null
          language_code: string | null
          meta_author: string | null
          meta_robots: string | null
          og_image: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          social_image_url: string | null
          store_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          content?: Json | null
          created_at?: string | null
          custom_meta_tags?: Json | null
          custom_scripts?: string | null
          id?: string
          is_homepage?: boolean | null
          is_published?: boolean | null
          language_code?: string | null
          meta_author?: string | null
          meta_robots?: string | null
          og_image?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          social_image_url?: string | null
          store_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          content?: Json | null
          created_at?: string | null
          custom_meta_tags?: Json | null
          custom_scripts?: string | null
          id?: string
          is_homepage?: boolean | null
          is_published?: boolean | null
          language_code?: string | null
          meta_author?: string | null
          meta_robots?: string | null
          og_image?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          social_image_url?: string | null
          store_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          fbclid: string | null
          gclid: string | null
          id: string
          ip_address: string | null
          page_url: string | null
          referrer: string | null
          session_id: string | null
          store_id: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          store_id: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          ip_address?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          store_id?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          website_id?: string | null
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          created_at: string
          custom_domain_allowed: boolean | null
          id: string
          max_funnels: number | null
          max_orders_per_month: number | null
          max_pages_per_store: number | null
          max_products_per_store: number | null
          max_stores: number | null
          max_websites: number | null
          plan_name: Database["public"]["Enums"]["subscription_plan"]
          price_bdt: number
          priority_support: boolean | null
          trial_days: number
          updated_at: string
          white_label: boolean | null
        }
        Insert: {
          created_at?: string
          custom_domain_allowed?: boolean | null
          id?: string
          max_funnels?: number | null
          max_orders_per_month?: number | null
          max_pages_per_store?: number | null
          max_products_per_store?: number | null
          max_stores?: number | null
          max_websites?: number | null
          plan_name: Database["public"]["Enums"]["subscription_plan"]
          price_bdt?: number
          priority_support?: boolean | null
          trial_days?: number
          updated_at?: string
          white_label?: boolean | null
        }
        Update: {
          created_at?: string
          custom_domain_allowed?: boolean | null
          id?: string
          max_funnels?: number | null
          max_orders_per_month?: number | null
          max_pages_per_store?: number | null
          max_products_per_store?: number | null
          max_stores?: number | null
          max_websites?: number | null
          plan_name?: Database["public"]["Enums"]["subscription_plan"]
          price_bdt?: number
          priority_support?: boolean | null
          trial_days?: number
          updated_at?: string
          white_label?: boolean | null
        }
        Relationships: []
      }
      platform_changelog_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      platform_feedback: {
        Row: {
          admin_response: string | null
          created_at: string
          description: string
          id: string
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      platform_marketing_content: {
        Row: {
          created_at: string
          hero_image_url: string | null
          id: string
          is_active: boolean
          section: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          section: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          section?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      platform_payment_options: {
        Row: {
          account_number: string | null
          created_at: string
          display_name: string | null
          id: string
          instructions: string | null
          is_enabled: boolean
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instructions?: string | null
          is_enabled?: boolean
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instructions?: string | null
          is_enabled?: boolean
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_roadmap_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          priority: number
          status: Database["public"]["Enums"]["roadmap_status"]
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          priority?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          priority?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_shipping_accounts: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          provider: string
          secret_key: string
          settings: Json
          updated_at: string
          webhook_token: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          secret_key: string
          settings?: Json
          updated_at?: string
          webhook_token?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          secret_key?: string
          settings?: Json
          updated_at?: string
          webhook_token?: string | null
        }
        Relationships: []
      }
      platform_support_settings: {
        Row: {
          availability_message: string | null
          created_at: string
          id: string
          is_enabled: boolean
          updated_at: string
          welcome_message: string
          whatsapp_number: string
          widget_position: string
        }
        Insert: {
          availability_message?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          welcome_message?: string
          whatsapp_number: string
          widget_position?: string
        }
        Update: {
          availability_message?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          welcome_message?: string
          whatsapp_number?: string
          widget_position?: string
        }
        Relationships: []
      }
      product_collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          position: number
          product_id: string
          updated_at: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          position?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collection_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_library: {
        Row: {
          ad_copy: string | null
          base_cost: number
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          is_trending: boolean | null
          name: string
          published_at: string | null
          shipping_cost: number
          short_description: string | null
          status: Database["public"]["Enums"]["product_library_status"]
          suggested_price: number | null
          supplier_link: string | null
          tags: string[] | null
          updated_at: string | null
          variations: Json | null
          video_url: string | null
        }
        Insert: {
          ad_copy?: string | null
          base_cost?: number
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_trending?: boolean | null
          name: string
          published_at?: string | null
          shipping_cost?: number
          short_description?: string | null
          status?: Database["public"]["Enums"]["product_library_status"]
          suggested_price?: number | null
          supplier_link?: string | null
          tags?: string[] | null
          updated_at?: string | null
          variations?: Json | null
          video_url?: string | null
        }
        Update: {
          ad_copy?: string | null
          base_cost?: number
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_trending?: boolean | null
          name?: string
          published_at?: string | null
          shipping_cost?: number
          short_description?: string | null
          status?: Database["public"]["Enums"]["product_library_status"]
          suggested_price?: number | null
          supplier_link?: string | null
          tags?: string[] | null
          updated_at?: string | null
          variations?: Json | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_library_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_library_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_library_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_library_imports: {
        Row: {
          created_at: string
          id: string
          library_item_id: string
          product_id: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          library_item_id: string
          product_id?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          library_item_id?: string
          product_id?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_library_imports_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "product_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_library_imports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_library_imports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_visible: boolean
          product_id: string
          rating: number
          reviewer_email: string | null
          reviewer_name: string
          reviewer_phone: string | null
          store_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          product_id: string
          rating: number
          reviewer_email?: string | null
          reviewer_name: string
          reviewer_phone?: string | null
          store_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          product_id?: string
          rating?: number
          reviewer_email?: string | null
          reviewer_name?: string
          reviewer_phone?: string | null
          store_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_website_visibility: {
        Row: {
          created_at: string
          id: string
          product_id: string
          website_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          website_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          website_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          action_buttons: Json
          allowed_payment_methods: string[] | null
          category_id: string | null
          compare_price: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          description_builder: Json | null
          description_mode: string
          easy_returns_days: number | null
          easy_returns_enabled: boolean
          free_shipping_min_amount: number | null
          fulfillment_type: string
          id: string
          images: Json | null
          inventory_quantity: number | null
          is_active: boolean | null
          library_item_id: string | null
          name: string
          price: number
          seo_description: string | null
          seo_title: string | null
          shipping_config: Json | null
          short_description: string | null
          sku: string | null
          slug: string
          store_id: string
          supplier_link: string | null
          track_inventory: boolean | null
          updated_at: string | null
          variations: Json | null
          video_url: string | null
          weight_grams: number | null
        }
        Insert: {
          action_buttons?: Json
          allowed_payment_methods?: string[] | null
          category_id?: string | null
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_builder?: Json | null
          description_mode?: string
          easy_returns_days?: number | null
          easy_returns_enabled?: boolean
          free_shipping_min_amount?: number | null
          fulfillment_type?: string
          id?: string
          images?: Json | null
          inventory_quantity?: number | null
          is_active?: boolean | null
          library_item_id?: string | null
          name: string
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          shipping_config?: Json | null
          short_description?: string | null
          sku?: string | null
          slug: string
          store_id: string
          supplier_link?: string | null
          track_inventory?: boolean | null
          updated_at?: string | null
          variations?: Json | null
          video_url?: string | null
          weight_grams?: number | null
        }
        Update: {
          action_buttons?: Json
          allowed_payment_methods?: string[] | null
          category_id?: string | null
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_builder?: Json | null
          description_mode?: string
          easy_returns_days?: number | null
          easy_returns_enabled?: boolean
          free_shipping_min_amount?: number | null
          fulfillment_type?: string
          id?: string
          images?: Json | null
          inventory_quantity?: number | null
          is_active?: boolean | null
          library_item_id?: string | null
          name?: string
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          shipping_config?: Json | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          store_id?: string
          supplier_link?: string | null
          track_inventory?: boolean | null
          updated_at?: string | null
          variations?: Json | null
          video_url?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "product_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          subscription_expires_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          trial_expires_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saas_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          plan_name: string
          plan_price_bdt: number
          starts_at: string
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          plan_name: string
          plan_price_bdt?: number
          starts_at?: string
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          plan_name?: string
          plan_price_bdt?: number
          starts_at?: string
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          og_image: string | null
          page_slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          og_image?: string | null
          page_slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          og_image?: string | null
          page_slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_pricing_plans: {
        Row: {
          button_variant: string | null
          color_class: string | null
          created_at: string
          description: string | null
          description_en: string | null
          display_name: string
          display_name_en: string | null
          features: Json
          features_en: Json
          icon: string | null
          id: string
          is_active: boolean
          is_popular: boolean
          period: string
          plan_name: string
          price_bdt: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          button_variant?: string | null
          color_class?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          display_name: string
          display_name_en?: string | null
          features?: Json
          features_en?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          period?: string
          plan_name: string
          price_bdt?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          button_variant?: string | null
          color_class?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          display_name?: string
          display_name_en?: string | null
          features?: Json
          features_en?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          period?: string
          plan_name?: string
          price_bdt?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_templates: {
        Row: {
          created_at: string
          demo_url: string | null
          id: string
          image_url: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_customizations: {
        Row: {
          created_at: string
          custom_config: Json
          custom_css: string | null
          id: string
          is_active: boolean
          sections: Json
          store_id: string
          theme_template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_config?: Json
          custom_css?: string | null
          id?: string
          is_active?: boolean
          sections?: Json
          store_id: string
          theme_template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_config?: Json
          custom_css?: string | null
          id?: string
          is_active?: boolean
          sections?: Json
          store_id?: string
          theme_template_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_shipping_accounts: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          provider: string
          secret_key: string
          settings: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          secret_key: string
          settings?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          secret_key?: string
          settings?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string | null
          facebook_pixel_id: string | null
          favicon_url: string | null
          google_ads_id: string | null
          google_analytics_id: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_templates: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          name: string
          preview_image: string | null
          sections: Json
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name: string
          preview_image?: string | null
          sections?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name?: string
          preview_image?: string | null
          sections?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          name: string
          preview_image: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name: string
          preview_image?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name?: string
          preview_image?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          is_published: boolean
          short_description: string | null
          slug: string
          sort_order: number
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          short_description?: string | null
          slug: string
          sort_order?: number
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          short_description?: string | null
          slug?: string
          sort_order?: number
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_lessons: {
        Row: {
          content_type: Database["public"]["Enums"]["training_content_type"]
          created_at: string
          duration_minutes: number | null
          embed_code: string | null
          id: string
          is_free_preview: boolean
          link_url: string | null
          module_id: string
          pdf_url: string | null
          sort_order: number
          text_content: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["training_content_type"]
          created_at?: string
          duration_minutes?: number | null
          embed_code?: string | null
          id?: string
          is_free_preview?: boolean
          link_url?: string | null
          module_id: string
          pdf_url?: string | null
          sort_order?: number
          text_content?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["training_content_type"]
          created_at?: string
          duration_minutes?: number | null
          embed_code?: string | null
          id?: string
          is_free_preview?: boolean
          link_url?: string | null
          module_id?: string
          pdf_url?: string | null
          sort_order?: number
          text_content?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage: {
        Row: {
          created_at: string
          current_funnels: number
          current_orders_this_month: number
          current_stores: number
          current_websites: number
          id: string
          last_reset_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_funnels?: number
          current_orders_this_month?: number
          current_stores?: number
          current_websites?: number
          id?: string
          last_reset_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_funnels?: number
          current_orders_this_month?: number
          current_stores?: number
          current_websites?: number
          id?: string
          last_reset_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_analytics: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          browser: string | null
          country: string | null
          created_at: string
          date: string
          device_type: string | null
          id: string
          page_id: string | null
          page_views: number
          referrer_source: string | null
          unique_visitors: number
          updated_at: string
          website_id: string
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          browser?: string | null
          country?: string | null
          created_at?: string
          date?: string
          device_type?: string | null
          id?: string
          page_id?: string | null
          page_views?: number
          referrer_source?: string | null
          unique_visitors?: number
          updated_at?: string
          website_id: string
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          browser?: string | null
          country?: string | null
          created_at?: string
          date?: string
          device_type?: string | null
          id?: string
          page_id?: string | null
          page_views?: number
          referrer_source?: string | null
          unique_visitors?: number
          updated_at?: string
          website_id?: string
        }
        Relationships: []
      }
      website_pages: {
        Row: {
          canonical_url: string | null
          content: Json
          created_at: string
          custom_meta_tags: Json | null
          custom_scripts: string | null
          id: string
          is_homepage: boolean
          is_published: boolean
          language_code: string | null
          meta_author: string | null
          meta_robots: string | null
          og_image: string | null
          preview_image_url: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          social_image_url: string | null
          title: string
          updated_at: string
          website_id: string
        }
        Insert: {
          canonical_url?: string | null
          content?: Json
          created_at?: string
          custom_meta_tags?: Json | null
          custom_scripts?: string | null
          id?: string
          is_homepage?: boolean
          is_published?: boolean
          language_code?: string | null
          meta_author?: string | null
          meta_robots?: string | null
          og_image?: string | null
          preview_image_url?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          social_image_url?: string | null
          title: string
          updated_at?: string
          website_id: string
        }
        Update: {
          canonical_url?: string | null
          content?: Json
          created_at?: string
          custom_meta_tags?: Json | null
          custom_scripts?: string | null
          id?: string
          is_homepage?: boolean
          is_published?: boolean
          language_code?: string | null
          meta_author?: string | null
          meta_robots?: string | null
          og_image?: string | null
          preview_image_url?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          social_image_url?: string | null
          title?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: []
      }
      websites: {
        Row: {
          created_at: string
          description: string | null
          domain: string | null
          facebook_pixel_id: string | null
          google_ads_id: string | null
          google_analytics_id: string | null
          id: string
          is_active: boolean
          is_published: boolean
          name: string
          settings: Json
          slug: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain?: string | null
          facebook_pixel_id?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          name: string
          settings?: Json
          slug: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string | null
          facebook_pixel_id?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          name?: string
          settings?: Json
          slug?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_resource: {
        Args: { _resource_type: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_cart_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      decrement_usage: {
        Args: { _resource_type: string; _user_id: string }
        Returns: undefined
      }
      get_imported_products: {
        Args: { store_id_param: string }
        Returns: string[]
      }
      get_library_orders_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_order_at: string
          library_item_id: string
          product_name: string
          revenue: number
          total_orders: number
          total_quantity: number
        }[]
      }
      get_library_product_orders: {
        Args: { library_product_id_param: string }
        Returns: {
          created_at: string
          customer_email: string
          customer_name: string
          order_id: string
          order_number: string
          price: number
          product_name: string
          quantity: number
          status: string
          store_name: string
          total: number
        }[]
      }
      get_public_reviews: {
        Args: { product_uuid?: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          product_id: string
          rating: number
          reviewer_name: string
          store_id: string
          title: string
        }[]
      }
      get_review_stats_for_products: {
        Args: { product_ids: string[] }
        Returns: {
          product_id: string
          rating_average: number
          rating_count: number
        }[]
      }
      increment_usage: {
        Args: { _resource_type: string; _user_id: string }
        Returns: undefined
      }
      is_store_owner: {
        Args: { store_uuid: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      normalize_phone: {
        Args: { p: string }
        Returns: string
      }
      record_product_import: {
        Args: {
          library_item_id_param: string
          product_id_param: string
          store_id_param: string
        }
        Returns: undefined
      }
      set_homepage: {
        Args: { page_uuid: string }
        Returns: undefined
      }
      set_website_homepage: {
        Args: { page_uuid: string }
        Returns: undefined
      }
      submit_product_review: {
        Args: {
          comment_param?: string
          product_uuid: string
          rating_param: number
          reviewer_email_param?: string
          reviewer_name_param: string
          reviewer_phone_param?: string
          title_param?: string
        }
        Returns: string
      }
    }
    Enums: {
      feedback_status:
        | "new"
        | "under_review"
        | "planned"
        | "rejected"
        | "implemented"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method: "cod" | "bkash" | "nagad" | "sslcommerz"
      product_library_status: "draft" | "published" | "archived"
      roadmap_status: "planned" | "in_progress" | "shipped" | "backlog"
      subscription_plan:
        | "free"
        | "pro_monthly"
        | "pro_yearly"
        | "reseller"
        | "starter"
        | "professional"
        | "enterprise"
      training_content_type: "video" | "text" | "pdf" | "embed" | "link"
      user_role: "store_owner" | "super_admin"
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
      feedback_status: [
        "new",
        "under_review",
        "planned",
        "rejected",
        "implemented",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cod", "bkash", "nagad", "sslcommerz"],
      product_library_status: ["draft", "published", "archived"],
      roadmap_status: ["planned", "in_progress", "shipped", "backlog"],
      subscription_plan: [
        "free",
        "pro_monthly",
        "pro_yearly",
        "reseller",
        "starter",
        "professional",
        "enterprise",
      ],
      training_content_type: ["video", "text", "pdf", "embed", "link"],
      user_role: ["store_owner", "super_admin"],
    },
  },
} as const
