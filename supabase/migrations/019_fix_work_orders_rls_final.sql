-- Fix Work Orders RLS Policy - FINAL FIX
-- Masalah: Policy UPDATE gagal karena users table RLS tidak mengizinkan SELECT untuk cek role
-- Solusi: Pastikan users table bisa diakses untuk cek role, lalu buat policy work_orders yang benar

-- STEP 1: Pastikan users table bisa diakses untuk cek role
-- Policy untuk users sudah ada dari migration 013 (is_master_admin function)
-- Kita hanya perlu memastikan function is_engineering_or_it() ada dan bisa digunakan

-- Pastikan function is_engineering_or_it() ada (sudah dibuat di migration 013)
-- Jika belum ada, buat function ini
CREATE OR REPLACE FUNCTION public.is_engineering_or_it()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Pastikan user sudah authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Function ini bypass RLS karena SECURITY DEFINER (dari migration 013)
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  -- Return true jika role adalah Engineering, IT, atau Master Admin
  RETURN COALESCE(user_role, '') IN ('Engineering', 'IT', 'Master Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 2: Fix work_orders policies dengan pendekatan yang benar

-- Drop semua policy work_orders yang ada
DROP POLICY IF EXISTS "Users can view work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_select_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_select" ON work_orders;
DROP POLICY IF EXISTS "Users can create work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can manage work orders" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can update work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can delete work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_delete_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_delete" ON work_orders;

-- Policy SELECT: Semua authenticated user bisa lihat work orders
CREATE POLICY "work_orders_select_all" ON work_orders
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy INSERT: Semua authenticated user bisa create work orders
CREATE POLICY "work_orders_insert_all" ON work_orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy UPDATE: Engineering/IT/Master Admin bisa update work orders
-- Menggunakan function is_engineering_or_it() untuk avoid recursion
CREATE POLICY "work_orders_update_eng_it" ON work_orders
  FOR UPDATE
  USING (public.is_engineering_or_it())
  WITH CHECK (public.is_engineering_or_it());

-- Policy DELETE: Engineering/IT/Master Admin bisa delete work orders
CREATE POLICY "work_orders_delete_eng_it" ON work_orders
  FOR DELETE
  USING (public.is_engineering_or_it());

-- STEP 3: Verifikasi
-- 
-- 1. Cek role user yang login:
--    SELECT id, email, role, TRIM(role) as role_trimmed 
--    FROM users 
--    WHERE id = auth.uid();
--
-- 2. Cek work orders yang ada (untuk mendapatkan UUID):
--    SELECT id, asset_id, status, reported_date 
--    FROM work_orders 
--    ORDER BY created_at DESC 
--    LIMIT 5;
--
-- 3. Test update work order (ganti UUID dengan ID dari query di atas):
--    UPDATE work_orders 
--    SET status = 'In Progress', started_date = CURRENT_DATE 
--    WHERE id = 'paste-uuid-di-sini'
--    RETURNING *;
--
-- Jika masih error, cek:
-- 1. Apakah user yang login memiliki role 'Engineering', 'IT', atau 'Master Admin'?
-- 2. Pastikan role tidak ada spasi di awal/akhir
-- 3. Pastikan function is_engineering_or_it() bekerja: SELECT public.is_engineering_or_it();

