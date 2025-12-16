-- Fix User Role - Perbaiki role user yang login
-- Jalankan query ini untuk memperbaiki role user

-- STEP 1: Cek user yang sedang login
-- Jalankan query ini dulu untuk melihat user ID dan role saat ini:
SELECT 
  id,
  email,
  full_name,
  role,
  TRIM(role) as role_trimmed,
  is_active,
  department_id
FROM users
WHERE id = auth.uid();

-- STEP 2: Update role user (pilih salah satu sesuai kebutuhan)

-- Opsi A: Update role menjadi IT
UPDATE users 
SET 
  role = 'IT',
  is_active = true
WHERE id = auth.uid()
RETURNING id, email, role, is_active;

-- Opsi B: Update role menjadi Engineering
-- UPDATE users 
-- SET 
--   role = 'Engineering',
--   is_active = true
-- WHERE id = auth.uid()
-- RETURNING id, email, role, is_active;

-- Opsi C: Update role menjadi Master Admin
-- UPDATE users 
-- SET 
--   role = 'Master Admin',
--   is_active = true
-- WHERE id = auth.uid()
-- RETURNING id, email, role, is_active;

-- STEP 3: Jika user tidak ada di tabel users, buat user baru
-- Ganti email dan nama sesuai user Anda
-- Uncomment dan jalankan jika user tidak ada:

/*
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  auth.uid(),  -- UUID dari auth.users (otomatis)
  'email-anda@damarlangit.com',  -- Ganti dengan email Anda
  'Nama Lengkap',  -- Ganti dengan nama Anda
  'IT',  -- atau 'Engineering' atau 'Master Admin'
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'IT',
  is_active = true
RETURNING *;
*/

-- STEP 4: Verifikasi setelah update
SELECT 
  id,
  email,
  role,
  TRIM(role) as role_trimmed,
  public.is_engineering_or_it() as is_eng_or_it
FROM users
WHERE id = auth.uid();


