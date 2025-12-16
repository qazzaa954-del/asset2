# Quick Fix: Work Order RLS Error

## Masalah
Error: "new row violates row-level security policy" saat update work order
Function `is_engineering_or_it()` return `false` atau `NULL`

## Solusi Cepat

### 1. Jalankan Migration 023
```sql
-- Copy isi file: supabase/migrations/023_fix_work_orders_complete.sql
-- Jalankan di Supabase SQL Editor
```

### 2. Perbaiki Role User

**Cara A: Update berdasarkan email**
```sql
-- Ganti dengan email user IT/Engineering Anda
UPDATE users 
SET 
  role = 'IT',  -- atau 'Engineering'
  is_active = true
WHERE email = 'email-anda@damarlangit.com'
RETURNING id, email, role, is_active;
```

**Cara B: Update semua user IT/Engineering sekaligus**
```sql
-- Copy isi file: supabase/migrations/024_fix_all_users_roles.sql
-- Jalankan di Supabase SQL Editor
```

**Cara C: Update berdasarkan UUID**
```sql
-- Ganti dengan UUID user Anda (dapatkan dari query STEP 1 di migration 025)
UPDATE users 
SET 
  role = 'IT',
  is_active = true
WHERE id = 'USER-UUID-DI-SINI'
RETURNING id, email, role, is_active;
```

### 3. Verifikasi

**Cek semua users:**
```sql
SELECT 
  id,
  email,
  role,
  TRIM(role) as role_trimmed,
  is_active,
  CASE 
    WHEN TRIM(role) IN ('IT', 'Engineering', 'Master Admin') THEN '✅ BISA'
    ELSE '❌ TIDAK BISA'
  END as can_update_wo
FROM users
ORDER BY created_at DESC;
```

**Test dari aplikasi (BUKAN SQL Editor):**
1. Login ke aplikasi dengan user IT/Engineering
2. Buka browser console (F12)
3. Jalankan:
```javascript
// Di browser console
const { data, error } = await supabase
  .from('users')
  .select('id, email, role')
  .eq('id', (await supabase.auth.getUser()).data.user.id)
  .single();
console.log('User:', data);
console.log('Role:', data?.role);
```

### 4. Test Update Work Order

Setelah role sudah benar:
1. Refresh aplikasi
2. Logout dan login lagi
3. Coba fitur "Mulai Work Order"
4. Error RLS seharusnya sudah hilang

## Catatan Penting

### Mengapa `auth.uid()` return NULL di SQL Editor?
- SQL Editor tidak memiliki user session
- `auth.uid()` hanya bekerja di aplikasi (browser) atau dengan service role
- Ini normal dan bukan masalah

### Cara Test Function di Aplikasi
Function `is_engineering_or_it()` hanya bisa di-test dari aplikasi, bukan SQL Editor.

**Test dari aplikasi:**
1. Login ke aplikasi
2. Buka browser console (F12)
3. Function akan otomatis dipanggil saat update work order
4. Cek error di console jika masih ada

### Checklist
- [ ] Migration 023 sudah dijalankan
- [ ] User IT/Engineering memiliki role yang benar (cek dengan query di atas)
- [ ] User sudah logout dan login lagi
- [ ] Test dari aplikasi, bukan SQL Editor


