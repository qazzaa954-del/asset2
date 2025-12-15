-- Fix Work Orders RLS Policy - Simple Approach (Tanpa Function)
-- Jika migration 017 masih error, gunakan migration ini
-- Pendekatan lebih sederhana dengan policy langsung

-- 1. Drop SEMUA policy work_orders
DROP POLICY IF EXISTS "Users can view work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_select_policy" ON work_orders;
DROP POLICY IF EXISTS "Users can create work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert_policy" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can manage work orders" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can update work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update_policy" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can delete work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_delete_policy" ON work_orders;

-- 2. Buat policy sederhana tanpa function (langsung cek role)

-- Policy SELECT: Semua authenticated user bisa lihat
CREATE POLICY "work_orders_select" ON work_orders
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy INSERT: Semua authenticated user bisa create
CREATE POLICY "work_orders_insert" ON work_orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy UPDATE: Engineering/IT/Master Admin bisa update
-- Menggunakan EXISTS untuk cek role langsung
CREATE POLICY "work_orders_update" ON work_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  );

-- Policy DELETE: Engineering/IT/Master Admin bisa delete
CREATE POLICY "work_orders_delete" ON work_orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  );

-- Catatan:
-- Policy ini menggunakan EXISTS langsung tanpa function
-- Pastikan users table memiliki RLS policy yang memungkinkan SELECT untuk cek role
-- Jika masih error, mungkin perlu disable RLS sementara untuk users table saat cek role

