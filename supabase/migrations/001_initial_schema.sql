-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  initial_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Master Admin', 'Engineering', 'IT', 'User')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Depreciation Methods Table
CREATE TABLE IF NOT EXISTS depreciation_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  formula TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_name VARCHAR(255) NOT NULL,
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  location VARCHAR(255) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  unit VARCHAR(50) NOT NULL,
  acquisition_year INTEGER NOT NULL,
  acquisition_price DECIMAL(15, 2) NOT NULL,
  estimated_lifespan INTEGER NOT NULL,
  condition VARCHAR(50) NOT NULL CHECK (condition IN ('Baik', 'Rusak Ringan', 'Rusak Berat')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Aktif', 'Disposal', 'Repair')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('Room', 'Public Area', 'Office')),
  photo_url TEXT,
  barcode VARCHAR(255) UNIQUE,
  book_value DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- Audits Table
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  audit_date DATE NOT NULL,
  auditor VARCHAR(255) NOT NULL,
  findings TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type VARCHAR(255) NOT NULL,
  cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  vendor VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reported_date DATE NOT NULL,
  description TEXT NOT NULL,
  photo_before TEXT,
  photo_after TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_date DATE,
  notes TEXT,
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department_id);
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets(condition);
CREATE INDEX IF NOT EXISTS idx_audits_asset ON audits(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate book value (straight-line depreciation)
CREATE OR REPLACE FUNCTION calculate_book_value(
  acquisition_price DECIMAL,
  acquisition_year INTEGER,
  estimated_lifespan INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  current_year INTEGER;
  years_used INTEGER;
  annual_depreciation DECIMAL;
  book_value DECIMAL;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  years_used := current_year - acquisition_year;
  
  IF years_used < 0 THEN
    years_used := 0;
  END IF;
  
  IF years_used >= estimated_lifespan THEN
    book_value := 0;
  ELSE
    annual_depreciation := acquisition_price / estimated_lifespan;
    book_value := acquisition_price - (annual_depreciation * years_used);
  END IF;
  
  RETURN GREATEST(book_value, 0);
END;
$$ LANGUAGE plpgsql;

-- Insert initial departments
INSERT INTO departments (code, name, initial_code) VALUES
  ('FBS', 'FB Service', 'FBS'),
  ('FBP', 'FB Produksi', 'FBP'),
  ('HK', 'HK', 'HK'),
  ('HR', 'HR Human Resources', 'HR'),
  ('FIN', 'FIN Finance & Accounting', 'FIN'),
  ('SM', 'SM Sales & Marketing', 'SM'),
  ('SEC', 'SEC', 'SEC'),
  ('IT', 'IT Information Technology', 'IT'),
  ('RA', 'RA Rekreasi & Adventure', 'RA'),
  ('FO', 'FO Front Office', 'FO'),
  ('GAR', 'GAR Gardener', 'GAR')
ON CONFLICT (code) DO NOTHING;

-- Insert default depreciation method (Straight-Line)
INSERT INTO depreciation_methods (name, formula, description, is_active) VALUES
  ('Straight-Line', 'book_value = acquisition_price - ((acquisition_price / estimated_lifespan) * years_used)', 'Metode depresiasi garis lurus', true)
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read departments
CREATE POLICY "Departments are viewable by everyone" ON departments
  FOR SELECT USING (true);

-- Policy: Only Master Admin can modify departments
CREATE POLICY "Only Master Admin can modify departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Master Admin'
    )
  );

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Master Admin can manage all users
CREATE POLICY "Master Admin can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Master Admin'
    )
  );

-- Policy: Users can view assets
CREATE POLICY "Users can view assets" ON assets
  FOR SELECT USING (true);

-- Policy: Users can insert assets
CREATE POLICY "Users can insert assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Only Master Admin can update/delete assets
CREATE POLICY "Only Master Admin can modify assets" ON assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Master Admin'
    )
  );

CREATE POLICY "Only Master Admin can delete assets" ON assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Master Admin'
    )
  );

-- Policy: Users can view audits
CREATE POLICY "Users can view audits" ON audits
  FOR SELECT USING (true);

-- Policy: Master Admin can manage audits
CREATE POLICY "Master Admin can manage audits" ON audits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Master Admin'
    )
  );

-- Policy: Users can view maintenance logs
CREATE POLICY "Users can view maintenance logs" ON maintenance_logs
  FOR SELECT USING (true);

-- Policy: Engineering/IT can manage maintenance logs
CREATE POLICY "Engineering/IT can manage maintenance logs" ON maintenance_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  );

-- Policy: Users can view work orders
CREATE POLICY "Users can view work orders" ON work_orders
  FOR SELECT USING (true);

-- Policy: Users can create work orders
CREATE POLICY "Users can create work orders" ON work_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Engineering/IT can manage work orders
CREATE POLICY "Engineering/IT can manage work orders" ON work_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Engineering', 'IT', 'Master Admin')
    )
  );

-- Policy: Users can view depreciation methods
CREATE POLICY "Users can view depreciation methods" ON depreciation_methods
  FOR SELECT USING (true);

-- Policy: Only Master Admin can manage depreciation methods
CREATE POLICY "Only Master Admin can manage depreciation methods" ON depreciation_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Master Admin'
    )
  );

