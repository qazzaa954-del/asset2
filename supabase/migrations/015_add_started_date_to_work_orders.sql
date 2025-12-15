-- Add started_date column to work_orders table
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS started_date DATE;

-- Add comment
COMMENT ON COLUMN work_orders.started_date IS 'Tanggal mulai pekerjaan (untuk IT/Engineering)';

