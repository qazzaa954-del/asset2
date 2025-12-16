-- Create Asset Projects Table
-- Modul untuk mengelola proyek-proyek asset

-- STEP 1: Create asset_projects table
CREATE TABLE IF NOT EXISTS asset_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name VARCHAR(255) NOT NULL,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(15, 2) DEFAULT 0,
  actual_cost DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Planning' 
    CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  project_manager VARCHAR(255),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create junction table for assets and projects (many-to-many)
CREATE TABLE IF NOT EXISTS asset_project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES asset_projects(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, asset_id)
);

-- STEP 3: Add comments
COMMENT ON TABLE asset_projects IS 'Tabel untuk mengelola proyek-proyek asset';
COMMENT ON TABLE asset_project_assignments IS 'Junction table untuk menghubungkan assets dengan projects';

-- STEP 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_projects_department ON asset_projects(department_id);
CREATE INDEX IF NOT EXISTS idx_asset_projects_status ON asset_projects(status);
CREATE INDEX IF NOT EXISTS idx_asset_projects_code ON asset_projects(project_code);
CREATE INDEX IF NOT EXISTS idx_asset_project_assignments_project ON asset_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_asset_project_assignments_asset ON asset_project_assignments(asset_id);

-- STEP 5: Create trigger for updated_at
CREATE TRIGGER update_asset_projects_updated_at 
  BEFORE UPDATE ON asset_projects
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 6: Setup RLS Policies for asset_projects
ALTER TABLE asset_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_project_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view projects
CREATE POLICY "Users can view asset projects"
ON asset_projects FOR SELECT
TO authenticated
USING (true);

-- Policy: Master Admin can insert projects
CREATE POLICY "Master Admin can insert asset projects"
ON asset_projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
);

-- Policy: Master Admin can update projects
CREATE POLICY "Master Admin can update asset projects"
ON asset_projects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
);

-- Policy: Master Admin can delete projects
CREATE POLICY "Master Admin can delete asset projects"
ON asset_projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
);

-- RLS Policies for asset_project_assignments
-- Policy: All authenticated users can view assignments
CREATE POLICY "Users can view asset project assignments"
ON asset_project_assignments FOR SELECT
TO authenticated
USING (true);

-- Policy: Master Admin can manage assignments
CREATE POLICY "Master Admin can manage asset project assignments"
ON asset_project_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
);

