import { createBrowserClient } from '@supabase/ssr'

// Use single instance to avoid multiple GoTrueClient instances warning
// createBrowserClient handles cookies automatically and is recommended for Next.js
// Use global variable to ensure single instance across all module loads
declare global {
  var __supabaseClient: ReturnType<typeof createBrowserClient> | undefined
}

// Create singleton instance - reuse if exists (important for hot reload in development)
if (!global.__supabaseClient) {
  global.__supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = global.__supabaseClient

// Alias for backward compatibility
export const supabaseClient = supabase

