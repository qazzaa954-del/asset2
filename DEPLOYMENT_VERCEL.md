# Panduan Deployment ke Vercel (Free Tier)

## ✅ Apakah Sistem Ini Cocok untuk Vercel Free?

**YA, sistem ini sangat cocok untuk Vercel Free Tier!** Berikut analisisnya:

### ✅ Kelebihan Vercel Free untuk Sistem Ini:

1. **Next.js 14 Support** ✅
   - Vercel dibuat khusus untuk Next.js
   - Build time cepat dan optimasi otomatis

2. **Ukuran Project** ✅
   - Project ini relatif kecil (~50-100 MB)
   - Tidak ada masalah dengan limit Vercel

3. **Bandwidth** ✅
   - 100 GB/bulan cukup untuk:
     - ~10,000-50,000 page views/bulan
     - Cocok untuk aplikasi internal perusahaan kecil-menengah

4. **File Upload** ✅
   - Limit 4.5 MB per request
   - Foto asset disimpan di Supabase Storage (bukan Vercel)
   - Tidak masalah!

### ⚠️ Batasan yang Perlu Diperhatikan:

1. **Build Time**: 45 menit/bulan
   - Build pertama: ~2-5 menit
   - Setiap update: ~1-3 menit
   - **Cukup untuk ~15-30 deployments/bulan**

2. **Function Execution**: 100 GB-hours/bulan
   - Untuk aplikasi ini, sangat cukup
   - Hanya digunakan untuk API routes (jika ada)

3. **Bandwidth**: 100 GB/bulan
   - Jika traffic tinggi, bisa upgrade ke Pro ($20/bulan)

---

## 📋 Langkah-langkah Deployment ke Vercel

### 1. Persiapan

#### 1.1. Pastikan Project Siap

```bash
# Test build lokal dulu
npm run build

# Jika berhasil, lanjut ke deployment
```

#### 1.2. Siapkan Environment Variables

Buat file `.env.local` dengan isi:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**JANGAN commit file `.env.local` ke Git!**

### 2. Deploy via Vercel Dashboard

#### 2.1. Buat Akun Vercel

1. Kunjungi https://vercel.com
2. Sign up dengan GitHub/GitLab/Bitbucket (gratis)
3. Verifikasi email

#### 2.2. Import Project

1. Klik **"Add New Project"**
2. Pilih repository GitHub Anda (atau upload ZIP)
3. Vercel akan auto-detect Next.js

#### 2.3. Konfigurasi Build Settings

Vercel akan auto-detect, tapi pastikan:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (root project)
- **Build Command**: `npm run build` (auto)
- **Output Directory**: `.next` (auto)
- **Install Command**: `npm install` (auto)

#### 2.4. Setup Environment Variables

1. Di halaman project settings, klik **"Environment Variables"**
2. Tambahkan variables berikut:

```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key
```

3. Pilih environment: **Production, Preview, Development** (semua)
4. Klik **"Save"**

#### 2.5. Deploy!

1. Klik **"Deploy"**
2. Tunggu build selesai (~2-5 menit)
3. Setelah selesai, dapat URL: `https://your-project.vercel.app`

### 3. Deploy via Vercel CLI (Alternatif)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy ke production
vercel --prod
```

### 4. Setup Custom Domain (Opsional)

1. Di Vercel Dashboard > Project Settings > Domains
2. Tambahkan domain Anda
3. Ikuti instruksi untuk setup DNS

---

## 🔧 Konfigurasi Tambahan

### 1. Optimize Build

Vercel akan otomatis:
- ✅ Code splitting
- ✅ Image optimization
- ✅ Static generation
- ✅ Edge caching

### 2. Monitoring

Vercel menyediakan:
- Analytics (free tier terbatas)
- Logs untuk debugging
- Performance metrics

### 3. Auto Deploy dari Git

Setelah connect ke GitHub:
- Setiap push ke `main` → auto deploy production
- Setiap pull request → preview deployment

---

## 📊 Estimasi Penggunaan Free Tier

### Untuk Aplikasi Internal (10-50 users):

- **Bandwidth**: ~5-10 GB/bulan ✅
- **Build Time**: ~10-15 menit/bulan ✅
- **Function Execution**: ~5-10 GB-hours/bulan ✅

**Kesimpulan: SANGAT CUKUP!**

### Jika Traffic Tinggi (100+ users):

- **Bandwidth**: Mungkin perlu upgrade ke Pro ($20/bulan)
- **Build Time**: Masih cukup
- **Function Execution**: Masih cukup

---

## 🚨 Troubleshooting

### Error: "Build Failed"

**Penyebab**: Environment variables belum di-set

**Solusi**:
1. Pastikan semua env variables sudah di-set di Vercel Dashboard
2. Re-deploy setelah set env variables

### Error: "Module not found"

**Penyebab**: Dependencies tidak terinstall

**Solusi**:
1. Pastikan `package.json` lengkap
2. Vercel akan auto-run `npm install`

### Error: "Supabase connection failed"

**Penyebab**: Environment variables salah atau belum di-set

**Solusi**:
1. Double-check `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Pastikan Supabase project masih aktif
3. Cek Supabase Dashboard > Settings > API

---

## ✅ Checklist Deployment

- [ ] Project build berhasil di lokal (`npm run build`)
- [ ] Environment variables sudah disiapkan
- [ ] Akun Vercel sudah dibuat
- [ ] Project sudah di-import ke Vercel
- [ ] Environment variables sudah di-set di Vercel
- [ ] Deploy berhasil
- [ ] Test aplikasi di production URL
- [ ] Test login dan akses data
- [ ] Test upload foto (jika ada)

---

## 💡 Tips Optimasi

1. **Enable Image Optimization**:
   - Vercel otomatis optimize images
   - Gunakan Next.js `<Image>` component (sudah digunakan)

2. **Enable Caching**:
   - Vercel otomatis cache static assets
   - API responses bisa di-cache jika perlu

3. **Monitor Usage**:
   - Cek Vercel Dashboard > Analytics
   - Pantau bandwidth dan build time

---

## 📈 Upgrade ke Pro (Jika Perlu)

Jika traffic tinggi atau butuh fitur lebih:

- **Pro Plan**: $20/bulan
  - Unlimited bandwidth
  - 1000 build minutes/bulan
  - Advanced analytics
  - Priority support

**Untuk aplikasi internal kecil-menengah, Free Tier sudah sangat cukup!**

