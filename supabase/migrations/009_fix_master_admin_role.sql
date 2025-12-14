-- Fix Master Admin Role - Pastikan role benar tanpa spasi
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek semua user dan role mereka
SELECT 
  id,
  email,
  full_name,
  role,
  LENGTH(role) as role_length,
  is_active
FROM users
ORDER BY created_at DESC;

-- 2. Update semua role yang mungkin memiliki spasi atau case berbeda
-- Normalize role ke format yang benar
UPDATE users
SET 
  role = CASE 
    WHEN TRIM(LOWER(role)) = 'master admin' THEN 'Master Admin'
    WHEN TRIM(LOWER(role)) = 'engineering' THEN 'Engineering'
    WHEN TRIM(LOWER(role)) = 'it' THEN 'IT'
    WHEN TRIM(LOWER(role)) = 'user' THEN 'User'
    ELSE TRIM(role)
  END,
  updated_at = NOW()
WHERE role IS NOT NULL;

-- 3. Verifikasi setelah update
SELECT 
  id,
  email,
  full_name,
  role,
  LENGTH(role) as role_length,
  role = 'Master Admin' as is_exact_match
FROM users
WHERE TRIM(LOWER(role)) = 'master admin';

-- 4. Jika masih ada masalah, update manual untuk user tertentu
-- Ganti UUID dengan UUID user Anda
/*
UPDATE users
SET 
  role = 'Master Admin',
  updated_at = NOW()
WHERE id = 'YOUR_USER_UUID_HERE';
*/

-- 5. Cek apakah ada karakter aneh di role
SELECT 
  id,
  email,
  role,
  LENGTH(role) as length,
  -- Cek karakter per karakter
  ASCII(SUBSTRING(role, 1, 1)) as char1_code,
  ASCII(SUBSTRING(role, 2, 1)) as char2_code,
  ASCII(SUBSTRING(role, 3, 1)) as char3_code,
  ASCII(SUBSTRING(role, 4, 1)) as char4_code,
  ASCII(SUBSTRING(role, 5, 1)) as char5_code,
  ASCII(SUBSTRING(role, 6, 1)) as char6_code,
  ASCII(SUBSTRING(role, 7, 1)) as char7_code,
  ASCII(SUBSTRING(role, 8, 1)) as char8_code,
  ASCII(SUBSTRING(role, 9, 1)) as char9_code,
  ASCII(SUBSTRING(role, 10, 1)) as char10_code,
  ASCII(SUBSTRING(role, 11, 1)) as char11_code,
  ASCII(SUBSTRING(role, 12, 1)) as char12_code,
  ASCII(SUBSTRING(role, 13, 1)) as char13_code
FROM users
WHERE TRIM(LOWER(role)) LIKE '%master%admin%';

