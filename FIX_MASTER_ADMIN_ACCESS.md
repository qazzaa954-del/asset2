# Perbaikan Akses Master Admin

## Masalah
User sudah login sebagai Master Admin tapi selalu mendapat "Akses ditolak".

## Penyebab Kemungkinan

1. **Role di database memiliki spasi atau karakter aneh**
2. **Role checking di code tidak konsisten**
3. **RLS policy terlalu ketat**

## Solusi yang Sudah Diterapkan

### 1. Perbaikan Code
- ✅ Semua role checking sekarang menggunakan `.trim()` untuk menghilangkan spasi
- ✅ Normalisasi role di `providers.tsx` saat fetch user profile
- ✅ Debug logging ditambahkan untuk melihat role yang sebenarnya

### 2. File yang Diperbaiki
- ✅ `app/providers.tsx` - Normalisasi role saat fetch
- ✅ `app/(dashboard)/users/page.tsx` - Role checking dengan trim
- ✅ `app/(dashboard)/departments/page.tsx` - Role checking dengan trim
- ✅ `app/(dashboard)/assets/page.tsx` - Role checking dengan trim
- ✅ `app/(dashboard)/financial/page.tsx` - Role checking dengan trim
- ✅ `app/(dashboard)/depreciation/page.tsx` - Role checking dengan trim
- ✅ `app/(dashboard)/work-orders/page.tsx` - Role checking dengan trim

## Langkah Perbaikan

### Langkah 1: Cek Role di Database

Jalankan query ini di **Supabase SQL Editor**:

```sql
-- Cek role user Anda
SELECT 
  id,
  email,
  full_name,
  role,
  LENGTH(role) as role_length,
  is_active
FROM users
WHERE email = 'email@damarlangit.com';  -- Ganti dengan email Anda
```

### Langkah 2: Normalisasi Role

Jalankan migration `009_fix_master_admin_role.sql` di Supabase SQL Editor untuk:
- Normalisasi semua role (trim spasi, fix case)
- Update role ke format yang benar

### Langkah 3: Update Manual (Jika Perlu)

Jika masih ada masalah, update manual:

```sql
-- Update role untuk user tertentu
UPDATE users
SET 
  role = 'Master Admin',
  updated_at = NOW()
WHERE id = 'YOUR_USER_UUID_HERE';  -- Ganti dengan UUID Anda
```

### Langkah 4: Cek di Browser Console

1. Buka browser console (F12)
2. Login ke aplikasi
3. Cek log "User Profile loaded:" untuk melihat role yang ter-load
4. Jika role tidak sesuai, berarti masalah di database

### Langkah 5: Debug Page

Akses `/debug-role` untuk melihat informasi lengkap tentang role:
- Raw role dari database
- Trimmed role
- Character codes
- Role length

## Verifikasi

Setelah update, cek:
1. Refresh browser
2. Cek browser console untuk log "User Profile loaded"
3. Cek apakah role sudah benar: `"role": "Master Admin"` (tanpa spasi)
4. Coba akses halaman yang memerlukan Master Admin

## Troubleshooting

### Masih "Akses ditolak"?
1. Cek browser console - apakah userProfile ter-load?
2. Cek role di console - apakah `"Master Admin"` atau ada spasi?
3. Jalankan SQL query untuk cek role di database
4. Pastikan role di database adalah `'Master Admin'` (exact match, tanpa spasi)

### Role tidak ter-load?
1. Cek apakah user ada di tabel `users`
2. Cek RLS policy - apakah user bisa melihat profil mereka sendiri?
3. Cek browser console untuk error

### Query untuk Debug:
```sql
-- Cek user dengan auth.uid() (harus dijalankan saat user login)
SELECT * FROM users WHERE id = auth.uid();

-- Cek semua users
SELECT id, email, full_name, role, is_active FROM users;
```

