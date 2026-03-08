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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          critical: boolean
          id: string
          name: string
          percent_complete: number
          planned_end: string
          planned_start: string
          predecessors: string | null
          project_id: string | null
          status: string
          user_id: string
          wbs: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          critical?: boolean
          id?: string
          name?: string
          percent_complete?: number
          planned_end?: string
          planned_start?: string
          predecessors?: string | null
          project_id?: string | null
          status?: string
          user_id: string
          wbs?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          critical?: boolean
          id?: string
          name?: string
          percent_complete?: number
          planned_end?: string
          planned_start?: string
          predecessors?: string | null
          project_id?: string | null
          status?: string
          user_id?: string
          wbs?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_items: {
        Row: {
          code: string
          created_at: string
          description: string
          executed_qty: number
          id: string
          measure_type: string
          project_id: string | null
          rate: number
          total_qty: number
          unit: string
          user_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          description?: string
          executed_qty?: number
          id?: string
          measure_type?: string
          project_id?: string | null
          rate?: number
          total_qty?: number
          unit?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          executed_qty?: number
          id?: string
          measure_type?: string
          project_id?: string | null
          rate?: number
          total_qty?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      concrete_pours: {
        Row: {
          created_at: string
          date: string
          grade: string
          id: string
          location: string
          project_id: string | null
          remarks: string
          slump: number
          supplier: string
          temperature: number
          user_id: string
          volume: number
        }
        Insert: {
          created_at?: string
          date?: string
          grade?: string
          id?: string
          location?: string
          project_id?: string | null
          remarks?: string
          slump?: number
          supplier?: string
          temperature?: number
          user_id: string
          volume?: number
        }
        Update: {
          created_at?: string
          date?: string
          grade?: string
          id?: string
          location?: string
          project_id?: string | null
          remarks?: string
          slump?: number
          supplier?: string
          temperature?: number
          user_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "concrete_pours_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quantity: {
        Row: {
          boq_code: string
          created_at: string
          date: string
          description: string
          id: string
          location: string
          project_id: string | null
          qty: number
          remarks: string
          unit: string
          user_id: string
        }
        Insert: {
          boq_code?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          location?: string
          project_id?: string | null
          qty?: number
          remarks?: string
          unit?: string
          user_id: string
        }
        Update: {
          boq_code?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          location?: string
          project_id?: string | null
          qty?: number
          remarks?: string
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quantity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_changes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          data: Json
          id: string
          operation: string
          project_id: string
          record_id: string
          status: string
          table_name: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          data?: Json
          id?: string
          operation?: string
          project_id: string
          record_id: string
          status?: string
          table_name: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          data?: Json
          id?: string
          operation?: string
          project_id?: string
          record_id?: string
          status?: string
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      delays: {
        Row: {
          activity: string
          cause: string
          created_at: string
          date: string
          description: string
          duration: number
          id: string
          impact: string
          project_id: string | null
          recovery: string
          status: string
          user_id: string
        }
        Insert: {
          activity?: string
          cause?: string
          created_at?: string
          date?: string
          description?: string
          duration?: number
          id?: string
          impact?: string
          project_id?: string | null
          recovery?: string
          status?: string
          user_id: string
        }
        Update: {
          activity?: string
          cause?: string
          created_at?: string
          date?: string
          description?: string
          duration?: number
          id?: string
          impact?: string
          project_id?: string | null
          recovery?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delays_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          activity: string
          created_at: string
          date: string
          description: string
          eq_id: string
          equipment_name: string
          fuel: number
          hours: number
          id: string
          issues: string
          operator: string
          ownership: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          activity?: string
          created_at?: string
          date?: string
          description?: string
          eq_id?: string
          equipment_name?: string
          fuel?: number
          hours?: number
          id?: string
          issues?: string
          operator?: string
          ownership?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          date?: string
          description?: string
          eq_id?: string
          equipment_name?: string
          fuel?: number
          hours?: number
          id?: string
          issues?: string
          operator?: string
          ownership?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_log: {
        Row: {
          cost: number
          created_at: string
          date: string
          equipment: string
          id: string
          liters: number
          odometer: number
          project_id: string | null
          remarks: string
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          equipment?: string
          id?: string
          liters?: number
          odometer?: number
          project_id?: string | null
          remarks?: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          equipment?: string
          id?: string
          liters?: number
          odometer?: number
          project_id?: string | null
          remarks?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          balance: number
          code: string
          created_at: string
          description: string
          id: string
          issues: number
          location: string
          min_level: number
          opening: number
          project_id: string | null
          receipts: number
          unit: string
          user_id: string
        }
        Insert: {
          balance?: number
          code?: string
          created_at?: string
          description?: string
          id?: string
          issues?: number
          location?: string
          min_level?: number
          opening?: number
          project_id?: string | null
          receipts?: number
          unit?: string
          user_id: string
        }
        Update: {
          balance?: number
          code?: string
          created_at?: string
          description?: string
          id?: string
          issues?: number
          location?: string
          min_level?: number
          opening?: number
          project_id?: string | null
          receipts?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      manpower: {
        Row: {
          carpenter: number
          created_at: string
          date: string
          electrician: number
          fitter: number
          id: string
          location: string
          mason: number
          operator: number
          project_id: string | null
          skilled: number
          steel: number
          supervisor: string
          unskilled: number
          user_id: string
          welder: number
        }
        Insert: {
          carpenter?: number
          created_at?: string
          date?: string
          electrician?: number
          fitter?: number
          id?: string
          location?: string
          mason?: number
          operator?: number
          project_id?: string | null
          skilled?: number
          steel?: number
          supervisor?: string
          unskilled?: number
          user_id: string
          welder?: number
        }
        Update: {
          carpenter?: number
          created_at?: string
          date?: string
          electrician?: number
          fitter?: number
          id?: string
          location?: string
          mason?: number
          operator?: number
          project_id?: string | null
          skilled?: number
          steel?: number
          supervisor?: string
          unskilled?: number
          user_id?: string
          welder?: number
        }
        Relationships: [
          {
            foreignKeyName: "manpower_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_tracking: {
        Row: {
          actual_delivery: string
          created_at: string
          expected_delivery: string
          id: string
          material_code: string
          material_description: string
          order_date: string
          ordered_qty: number
          po_number: string
          project_id: string | null
          received_qty: number
          remarks: string
          required_qty: number
          status: string
          supplier: string
          total_cost: number
          unit: string
          unit_rate: number
          user_id: string
        }
        Insert: {
          actual_delivery?: string
          created_at?: string
          expected_delivery?: string
          id?: string
          material_code?: string
          material_description?: string
          order_date?: string
          ordered_qty?: number
          po_number?: string
          project_id?: string | null
          received_qty?: number
          remarks?: string
          required_qty?: number
          status?: string
          supplier?: string
          total_cost?: number
          unit?: string
          unit_rate?: number
          user_id: string
        }
        Update: {
          actual_delivery?: string
          created_at?: string
          expected_delivery?: string
          id?: string
          material_code?: string
          material_description?: string
          order_date?: string
          ordered_qty?: number
          po_number?: string
          project_id?: string | null
          received_qty?: number
          remarks?: string
          required_qty?: number
          status?: string
          supplier?: string
          total_cost?: number
          unit?: string
          unit_rate?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          storage_mode: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          storage_mode?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          storage_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          connection_code: string
          created_at: string
          created_by: string
          description: string
          id: string
          name: string
        }
        Insert: {
          connection_code?: string
          created_at?: string
          created_by: string
          description?: string
          id?: string
          name?: string
        }
        Update: {
          connection_code?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          date: string
          id: string
          item_code: string
          po_no: string
          price: number
          project_id: string | null
          qty: number
          remarks: string
          status: string
          supplier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          item_code?: string
          po_no?: string
          price?: number
          project_id?: string | null
          qty?: number
          remarks?: string
          status?: string
          supplier?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          item_code?: string
          po_no?: string
          price?: number
          project_id?: string | null
          qty?: number
          remarks?: string
          status?: string
          supplier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incidents: {
        Row: {
          cause: string
          created_at: string
          date: string
          description: string
          id: string
          injured: string
          location: string
          preventive: string
          project_id: string | null
          reporter: string
          type: string
          user_id: string
        }
        Insert: {
          cause?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          injured?: string
          location?: string
          preventive?: string
          project_id?: string | null
          reporter?: string
          type?: string
          user_id: string
        }
        Update: {
          cause?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          injured?: string
          location?: string
          preventive?: string
          project_id?: string | null
          reporter?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      get_project_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "project_manager" | "engineer" | "viewer"
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
      app_role: ["admin", "project_manager", "engineer", "viewer"],
    },
  },
} as const
