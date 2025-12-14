# Setup Supabase untuk Asset-Damar-Langit

## 1. Buat Project Supabase

1. Kunjungi https://supabase.com
2. Buat akun atau login
3. Klik "New Project"
4. Isi detail project:
   - Name: asset-damar-langit
   - Database Password: (simpan password ini!)
   - Region: pilih yang terdekat

## 2. Setup Database

1. Buka SQL Editor di Supabase Dashboard
2. Jalankan script dari `supabase/migrations/001_initial_schema.sql`
3. Pastikan semua tabel dan policies berhasil dibuat

## 3. Setup Storage

1. Buka Storage di Supabase Dashboard
2. Buat bucket baru dengan nama: `asset-photos`
   - Public bucket: **YES** (untuk akses foto)
   - File size limit: 5MB (atau sesuai kebutuhan)
3. Buat bucket baru dengan nama: `work-order-photos`
   - Public bucket: **YES**
   - File size limit: 5MB

## 4. Setup Authentication

1. Buka Authentication > Settings
2. Enable Email provider
3. Disable "Confirm email" jika ingin langsung login (untuk development)

## 5. Buat User Master Admin

### Via Supabase Dashboard:

1. Buka Authentication > Users
2. Klik "Add user" > "Create new user"
3. Isi:
   - Email: admin@damarlangit.com
   - Password: (buat password kuat)
   - Auto Confirm User: **YES**
4. Copy User ID yang baru dibuat

### Setup User di Tabel users:

1. Buka SQL Editor
2. Jalankan query berikut (ganti USER_ID dengan ID dari langkah sebelumnya):

```sql
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'USER_ID',
  'admin@damarlangit.com',
  'Master Admin',
  'Master Admin',
  true
);
```

## 6. Setup Environment Variables

1. Buka Project Settings > API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (untuk scripts)

3. Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 7. Seed Sample Data (Optional)

Setelah setup selesai, jalankan script untuk mengisi data contoh:

```bash
npx ts-node scripts/seed-sample-data.ts
```

## 8. Test Login

1. Start development server: `npm run dev`
2. Buka http://localhost:3000
3. Login dengan email dan password Master Admin yang sudah dibuat

## Troubleshooting

### Error: "relation does not exist"
- Pastikan migration SQL sudah dijalankan
- Cek apakah semua tabel sudah dibuat di Database > Tables

### Error: "storage bucket not found"
- Pastikan bucket `asset-photos` dan `work-order-photos` sudah dibuat
- Cek bucket permissions (harus public untuk akses foto)

### Error: "permission denied"
- Pastikan RLS policies sudah dibuat
- Cek role user di tabel `users`

### Error: "invalid JWT"
- Pastikan environment variables sudah benar
- Restart development server setelah mengubah `.env.local`

