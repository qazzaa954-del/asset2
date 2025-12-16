import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Use single instance to avoid multiple GoTrueClient instances warning
// createClientComponentClient handles cookies automatically and is recommended for Next.js
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
})()

// Alias for backward compatibility
export const supabaseClient = supabase

