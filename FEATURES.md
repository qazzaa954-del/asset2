# Fitur Asset-Damar-Langit

## ✅ Fitur yang Telah Diimplementasikan

### 1. Struktur Master Data

#### Master Departemen
- ✅ Tabel dengan: Kode Dept, Nama Departemen, Inisial Kode Aset
- ✅ Data awal 11 departemen:
  - FB Service (FBS)
  - FB Produksi (FBP)
  - HK
  - HR Human Resources (HR)
  - FIN Finance & Accounting (FIN)
  - SM Sales & Marketing (SM)
  - SEC
  - IT Information Technology (IT)
  - RA Rekreasi & Adventure (RA)
  - FO Front Office (FO)
  - GAR Gardener (GAR)
- ✅ Hanya Master Admin yang dapat mengelola

### 2. Modul Master Inventory Aset

#### Form Input
- ✅ Identitas Aset:
  - Nama Aset
  - Kode Aset (Otomatis: Inisial Dept + Nomor Urut)
  - Lokasi (Spesifik: Kamar/Area Publik/Office)
  - Departemen Penanggung Jawab

- ✅ Spesifikasi:
  - Satuan (Dropdown: Pcs, Unit, Set, dll.)
  - Tahun Perolehan
  - Harga Perolehan
  - Estimasi Umur (Tahun)

- ✅ Kondisi Aset: (Dropdown: Baik, Rusak Ringan, Rusak Berat)
- ✅ Status Aset: (Dropdown: Aktif, Disposal, Repair)
- ✅ Kategori Tambahan: (Dropdown wajib: Room, Public Area, Office)

#### Otomasi
- ✅ Foto Aset: Wajib, dengan opsi Upload dan Ambil Foto Langsung (capture)
- ✅ Barcode Aset: Generate Barcode Otomatis setelah penyimpanan
- ✅ Tombol Input Cerdas: 
  - Dropdown "Input Cerdas" dengan opsi:
    - Tambah 5 Unit Sekaligus
    - Tambah 10 Unit Sekaligus
    - Tambah 20 Unit Sekaligus
  - Form bulk input dengan auto-numbering nama aset

### 3. Modul Finansial & Audit

#### Perhitungan Depresiasi
- ✅ Menu Depresiasi terpisah
- ✅ Depresiasi Dihitung Otomatis (Straight-Line Method)
- ✅ Nilai Buku (Otomatis terhitung)
- ✅ Master Admin dapat menambah/kurangi metode depresiasi

#### Informasi Audit
- ✅ Tanggal Audit Terakhir
- ✅ Auditor
- ✅ Catatan / Temuan

#### Menu Audit Aset
- ✅ Hanya dapat diakses oleh Master Admin
- ✅ Menampilkan seluruh aset secara Real Time
- ✅ Fungsi Export CSV

### 4. Modul Rekapitulasi & Laporan (Dashboard)

#### Dashboard Utama
- ✅ Ringkasan data Interaktif & Rapi dengan Chart:
  - Pie Chart Kondisi Aset
  - Bar Chart Total Aset per Dept
- ✅ Statistik Cards:
  - Total Aset
  - Nilai Total Aset
  - Work Order Pending
  - Aset Dalam Perbaikan

#### Tabel Rekapitulasi Audit Departemen
- ✅ Departemen
- ✅ Total Aset
- ✅ Baik
- ✅ Rusak Ringan
- ✅ Rusak Berat
- ✅ Dalam Perbaikan
- ✅ Nilai Buku Total
- ✅ Export CSV

#### Log Aset
- ✅ Riwayat Audit (Tanggal, Hasil, Auditor, Temuan)
- ✅ Riwayat Maintenance (Tanggal, Jenis Perbaikan, Biaya, Vendor Servis)
- ✅ Halaman Detail Aset dengan tab/log lengkap

### 5. Modul Work Order (WO)

#### Akses Terbatas
- ✅ Hanya untuk departemen Engineering & IT
- ✅ Master Admin juga memiliki akses

#### Mekanisme Pelaporan
- ✅ Form input "Input Form WO Profesional"
- ✅ Pengisian form otomatis memicu pembuatan Work Order
- ✅ Pemberitahuan Real-Time (Notifikasi di Dashboard)
- ✅ WO mencakup foto Before & After perbaikan

#### Smart Maintenance Scheduling
- ✅ Sistem mengidentifikasi aset yang membutuhkan check/service:
  - Aset Rusak Ringan
  - Aset Rusak Berat
- ✅ Mengusulkan Jadwal Perbaikan Selanjutnya
- ✅ Secara otomatis membuat Draft Work Order Terjadwal
- ✅ Terhubung pada dashboard Engineering & IT
- ✅ Setiap aset memiliki log Riwayat Maintenance

### 6. Manajemen Pengguna & Hak Akses

#### Menu Manajemen Pengguna & Hak Akses
- ✅ Hanya dapat diakses oleh Master Admin
- ✅ Menambah dan Mengurangi User
- ✅ Edit user (email, nama, role, departemen)
- ✅ Aktifkan/Nonaktifkan user

#### Kontrol Master Admin
- ✅ Hanya Master Admin yang dapat Hapus Seluruhnya atau Edit data aset
- ✅ Hanya Master Admin yang memiliki akses ke Menu Audit Aset
- ✅ Hanya Master Admin yang dapat menambah/mengurangi metode Depresiasi
- ✅ Hanya Master Admin yang dapat mengelola departemen
- ✅ Hanya Master Admin yang dapat mengelola pengguna

### 7. Data Contoh Awal

- ✅ Script seed data untuk 55 aset
- ✅ 5 contoh data aset per departemen
- ✅ Struktur data sesuai spesifikasi
- ✅ Barcode Otomatis untuk setiap aset
- ✅ Foto dapat diupload melalui aplikasi

### 8. Fitur Tambahan

- ✅ Authentication dengan Supabase Auth
- ✅ Role-based Access Control (RBAC)
- ✅ Responsive Design dengan Tailwind CSS
- ✅ Real-time data dengan Supabase
- ✅ File upload ke Supabase Storage
- ✅ Barcode generation dengan JsBarcode
- ✅ Chart visualization dengan Recharts
- ✅ Export CSV functionality

## Teknologi yang Digunakan

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Barcode**: JsBarcode
- **Icons**: Lucide React

## Struktur Database

- `departments` - Master data departemen
- `users` - Data pengguna dengan role
- `assets` - Data aset
- `audits` - Riwayat audit
- `maintenance_logs` - Riwayat maintenance
- `work_orders` - Data work order
- `depreciation_methods` - Metode depresiasi

## Security

- Row Level Security (RLS) di Supabase
- Role-based access control
- Protected routes dengan authentication
- Secure file upload ke Supabase Storage

