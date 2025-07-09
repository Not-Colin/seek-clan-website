// lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// --- TEMPORARY DIAGNOSTIC LOGS ---
console.log('Vercel Build: NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET');
console.log('Vercel Build: NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'NOT SET');
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Vercel Build: Supabase URL or Anon Key is UNDEFINED or EMPTY!');
}
// --- END TEMPORARY DIAGNOSTIC LOGS ---

export const supabase = createClient(supabaseUrl, supabaseAnonKey)