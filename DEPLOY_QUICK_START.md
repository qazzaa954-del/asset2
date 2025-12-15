# 🚀 Quick Start: Deploy ke Vercel

Panduan cepat untuk deploy sistem Asset-Damar-Langit ke Vercel dalam 5 menit!

---

## 📋 Prerequisites

- ✅ Akun Vercel (gratis) - https://vercel.com
- ✅ Akun Supabase (gratis) - https://supabase.com
- ✅ Project sudah di GitHub/GitLab/Bitbucket (opsional, bisa upload ZIP)

---

## 🎯 Metode 1: Deploy via Vercel Dashboard (Paling Mudah)

### Langkah 1: Siapkan Supabase

1. Buat project di https://supabase.com
2. Jalankan migration SQL dari `supabase/migrations/001_initial_schema.sql`
3. Buat storage buckets: `asset-photos` dan `work-order-photos`
4. Copy credentials:
   - Project URL
   - anon/public key
   - service_role key

### Langkah 2: Deploy ke Vercel

1. **Buka https://vercel.com** dan login
2. Klik **"Add New Project"**
3. **Pilih metode:**
   - **Option A**: Connect GitHub/GitLab → Pilih repository
   - **Option B**: Upload ZIP → Drag & drop folder project
4. **Konfigurasi Project:**
   - Framework: Next.js (auto-detect)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto)
   - Output Directory: `.next` (auto)
5. **Setup Environment Variables:**
   - Klik **"Environment Variables"**
   - Tambahkan 3 variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
     SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
     ```
   - Pilih environment: **Production, Preview, Development** (semua)
6. **Deploy!**
   - Klik **"Deploy"**
   - Tunggu build selesai (~2-5 menit)
   - Dapat URL: `https://your-project.vercel.app`

### Langkah 3: Test Aplikasi

1. Buka URL yang diberikan Vercel
2. Test login dengan kredensial Master Admin
3. Test fitur-fitur utama

**Selesai! 🎉**

---

## 🎯 Metode 2: Deploy via Vercel CLI

### Langkah 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Langkah 2: Login

```bash
vercel login
```

### Langkah 3: Deploy

```bash
# Deploy ke preview
vercel

# Deploy ke production
vercel --prod
```

### Langkah 4: Setup Environment Variables

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

Atau via Dashboard:
1. Buka Vercel Dashboard > Project > Settings > Environment Variables
2. Tambahkan variables seperti di Metode 1

---

## 🔧 Konfigurasi Tambahan

### 1. Custom Domain (Opsional)

1. Buka Vercel Dashboard > Project > Settings > Domains
2. Tambahkan domain Anda
3. Ikuti instruksi setup DNS

### 2. Auto Deploy dari Git

Setelah connect ke GitHub:
- Setiap push ke `main` → auto deploy production
- Setiap pull request → preview deployment

### 3. Environment Variables per Environment

Anda bisa set environment variables berbeda untuk:
- **Production**: URL production
- **Preview**: URL staging
- **Development**: URL development

---

## ✅ Checklist Deployment

- [ ] Supabase project sudah dibuat
- [ ] Migration SQL sudah dijalankan
- [ ] Storage buckets sudah dibuat
- [ ] Environment variables sudah disiapkan
- [ ] Project sudah di-deploy ke Vercel
- [ ] Environment variables sudah di-set di Vercel
- [ ] Build berhasil
- [ ] Aplikasi bisa diakses
- [ ] Login berhasil
- [ ] Data bisa di-load
- [ ] Upload foto berfungsi

---

## 🚨 Troubleshooting

### Build Failed

**Solusi:**
1. Cek environment variables sudah di-set
2. Cek build logs di Vercel Dashboard
3. Test build lokal: `npm run build`

### Supabase Connection Error

**Solusi:**
1. Double-check environment variables
2. Pastikan Supabase project masih aktif
3. Cek Supabase Dashboard > Settings > API

### Module Not Found

**Solusi:**
1. Pastikan `package.json` lengkap
2. Vercel akan auto-run `npm install`
3. Cek build logs untuk detail error

---

## 📊 Monitoring

Setelah deploy, monitor:
- **Vercel Dashboard**: Analytics, Logs, Performance
- **Supabase Dashboard**: Usage, Database size, API requests

---

## 🎉 Selesai!

Aplikasi Anda sekarang live di Vercel! 

**URL Production**: `https://your-project.vercel.app`

Untuk detail lengkap, lihat: [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)
