-- Create Department Menu Permissions Table
-- Sistem untuk mengatur akses menu per departemen oleh Master Admin

-- STEP 1: Create department_menu_permissions table
CREATE TABLE IF NOT EXISTS department_menu_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  menu_path VARCHAR(255) NOT NULL, -- Path menu seperti '/dashboard', '/assets', dll
  menu_label VARCHAR(255) NOT NULL, -- Label menu seperti 'Dashboard', 'Master Inventory', dll
  is_allowed BOOLEAN NOT NULL DEFAULT true, -- Apakah menu ini diizinkan untuk departemen ini
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, menu_path) -- Satu departemen hanya punya satu permission per menu
);

-- STEP 2: Add comments
COMMENT ON TABLE department_menu_permissions IS 'Tabel untuk menyimpan permission akses menu per departemen';
COMMENT ON COLUMN department_menu_permissions.menu_path IS 'Path menu (contoh: /dashboard, /assets, /work-orders)';
COMMENT ON COLUMN department_menu_permissions.menu_label IS 'Label menu untuk display (contoh: Dashboard, Master Inventory)';
COMMENT ON COLUMN department_menu_permissions.is_allowed IS 'Apakah menu ini diizinkan untuk departemen ini';

-- STEP 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_department_menu_permissions_department ON department_menu_permissions(department_id);
CREATE INDEX IF NOT EXISTS idx_department_menu_permissions_menu_path ON department_menu_permissions(menu_path);
CREATE INDEX IF NOT EXISTS idx_department_menu_permissions_allowed ON department_menu_permissions(is_allowed);

-- STEP 4: Create trigger for updated_at
CREATE TRIGGER update_department_menu_permissions_updated_at 
  BEFORE UPDATE ON department_menu_permissions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 5: Setup RLS Policies
ALTER TABLE department_menu_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view permissions (untuk check akses)
CREATE POLICY "Users can view department menu permissions"
ON department_menu_permissions FOR SELECT
TO authenticated
USING (true);

-- Policy: Only Master Admin can manage permissions
CREATE POLICY "Master Admin can manage department menu permissions"
ON department_menu_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
);

-- STEP 6: Insert default permissions untuk semua departemen
-- Master Admin selalu punya akses penuh (tidak perlu di tabel ini)
-- Default: Semua menu diizinkan untuk semua departemen (bisa diubah oleh Master Admin)
DO $$
DECLARE
  dept_record RECORD;
  menu_record RECORD;
  menus TEXT[][] := ARRAY[
    ['/dashboard', 'Dashboard'],
    ['/assets', 'Master Inventory'],
    ['/asset-projects', 'Asset Projects'],
    ['/departments', 'Master Departemen'],
    ['/financial', 'Finansial & Audit'],
    ['/depreciation', 'Depresiasi'],
    ['/work-orders', 'Work Order'],
    ['/users', 'Manajemen Pengguna'],
    ['/reports', 'Laporan BAK']
  ];
  master_admin_id UUID;
BEGIN
  -- Get Master Admin ID
  SELECT id INTO master_admin_id
  FROM users
  WHERE role = 'Master Admin'
  LIMIT 1;

  -- Loop through all departments
  FOR dept_record IN SELECT id FROM departments LOOP
    -- Loop through all menus
    FOREACH menu_record SLICE 1 IN ARRAY menus LOOP
      -- Insert default permission (is_allowed = true)
      INSERT INTO department_menu_permissions (
        department_id,
        menu_path,
        menu_label,
        is_allowed,
        created_by
      )
      VALUES (
        dept_record.id,
        menu_record[1],
        menu_record[2],
        true,
        COALESCE(master_admin_id, (SELECT id FROM users LIMIT 1))
      )
      ON CONFLICT (department_id, menu_path) DO NOTHING;
    END LOOP;
  END LOOP;
END
$$;

