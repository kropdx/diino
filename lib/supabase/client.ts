import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Enable verbose Supabase client logs only when explicitly toggled.
          debug: process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true'
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-client-info': 'diino-web'
          }
        }
      }
    )
  }
  return supabaseClient
}

// Export a singleton client instance for direct import in components.
export const supabase = createClient()