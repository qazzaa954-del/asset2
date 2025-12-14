export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          code: string
          name: string
          initial_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          initial_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          initial_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          asset_name: string
          asset_code: string
          location: string
          department_id: string
          unit: string
          acquisition_year: number
          acquisition_price: number
          estimated_lifespan: number
          condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat'
          status: 'Aktif' | 'Disposal' | 'Repair'
          category: 'Room' | 'Public Area' | 'Office'
          photo_url: string | null
          barcode: string | null
          book_value: number
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          asset_name: string
          asset_code: string
          location: string
          department_id: string
          unit: string
          acquisition_year: number
          acquisition_price: number
          estimated_lifespan: number
          condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat'
          status: 'Aktif' | 'Disposal' | 'Repair'
          category: 'Room' | 'Public Area' | 'Office'
          photo_url?: string | null
          barcode?: string | null
          book_value?: number
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          asset_name?: string
          asset_code?: string
          location?: string
          department_id?: string
          unit?: string
          acquisition_year?: number
          acquisition_price?: number
          estimated_lifespan?: number
          condition?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat'
          status?: 'Aktif' | 'Disposal' | 'Repair'
          category?: 'Room' | 'Public Area' | 'Office'
          photo_url?: string | null
          barcode?: string | null
          book_value?: number
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      audits: {
        Row: {
          id: string
          asset_id: string
          audit_date: string
          auditor: string
          findings: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          audit_date: string
          auditor: string
          findings?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          audit_date?: string
          auditor?: string
          findings?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      maintenance_logs: {
        Row: {
          id: string
          asset_id: string
          maintenance_date: string
          maintenance_type: string
          cost: number
          vendor: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          maintenance_date: string
          maintenance_type: string
          cost: number
          vendor?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          maintenance_date?: string
          maintenance_type?: string
          cost?: number
          vendor?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          asset_id: string
          reported_by: string
          reported_date: string
          description: string
          photo_before: string | null
          photo_after: string | null
          status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
          assigned_to: string | null
          completed_date: string | null
          notes: string | null
          is_scheduled: boolean
          scheduled_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          reported_by: string
          reported_date: string
          description: string
          photo_before?: string | null
          photo_after?: string | null
          status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
          assigned_to?: string | null
          completed_date?: string | null
          notes?: string | null
          is_scheduled?: boolean
          scheduled_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          reported_by?: string
          reported_date?: string
          description?: string
          photo_before?: string | null
          photo_after?: string | null
          status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
          assigned_to?: string | null
          completed_date?: string | null
          notes?: string | null
          is_scheduled?: boolean
          scheduled_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      depreciation_methods: {
        Row: {
          id: string
          name: string
          formula: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          formula: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          formula?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'Master Admin' | 'Engineering' | 'IT' | 'User'
          department_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'Master Admin' | 'Engineering' | 'IT' | 'User'
          department_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'Master Admin' | 'Engineering' | 'IT' | 'User'
          department_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

