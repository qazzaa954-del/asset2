# Quick Fix: Update User yang Sudah Ada

## Error yang Terjadi
```
ERROR: 23505: duplicate key value violates unique constraint "users_pkey"
DETAIL: Key (id)=(e090e771-9760-41ec-858f-ace33c9a159d) already exists.
```

## Solusi: UPDATE bukan INSERT

User dengan UUID `e090e771-9760-41ec-858f-ace33c9a159d` sudah ada di tabel users. Gunakan UPDATE:

### Langkah 1: Update User di Supabase SQL Editor

Jalankan query ini di **Supabase Dashboard → SQL Editor**:

```sql
-- Update user yang sudah ada
UPDATE users
SET 
  email = COALESCE(email, 'admin@damarlangit.com'),
  full_name = COALESCE(NULLIF(full_name, ''), 'Master Admin'),
  role = 'Master Admin',
  is_active = true
WHERE id = 'e090e771-9760-41ec-858f-ace33c9a159d';
```

### Langkah 2: Verifikasi

Cek apakah user sudah ter-update:

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM users
WHERE id = 'e090e771-9760-41ec-858f-ace33c9a159d';
```

### Langkah 3: Refresh Browser

Setelah update, refresh browser dan sidebar harus menampilkan menu.

## Jika Masih Tidak Muncul

### Cek RLS Policy

Pastikan RLS policy sudah benar:

```sql
-- Cek policy yang ada
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Jika perlu, recreate policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
```

### Cek di Browser Console

Buka browser console (F12) dan cek apakah ada error:
- Error fetching user profile
- RLS policy error
- Network error

## Troubleshooting

### Menu masih tidak muncul?
1. Pastikan user sudah ter-update dengan role yang benar
2. Pastikan RLS policy sudah benar
3. Cek browser console untuk error
4. Pastikan user sudah login

### Query untuk debug:
```sql
-- Cek user dengan auth.uid() (harus dijalankan saat user login)
SELECT * FROM users WHERE id = auth.uid();

-- Cek semua users (jika Master Admin)
SELECT id, email, full_name, role, is_active FROM users;
```

