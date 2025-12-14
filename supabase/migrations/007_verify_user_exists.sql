-- Script untuk verifikasi user sudah ada dan bisa diakses
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek apakah user ada di tabel users
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM users
WHERE id = auth.uid();

-- 2. Jika tidak ada hasil, berarti user belum terdaftar
-- Jika ada hasil, berarti user sudah terdaftar

-- 3. Update user jika perlu (ganti role atau nama)
-- Uncomment dan sesuaikan jika perlu:

/*
UPDATE users
SET 
  role = 'Master Admin',
  full_name = 'Nama Lengkap Anda',
  is_active = true
WHERE id = auth.uid();
*/

-- 4. Cek semua users (hanya untuk Master Admin)
-- Uncomment jika Anda Master Admin:

/*
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM users
ORDER BY created_at DESC;
*/

