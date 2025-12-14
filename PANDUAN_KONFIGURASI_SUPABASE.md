# Panduan Konfigurasi Supabase - Step by Step

Panduan lengkap untuk mengkonfigurasi Supabase untuk aplikasi Asset Damar Langit.

---

## 📋 Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Membuat Project Supabase](#2-membuat-project-supabase)
3. [Setup Database Schema](#3-setup-database-schema)
4. [Setup Storage Buckets](#4-setup-storage-buckets)
5. [Setup Authentication](#5-setup-authentication)
6. [Membuat User Master Admin](#6-membuat-user-master-admin)
7. [Konfigurasi Environment Variables](#7-konfigurasi-environment-variables)
8. [Verifikasi Konfigurasi](#8-verifikasi-konfigurasi)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Persiapan Awal

### 1.1 Pastikan Dependencies Terinstall

Pastikan semua package Supabase sudah terinstall di project Anda:

```bash
npm install
```

Dependencies yang diperlukan sudah ada di `package.json`:
- `@supabase/supabase-js`
- `@supabase/auth-helpers-nextjs`
- `@supabase/auth-helpers-react`

### 1.2 Siapkan Informasi yang Diperlukan

Sebelum mulai, siapkan:
- Email untuk akun Supabase (jika belum punya)
- Password untuk database (buat yang kuat, minimal 12 karakter)
- Email untuk Master Admin (contoh: `admin@damarlangit.com`)

---

## 2. Membuat Project Supabase

### Langkah 2.1: Akses Website Supabase

1. Buka browser dan kunjungi: **https://supabase.com**
2. Klik tombol **"Start your project"** atau **"Sign In"** di pojok kanan atas

### Langkah 2.2: Buat Akun (Jika Belum Punya)

1. Jika belum punya akun, klik **"Sign Up"**
2. Pilih metode sign up:
   - **GitHub** (disarankan untuk developer)
   - **Email** (jika tidak punya GitHub)
3. Ikuti proses registrasi sampai selesai
4. Verifikasi email jika diminta

### Langkah 2.3: Buat Project Baru

1. Setelah login, Anda akan masuk ke **Dashboard**
2. Klik tombol **"New Project"** (biasanya di pojok kanan atas atau tengah halaman)
3. Isi form dengan detail berikut:

   **Organization:**
   - Pilih organization yang sudah ada, atau
   - Buat organization baru dengan nama: `Damar Langit` (atau sesuai kebutuhan)

   **Project Details:**
   - **Name**: `asset-damar-langit` (atau nama sesuai keinginan)
   - **Database Password**: 
     - Buat password yang kuat (minimal 12 karakter)
     - **PENTING**: Simpan password ini di tempat aman! Anda akan membutuhkannya nanti
     - Contoh: `MySecurePass123!@#`
   - **Region**: 
     - Pilih region yang terdekat dengan lokasi Anda
     - Untuk Indonesia, pilih: **Southeast Asia (Singapore)** atau **Southeast Asia (Mumbai)**
   - **Pricing Plan**: 
     - Pilih **Free** untuk development/testing
     - Atau **Pro** untuk production

4. Klik **"Create new project"**
5. Tunggu proses pembuatan project (biasanya 1-2 menit)

### Langkah 2.4: Tunggu Project Siap

- Supabase akan membuat database, API, dan storage untuk project Anda
- Status akan berubah dari "Setting up" menjadi "Active" ketika selesai
- Jangan tutup halaman ini, tunggu sampai selesai

---

## 3. Setup Database Schema

### Langkah 3.1: Buka SQL Editor

1. Di dashboard project, klik menu **"SQL Editor"** di sidebar kiri
2. Klik tombol **"New query"** untuk membuat query baru

### Langkah 3.2: Jalankan Migration Schema

1. Buka file `supabase/migrations/001_initial_schema.sql` di project Anda
2. **Copy seluruh isi file** tersebut
3. Paste ke SQL Editor di Supabase Dashboard
4. Klik tombol **"Run"** (atau tekan `Ctrl+Enter` / `Cmd+Enter`)

### Langkah 3.3: Verifikasi Tabel Berhasil Dibuat

1. Klik menu **"Table Editor"** di sidebar kiri
2. Pastikan tabel-tabel berikut sudah muncul:
   - ✅ `departments`
   - ✅ `users`
   - ✅ `assets`
   - ✅ `audits`
   - ✅ `maintenance_logs`
   - ✅ `work_orders`
   - ✅ `depreciation_methods`

3. Klik salah satu tabel (misalnya `departments`) untuk melihat strukturnya
4. Pastikan kolom-kolom sudah sesuai dengan yang diharapkan

### Langkah 3.4: Verifikasi Data Initial

1. Klik tabel `departments`
2. Pastikan ada 11 department yang sudah ter-insert:
   - FBS, FBP, HK, HR, FIN, SM, SEC, IT, RA, FO, GAR
3. Klik tabel `depreciation_methods`
4. Pastikan ada 1 metode depresiasi (Straight-Line)

---

## 4. Setup Storage Buckets

Storage digunakan untuk menyimpan foto asset dan work order.

### Langkah 4.1: Buka Storage Settings

1. Di dashboard, klik menu **"Storage"** di sidebar kiri
2. Klik tombol **"New bucket"** atau **"Create bucket"**

### Langkah 4.2: Buat Bucket untuk Asset Photos

1. Klik **"New bucket"**
2. Isi form:
   - **Name**: `asset-photos`
   - **Public bucket**: **✅ YES** (centang ini!)
     - Penting: Bucket harus public agar foto bisa diakses dari aplikasi
   - **File size limit**: `5242880` (5MB dalam bytes)
     - Atau sesuaikan dengan kebutuhan Anda
   - **Allowed MIME types**: (biarkan kosong untuk semua jenis file)
     - Atau isi: `image/jpeg,image/png,image/webp` jika ingin hanya gambar
3. Klik **"Create bucket"**

### Langkah 4.3: Buat Bucket untuk Work Order Photos

1. Klik **"New bucket"** lagi
2. Isi form:
   - **Name**: `work-order-photos`
   - **Public bucket**: **✅ YES** (centang ini!)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: (biarkan kosong atau isi seperti di atas)
3. Klik **"Create bucket"**

### Langkah 4.4: Verifikasi Buckets

1. Di halaman Storage, pastikan kedua bucket sudah muncul:
   - ✅ `asset-photos` (Public)
   - ✅ `work-order-photos` (Public)

### Langkah 4.5: Setup Storage Policies (Opsional)

Jika perlu, Anda bisa setup policies untuk akses storage:

1. Klik bucket `asset-photos`
2. Klik tab **"Policies"**
3. Untuk bucket public, biasanya sudah otomatis bisa diakses
4. Jika perlu, buat policy untuk upload:
   - Klik **"New policy"**
   - Pilih template: **"Allow authenticated users to upload"**
   - Atau buat custom policy sesuai kebutuhan

---

## 5. Setup Authentication

### Langkah 5.1: Buka Authentication Settings

1. Di dashboard, klik menu **"Authentication"** di sidebar kiri
2. Klik submenu **"Providers"** atau **"Settings"**

### Langkah 5.2: Enable Email Provider

1. Pastikan **"Email"** provider sudah **enabled** (default sudah enabled)
2. Jika belum, klik toggle untuk enable

### Langkah 5.3: Konfigurasi Email Settings

1. Klik tab **"Settings"** di Authentication
2. Scroll ke bagian **"Email Auth"**
3. Konfigurasi berikut (untuk development):
   - **Enable email confirmations**: 
     - ✅ **DISABLE** (untuk development, agar bisa langsung login)
     - Atau ✅ **ENABLE** (untuk production, user harus konfirmasi email dulu)
   - **Secure email change**: Sesuaikan kebutuhan
   - **Double confirm email changes**: Sesuaikan kebutuhan

### Langkah 5.4: Setup Email Templates (Opsional)

1. Klik tab **"Email Templates"**
2. Anda bisa customize template email untuk:
   - Confirm signup
   - Magic link
   - Change email address
   - Reset password
3. Untuk sekarang, biarkan default dulu

---

## 6. Membuat User Master Admin

### Langkah 6.1: Buat User di Authentication

1. Klik menu **"Authentication"** > **"Users"**
2. Klik tombol **"Add user"** > **"Create new user"**
3. Isi form:
   - **Email**: `admin@damarlangit.com` (atau email yang Anda inginkan)
   - **Password**: Buat password yang kuat
     - Minimal 8 karakter
     - Disarankan: kombinasi huruf besar, huruf kecil, angka, dan simbol
     - Contoh: `Admin123!@#`
   - **Auto Confirm User**: **✅ YES** (centang ini!)
     - Penting: Ini memastikan user langsung aktif tanpa perlu konfirmasi email
   - **Send invitation email**: (opsional, bisa dicentang atau tidak)
4. Klik **"Create user"**

### Langkah 6.2: Copy User ID

1. Setelah user dibuat, Anda akan melihat daftar users
2. Klik user yang baru dibuat (`admin@damarlangit.com`)
3. **Copy User ID** (UUID yang panjang, contoh: `123e4567-e89b-12d3-a456-426614174000`)
   - User ID ini ada di bagian atas halaman detail user
   - Simpan ID ini, Anda akan membutuhkannya di langkah berikutnya

### Langkah 6.3: Insert User ke Tabel users

1. Klik menu **"SQL Editor"**
2. Klik **"New query"**
3. Jalankan query berikut (ganti `USER_ID` dengan ID yang Anda copy di langkah sebelumnya):

```sql
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'USER_ID_DARI_LANGKAH_SEBELUMNYA',
  'admin@damarlangit.com',
  'Master Admin',
  'Master Admin',
  true
);
```

**Contoh query yang sudah diisi:**
```sql
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'admin@damarlangit.com',
  'Master Admin',
  'Master Admin',
  true
);
```

4. Klik **"Run"** untuk menjalankan query
5. Pastikan muncul pesan sukses: "Success. No rows returned"

### Langkah 6.4: Verifikasi User

1. Klik menu **"Table Editor"**
2. Klik tabel **"users"**
3. Pastikan ada 1 row dengan:
   - Email: `admin@damarlangit.com`
   - Role: `Master Admin`
   - Is Active: `true`

---

## 7. Konfigurasi Environment Variables

### Langkah 7.1: Buka Project Settings

1. Di dashboard, klik ikon **⚙️ Settings** (biasanya di sidebar kiri bawah)
2. Klik **"API"** di menu Settings

### Langkah 7.2: Copy API Keys

Di halaman API, Anda akan melihat beberapa informasi penting:

1. **Project URL**:
   - Format: `https://xxxxxxxxxxxxx.supabase.co`
   - Klik ikon copy untuk copy URL ini
   - Simpan untuk digunakan sebagai `NEXT_PUBLIC_SUPABASE_URL`

2. **anon/public key**:
   - Ini adalah key yang aman untuk digunakan di client-side
   - Klik ikon copy untuk copy key ini
   - Simpan untuk digunakan sebagai `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **service_role key** (opsional, untuk scripts):
   - ⚠️ **PENTING**: Key ini memiliki akses penuh, jangan expose di client-side!
   - Hanya digunakan untuk server-side scripts
   - Klik "Reveal" untuk melihat key, lalu copy
   - Simpan untuk digunakan sebagai `SUPABASE_SERVICE_ROLE_KEY`

### Langkah 7.3: Buat File .env.local

1. Di root project Anda (folder `asset-new`), buat file baru dengan nama: `.env.local`
   - **Catatan**: File ini biasanya tidak terlihat di file explorer karena diawali dengan titik (.)
   - Di VS Code, Anda bisa membuat file dengan nama `.env.local`

2. Buka file `.env.local` dan isi dengan format berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx

# Service Role Key (untuk scripts, jangan expose di client!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx
```

3. **Ganti nilai-nilai** dengan yang Anda copy dari Supabase Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`: Paste Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Paste anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Paste service_role key (jika diperlukan)

4. **Simpan file** (Ctrl+S atau Cmd+S)

### Langkah 7.4: Verifikasi File .env.local

1. Pastikan file `.env.local` ada di root project
2. Pastikan file `.gitignore` sudah include `.env.local` (untuk keamanan)
3. Buka file `.gitignore` dan pastikan ada baris:
   ```
   .env.local
   .env*.local
   ```

### Langkah 7.5: Restart Development Server

Jika development server sedang berjalan:

1. Hentikan server (tekan `Ctrl+C` di terminal)
2. Start ulang dengan:
   ```bash
   npm run dev
   ```

**Penting**: Environment variables hanya dimuat saat server start, jadi harus restart setelah membuat/mengubah `.env.local`.

---

## 8. Verifikasi Konfigurasi

### Langkah 8.1: Test Koneksi Database

1. Buka terminal di project Anda
2. Pastikan development server berjalan:
   ```bash
   npm run dev
   ```
3. Buka browser ke: `http://localhost:3000`
4. Jika tidak ada error, berarti koneksi berhasil

### Langkah 8.2: Test Login

1. Buka halaman login: `http://localhost:3000/login`
2. Masukkan:
   - **Email**: `admin@damarlangit.com`
   - **Password**: Password yang Anda buat di Langkah 6.1
3. Klik **"Login"**
4. Jika berhasil, Anda akan di-redirect ke dashboard

### Langkah 8.3: Test Akses Data

Setelah login, coba akses beberapa fitur:

1. **Dashboard**: Pastikan bisa melihat dashboard
2. **Assets**: Pastikan bisa melihat daftar assets (meskipun masih kosong)
3. **Departments**: Pastikan bisa melihat daftar departments (harusnya ada 11 department)

### Langkah 8.4: Test Storage (Opsional)

Jika aplikasi sudah memiliki fitur upload foto:

1. Coba upload foto asset
2. Pastikan foto tersimpan di bucket `asset-photos`
3. Verifikasi di Supabase Dashboard > Storage > `asset-photos`

---

## 9. Troubleshooting

### Error: "Invalid API key" atau "Invalid JWT"

**Penyebab**: Environment variables salah atau belum di-set

**Solusi**:
1. Pastikan file `.env.local` ada di root project
2. Pastikan nilai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar
3. Copy ulang dari Supabase Dashboard > Settings > API
4. Restart development server (`npm run dev`)

### Error: "relation does not exist" atau "table does not exist"

**Penyebab**: Migration SQL belum dijalankan

**Solusi**:
1. Buka Supabase Dashboard > SQL Editor
2. Jalankan ulang file `supabase/migrations/001_initial_schema.sql`
3. Verifikasi di Table Editor bahwa semua tabel sudah ada

### Error: "permission denied" atau "new row violates row-level security policy"

**Penyebab**: RLS (Row Level Security) policies belum dibuat atau user tidak memiliki permission

**Solusi**:
1. Pastikan migration SQL sudah dijalankan (termasuk bagian RLS policies)
2. Pastikan user sudah di-insert ke tabel `users` dengan role yang sesuai
3. Pastikan user sudah login dengan benar
4. Cek di Supabase Dashboard > Authentication > Users, pastikan user aktif

### Error: "storage bucket not found"

**Penyebab**: Bucket belum dibuat atau nama bucket salah

**Solusi**:
1. Buka Supabase Dashboard > Storage
2. Pastikan bucket `asset-photos` dan `work-order-photos` sudah dibuat
3. Pastikan bucket adalah **Public**
4. Cek nama bucket di kode aplikasi, pastikan sesuai

### Error: "email not confirmed" atau tidak bisa login

**Penyebab**: Email confirmation di-enable tapi user belum konfirmasi

**Solusi**:
1. Buka Supabase Dashboard > Authentication > Settings
2. Disable **"Enable email confirmations"** (untuk development)
3. Atau pastikan user dibuat dengan **"Auto Confirm User"** = YES
4. Atau cek email inbox untuk link konfirmasi

### Error: "Cannot read properties of undefined" di console browser

**Penyebab**: Supabase client belum ter-initialize dengan benar

**Solusi**:
1. Pastikan file `lib/supabase/client.ts` sudah benar
2. Pastikan environment variables sudah di-set
3. Cek di browser console (F12) untuk error detail
4. Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah di-set

### Error saat menjalankan seed data script

**Penyebab**: Service role key belum di-set atau salah

**Solusi**:
1. Pastikan `SUPABASE_SERVICE_ROLE_KEY` ada di `.env.local`
2. Copy service_role key dari Supabase Dashboard > Settings > API
3. Pastikan script menggunakan service_role key, bukan anon key

---

## ✅ Checklist Konfigurasi

Gunakan checklist ini untuk memastikan semua langkah sudah selesai:

- [ ] Project Supabase sudah dibuat
- [ ] Database schema sudah dijalankan (migration SQL)
- [ ] Semua tabel sudah ter-verifikasi ada
- [ ] Bucket `asset-photos` sudah dibuat (Public)
- [ ] Bucket `work-order-photos` sudah dibuat (Public)
- [ ] Email provider sudah enabled
- [ ] User Master Admin sudah dibuat di Authentication
- [ ] User Master Admin sudah di-insert ke tabel `users`
- [ ] File `.env.local` sudah dibuat
- [ ] `NEXT_PUBLIC_SUPABASE_URL` sudah di-set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah di-set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` sudah di-set (jika diperlukan)
- [ ] Development server sudah di-restart
- [ ] Login berhasil dengan user Master Admin
- [ ] Dashboard bisa diakses
- [ ] Data departments bisa dilihat

---

## 📚 Referensi Tambahan

- **Supabase Documentation**: https://supabase.com/docs
- **Next.js + Supabase Guide**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Storage Guide**: https://supabase.com/docs/guides/storage

---

## 🎉 Selesai!

Jika semua checklist sudah dicentang, berarti konfigurasi Supabase Anda sudah selesai dan siap digunakan!

Jika ada pertanyaan atau masalah, silakan cek bagian Troubleshooting di atas atau dokumentasi Supabase.

---

**Catatan Penting**:
- Jangan commit file `.env.local` ke Git (sudah di-ignore)
- Simpan semua credentials dengan aman
- Untuk production, gunakan environment variables di hosting platform (Vercel, Netlify, dll)
- Service role key hanya untuk server-side, jangan expose di client-side!


