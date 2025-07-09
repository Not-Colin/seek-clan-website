// lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// IMPORTANT: Removed the temporary console.log statements

export const supabase = createClient(supabaseUrl, supabaseAnonKey)