-- Update User yang Sudah Ada
-- Gunakan ini jika user sudah ada di tabel users (error duplicate key)

-- Langkah 1: Update user dengan UUID yang sudah ada
-- Ganti UUID di bawah dengan UUID user Anda (e090e771-9760-41ec-858f-ace33c9a159d)

UPDATE users
SET 
  email = COALESCE(email, 'admin@damarlangit.com'),
  full_name = COALESCE(NULLIF(full_name, ''), 'Master Admin'),
  role = COALESCE(NULLIF(role, ''), 'Master Admin'),
  is_active = true
WHERE id = 'e090e771-9760-41ec-858f-ace33c9a159d';

-- Langkah 2: Verifikasi user sudah ter-update
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM users
WHERE id = 'e090e771-9760-41ec-858f-ace33c9a159d';

-- Alternatif: Update semua user yang belum lengkap
UPDATE users
SET 
  full_name = COALESCE(NULLIF(full_name, ''), 'User'),
  role = COALESCE(NULLIF(role, ''), 'User'),
  is_active = COALESCE(is_active, true)
WHERE full_name IS NULL 
   OR full_name = '' 
   OR role IS NULL 
   OR role = '';

-- Catatan: Setelah update, refresh browser dan sidebar harus menampilkan menu

