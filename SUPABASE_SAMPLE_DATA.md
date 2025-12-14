# SQL Sample Data - 55 Assets

File SQL untuk insert sample data: **`supabase/migrations/012_sample_data_55_assets.sql`**

## Cara Menggunakan

### Opsi 1: Via Supabase Dashboard (Recommended)
1. Buka Supabase Dashboard → SQL Editor
2. Copy seluruh isi file `012_sample_data_55_assets.sql`
3. Paste ke SQL Editor
4. Klik **Run** atau tekan `Ctrl+Enter`
5. Pastikan ada Master Admin user di tabel `users` sebelum menjalankan script

### Opsi 2: Via Supabase CLI
```bash
supabase db reset  # Reset database dan jalankan semua migrations
# atau
supabase migration up  # Jalankan migration baru saja
```

## Isi Sample Data

Script ini akan membuat **55 aset** (5 aset per departemen):

- **FBS** (FB Service): 5 aset
- **FBP** (FB Produksi): 5 aset
- **HK**: 5 aset
- **HR** (Human Resources): 5 aset
- **FIN** (Finance & Accounting): 5 aset
- **SM** (Sales & Marketing): 5 aset
- **SEC**: 5 aset
- **IT** (Information Technology): 5 aset
- **RA** (Rekreasi & Adventure): 5 aset
- **FO** (Front Office): 5 aset
- **GAR** (Gardener): 5 aset

## Fitur Script

✅ **Auto-generate Asset Code**: Format `DEPT-XXXX` (contoh: FBS-0001, IT-0001)
✅ **Auto-generate Barcode**: Sama dengan asset code
✅ **Auto-calculate Book Value**: Menghitung nilai buku berdasarkan depresiasi straight-line
✅ **Auto-sequence**: Otomatis melanjutkan nomor urut dari aset yang sudah ada
✅ **Variasi Data**: Berbagai kondisi (Baik, Rusak Ringan), status (Aktif, Repair), dan kategori (Room, Public Area, Office)

## Prerequisites

1. ✅ Semua migration sebelumnya sudah dijalankan (001-011)
2. ✅ Master Admin user sudah dibuat di tabel `users`
3. ✅ Semua departemen sudah ada di tabel `departments`

## Verifikasi

Setelah menjalankan script, cek dengan query:

```sql
-- Cek total aset per departemen
SELECT 
  d.name AS departemen,
  COUNT(a.id) AS total_aset
FROM departments d
LEFT JOIN assets a ON a.department_id = d.id
GROUP BY d.id, d.name
ORDER BY d.name;

-- Cek semua aset yang baru dibuat
SELECT 
  asset_code,
  asset_name,
  location,
  condition,
  status,
  book_value
FROM assets
ORDER BY asset_code;
```

## Catatan

- Script menggunakan fungsi `get_next_asset_sequence()` untuk auto-generate nomor urut
- Script menggunakan fungsi `calculate_book_value_func()` untuk menghitung nilai buku
- Jika ada aset yang sudah ada, script akan melanjutkan nomor urut dari yang terakhir
- Fungsi-fungsi helper bisa dihapus di akhir script (ada di bagian comment)

## Troubleshooting

**Error: "No Master Admin user found"**
- Pastikan sudah ada user dengan role 'Master Admin' di tabel `users`
- Cek dengan: `SELECT * FROM users WHERE role = 'Master Admin';`

**Error: Department not found**
- Pastikan semua departemen sudah di-insert dari migration 001
- Cek dengan: `SELECT * FROM departments;`

**Asset code duplikat**
- Script otomatis menghindari duplikat dengan mengambil nomor urut terakhir
- Jika masih error, cek tabel assets: `SELECT asset_code FROM assets ORDER BY asset_code;`
