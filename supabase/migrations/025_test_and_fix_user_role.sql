-- Test dan Fix User Role - Test tanpa auth.uid()
-- Query ini bisa dijalankan di SQL Editor tanpa perlu user session

-- STEP 1: Cek semua users dan role mereka
SELECT 
  id,
  email,
  full_name,
  role,
  TRIM(role) as role_trimmed,
  is_active,
  department_id,
  CASE 
    WHEN TRIM(role) IN ('IT', 'Engineering', 'Master Admin') THEN '✅ BISA update WO'
    ELSE '❌ TIDAK BISA update WO'
  END as can_update_wo
FROM users
ORDER BY created_at DESC;

-- STEP 2: Test function dengan UUID user tertentu
-- Ganti 'USER-UUID-DI-SINI' dengan UUID user yang ingin di-test
-- Cara dapatkan UUID: Lihat hasil query STEP 1, copy kolom 'id'

-- Contoh test function (ganti UUID):
/*
SELECT 
  id,
  email,
  role,
  -- Simulasi function dengan role check langsung
  CASE 
    WHEN TRIM(role) IN ('IT', 'Engineering', 'Master Admin') THEN true
    ELSE false
  END as can_update_wo
FROM users
WHERE id = 'USER-UUID-DI-SINI';
*/

-- STEP 3: Update role user IT/Engineering secara manual
-- Ganti 'EMAIL-USER-DI-SINI' dengan email user yang ingin di-update

-- Update user menjadi IT
UPDATE users 
SET 
  role = 'IT',
  is_active = true
WHERE email = 'EMAIL-USER-DI-SINI'  -- Ganti dengan email user IT
RETURNING id, email, full_name, role, is_active;

-- Update user menjadi Engineering
-- UPDATE users 
-- SET 
--   role = 'Engineering',
--   is_active = true
-- WHERE email = 'EMAIL-USER-DI-SINI'  -- Ganti dengan email user Engineering
-- RETURNING id, email, full_name, role, is_active;

-- STEP 4: Update semua user IT berdasarkan email pattern
UPDATE users 
SET 
  role = 'IT',
  is_active = true
WHERE 
  (LOWER(email) LIKE '%it@%' OR LOWER(email) LIKE '%@it.%')
  AND (role IS NULL OR TRIM(role) NOT IN ('IT', 'Engineering', 'Master Admin'))
RETURNING id, email, full_name, role;

-- STEP 5: Update semua user Engineering berdasarkan email pattern
UPDATE users 
SET 
  role = 'Engineering',
  is_active = true
WHERE 
  (LOWER(email) LIKE '%engineering@%' OR LOWER(email) LIKE '%eng@%')
  AND (role IS NULL OR TRIM(role) NOT IN ('IT', 'Engineering', 'Master Admin'))
RETURNING id, email, full_name, role;

-- STEP 6: Verifikasi setelah update
SELECT 
  id,
  email,
  full_name,
  role,
  TRIM(role) as role_trimmed,
  is_active,
  CASE 
    WHEN TRIM(role) IN ('IT', 'Engineering', 'Master Admin') THEN '✅ BISA update work orders'
    ELSE '❌ TIDAK BISA update work orders'
  END as status
FROM users
WHERE TRIM(role) IN ('IT', 'Engineering', 'Master Admin')
ORDER BY role, email;

