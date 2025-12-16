-- Verify Asset Projects Table Exists
-- Jalankan query ini untuk cek apakah tabel asset_projects sudah ada

-- STEP 1: Cek apakah tabel asset_projects ada
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'asset_projects';

-- STEP 2: Jika tabel tidak ada, jalankan migration 029_create_asset_projects.sql
-- Jika tabel ada, cek struktur kolom:
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'asset_projects'
ORDER BY ordinal_position;

-- STEP 3: Cek apakah ada data
SELECT COUNT(*) as total_projects FROM asset_projects;

-- STEP 4: Cek RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'asset_projects';

