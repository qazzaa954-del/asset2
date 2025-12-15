-- Fix Work Orders RLS Policy - CLEAN VERSION
-- Migration ini hanya fokus ke work_orders, tidak menyentuh users table

-- STEP 1: Pastikan function is_engineering_or_it() ada dan benar
CREATE OR REPLACE FUNCTION public.is_engineering_or_it()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_id UUID;
BEGIN
  -- Ambil user ID
  user_id := auth.uid();
  
  -- Pastikan user sudah authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Function ini bypass RLS karena SECURITY DEFINER
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  -- Jika user tidak ditemukan, return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Trim role untuk handle spasi
  user_role := TRIM(user_role);
  
  -- Return true jika role adalah Engineering, IT, atau Master Admin
  RETURN user_role IN ('Engineering', 'IT', 'Master Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 2: Drop SEMUA policy work_orders yang ada
DROP POLICY IF EXISTS "Users can view work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_select_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_select" ON work_orders;
DROP POLICY IF EXISTS "work_orders_select_all" ON work_orders;
DROP POLICY IF EXISTS "Users can create work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert_all" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can manage work orders" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can update work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update_eng_it" ON work_orders;
DROP POLICY IF EXISTS "Engineering/IT can delete work orders" ON work_orders;
DROP POLICY IF EXISTS "work_orders_delete_policy" ON work_orders;
DROP POLICY IF EXISTS "work_orders_delete" ON work_orders;
DROP POLICY IF EXISTS "work_orders_delete_eng_it" ON work_orders;

-- STEP 3: Buat policy baru yang benar

-- Policy SELECT: Semua authenticated user bisa lihat work orders
CREATE POLICY "work_orders_select_all" ON work_orders
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy INSERT: Semua authenticated user bisa create work orders
CREATE POLICY "work_orders_insert_all" ON work_orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy UPDATE: Engineering/IT/Master Admin bisa update work orders
CREATE POLICY "work_orders_update_eng_it" ON work_orders
  FOR UPDATE
  USING (public.is_engineering_or_it())
  WITH CHECK (public.is_engineering_or_it());

-- Policy DELETE: Engineering/IT/Master Admin bisa delete work orders
CREATE POLICY "work_orders_delete_eng_it" ON work_orders
  FOR DELETE
  USING (public.is_engineering_or_it());

