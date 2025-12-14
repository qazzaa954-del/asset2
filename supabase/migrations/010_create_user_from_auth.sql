-- Script untuk membuat user di tabel users dari auth.users
-- Jalankan ini di Supabase SQL Editor

-- Langkah 1: Cek user yang sudah login di auth.users
-- Jalankan query ini untuk mendapatkan UUID dan email:
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Langkah 2: Insert user ke tabel users
-- Ganti UUID dan email di bawah dengan hasil dari Langkah 1
-- Uncomment dan sesuaikan:

/*
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'PASTE_UUID_DARI_AUTH_USERS_DISINI',  -- Ganti dengan UUID dari auth.users
  'email@damarlangit.com',              -- Ganti dengan email Anda
  'Master Admin',                        -- Ganti dengan nama Anda
  'Master Admin',                        -- Role: Master Admin, Engineering, IT, atau User
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = true;
*/

-- Langkah 3: Auto-create untuk semua user yang belum ada di tabel users
-- Script ini akan membuat user profile untuk semua user di auth.users yang belum ada di tabel users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT id, email FROM auth.users
    WHERE id NOT IN (SELECT id FROM users)
  LOOP
    INSERT INTO users (id, email, full_name, role, is_active)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(split_part(auth_user.email, '@', 1), 'User'),
      'User', -- Default role, bisa diubah setelahnya
      true
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created user profile for: %', auth_user.email;
  END LOOP;
END $$;

-- Langkah 4: Update user pertama menjadi Master Admin
-- Uncomment dan sesuaikan jika perlu:

/*
UPDATE users
SET 
  role = 'Master Admin',
  full_name = 'Master Admin',
  is_active = true
WHERE id = (
  SELECT id FROM users ORDER BY created_at LIMIT 1
);
*/

-- Langkah 5: Verifikasi
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active,
  CASE 
    WHEN au.id IS NOT NULL THEN 'Ada di auth.users'
    ELSE 'TIDAK ada di auth.users'
  END as auth_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

