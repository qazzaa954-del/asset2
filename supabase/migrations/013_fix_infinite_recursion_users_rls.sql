-- Fix Infinite Recursion in Users RLS Policy
-- Error: infinite recursion detected in policy for relation "users" (42P17)
-- 
-- Masalah: Policy "Master Admin can manage users" menyebabkan recursion karena
-- mencoba SELECT dari users table di dalam policy itu sendiri.
--
-- Solusi: Gunakan SECURITY DEFINER function untuk bypass RLS saat cek role

-- 1. Drop semua policy yang bermasalah
DROP POLICY IF EXISTS "Master Admin can manage users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 2. Buat function dengan SECURITY DEFINER untuk cek role tanpa recursion
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Function ini bypass RLS karena SECURITY DEFINER
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN user_role = 'Master Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Buat function untuk cek apakah user adalah dirinya sendiri atau Master Admin
CREATE OR REPLACE FUNCTION public.can_manage_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  user_role TEXT;
BEGIN
  current_user_id := auth.uid();
  
  -- User selalu bisa manage dirinya sendiri
  IF current_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Cek apakah current user adalah Master Admin
  SELECT role INTO user_role
  FROM public.users
  WHERE id = current_user_id;
  
  RETURN user_role = 'Master Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Buat policy baru yang tidak menyebabkan recursion
-- Policy untuk SELECT: User bisa lihat profil mereka sendiri
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy untuk SELECT: Master Admin bisa lihat semua users
-- Menggunakan function untuk avoid recursion
CREATE POLICY "Master Admin can view all users" ON users
  FOR SELECT
  USING (public.is_master_admin());

-- Policy untuk INSERT: User bisa insert profil mereka sendiri
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy untuk UPDATE: User bisa update profil mereka sendiri atau Master Admin bisa update semua
CREATE POLICY "Users can update own or Master Admin can update all" ON users
  FOR UPDATE
  USING (
    auth.uid() = id 
    OR public.is_master_admin()
  )
  WITH CHECK (
    auth.uid() = id 
    OR public.is_master_admin()
  );

-- Policy untuk DELETE: Hanya Master Admin yang bisa delete
CREATE POLICY "Only Master Admin can delete users" ON users
  FOR DELETE
  USING (public.is_master_admin());

-- 5. Fix policies untuk tabel lain yang juga menggunakan users table
-- Drop dan recreate dengan function untuk avoid recursion

-- Departments policy
DROP POLICY IF EXISTS "Only Master Admin can modify departments" ON departments;
CREATE POLICY "Only Master Admin can modify departments" ON departments
  FOR ALL 
  USING (public.is_master_admin())
  WITH CHECK (public.is_master_admin());

-- Assets policies
DROP POLICY IF EXISTS "Only Master Admin can modify assets" ON assets;
DROP POLICY IF EXISTS "Only Master Admin can delete assets" ON assets;

CREATE POLICY "Only Master Admin can modify assets" ON assets
  FOR UPDATE
  USING (public.is_master_admin())
  WITH CHECK (public.is_master_admin());

CREATE POLICY "Only Master Admin can delete assets" ON assets
  FOR DELETE
  USING (public.is_master_admin());

-- Audits policy
DROP POLICY IF EXISTS "Master Admin can manage audits" ON audits;
CREATE POLICY "Master Admin can manage audits" ON audits
  FOR ALL
  USING (public.is_master_admin())
  WITH CHECK (public.is_master_admin());

-- Maintenance logs policy
DROP POLICY IF EXISTS "Engineering/IT can manage maintenance logs" ON maintenance_logs;
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

CREATE POLICY "Engineering/IT can manage maintenance logs" ON maintenance_logs
  FOR ALL
  USING (public.is_engineering_or_it())
  WITH CHECK (public.is_engineering_or_it());

-- Work orders policy
DROP POLICY IF EXISTS "Engineering/IT can manage work orders" ON work_orders;
CREATE POLICY "Engineering/IT can manage work orders" ON work_orders
  FOR ALL
  USING (public.is_engineering_or_it())
  WITH CHECK (public.is_engineering_or_it());

-- Depreciation methods policy
DROP POLICY IF EXISTS "Only Master Admin can manage depreciation methods" ON depreciation_methods;
CREATE POLICY "Only Master Admin can manage depreciation methods" ON depreciation_methods
  FOR ALL
  USING (public.is_master_admin())
  WITH CHECK (public.is_master_admin());

-- 6. Verifikasi
-- Test query (harus dijalankan saat user login):
-- SELECT * FROM users WHERE id = auth.uid(); -- Should work
-- SELECT public.is_master_admin(); -- Should return true/false

-- Catatan:
-- Function dengan SECURITY DEFINER akan bypass RLS, sehingga tidak menyebabkan recursion
-- Function ini hanya bisa dijalankan oleh user yang sudah authenticated (auth.uid() tersedia)
