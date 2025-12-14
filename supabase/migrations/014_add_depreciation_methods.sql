-- Add Depreciation Methods: Saldo Menurun dan Jumlah Angka Tahun
-- Sesuai dengan standar akuntansi

-- 1. Insert Metode Saldo Menurun (Declining Balance Method)
INSERT INTO depreciation_methods (name, formula, description, is_active)
VALUES (
  'Saldo Menurun (Declining Balance)',
  'book_value = acquisition_price * (1 - depreciation_rate) ^ years_used WHERE depreciation_rate = 2 / estimated_lifespan',
  'Metode Saldo Menurun (Declining Balance Method) menghitung depresiasi dengan persentase tetap dari nilai buku yang tersisa. Biasanya menggunakan double-declining balance (2x straight-line rate). Nilai buku menurun lebih cepat di tahun-tahun awal.',
  true
)
ON CONFLICT DO NOTHING;

-- 2. Insert Metode Jumlah Angka Tahun (Sum-of-the-Years'' Digits - SYD)
INSERT INTO depreciation_methods (name, formula, description, is_active)
VALUES (
  'Jumlah Angka Tahun (SYD)',
  'book_value = acquisition_price - (acquisition_price * (remaining_life / sum_of_years) * years_used) WHERE sum_of_years = estimated_lifespan * (estimated_lifespan + 1) / 2',
  'Metode Jumlah Angka Tahun (Sum-of-the-Years'' Digits - SYD) menghitung depresiasi dengan proporsi yang lebih besar di tahun-tahun awal. Proporsi dihitung berdasarkan sisa umur aset dibagi dengan jumlah total angka tahun.',
  true
)
ON CONFLICT DO NOTHING;

-- 3. Update formula untuk Straight-Line agar lebih jelas
UPDATE depreciation_methods
SET formula = 'book_value = acquisition_price - ((acquisition_price / estimated_lifespan) * years_used)',
    description = 'Metode Garis Lurus (Straight-Line Method) menghitung depresiasi dengan membagi nilai perolehan secara merata selama umur ekonomis aset. Depresiasi tahunan = (Harga Perolehan - Nilai Sisa) / Umur Ekonomis.'
WHERE name = 'Straight-Line';

-- Catatan:
-- Untuk implementasi perhitungan di aplikasi, perlu dibuat function JavaScript/TypeScript
-- yang menghitung book_value berdasarkan metode yang dipilih.
