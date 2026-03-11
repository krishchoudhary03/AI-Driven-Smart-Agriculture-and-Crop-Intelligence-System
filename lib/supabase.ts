import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Avoid crashing during static build when env vars are not yet available
export const supabase: SupabaseClient = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        if (prop === 'auth') {
          return {
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            signOut: async () => ({ error: null }),
          }
        }
        if (prop === 'from') {
          return () => ({
            select: () => ({ data: [], error: null, eq: () => ({ data: [], error: null }) }),
            insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          })
        }
        return () => {}
      },
    }))