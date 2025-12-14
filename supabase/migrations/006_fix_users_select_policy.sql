-- Fix RLS Policy untuk memastikan user bisa melihat profil mereka sendiri
-- Ini penting untuk sidebar bisa menampilkan menu

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Buat policy baru yang lebih jelas
-- User bisa melihat profil mereka sendiri berdasarkan auth.uid()
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Pastikan policy ini aktif
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verifikasi: Cek apakah user bisa melihat profil mereka sendiri
-- Jalankan query ini di Supabase SQL Editor (dengan user yang login):
-- SELECT * FROM users WHERE id = auth.uid();

