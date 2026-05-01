/**
 * Supabase Database types — Multi-tenant SaaS schema.
 * Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts`
 * to regenerate this file when the schema changes.
 */
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          owner_id: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          timezone: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          owner_id?: string;
          email?: string;
          phone?: string;
          address?: string;
          timezone?: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>;
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          role: string;
          is_active: boolean;
          created_at: string;
          first_name?: string;
          last_name?: string;
          email?: string;
        };
        Insert: {
          user_id: string;
          business_id: string;
          role: string;
          is_active?: boolean;
          first_name?: string;
          last_name?: string;
          email?: string;
        };
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
      };
      staff: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          role: string;
          first_name: string;
          last_name: string;
          email: string;
        };
        Insert: {
          user_id: string;
          business_id: string;
          role: string;
          first_name: string;
          last_name: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['staff']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          duration_mins: number;
          price: number;
          description?: string | null;
          emoji?: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          duration_mins: number;
          price?: number;
          description?: string | null;
          emoji?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      availability: {
        Row: {
          id: string;
          business_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
        };
        Insert: {
          business_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
        };
        Update: Partial<Database['public']['Tables']['availability']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          business_id: string;
          service_id: string;
          assigned_employee_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          start_time: string;
          end_time: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          service_id: string;
          assigned_employee_id?: string;
          customer_name: string;
          customer_email: string;
          customer_phone?: string;
          start_time: string;
          end_time: string;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      appointment_services: {
        Row: {
          appointment_id: string;
          service_id: string;
          business_id: string;
        };
        Insert: {
          appointment_id: string;
          service_id: string;
          business_id: string;
        };
        Update: Partial<Database['public']['Tables']['appointment_services']['Insert']>;
      };
      employee_schedules: {
        Row: {
          id: string;
          business_id: string;
          team_member_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Insert: {
          business_id: string;
          team_member_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database['public']['Tables']['employee_schedules']['Insert']>;
      };
      service_team_members: {
        Row: {
          business_id: string;
          team_member_id: string;
          service_id: string;
        };
        Insert: {
          business_id: string;
          team_member_id: string;
          service_id: string;
        };
        Update: Partial<Database['public']['Tables']['service_team_members']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_business_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'cancelled';
      team_role: 'owner' | 'admin' | 'employee';
    };
  };
};

// ── Convenience row types ──────────────────────────────────────────────────
export type Business = Database['public']['Tables']['businesses']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Availability = Database['public']['Tables']['availability']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];

export type BookingStatus = Database['public']['Enums']['booking_status'];
export type TeamRole = Database['public']['Enums']['team_role'];
