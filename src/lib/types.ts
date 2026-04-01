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
          breakfast: boolean | null
          lunch: boolean | null
          dinner: boolean | null
          cipralex_taken: boolean | null
          hygiene_done: boolean | null
          movement_done: boolean | null
          ground_maintenance_done: boolean | null
          ground_build_done: boolean | null
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
          breakfast?: boolean | null
          lunch?: boolean | null
          dinner?: boolean | null
          cipralex_taken?: boolean | null
          hygiene_done?: boolean | null
          movement_done?: boolean | null
          ground_maintenance_done?: boolean | null
          ground_build_done?: boolean | null
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
          breakfast?: boolean | null
          lunch?: boolean | null
          dinner?: boolean | null
          cipralex_taken?: boolean | null
          hygiene_done?: boolean | null
          movement_done?: boolean | null
          ground_maintenance_done?: boolean | null
          ground_build_done?: boolean | null
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
