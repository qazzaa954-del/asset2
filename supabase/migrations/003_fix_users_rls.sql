-- Fix RLS Policy untuk Users Table
-- Memastikan user yang login bisa melihat profil mereka sendiri

-- Drop existing policy jika ada
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Buat policy baru yang lebih permissive untuk development
-- User bisa melihat profil mereka sendiri
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Tambahkan policy untuk insert (user bisa membuat profil mereka sendiri)
-- Ini berguna jika ada trigger untuk auto-create user profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy untuk update profil sendiri
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Catatan: Jika user belum ada di tabel users setelah login,
-- Anda perlu membuat user secara manual atau menggunakan trigger.
-- Untuk membuat user pertama kali, jalankan SQL ini di Supabase SQL Editor:

/*
-- Contoh: Insert user Master Admin pertama
-- Ganti 'YOUR_USER_ID_FROM_AUTH' dengan UUID user dari auth.users
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'YOUR_USER_ID_FROM_AUTH',  -- Dapatkan dari auth.users setelah login
  'admin@damarlangit.com',
  'Master Admin',
  'Master Admin',
  true
)
ON CONFLICT (id) DO NOTHING;
*/

