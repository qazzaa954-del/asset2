import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Use single instance to avoid multiple GoTrueClient instances warning
// createClientComponentClient handles cookies automatically and is recommended for Next.js
// Use global variable to ensure single instance across all module loads
declare global {
  var __supabaseClient: ReturnType<typeof createClientComponentClient> | undefined
}

// Create singleton instance - reuse if exists (important for hot reload in development)
if (!global.__supabaseClient) {
  global.__supabaseClient = createClientComponentClient()
}

export const supabase = global.__supabaseClient

// Alias for backward compatibility
export const supabaseClient = supabase

