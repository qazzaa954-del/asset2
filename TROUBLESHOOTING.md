# Troubleshooting Guide

## Masalah yang Sudah Diperbaiki

### 1. ✅ Dropdown Departemen Tidak Berfungsi
**Masalah:** Dropdown departemen tidak bisa dibuka atau tidak menampilkan opsi.

**Solusi yang Diterapkan:**
- ✅ Menambahkan placeholder "Pilih Departemen" di komponen Select
- ✅ Menambahkan disabled state saat departments sedang dimuat
- ✅ Menambahkan error handling untuk fetch departments
- ✅ Menambahkan logging untuk debugging

**Cara Verifikasi:**
1. Buka halaman Assets
2. Klik tombol "Tambah Aset"
3. Dropdown "Departemen" seharusnya menampilkan daftar departemen
4. Jika masih kosong, cek console browser untuk error

### 2. ✅ Data Assets Tidak Muncul
**Masalah:** Tabel assets kosong meskipun ada data di database.

**Solusi yang Diterapkan:**
- ✅ Menambahkan loading state dengan spinner
- ✅ Menambahkan empty state dengan pesan yang jelas
- ✅ Menambahkan error handling yang lebih baik
- ✅ Menambahkan logging untuk debugging
- ✅ Memastikan query mengurutkan data dengan benar

**Cara Verifikasi:**
1. Buka halaman Assets
2. Jika tidak ada data, akan muncul pesan "Belum ada data aset"
3. Klik "Generate Sample Data" untuk membuat 55 aset dummy
4. Data seharusnya muncul setelah generate

### 3. ✅ User Profile Tidak Ditemukan
**Masalah:** Meskipun sudah login sebagai Master Admin, masih muncul warning "Profil User Tidak Ditemukan".

**Solusi yang Diterapkan:**
- ✅ Auto-create user profile jika tidak ditemukan
- ✅ Menggunakan data dari auth.user untuk membuat profile
- ✅ Menambahkan error handling yang lebih baik
- ✅ Menambahkan logging untuk debugging

**Cara Verifikasi:**
1. Login ke aplikasi
2. Jika user profile tidak ada, sistem akan otomatis membuatnya
3. Cek console browser untuk log "User profile created successfully"
4. Refresh halaman, warning seharusnya hilang

### 4. ✅ Dashboard Ada Data Tapi Assets Tidak Ada
**Masalah:** Dashboard menampilkan data (55 aset) tapi halaman Assets kosong.

**Solusi yang Diterapkan:**
- ✅ Memastikan query assets menggunakan order yang benar
- ✅ Menambahkan error handling untuk RLS policies
- ✅ Memastikan fetch data dipanggil dengan benar
- ✅ Menambahkan loading dan empty states

**Cara Verifikasi:**
1. Buka Dashboard - seharusnya menampilkan "Total Aset: 55"
2. Buka halaman Assets - seharusnya menampilkan 55 aset dalam tabel
3. Jika masih kosong, cek console untuk error RLS

## Cara Mengatasi Masalah

### Jika Dropdown Departemen Masih Kosong:

1. **Cek Console Browser:**
   - Buka Developer Tools (F12)
   - Lihat tab Console
   - Cari error terkait "departments" atau "RLS"

2. **Cek Supabase Dashboard:**
   ```sql
   SELECT * FROM departments;
   ```
   - Pastikan ada data departemen

3. **Cek RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'departments';
   ```
   - Pastikan policy mengizinkan SELECT untuk user yang login

### Jika Data Assets Tidak Muncul:

1. **Cek Console Browser:**
   - Lihat error di console
   - Cek apakah ada error RLS atau permission

2. **Cek Supabase Dashboard:**
   ```sql
   SELECT COUNT(*) FROM assets;
   SELECT * FROM assets LIMIT 5;
   ```
   - Pastikan ada data assets

3. **Generate Sample Data:**
   - Klik tombol "Generate Sample Data (55 Aset)" di halaman Assets
   - Atau jalankan SQL migration `012_sample_data_55_assets.sql`

4. **Cek RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'assets';
   ```
   - Pastikan policy mengizinkan SELECT untuk user yang login

### Jika User Profile Tidak Ditemukan:

1. **Cek Auth User:**
   ```sql
   SELECT id, email FROM auth.users;
   ```

2. **Cek Users Table:**
   ```sql
   SELECT * FROM users;
   ```

3. **Buat User Profile Manual (jika perlu):**
   ```sql
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     'USER_ID_DARI_AUTH_USERS',
     'email@example.com',
     'Nama User',
     'Master Admin',
     true
   );
   ```

4. **Jalankan Migration 011:**
   - Migration 011 akan membuat trigger untuk auto-create user profile
   - Jalankan di Supabase SQL Editor

## Tips Debugging

1. **Gunakan Browser Console:**
   - Buka Developer Tools (F12)
   - Lihat tab Console untuk error messages
   - Lihat tab Network untuk cek API calls

2. **Gunakan Supabase Logs:**
   - Buka Supabase Dashboard
   - Lihat tab Logs untuk melihat query yang dijalankan
   - Cek apakah ada error di logs

3. **Test Query Langsung:**
   - Gunakan Supabase SQL Editor
   - Test query yang sama dengan yang digunakan di aplikasi
   - Pastikan query berhasil di SQL Editor

4. **Cek RLS Policies:**
   - Pastikan RLS policies mengizinkan akses untuk user yang login
   - Test dengan user yang berbeda (Master Admin, User, dll)

## Kontak Support

Jika masalah masih terjadi setelah mengikuti troubleshooting di atas:
1. Screenshot error message dari console browser
2. Screenshot error dari Supabase Dashboard
3. Copy query yang error dari Network tab
4. Hubungi administrator atau developer
