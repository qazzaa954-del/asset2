# Fix Infinite Recursion Error (42P17)

## Masalah

Error: `infinite recursion detected in policy for relation "users"` dengan error code `42P17`

### Penyebab

RLS (Row Level Security) policy pada tabel `users` menyebabkan infinite recursion karena:

1. Policy "Master Admin can manage users" mencoba SELECT dari tabel `users` untuk mengecek role
2. SELECT tersebut memicu policy lagi
3. Policy tersebut mencoba SELECT lagi, dan seterusnya → **infinite loop**

Contoh policy yang bermasalah:
```sql
CREATE POLICY "Master Admin can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users  -- ← Ini menyebabkan recursion!
      WHERE users.id = auth.uid()
      AND users.role = 'Master Admin'
    )
  );
```

## Solusi

File migration: **`supabase/migrations/013_fix_infinite_recursion_users_rls.sql`**

### Langkah Perbaikan

1. **Buka Supabase Dashboard → SQL Editor**

2. **Jalankan migration 013:**
   - Copy seluruh isi file `supabase/migrations/013_fix_infinite_recursion_users_rls.sql`
   - Paste ke SQL Editor
   - Klik **Run**

3. **Verifikasi:**
   ```sql
   -- Test apakah user bisa melihat profil mereka sendiri
   SELECT * FROM users WHERE id = auth.uid();
   
   -- Test function
   SELECT public.is_master_admin();
   ```

### Apa yang Diperbaiki?

1. ✅ **Membuat SECURITY DEFINER functions:**
   - `public.is_master_admin()` - Cek apakah user adalah Master Admin
   - `public.is_engineering_or_it()` - Cek apakah user adalah Engineering/IT
   - `public.can_manage_user()` - Cek apakah user bisa manage user lain
   
   Functions ini bypass RLS, sehingga tidak menyebabkan recursion.

2. ✅ **Memperbaiki semua RLS policies:**
   - Users table policies
   - Departments policies
   - Assets policies
   - Audits policies
   - Maintenance logs policies
   - Work orders policies
   - Depreciation methods policies

3. ✅ **Menghapus policies yang menyebabkan recursion:**
   - Drop semua policy lama yang menggunakan `EXISTS (SELECT FROM users)`
   - Buat policy baru yang menggunakan SECURITY DEFINER functions

## Setelah Perbaikan

Setelah menjalankan migration:

1. **Refresh browser** - Error seharusnya hilang
2. **User profile seharusnya bisa di-fetch** - Tidak ada lagi error 500
3. **Assets dan departments seharusnya bisa di-fetch** - Data muncul di halaman
4. **Dropdown departemen seharusnya berfungsi** - Tidak ada lagi error RLS

## Troubleshooting

### Jika masih ada error setelah migration:

1. **Cek apakah functions sudah dibuat:**
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('is_master_admin', 'is_engineering_or_it', 'can_manage_user');
   ```

2. **Cek policies yang aktif:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

3. **Test function langsung:**
   ```sql
   SELECT public.is_master_admin();
   -- Seharusnya return true/false, bukan error
   ```

4. **Cek apakah user sudah ada di tabel users:**
   ```sql
   SELECT id, email, role FROM users WHERE id = auth.uid();
   ```

### Jika function tidak bisa dijalankan:

1. **Pastikan user sudah login** - `auth.uid()` harus ada
2. **Cek permissions** - Function harus punya SECURITY DEFINER
3. **Cek schema** - Function harus di schema `public`

## Catatan Penting

- **SECURITY DEFINER functions** bypass RLS, jadi harus digunakan dengan hati-hati
- Functions ini hanya bisa dijalankan oleh authenticated users (auth.uid() tersedia)
- Functions ini STABLE, artinya hasilnya konsisten dalam satu transaction

## Verifikasi Lengkap

Setelah migration, test semua fitur:

1. ✅ Login sebagai Master Admin
2. ✅ User profile muncul di sidebar
3. ✅ Halaman Assets menampilkan data
4. ✅ Dropdown departemen berfungsi
5. ✅ Bisa tambah/edit/delete assets
6. ✅ Bisa manage users
7. ✅ Tidak ada error di console browser

Jika semua test berhasil, masalah sudah teratasi! 🎉
