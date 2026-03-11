export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      daily_records: {
        Row: {
          id: string
          user_id: string
          date: string
          sleep_start: string | null
          sleep_end: string | null
          breakfast: boolean
          lunch: boolean
          dinner: boolean
          cipralex_taken: boolean
          hygiene_done: boolean
          movement_done: boolean
          ground_maintenance_done: boolean
          ground_build_done: boolean
          note: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          sleep_start?: string | null
          sleep_end?: string | null
          breakfast?: boolean
          lunch?: boolean
          dinner?: boolean
          cipralex_taken?: boolean
          hygiene_done?: boolean
          movement_done?: boolean
          ground_maintenance_done?: boolean
          ground_build_done?: boolean
          note?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          sleep_start?: string | null
          sleep_end?: string | null
          breakfast?: boolean
          lunch?: boolean
          dinner?: boolean
          cipralex_taken?: boolean
          hygiene_done?: boolean
          movement_done?: boolean
          ground_maintenance_done?: boolean
          ground_build_done?: boolean
          note?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ground_projects: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status?: string
          start_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: string
          start_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_signals: {
        Row: {
          id: string
          user_id: string
          week_start: string
          financial_note: string
          sleep_state: string
          note: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          financial_note?: string
          sleep_state?: string
          note?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          financial_note?: string
          sleep_state?: string
          note?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
