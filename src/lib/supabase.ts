import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface MasterProduct {
  product_id: string
  model_name: string
  description: string | null
  image_url: string | null
  warranty_period_months: number
  standard_service_interval_months: number
  created_at: string
  updated_at: string
}

export interface UserProduct {
  id: string
  user_id: string
  master_product_id: string
  purchase_date: string
  serial_number: string | null
  amc_valid_until: string | null
  created_at: string
  updated_at: string
  master_product?: MasterProduct
}

export interface Service {
  id: string
  user_product_id: string
  service_date: string | null
  next_service_due_date: string | null
  status: 'Upcoming' | 'Due Soon' | 'Overdue' | 'Completed'
  notification_sent: boolean
  notes: string | null
  created_at: string
  updated_at: string
  user_product?: UserProduct
}

export interface AdminUser {
  id: string
  role: 'admin' | 'super_admin'
  created_at: string
}