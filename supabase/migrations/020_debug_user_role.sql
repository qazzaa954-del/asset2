-- Debug: Cek User Role dan Function
-- Jalankan query ini untuk debug kenapa function is_engineering_or_it() return NULL

-- 1. Cek apakah user authenticated
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'User tidak authenticated (auth.uid() = NULL)'
    ELSE 'User authenticated'
  END as auth_status;

-- 2. Cek user di tabel users
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

-- 3. Test function is_engineering_or_it()
SELECT 
  public.is_engineering_or_it() as function_result,
  CASE 
    WHEN public.is_engineering_or_it() IS NULL THEN 'Function return NULL - ada masalah!'
    WHEN public.is_engineering_or_it() = true THEN 'Function return TRUE - user adalah Engineering/IT/Master Admin'
    WHEN public.is_engineering_or_it() = false THEN 'Function return FALSE - user BUKAN Engineering/IT/Master Admin'
    ELSE 'Unknown result'
  END as function_status;

-- 4. Cek semua users (jika Master Admin)
-- Uncomment jika perlu:
-- SELECT id, email, role, is_active FROM users ORDER BY created_at DESC;

-- 5. Jika function return NULL atau FALSE, perbaiki role user:
-- UPDATE users 
-- SET role = 'IT'  -- atau 'Engineering' atau 'Master Admin'
-- WHERE id = auth.uid()
-- RETURNING *;


