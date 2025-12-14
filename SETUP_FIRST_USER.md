# Setup User Pertama untuk Sidebar

## Masalah
Sidebar tidak menampilkan menu karena user yang login belum terdaftar di tabel `users`.

## Solusi

### Opsi 1: Insert User Manual (Cara Cepat)

1. Login ke Supabase Dashboard
2. Buka **SQL Editor**
3. Jalankan query berikut (ganti dengan data user Anda):

```sql
-- Cek user yang sudah login di auth.users
SELECT id, email FROM auth.users;

-- Copy UUID dari hasil query di atas, lalu jalankan:
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'PASTE_UUID_DARI_AUTH_USERS_DISINI',  -- Ganti dengan UUID dari auth.users
  'admin@damarlangit.com',              -- Ganti dengan email Anda
  'Master Admin',                        -- Ganti dengan nama Anda
  'Master Admin',                        -- Role: Master Admin, Engineering, IT, atau User
  true
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
```

### Opsi 2: Menggunakan Trigger Auto-Create (Otomatis untuk User Baru)

1. Jalankan migration `004_auto_create_user_profile.sql` di Supabase SQL Editor
2. Trigger akan otomatis membuat user profile untuk user baru yang sign up
3. Untuk user yang sudah ada, gunakan Opsi 1

### Opsi 3: Update User yang Sudah Ada

Jika user sudah ada di tabel `users` tapi role-nya salah:

```sql
-- Update role user
UPDATE users
SET role = 'Master Admin',
    full_name = 'Nama Lengkap Anda'
WHERE email = 'email@damarlangit.com';
```

## Verifikasi

Setelah insert/update, refresh browser dan cek:
1. Sidebar harus menampilkan menu items
2. Menu yang muncul sesuai dengan role user
3. Nama user muncul di header sidebar

## Troubleshooting

### Menu masih tidak muncul?
1. Cek browser console untuk error
2. Pastikan user sudah terdaftar di tabel `users`
3. Pastikan RLS policies sudah dijalankan
4. Cek role user di database

### Query untuk cek user:
```sql
SELECT id, email, full_name, role, is_active 
FROM users 
WHERE email = 'email@damarlangit.com';
```

