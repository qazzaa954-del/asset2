# Quick Fix: Profil User Tidak Ditemukan

## Masalah
Pesan "Profil User Tidak Ditemukan" muncul karena user belum terdaftar di tabel `users`.

## Solusi Cepat (Pilih Salah Satu)

### Opsi 1: Auto-Create untuk Semua User (RECOMMENDED)

Jalankan script ini di **Supabase Dashboard → SQL Editor**:

```sql
-- Buat user profile untuk semua user di auth.users yang belum ada
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT id, email FROM auth.users
    WHERE id NOT IN (SELECT id FROM users WHERE id IS NOT NULL)
  LOOP
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (
      auth_user.id,
      auth_user.email,
      split_part(auth_user.email, '@', 1),
      'User',
      true
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created user profile for: %', auth_user.email;
  END LOOP;
END $$;

-- Update user pertama menjadi Master Admin
UPDATE users
SET 
  role = 'Master Admin',
  full_name = 'Master Admin'
WHERE id = (SELECT id FROM users ORDER BY created_at LIMIT 1);
```

### Opsi 2: Insert Manual (Jika Opsi 1 Tidak Bekerja)

**Langkah 1:** Cek UUID user Anda
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

**Langkah 2:** Copy UUID dan insert manual
```sql
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'PASTE_UUID_DISINI',           -- Ganti dengan UUID dari langkah 1
  'email@damarlangit.com',       -- Ganti dengan email Anda
  'Master Admin',                 -- Nama Anda
  'Master Admin',                 -- Role
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = 'Master Admin',
  is_active = true;
```

### Opsi 3: Jalankan Migration Lengkap

Jalankan file `supabase/migrations/011_fix_auto_create_user_trigger.sql` di Supabase SQL Editor. Script ini akan:
- Membuat trigger untuk auto-create user profile
- Membuat user profile untuk semua user yang sudah ada
- Update user pertama menjadi Master Admin

## Verifikasi

Setelah menjalankan script, verifikasi dengan:

```sql
-- Cek apakah user sudah ada
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM users
WHERE email = 'email@damarlangit.com';  -- Ganti dengan email Anda
```

Pastikan:
- ✅ User ada di tabel `users`
- ✅ `role` = `'Master Admin'` (tanpa spasi)
- ✅ `is_active` = `true`

## Setelah Fix

1. **Refresh browser** (Ctrl+F5 atau Cmd+Shift+R)
2. **Buka browser console** (F12) dan cek log "User Profile loaded successfully"
3. **Coba akses halaman** yang memerlukan Master Admin

## Troubleshooting

### Masih "Profil User Tidak Ditemukan"?
1. Cek apakah script berhasil dijalankan (lihat NOTICE messages)
2. Cek apakah user ada di tabel users dengan query verifikasi di atas
3. Cek RLS policy - pastikan user bisa melihat profil mereka sendiri

### Query untuk Debug:
```sql
-- Cek semua user di auth.users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Cek semua user di tabel users
SELECT id, email, full_name, role, is_active FROM users ORDER BY created_at DESC;

-- Cek user yang ada di auth tapi tidak ada di users
SELECT 
  au.id,
  au.email
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;
```

