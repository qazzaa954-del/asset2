-- Sample Data: 55 Assets (5 per department)
-- Run this after all migrations are complete
-- Requires: Master Admin user must exist in users table

-- Function to get next sequence number for a department
CREATE OR REPLACE FUNCTION get_next_asset_sequence(dept_initial_code VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  last_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(asset_code, '-', 2) AS INTEGER)), 0)
  INTO last_seq
  FROM assets
  WHERE asset_code LIKE dept_initial_code || '-%';
  
  RETURN last_seq + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate book value
CREATE OR REPLACE FUNCTION calculate_book_value_func(
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
  years_used := GREATEST(0, current_year - acquisition_year);
  
  IF years_used >= estimated_lifespan THEN
    book_value := 0;
  ELSE
    annual_depreciation := acquisition_price / estimated_lifespan;
    book_value := GREATEST(0, acquisition_price - (annual_depreciation * years_used));
  END IF;
  
  RETURN book_value;
END;
$$ LANGUAGE plpgsql;

-- Insert Sample Assets
-- Note: Replace 'YOUR_ADMIN_USER_ID' with actual Master Admin user ID from users table
DO $$
DECLARE
  admin_user_id UUID;
  dept_fbs_id UUID;
  dept_fbp_id UUID;
  dept_hk_id UUID;
  dept_hr_id UUID;
  dept_fin_id UUID;
  dept_sm_id UUID;
  dept_sec_id UUID;
  dept_it_id UUID;
  dept_ra_id UUID;
  dept_fo_id UUID;
  dept_gar_id UUID;
  seq_num INTEGER;
  asset_code_val VARCHAR;
BEGIN
  -- Get Master Admin user ID (use first Master Admin found)
  SELECT id INTO admin_user_id
  FROM users
  WHERE role = 'Master Admin'
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No Master Admin user found. Please create one first.';
  END IF;
  
  -- Get department IDs
  SELECT id INTO dept_fbs_id FROM departments WHERE code = 'FBS';
  SELECT id INTO dept_fbp_id FROM departments WHERE code = 'FBP';
  SELECT id INTO dept_hk_id FROM departments WHERE code = 'HK';
  SELECT id INTO dept_hr_id FROM departments WHERE code = 'HR';
  SELECT id INTO dept_fin_id FROM departments WHERE code = 'FIN';
  SELECT id INTO dept_sm_id FROM departments WHERE code = 'SM';
  SELECT id INTO dept_sec_id FROM departments WHERE code = 'SEC';
  SELECT id INTO dept_it_id FROM departments WHERE code = 'IT';
  SELECT id INTO dept_ra_id FROM departments WHERE code = 'RA';
  SELECT id INTO dept_fo_id FROM departments WHERE code = 'FO';
  SELECT id INTO dept_gar_id FROM departments WHERE code = 'GAR';
  
  -- FBS Department (5 assets)
  seq_num := get_next_asset_sequence('FBS');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Meja Makan Restoran', 'FBS-' || LPAD(seq_num::TEXT, 4, '0'), 'Restoran Utama', dept_fbs_id, 'Unit', 2022, 2500000, 10, 'Baik', 'Aktif', 'Public Area', 'FBS-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(2500000, 2022, 10), admin_user_id),
    ('Kursi Restoran', 'FBS-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Restoran Utama', dept_fbs_id, 'Unit', 2022, 500000, 8, 'Baik', 'Aktif', 'Public Area', 'FBS-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(500000, 2022, 8), admin_user_id),
    ('Piring Makan', 'FBS-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Dapur Restoran', dept_fbs_id, 'Set', 2023, 150000, 5, 'Baik', 'Aktif', 'Public Area', 'FBS-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(150000, 2023, 5), admin_user_id),
    ('Gelas Minum', 'FBS-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Bar Area', dept_fbs_id, 'Set', 2023, 200000, 5, 'Rusak Ringan', 'Aktif', 'Public Area', 'FBS-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(200000, 2023, 5), admin_user_id),
    ('Kompor Gas', 'FBS-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Dapur Restoran', dept_fbs_id, 'Unit', 2021, 5000000, 10, 'Baik', 'Aktif', 'Public Area', 'FBS-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(5000000, 2021, 10), admin_user_id);
  
  -- FBP Department (5 assets)
  seq_num := get_next_asset_sequence('FBP');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Mixer Roti', 'FBP-' || LPAD(seq_num::TEXT, 4, '0'), 'Dapur Produksi', dept_fbp_id, 'Unit', 2022, 8000000, 12, 'Baik', 'Aktif', 'Office', 'FBP-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(8000000, 2022, 12), admin_user_id),
    ('Oven Roti', 'FBP-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Dapur Produksi', dept_fbp_id, 'Unit', 2021, 12000000, 15, 'Baik', 'Aktif', 'Office', 'FBP-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(12000000, 2021, 15), admin_user_id),
    ('Kulkas Bahan Baku', 'FBP-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Gudang Bahan', dept_fbp_id, 'Unit', 2020, 10000000, 10, 'Rusak Ringan', 'Repair', 'Office', 'FBP-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(10000000, 2020, 10), admin_user_id),
    ('Timbangan Digital', 'FBP-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Dapur Produksi', dept_fbp_id, 'Unit', 2023, 1500000, 8, 'Baik', 'Aktif', 'Office', 'FBP-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(1500000, 2023, 8), admin_user_id),
    ('Meja Kerja Stainless', 'FBP-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Dapur Produksi', dept_fbp_id, 'Unit', 2022, 3000000, 10, 'Baik', 'Aktif', 'Office', 'FBP-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(3000000, 2022, 10), admin_user_id);
  
  -- HK Department (5 assets)
  seq_num := get_next_asset_sequence('HK');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Vacuum Cleaner', 'HK-' || LPAD(seq_num::TEXT, 4, '0'), 'Lantai 1', dept_hk_id, 'Unit', 2023, 2500000, 8, 'Baik', 'Aktif', 'Public Area', 'HK-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(2500000, 2023, 8), admin_user_id),
    ('Mesin Cuci', 'HK-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Laundry Room', dept_hk_id, 'Unit', 2022, 6000000, 10, 'Baik', 'Aktif', 'Office', 'HK-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(6000000, 2022, 10), admin_user_id),
    ('Pengering Pakaian', 'HK-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Laundry Room', dept_hk_id, 'Unit', 2022, 5000000, 10, 'Baik', 'Aktif', 'Office', 'HK-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(5000000, 2022, 10), admin_user_id),
    ('Setrika Uap', 'HK-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Laundry Room', dept_hk_id, 'Unit', 2023, 2000000, 7, 'Baik', 'Aktif', 'Office', 'HK-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(2000000, 2023, 7), admin_user_id),
    ('Keranjang Laundry', 'HK-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Laundry Room', dept_hk_id, 'Unit', 2023, 300000, 5, 'Baik', 'Aktif', 'Office', 'HK-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(300000, 2023, 5), admin_user_id);
  
  -- HR Department (5 assets)
  seq_num := get_next_asset_sequence('HR');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Laptop HR', 'HR-' || LPAD(seq_num::TEXT, 4, '0'), 'Kantor HR', dept_hr_id, 'Unit', 2023, 12000000, 5, 'Baik', 'Aktif', 'Office', 'HR-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(12000000, 2023, 5), admin_user_id),
    ('Printer HR', 'HR-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Kantor HR', dept_hr_id, 'Unit', 2022, 3000000, 5, 'Baik', 'Aktif', 'Office', 'HR-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(3000000, 2022, 5), admin_user_id),
    ('Filing Cabinet', 'HR-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Kantor HR', dept_hr_id, 'Unit', 2021, 2500000, 15, 'Baik', 'Aktif', 'Office', 'HR-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(2500000, 2021, 15), admin_user_id),
    ('Meja Kerja HR', 'HR-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Kantor HR', dept_hr_id, 'Unit', 2022, 2000000, 10, 'Baik', 'Aktif', 'Office', 'HR-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(2000000, 2022, 10), admin_user_id),
    ('Kursi Kantor', 'HR-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Kantor HR', dept_hr_id, 'Unit', 2022, 1500000, 8, 'Rusak Ringan', 'Aktif', 'Office', 'HR-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(1500000, 2022, 8), admin_user_id);
  
  -- FIN Department (5 assets)
  seq_num := get_next_asset_sequence('FIN');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Laptop Finance', 'FIN-' || LPAD(seq_num::TEXT, 4, '0'), 'Kantor Finance', dept_fin_id, 'Unit', 2023, 15000000, 5, 'Baik', 'Aktif', 'Office', 'FIN-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(15000000, 2023, 5), admin_user_id),
    ('Calculator', 'FIN-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Kantor Finance', dept_fin_id, 'Unit', 2023, 500000, 10, 'Baik', 'Aktif', 'Office', 'FIN-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(500000, 2023, 10), admin_user_id),
    ('Brankas', 'FIN-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Kantor Finance', dept_fin_id, 'Unit', 2021, 8000000, 20, 'Baik', 'Aktif', 'Office', 'FIN-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(8000000, 2021, 20), admin_user_id),
    ('Printer Finance', 'FIN-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Kantor Finance', dept_fin_id, 'Unit', 2022, 4000000, 5, 'Baik', 'Aktif', 'Office', 'FIN-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(4000000, 2022, 5), admin_user_id),
    ('Meja Kasir', 'FIN-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Kantor Finance', dept_fin_id, 'Unit', 2022, 3000000, 10, 'Baik', 'Aktif', 'Office', 'FIN-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(3000000, 2022, 10), admin_user_id);
  
  -- SM Department (5 assets)
  seq_num := get_next_asset_sequence('SM');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Banner Promosi', 'SM-' || LPAD(seq_num::TEXT, 4, '0'), 'Lobby', dept_sm_id, 'Lembar', 2023, 500000, 2, 'Baik', 'Aktif', 'Public Area', 'SM-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(500000, 2023, 2), admin_user_id),
    ('Stand Banner', 'SM-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Lobby', dept_sm_id, 'Unit', 2022, 800000, 5, 'Baik', 'Aktif', 'Public Area', 'SM-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(800000, 2022, 5), admin_user_id),
    ('Kamera Promosi', 'SM-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Kantor Marketing', dept_sm_id, 'Unit', 2023, 10000000, 5, 'Baik', 'Aktif', 'Office', 'SM-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(10000000, 2023, 5), admin_user_id),
    ('Laptop Marketing', 'SM-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Kantor Marketing', dept_sm_id, 'Unit', 2023, 12000000, 5, 'Baik', 'Aktif', 'Office', 'SM-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(12000000, 2023, 5), admin_user_id),
    ('Projector', 'SM-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Ruang Meeting', dept_sm_id, 'Unit', 2022, 8000000, 8, 'Baik', 'Aktif', 'Office', 'SM-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(8000000, 2022, 8), admin_user_id);
  
  -- SEC Department (5 assets)
  seq_num := get_next_asset_sequence('SEC');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Walkie Talkie', 'SEC-' || LPAD(seq_num::TEXT, 4, '0'), 'Pos Security', dept_sec_id, 'Unit', 2023, 1500000, 5, 'Baik', 'Aktif', 'Office', 'SEC-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(1500000, 2023, 5), admin_user_id),
    ('CCTV Camera', 'SEC-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Lobby', dept_sec_id, 'Unit', 2022, 3000000, 8, 'Baik', 'Aktif', 'Public Area', 'SEC-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(3000000, 2022, 8), admin_user_id),
    ('Flashlight', 'SEC-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Pos Security', dept_sec_id, 'Unit', 2023, 200000, 3, 'Baik', 'Aktif', 'Office', 'SEC-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(200000, 2023, 3), admin_user_id),
    ('Meja Security', 'SEC-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Pos Security', dept_sec_id, 'Unit', 2021, 1500000, 10, 'Rusak Ringan', 'Aktif', 'Office', 'SEC-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(1500000, 2021, 10), admin_user_id),
    ('Kursi Security', 'SEC-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Pos Security', dept_sec_id, 'Unit', 2021, 800000, 8, 'Baik', 'Aktif', 'Office', 'SEC-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(800000, 2021, 8), admin_user_id);
  
  -- IT Department (5 assets)
  seq_num := get_next_asset_sequence('IT');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Server Rack', 'IT-' || LPAD(seq_num::TEXT, 4, '0'), 'Server Room', dept_it_id, 'Unit', 2021, 15000000, 10, 'Baik', 'Aktif', 'Office', 'IT-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(15000000, 2021, 10), admin_user_id),
    ('Router Network', 'IT-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Server Room', dept_it_id, 'Unit', 2022, 5000000, 5, 'Baik', 'Aktif', 'Office', 'IT-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(5000000, 2022, 5), admin_user_id),
    ('Laptop IT', 'IT-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Kantor IT', dept_it_id, 'Unit', 2023, 14000000, 5, 'Baik', 'Aktif', 'Office', 'IT-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(14000000, 2023, 5), admin_user_id),
    ('Monitor', 'IT-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Kantor IT', dept_it_id, 'Unit', 2023, 3000000, 5, 'Baik', 'Aktif', 'Office', 'IT-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(3000000, 2023, 5), admin_user_id),
    ('Switch Network', 'IT-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Server Room', dept_it_id, 'Unit', 2022, 4000000, 8, 'Baik', 'Aktif', 'Office', 'IT-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(4000000, 2022, 8), admin_user_id);
  
  -- RA Department (5 assets)
  seq_num := get_next_asset_sequence('RA');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Perahu Kano', 'RA-' || LPAD(seq_num::TEXT, 4, '0'), 'Danau', dept_ra_id, 'Unit', 2022, 8000000, 10, 'Baik', 'Aktif', 'Public Area', 'RA-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(8000000, 2022, 10), admin_user_id),
    ('Sepeda Gunung', 'RA-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Gudang Adventure', dept_ra_id, 'Unit', 2023, 5000000, 8, 'Baik', 'Aktif', 'Public Area', 'RA-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(5000000, 2023, 8), admin_user_id),
    ('Tenda Camping', 'RA-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Gudang Adventure', dept_ra_id, 'Unit', 2022, 3000000, 5, 'Baik', 'Aktif', 'Public Area', 'RA-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(3000000, 2022, 5), admin_user_id),
    ('Alat Panjat Tebing', 'RA-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Gudang Adventure', dept_ra_id, 'Set', 2023, 4000000, 5, 'Baik', 'Aktif', 'Public Area', 'RA-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(4000000, 2023, 5), admin_user_id),
    ('Life Jacket', 'RA-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Danau', dept_ra_id, 'Unit', 2023, 500000, 5, 'Baik', 'Aktif', 'Public Area', 'RA-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(500000, 2023, 5), admin_user_id);
  
  -- FO Department (5 assets)
  seq_num := get_next_asset_sequence('FO');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Komputer Front Desk', 'FO-' || LPAD(seq_num::TEXT, 4, '0'), 'Lobby', dept_fo_id, 'Unit', 2023, 10000000, 5, 'Baik', 'Aktif', 'Public Area', 'FO-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(10000000, 2023, 5), admin_user_id),
    ('Printer Front Desk', 'FO-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Lobby', dept_fo_id, 'Unit', 2022, 2500000, 5, 'Baik', 'Aktif', 'Public Area', 'FO-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(2500000, 2022, 5), admin_user_id),
    ('Meja Reception', 'FO-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Lobby', dept_fo_id, 'Unit', 2022, 4000000, 10, 'Baik', 'Aktif', 'Public Area', 'FO-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(4000000, 2022, 10), admin_user_id),
    ('Kursi Reception', 'FO-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Lobby', dept_fo_id, 'Unit', 2022, 2000000, 8, 'Baik', 'Aktif', 'Public Area', 'FO-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(2000000, 2022, 8), admin_user_id),
    ('Telepon Front Desk', 'FO-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Lobby', dept_fo_id, 'Unit', 2023, 1500000, 5, 'Baik', 'Aktif', 'Public Area', 'FO-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(1500000, 2023, 5), admin_user_id);
  
  -- GAR Department (5 assets)
  seq_num := get_next_asset_sequence('GAR');
  INSERT INTO assets (asset_name, asset_code, location, department_id, unit, acquisition_year, acquisition_price, estimated_lifespan, condition, status, category, barcode, book_value, created_by)
  VALUES 
    ('Mesin Potong Rumput', 'GAR-' || LPAD(seq_num::TEXT, 4, '0'), 'Gudang Alat', dept_gar_id, 'Unit', 2022, 6000000, 8, 'Baik', 'Aktif', 'Public Area', 'GAR-' || LPAD(seq_num::TEXT, 4, '0'), calculate_book_value_func(6000000, 2022, 8), admin_user_id),
    ('Selang Air', 'GAR-' || LPAD((seq_num+1)::TEXT, 4, '0'), 'Gudang Alat', dept_gar_id, 'Unit', 2023, 500000, 5, 'Baik', 'Aktif', 'Public Area', 'GAR-' || LPAD((seq_num+1)::TEXT, 4, '0'), calculate_book_value_func(500000, 2023, 5), admin_user_id),
    ('Gunting Tanaman', 'GAR-' || LPAD((seq_num+2)::TEXT, 4, '0'), 'Gudang Alat', dept_gar_id, 'Unit', 2023, 300000, 5, 'Baik', 'Aktif', 'Public Area', 'GAR-' || LPAD((seq_num+2)::TEXT, 4, '0'), calculate_book_value_func(300000, 2023, 5), admin_user_id),
    ('Pupuk Organik', 'GAR-' || LPAD((seq_num+3)::TEXT, 4, '0'), 'Gudang Alat', dept_gar_id, 'Set', 2023, 800000, 2, 'Baik', 'Aktif', 'Public Area', 'GAR-' || LPAD((seq_num+3)::TEXT, 4, '0'), calculate_book_value_func(800000, 2023, 2), admin_user_id),
    ('Pot Tanaman', 'GAR-' || LPAD((seq_num+4)::TEXT, 4, '0'), 'Gudang Alat', dept_gar_id, 'Unit', 2022, 200000, 10, 'Rusak Ringan', 'Aktif', 'Public Area', 'GAR-' || LPAD((seq_num+4)::TEXT, 4, '0'), calculate_book_value_func(200000, 2022, 10), admin_user_id);
  
  RAISE NOTICE 'Sample data inserted successfully! Total: 55 assets (5 per department)';
END $$;

-- Clean up temporary functions (optional - comment out if you want to keep them)
-- DROP FUNCTION IF EXISTS get_next_asset_sequence(VARCHAR);
-- DROP FUNCTION IF EXISTS calculate_book_value_func(DECIMAL, INTEGER, INTEGER);
