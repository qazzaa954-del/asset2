#!/bin/bash

# Script untuk deploy ke Vercel
# Usage: ./scripts/deploy-vercel.sh

echo "🚀 Starting Vercel Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Check environment variables
echo "📋 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set. Please set it in Vercel Dashboard or use: vercel env add NEXT_PUBLIC_SUPABASE_URL"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set. Please set it in Vercel Dashboard or use: vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
fi

# Build check
echo "🔨 Testing build locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy
echo "🚀 Deploying to Vercel..."
read -p "Deploy to production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
else
    vercel
fi

echo "✅ Deployment complete!"
echo "📊 Check your deployment at: https://vercel.com/dashboard"
