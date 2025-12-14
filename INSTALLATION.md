# Panduan Instalasi Asset-Damar-Langit

## Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis)
- Git (opsional)

## Langkah Instalasi

### 1. Clone atau Download Project

```bash
git clone <repository-url>
cd asset-new
```

atau extract file ZIP ke folder `asset-new`

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

Ikuti panduan lengkap di [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Ringkasan:
1. Buat project di https://supabase.com
2. Jalankan migration SQL dari `supabase/migrations/001_initial_schema.sql`
3. Buat storage buckets: `asset-photos` dan `work-order-photos`
4. Buat user Master Admin
5. Setup environment variables

### 4. Konfigurasi Environment

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

### 6. Login

Gunakan kredensial Master Admin yang sudah dibuat:
- Email: admin@damarlangit.com (atau sesuai yang dibuat)
- Password: (password yang sudah dibuat)

### 7. (Optional) Seed Sample Data

Untuk mengisi data contoh 55 aset:

```bash
npx ts-node scripts/seed-sample-data.ts
```

## Build untuk Production

```bash
npm run build
npm start
```

## Struktur Project

```
asset-new/
├── app/                    # Next.js app directory
│   ├── (dashboard)/        # Protected routes
│   │   ├── dashboard/      # Dashboard utama
│   │   ├── assets/         # Master Inventory
│   │   ├── departments/    # Master Departemen
│   │   ├── financial/      # Finansial & Audit
│   │   ├── work-orders/    # Work Order
│   │   ├── users/          # Manajemen Pengguna
│   │   └── reports/        # Laporan
│   ├── login/              # Halaman login
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # UI components
│   ├── layout/             # Layout components
│   └── BarcodeDisplay.tsx # Barcode component
├── lib/                    # Utilities & helpers
│   ├── supabase/           # Supabase clients
│   ├── hooks/              # Custom hooks
│   └── utils.ts            # Utility functions
├── supabase/               # Database migrations
│   └── migrations/         # SQL migration files
├── scripts/                # Utility scripts
│   └── seed-sample-data.ts # Script seed data
└── package.json            # Dependencies
```

## Fitur Utama

✅ **Master Data Departemen** - Kelola 11 departemen
✅ **Master Inventory Aset** - Input aset dengan auto-code & barcode
✅ **Finansial & Audit** - Depresiasi otomatis & menu audit
✅ **Dashboard Interaktif** - Charts & statistik real-time
✅ **Work Order** - Sistem pelaporan & maintenance
✅ **Manajemen Pengguna** - Kontrol akses berbasis role
✅ **Laporan & Rekapitulasi** - Export CSV & dashboard

## Troubleshooting

### Port sudah digunakan
```bash
# Gunakan port lain
npm run dev -- -p 3001
```

### Error database connection
- Pastikan environment variables sudah benar
- Cek koneksi internet
- Verifikasi Supabase project masih aktif

### Error storage upload
- Pastikan buckets sudah dibuat
- Cek bucket permissions (harus public)
- Verifikasi file size tidak melebihi limit

## Support

Untuk bantuan lebih lanjut, hubungi tim development.

