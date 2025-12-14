# Scripts

## Seed Sample Data

Script untuk mengisi data contoh (55 aset) ke database.

### Prerequisites

1. Supabase project sudah setup
2. Database migrations sudah dijalankan
3. Storage bucket `asset-photos` sudah dibuat di Supabase
4. User Master Admin sudah dibuat di Supabase Auth dan tabel `users`

### Setup

1. Install ts-node:
```bash
npm install -g ts-node
```

2. Set environment variables:
```bash
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Run script:
```bash
npx ts-node scripts/seed-sample-data.ts
```

### Catatan

- Script akan membuat 55 aset sesuai spesifikasi
- Setiap aset akan memiliki kode otomatis berdasarkan departemen
- Barcode akan sama dengan kode aset
- Foto aset perlu diupload manual melalui aplikasi (karena script tidak bisa upload file)

