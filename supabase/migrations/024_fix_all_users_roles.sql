-- Fix All Users Roles - Pastikan semua user IT/Engineering memiliki role yang benar
-- Migration ini akan memperbaiki role semua user IT dan Engineering

-- STEP 1: Cek semua users dan role mereka
SELECT 
  id,
  email,
  full_name,
  role,
  TRIM(role) as role_trimmed,
  is_active,
  department_id
FROM users
ORDER BY created_at DESC;

-- STEP 2: Update semua user yang role-nya salah atau NULL
-- Update user dengan email yang mengandung 'it' atau 'engineering' menjadi role yang benar

-- Update user IT
UPDATE users 
SET 
  role = 'IT',
  is_active = true
WHERE 
  (LOWER(email) LIKE '%it%' OR LOWER(full_name) LIKE '%it%')
  AND (role IS NULL OR TRIM(role) NOT IN ('IT', 'Engineering', 'Master Admin'))
RETURNING id, email, full_name, role;

-- Update user Engineering
UPDATE users 
SET 
  role = 'Engineering',
  is_active = true
WHERE 
  (LOWER(email) LIKE '%engineering%' OR LOWER(email) LIKE '%eng%' OR LOWER(full_name) LIKE '%engineering%' OR LOWER(full_name) LIKE '%eng%')
  AND (role IS NULL OR TRIM(role) NOT IN ('IT', 'Engineering', 'Master Admin'))
RETURNING id, email, full_name, role;

-- STEP 3: Update user berdasarkan department_id
-- Jika user memiliki department_id IT, set role menjadi IT
UPDATE users 
SET 
  role = 'IT',
  is_active = true
WHERE 
  department_id IN (
    SELECT id FROM departments 
    WHERE code = 'IT' OR name LIKE '%IT%' OR name LIKE '%Information Technology%'
  )
  AND (role IS NULL OR TRIM(role) NOT IN ('IT', 'Engineering', 'Master Admin'))
RETURNING id, email, full_name, role, department_id;

-- STEP 4: Verifikasi setelah update
SELECT 
  id,
  email,
  full_name,
  role,
  TRIM(role) as role_trimmed,
  is_active,
  public.is_engineering_or_it() as can_update_wo
FROM users
WHERE TRIM(role) IN ('IT', 'Engineering', 'Master Admin')
ORDER BY role, email;

-- Catatan:
-- Setelah migration ini, semua user IT dan Engineering seharusnya bisa update work orders
-- Test dengan: SELECT public.is_engineering_or_it(); (harus return true untuk user IT/Engineering)


