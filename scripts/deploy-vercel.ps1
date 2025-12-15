# Script PowerShell untuk deploy ke Vercel
# Usage: .\scripts\deploy-vercel.ps1

Write-Host "🚀 Starting Vercel Deployment..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm i -g vercel
}

# Check if user is logged in
try {
    vercel whoami | Out-Null
} catch {
    Write-Host "🔐 Please login to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Check environment variables
Write-Host "📋 Checking environment variables..." -ForegroundColor Cyan
if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Host "⚠️  NEXT_PUBLIC_SUPABASE_URL not set. Please set it in Vercel Dashboard" -ForegroundColor Yellow
}

if (-not $env:NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    Write-Host "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set. Please set it in Vercel Dashboard" -ForegroundColor Yellow
}

# Build check
Write-Host "🔨 Testing build locally..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Deploy
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
$deployProd = Read-Host "Deploy to production? (y/n)"
if ($deployProd -eq "y" -or $deployProd -eq "Y") {
    vercel --prod
} else {
    vercel
}

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📊 Check your deployment at: https://vercel.com/dashboard" -ForegroundColor Cyan
