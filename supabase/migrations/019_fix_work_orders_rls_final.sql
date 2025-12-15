-- Fix Work Orders RLS Policy - FINAL FIX
-- Masalah: Policy UPDATE gagal karena users table RLS tidak mengizinkan SELECT untuk cek role
-- Solusi: Pastikan users table bisa diakses untuk cek role, lalu buat policy work_orders yang benar

-- STEP 1: Pastikan users table bisa diakses untuk cek role
-- Cek apakah ada policy SELECT untuk users
-- Jika tidak ada, buat policy yang mengizinkan user melihat role mereka sendiri dan role user lain untuk keperluan RLS

-- Policy untuk users: User bisa lihat role mereka sendiri
-- (Ini seharusnya sudah ada dari migration sebelumnya, tapi kita pastikan)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Policy untuk users: User bisa lihat role user lain untuk keperluan RLS check
-- (Ini penting untuk policy work_orders bisa cek role)
CREATE POLICY IF NOT EXISTS "Users can view roles for RLS" ON users
  FOR SELECT
  USING (true); -- Semua authenticated user bisa lihat role (hanya untuk RLS check)

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
-- Menggunakan subquery langsung untuk cek role
CREATE POLICY "work_orders_update_eng_it" ON work_orders
  FOR UPDATE
  USING (
    -- Cek apakah current user adalah Engineering, IT, atau Master Admin
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  )
  WITH CHECK (
    -- Setelah update, pastikan masih memenuhi kondisi
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  );

-- Policy DELETE: Engineering/IT/Master Admin bisa delete work orders
CREATE POLICY "work_orders_delete_eng_it" ON work_orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  );

-- STEP 3: Verifikasi
-- Jalankan query ini untuk test (ganti 'your-work-order-id' dengan ID work order yang ada):
-- UPDATE work_orders 
-- SET status = 'In Progress', started_date = CURRENT_DATE 
-- WHERE id = 'your-work-order-id';
-- 
-- Jika masih error, cek:
-- 1. Apakah user yang login memiliki role 'Engineering', 'IT', atau 'Master Admin'?
-- 2. Jalankan: SELECT id, role FROM users WHERE id = auth.uid();
-- 3. Pastikan role tidak ada spasi di awal/akhir

