-- Fix Work Orders RLS Policy - Comprehensive Fix
-- Error: "new row violates row-level security policy" saat update work order
-- Masalah: Policy mungkin tidak mengizinkan update dengan field baru (started_date, photo_before)

-- 1. Drop SEMUA policy work_orders yang ada (termasuk yang mungkin tersembunyi)
DROP POLICY IF EXISTS "Users can view work orders" ON work_orders;
DROP POLICY IF EXISTS "Users can create work orders" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can manage work orders" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can update work orders" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can delete work orders" ON work_orders;

-- 2. Pastikan function is_engineering_or_it() ada dan benar
CREATE OR REPLACE FUNCTION public.is_engineering_or_it()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Pastikan user sudah authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Ambil role dari users table (bypass RLS dengan SECURITY DEFINER)
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  -- Return true jika role adalah Engineering, IT, atau Master Admin
  RETURN COALESCE(user_role, '') IN ('Engineering', 'IT', 'Master Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Buat policy yang lebih spesifik dan jelas

-- Policy 1: SELECT - Semua user authenticated bisa lihat work orders
CREATE POLICY "work_orders_select_policy" ON work_orders
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 2: INSERT - Semua user authenticated bisa create work orders
CREATE POLICY "work_orders_insert_policy" ON work_orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: UPDATE - Engineering/IT/Master Admin bisa update work orders
-- Ini termasuk update: status, started_date, photo_before, photo_after, completed_date, assigned_to
CREATE POLICY "work_orders_update_policy" ON work_orders
  FOR UPDATE
  USING (
    -- Bisa update jika user adalah Engineering/IT/Master Admin
    public.is_engineering_or_it()
    -- ATAU user adalah yang melaporkan work order ini (untuk update sendiri)
    OR reported_by = auth.uid()
  )
  WITH CHECK (
    -- Setelah update, harus tetap memenuhi salah satu kondisi
    public.is_engineering_or_it()
    OR reported_by = auth.uid()
  );

-- Policy 4: DELETE - Hanya Engineering/IT/Master Admin bisa delete
CREATE POLICY "work_orders_delete_policy" ON work_orders
  FOR DELETE
  USING (public.is_engineering_or_it());

-- 4. Test function (optional - bisa dijalankan manual)
-- SELECT public.is_engineering_or_it(); -- Harus return true/false

-- 5. Verifikasi policies
-- SELECT * FROM pg_policies WHERE tablename = 'work_orders';

-- Catatan penting:
-- 1. Function is_engineering_or_it() menggunakan SECURITY DEFINER untuk bypass RLS
-- 2. Policy UPDATE menggunakan OR condition untuk fleksibilitas
-- 3. WITH CHECK memastikan data setelah update juga valid

