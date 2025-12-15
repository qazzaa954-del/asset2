-- Fix Work Orders RLS Policy untuk allow update dengan started_date dan photo_before
-- Error: "new row violates row-level security policy" saat update work order

-- 1. Drop semua policy work_orders yang ada
DROP POLICY IF EXISTS "Users can view work orders" ON work_orders;
DROP POLICY IF EXISTS "Users can create work orders" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can manage work orders" ON work_orders;

-- 2. Pastikan function is_engineering_or_it() sudah ada
CREATE OR REPLACE FUNCTION public.is_engineering_or_it()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN user_role IN ('Engineering', 'IT', 'Master Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Buat policy baru yang lebih spesifik

-- Policy untuk SELECT: Semua user yang authenticated bisa lihat work orders
CREATE POLICY "Users can view work orders" ON work_orders
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy untuk INSERT: Semua user yang authenticated bisa create work orders
CREATE POLICY "Users can create work orders" ON work_orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy untuk UPDATE: Engineering/IT/Master Admin bisa update work orders
-- Ini termasuk update status, started_date, photo_before, photo_after, completed_date
CREATE POLICY "Engineering/IT can update work orders" ON work_orders
  FOR UPDATE
  USING (public.is_engineering_or_it())
  WITH CHECK (public.is_engineering_or_it());

-- Policy untuk DELETE: Engineering/IT/Master Admin bisa delete work orders
CREATE POLICY "Engineering/IT can delete work orders" ON work_orders
  FOR DELETE
  USING (public.is_engineering_or_it());

-- 4. Verifikasi
-- Test query (harus dijalankan saat user login dengan role Engineering/IT):
-- UPDATE work_orders SET status = 'In Progress', started_date = CURRENT_DATE WHERE id = 'work-order-id';
-- Harus berhasil tanpa error RLS

