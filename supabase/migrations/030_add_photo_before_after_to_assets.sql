-- Add photo_before and photo_after columns to assets table
-- Untuk tracking foto asset sebelum dan sesudah project

-- STEP 1: Add photo_before column
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS photo_before TEXT;

-- STEP 2: Add photo_after column
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS photo_after TEXT;

-- STEP 3: Add comments
COMMENT ON COLUMN assets.photo_before IS 'URL foto asset sebelum project (untuk tracking perubahan)';
COMMENT ON COLUMN assets.photo_after IS 'URL foto asset sesudah project (untuk tracking perubahan)';

