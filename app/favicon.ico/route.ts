import { NextResponse } from 'next/server'

// Redirect favicon.ico requests to icon.svg
export async function GET() {
  return NextResponse.redirect(new URL('/icon.svg', process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'), 301)
}

