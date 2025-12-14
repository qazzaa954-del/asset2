-- Script untuk Insert User Pertama
-- IMPORTANT: Ganti UUID dan email dengan data user Anda yang sebenarnya

-- Langkah 1: Cek user yang sudah login di auth.users
-- Jalankan query ini di Supabase SQL Editor untuk mendapatkan UUID:
-- SELECT id, email FROM auth.users;

-- Langkah 2: Insert user ke tabel users
-- Ganti 'YOUR_USER_UUID_HERE' dengan UUID dari langkah 1
-- Ganti email, nama, dan role sesuai kebutuhan

DO $$
DECLARE
  user_uuid UUID;
  user_email TEXT;
BEGIN
  -- Ambil UUID user pertama dari auth.users (atau ganti dengan UUID spesifik)
  SELECT id INTO user_uuid FROM auth.users ORDER BY created_at LIMIT 1;
  
  -- Jika tidak ada user di auth.users, gunakan UUID manual
  IF user_uuid IS NULL THEN
    RAISE NOTICE 'Tidak ada user di auth.users. Silakan ganti user_uuid dengan UUID manual.';
    -- user_uuid := '00000000-0000-0000-0000-000000000000'; -- Ganti dengan UUID Anda
    RETURN;
  END IF;
  
  -- Ambil email dari auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
  
  -- Insert atau update user di tabel users
  INSERT INTO users (id, email, full_name, role, is_active)
  VALUES (
    user_uuid,
    COALESCE(user_email, 'admin@damarlangit.com'),
    'Master Admin',
    'Master Admin',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    is_active = true;
    
  RAISE NOTICE 'User berhasil dibuat/diupdate: %', user_email;
END $$;

-- Alternatif: Insert manual dengan UUID spesifik
-- Uncomment dan ganti UUID di bawah ini jika cara otomatis tidak bekerja

/*
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'PASTE_UUID_DARI_AUTH_USERS_DISINI',  -- Ganti dengan UUID dari auth.users
  'admin@damarlangit.com',              -- Ganti dengan email Anda
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

