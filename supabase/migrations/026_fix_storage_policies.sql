-- Fix Storage Policies untuk work-order-photos dan asset-photos
-- Error: "StorageApiError: new row violates row-level security policy"
-- Masalah: Bucket storage tidak memiliki policy untuk upload

-- STEP 1: Pastikan bucket sudah dibuat (manual di Supabase Dashboard)
-- Bucket yang diperlukan:
-- 1. asset-photos (Public)
-- 2. work-order-photos (Public)
-- 
-- Jika belum ada, buat di: Supabase Dashboard > Storage > New bucket

-- STEP 2: Setup Storage Policies untuk work-order-photos

-- Policy: Authenticated users bisa upload ke work-order-photos
CREATE POLICY IF NOT EXISTS "Authenticated users can upload work order photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-photos'
);

-- Policy: Authenticated users bisa read work-order-photos
CREATE POLICY IF NOT EXISTS "Authenticated users can read work order photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-order-photos'
);

-- Policy: Authenticated users bisa update work-order-photos (untuk replace file)
CREATE POLICY IF NOT EXISTS "Authenticated users can update work order photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work-order-photos'
)
WITH CHECK (
  bucket_id = 'work-order-photos'
);

-- Policy: Authenticated users bisa delete work-order-photos
CREATE POLICY IF NOT EXISTS "Authenticated users can delete work order photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-order-photos'
);

-- STEP 3: Setup Storage Policies untuk asset-photos

-- Policy: Authenticated users bisa upload ke asset-photos
CREATE POLICY IF NOT EXISTS "Authenticated users can upload asset photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'asset-photos'
);

-- Policy: Authenticated users bisa read asset-photos
CREATE POLICY IF NOT EXISTS "Authenticated users can read asset photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'asset-photos'
);

-- Policy: Authenticated users bisa update asset-photos
CREATE POLICY IF NOT EXISTS "Authenticated users can update asset photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'asset-photos'
)
WITH CHECK (
  bucket_id = 'asset-photos'
);

-- Policy: Authenticated users bisa delete asset-photos
CREATE POLICY IF NOT EXISTS "Authenticated users can delete asset photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'asset-photos'
);

-- STEP 4: Verifikasi policies
-- Jalankan query ini untuk cek policies yang sudah dibuat:
-- SELECT * FROM storage.policies WHERE bucket_id IN ('work-order-photos', 'asset-photos');

-- Catatan:
-- Jika error "policy already exists", itu berarti policy sudah ada, tidak masalah
-- Jika bucket belum dibuat, buat dulu di Supabase Dashboard > Storage

