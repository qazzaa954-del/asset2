-- Create Storage Buckets untuk asset-photos dan work-order-photos
-- Error: "Bucket not found" saat upload foto
-- Solusi: Buat bucket secara otomatis via SQL

-- STEP 1: Buat bucket asset-photos (jika belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-photos',
  'asset-photos',
  true,  -- Public bucket
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']  -- Allowed MIME types
)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Buat bucket work-order-photos (jika belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-order-photos',
  'work-order-photos',
  true,  -- Public bucket
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']  -- Allowed MIME types
)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Verifikasi bucket sudah dibuat
-- Jalankan query ini untuk cek:
-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('asset-photos', 'work-order-photos');

-- STEP 4: Pastikan storage policies sudah ada (dari migration 026)
-- Jika belum, jalankan migration 026_fix_storage_policies.sql


