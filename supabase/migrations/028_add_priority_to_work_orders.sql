-- Add Priority Level to Work Orders
-- Priority: Low, Medium, High, Urgent

-- STEP 1: Add priority column to work_orders table
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium' 
CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));

-- STEP 2: Add comment
COMMENT ON COLUMN work_orders.priority IS 'Priority level: Low, Medium, High, Urgent';

-- STEP 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);

-- STEP 4: Update existing work orders to have default priority
UPDATE work_orders
SET priority = 'Medium'
WHERE priority IS NULL;

