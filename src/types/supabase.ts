export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      classes: {
        Row: {
          class_name: string
          created_at: string
          created_by: string | null
          grade_id: string
          id: string
          room_code: string | null
          school_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          created_by?: string | null
          grade_id: string
          id?: string
          room_code?: string | null
          school_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          created_by?: string | null
          grade_id?: string
          id?: string
          room_code?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          grade_name: string
          id: string
          school_type: Database["public"]["Enums"]["school_type_enum"]
          sort_order: number
        }
        Insert: {
          grade_name: string
          id?: string
          school_type: Database["public"]["Enums"]["school_type_enum"]
          sort_order?: number
        }
        Update: {
          grade_name?: string
          id?: string
          school_type?: Database["public"]["Enums"]["school_type_enum"]
          sort_order?: number
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          class_id: string
          ended_at: string | null
          id: string
          interim_transcript: string | null
          is_active: boolean
          language: string
          room_code: string
          started_at: string
          subject_id: string
          teacher_id: string
          transcript: string | null
        }
        Insert: {
          class_id: string
          ended_at?: string | null
          id?: string
          interim_transcript?: string | null
          is_active?: boolean
          language?: string
          room_code: string
          started_at?: string
          subject_id: string
          teacher_id: string
          transcript?: string | null
        }
        Update: {
          class_id?: string
          ended_at?: string | null
          id?: string
          interim_transcript?: string | null
          is_active?: boolean
          language?: string
          room_code?: string
          started_at?: string
          subject_id?: string
          teacher_id?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          id: string
          school_name: string
          school_type: Database["public"]["Enums"]["school_type_enum"]
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          school_name: string
          school_type: Database["public"]["Enums"]["school_type_enum"]
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          school_name?: string
          school_type?: Database["public"]["Enums"]["school_type_enum"]
        }
        Relationships: []
      }
      session_history: {
        Row: {
          class_display: string
          class_id: string | null
          created_at: string
          duration: number
          excerpt: string
          id: string
          language: string
          session_date: string
          subject_display: string
          subject_id: string | null
          teacher_id: string | null
          teacher_name: string
          transcript_full: string | null
          word_count: number
        }
        Insert: {
          class_display: string
          class_id?: string | null
          created_at?: string
          duration?: number
          excerpt?: string
          id?: string
          language?: string
          session_date?: string
          subject_display: string
          subject_id?: string | null
          teacher_id?: string | null
          teacher_name: string
          transcript_full?: string | null
          word_count?: number
        }
        Update: {
          class_display?: string
          class_id?: string | null
          created_at?: string
          duration?: number
          excerpt?: string
          id?: string
          language?: string
          session_date?: string
          subject_display?: string
          subject_id?: string | null
          teacher_id?: string | null
          teacher_name?: string
          transcript_full?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_history_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_history_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_history_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          id: string
          joined_at: string
          session_id: string
          student_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_id: string
          student_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          absen: string
          class_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          absen?: string
          class_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          absen?: string
          class_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_by: string | null
          id: string
          is_custom: boolean
          subject_name: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          is_custom?: boolean
          subject_name: string
        }
        Update: {
          created_by?: string | null
          id?: string
          is_custom?: boolean
          subject_name?: string
        }
        Relationships: []
      }
      teacher_classes: {
        Row: {
          class_id: string
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          auth_user_id: string
          created_at: string
          custom_glossary: Json | null
          email: string
          full_name: string
          id: string
          is_verified: boolean
          nip: string | null
          role: string
          school_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          custom_glossary?: Json | null
          email: string
          full_name: string
          id?: string
          is_verified?: boolean
          nip?: string | null
          role?: string
          school_id: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          custom_glossary?: Json | null
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean
          nip?: string | null
          role?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_teacher_email: { Args: { p_email: string }; Returns: boolean }
      generate_room_code: { Args: never; Returns: string }
      get_teacher_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      school_type_enum: "SD" | "SMP" | "SMA" | "SMK" | "SLB"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      school_type_enum: ["SD", "SMP", "SMA", "SMK", "SLB"],
    },
  },
} as const

