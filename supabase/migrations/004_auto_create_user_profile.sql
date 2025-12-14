-- Trigger untuk auto-create user profile setelah sign up di auth
-- Ini akan otomatis membuat record di tabel users ketika user baru sign up

-- Function untuk create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'User', -- Default role
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger yang akan dipanggil setelah user baru dibuat di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Catatan penting:
-- 1. Function ini menggunakan SECURITY DEFINER untuk bypass RLS
-- 2. Trigger ini hanya bekerja untuk user baru yang sign up
-- 3. Untuk user yang sudah ada, Anda perlu insert manual ke tabel users
-- 4. Setelah trigger ini dibuat, user baru akan otomatis terdaftar di tabel users

