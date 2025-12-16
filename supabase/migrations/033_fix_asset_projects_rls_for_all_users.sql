-- Fix RLS Policies for asset_projects to allow all users to view and manage their own projects
-- Semua user bisa view semua projects
-- User bisa insert/update/delete project mereka sendiri (berdasarkan department_id atau created_by)
-- Master Admin bisa manage semua projects

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view asset projects" ON asset_projects;
DROP POLICY IF EXISTS "Master Admin can insert asset projects" ON asset_projects;
DROP POLICY IF EXISTS "Master Admin can update asset projects" ON asset_projects;
DROP POLICY IF EXISTS "Master Admin can delete asset projects" ON asset_projects;

DROP POLICY IF EXISTS "Users can view asset project assignments" ON asset_project_assignments;
DROP POLICY IF EXISTS "Master Admin can manage asset project assignments" ON asset_project_assignments;

-- RLS Policies for asset_projects
-- Policy: All authenticated users can view all projects
CREATE POLICY "All users can view asset projects"
ON asset_projects FOR SELECT
TO authenticated
USING (true);

-- Policy: All authenticated users can insert projects (untuk department mereka sendiri atau jika Master Admin)
CREATE POLICY "Users can insert asset projects"
ON asset_projects FOR INSERT
TO authenticated
WITH CHECK (
  -- Master Admin bisa insert semua projects
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
  OR
  -- User biasa bisa insert project untuk department mereka sendiri
  (
    department_id IS NULL 
    OR 
    department_id IN (
      SELECT department_id FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
);

-- Policy: Users can update their own projects or Master Admin can update all
CREATE POLICY "Users can update asset projects"
ON asset_projects FOR UPDATE
TO authenticated
USING (
  -- Master Admin bisa update semua
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
  OR
  -- User bisa update project yang dibuat oleh mereka atau untuk department mereka
  (
    created_by = auth.uid()
    OR
    (
      department_id IS NOT NULL
      AND department_id IN (
        SELECT department_id FROM users
        WHERE users.id = auth.uid()
        AND users.is_active = true
      )
    )
  )
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
  OR
  (
    created_by = auth.uid()
    OR
    (
      department_id IS NOT NULL
      AND department_id IN (
        SELECT department_id FROM users
        WHERE users.id = auth.uid()
        AND users.is_active = true
      )
    )
  )
);

-- Policy: Users can delete their own projects or Master Admin can delete all
CREATE POLICY "Users can delete asset projects"
ON asset_projects FOR DELETE
TO authenticated
USING (
  -- Master Admin bisa delete semua
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Master Admin'
    AND users.is_active = true
  )
  OR
  -- User bisa delete project yang dibuat oleh mereka atau untuk department mereka
  (
    created_by = auth.uid()
    OR
    (
      department_id IS NOT NULL
      AND department_id IN (
        SELECT department_id FROM users
        WHERE users.id = auth.uid()
        AND users.is_active = true
      )
    )
  )
);

-- RLS Policies for asset_project_assignments
-- Policy: All authenticated users can view assignments
CREATE POLICY "All users can view asset project assignments"
ON asset_project_assignments FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert assignments for projects they can access
CREATE POLICY "Users can insert asset project assignments"
ON asset_project_assignments FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if user can access the project
  EXISTS (
    SELECT 1 FROM asset_projects
    WHERE asset_projects.id = project_id
    AND (
      -- Master Admin can access all
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'Master Admin'
        AND users.is_active = true
      )
      OR
      -- User can access if project is for their department or created by them
      (
        asset_projects.department_id IS NULL
        OR
        asset_projects.department_id IN (
          SELECT department_id FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
        OR
        asset_projects.created_by = auth.uid()
      )
    )
  )
);

-- Policy: Users can update assignments for projects they can access
CREATE POLICY "Users can update asset project assignments"
ON asset_project_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM asset_projects
    WHERE asset_projects.id = project_id
    AND (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'Master Admin'
        AND users.is_active = true
      )
      OR
      (
        asset_projects.department_id IS NULL
        OR
        asset_projects.department_id IN (
          SELECT department_id FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
        OR
        asset_projects.created_by = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM asset_projects
    WHERE asset_projects.id = project_id
    AND (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'Master Admin'
        AND users.is_active = true
      )
      OR
      (
        asset_projects.department_id IS NULL
        OR
        asset_projects.department_id IN (
          SELECT department_id FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
        OR
        asset_projects.created_by = auth.uid()
      )
    )
  )
);

-- Policy: Users can delete assignments for projects they can access
CREATE POLICY "Users can delete asset project assignments"
ON asset_project_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM asset_projects
    WHERE asset_projects.id = project_id
    AND (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'Master Admin'
        AND users.is_active = true
      )
      OR
      (
        asset_projects.department_id IS NULL
        OR
        asset_projects.department_id IN (
          SELECT department_id FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
        OR
        asset_projects.created_by = auth.uid()
      )
    )
  )
);

