-- Fix Auto-Create User Profile Trigger
-- Script ini akan membuat user profile otomatis untuk user yang sudah login tapi belum ada di tabel users

-- 1. Pastikan function untuk create user profile ada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'User'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop trigger lama jika ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Buat trigger baru
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Buat user profile untuk user yang sudah ada di auth.users tapi belum ada di users
-- Script ini akan membuat user profile untuk semua user yang sudah login
DO $$
DECLARE
  auth_user RECORD;
  user_count INTEGER;
BEGIN
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM users WHERE id IS NOT NULL)
  LOOP
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(
        auth_user.raw_user_meta_data->>'full_name',
        split_part(auth_user.email, '@', 1)
      ),
      COALESCE(auth_user.raw_user_meta_data->>'role', 'User'),
      true
    )
    ON CONFLICT (id) DO NOTHING;
    
    GET DIAGNOSTICS user_count = ROW_COUNT;
    IF user_count > 0 THEN
      RAISE NOTICE 'Created user profile for: % (ID: %)', auth_user.email, auth_user.id;
    END IF;
  END LOOP;
END $$;

-- 5. Update user pertama menjadi Master Admin (jika belum ada Master Admin)
DO $$
DECLARE
  master_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO master_admin_count
  FROM users
  WHERE role = 'Master Admin';
  
  IF master_admin_count = 0 THEN
    UPDATE users
    SET 
      role = 'Master Admin',
      full_name = COALESCE(full_name, 'Master Admin')
    WHERE id = (SELECT id FROM users ORDER BY created_at LIMIT 1);
    
    RAISE NOTICE 'Updated first user to Master Admin';
  END IF;
END $$;

-- 6. Verifikasi hasil
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active,
  CASE 
    WHEN au.id IS NOT NULL THEN '✓ Ada di auth.users'
    ELSE '✗ TIDAK ada di auth.users'
  END as auth_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

