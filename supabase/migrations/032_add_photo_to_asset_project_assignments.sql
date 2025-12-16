-- Add photo_before and photo_after columns to asset_project_assignments
-- Untuk tracking foto sebelum dan sesudah project

ALTER TABLE asset_project_assignments
ADD COLUMN IF NOT EXISTS photo_before TEXT;

ALTER TABLE asset_project_assignments
ADD COLUMN IF NOT EXISTS photo_after TEXT;

COMMENT ON COLUMN asset_project_assignments.photo_before IS 'URL foto asset sebelum project';
COMMENT ON COLUMN asset_project_assignments.photo_after IS 'URL foto asset sesudah project';

