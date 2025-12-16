import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Redirect favicon.ico requests to icon.svg
export async function GET(request: NextRequest) {
  const url = new URL('/icon.svg', request.url)
  return NextResponse.redirect(url, 301)
}

