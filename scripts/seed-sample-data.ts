/**
 * Script untuk insert sample data (55 aset)
 * Jalankan setelah setup Supabase dan migrasi database
 * 
 * Catatan: Script ini memerlukan:
 * 1. User Master Admin sudah dibuat di Supabase Auth
 * 2. Storage buckets 'asset-photos' sudah dibuat di Supabase
 * 3. Jalankan dengan: npx ts-node scripts/seed-sample-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleAssets = [
  // IT Department (5 assets)
  { dept: 'IT', name: 'Laptop (Staff)', location: 'Office IT', year: 2023, price: 12000000, lifespan: 4, category: 'Office' },
  { dept: 'IT', name: 'Server Utama', location: 'Server Room', year: 2022, price: 50000000, lifespan: 7, category: 'Public Area' },
  { dept: 'IT', name: 'Router WiFi', location: 'Office IT', year: 2024, price: 2500000, lifespan: 5, category: 'Office' },
  { dept: 'IT', name: 'Switch Network', location: 'Server Room', year: 2023, price: 8000000, lifespan: 6, category: 'Public Area' },
  { dept: 'IT', name: 'UPS Backup', location: 'Server Room', year: 2022, price: 15000000, lifespan: 5, category: 'Public Area' },

  // FO Department (5 assets)
  { dept: 'FO', name: 'Mesin EDC', location: 'FO Counter', year: 2024, price: 3000000, lifespan: 5, category: 'Public Area' },
  { dept: 'FO', name: 'Komputer Front Desk', location: 'FO Counter', year: 2023, price: 10000000, lifespan: 4, category: 'Office' },
  { dept: 'FO', name: 'Printer Thermal', location: 'FO Counter', year: 2024, price: 2000000, lifespan: 3, category: 'Office' },
  { dept: 'FO', name: 'Telepon Reception', location: 'FO Counter', year: 2023, price: 1500000, lifespan: 5, category: 'Office' },
  { dept: 'FO', name: 'Brankas Kunci', location: 'FO Counter', year: 2022, price: 5000000, lifespan: 10, category: 'Office' },

  // HK Department (5 assets)
  { dept: 'HK', name: 'Vacuum Cleaner', location: 'Store HK Lt. 2', year: 2023, price: 5000000, lifespan: 3, category: 'Public Area' },
  { dept: 'HK', name: 'Mesin Cuci Karpet', location: 'Laundry Room', year: 2022, price: 25000000, lifespan: 7, category: 'Public Area' },
  { dept: 'HK', name: 'Steam Cleaner', location: 'Store HK Lt. 2', year: 2023, price: 8000000, lifespan: 5, category: 'Public Area' },
  { dept: 'HK', name: 'Floor Polisher', location: 'Store HK Lt. 2', year: 2022, price: 12000000, lifespan: 6, category: 'Public Area' },
  { dept: 'HK', name: 'Trolley Cleaning', location: 'Store HK Lt. 2', year: 2024, price: 3000000, lifespan: 5, category: 'Public Area' },

  // FBS Department (5 assets)
  { dept: 'FBS', name: 'Mesin Kopi', location: 'Restoran Utama', year: 2022, price: 15000000, lifespan: 5, category: 'Public Area' },
  { dept: 'FBS', name: 'Dishwasher', location: 'Kitchen Restoran', year: 2023, price: 20000000, lifespan: 6, category: 'Public Area' },
  { dept: 'FBS', name: 'Blender Industrial', location: 'Kitchen Restoran', year: 2024, price: 5000000, lifespan: 4, category: 'Public Area' },
  { dept: 'FBS', name: 'Freezer Display', location: 'Restoran Utama', year: 2022, price: 18000000, lifespan: 8, category: 'Public Area' },
  { dept: 'FBS', name: 'Mesin Es Krim', location: 'Restoran Utama', year: 2023, price: 12000000, lifespan: 5, category: 'Public Area' },

  // FBP Department (5 assets)
  { dept: 'FBP', name: 'Oven Deck', location: 'Kitchen Pusat', year: 2021, price: 35000000, lifespan: 10, category: 'Public Area' },
  { dept: 'FBP', name: 'Mixer Industrial', location: 'Kitchen Pusat', year: 2022, price: 25000000, lifespan: 8, category: 'Public Area' },
  { dept: 'FBP', name: 'Deep Fryer', location: 'Kitchen Pusat', year: 2023, price: 15000000, lifespan: 6, category: 'Public Area' },
  { dept: 'FBP', name: 'Grill Station', location: 'Kitchen Pusat', year: 2022, price: 20000000, lifespan: 7, category: 'Public Area' },
  { dept: 'FBP', name: 'Salamander', location: 'Kitchen Pusat', year: 2023, price: 10000000, lifespan: 5, category: 'Public Area' },

  // RA Department (5 assets)
  { dept: 'RA', name: 'Perahu Kayak', location: 'Area Danau', year: 2023, price: 8000000, lifespan: 5, category: 'Public Area' },
  { dept: 'RA', name: 'Stand Up Paddle', location: 'Area Danau', year: 2024, price: 5000000, lifespan: 4, category: 'Public Area' },
  { dept: 'RA', name: 'Sepeda Gunung', location: 'Gudang RA', year: 2023, price: 6000000, lifespan: 5, category: 'Public Area' },
  { dept: 'RA', name: 'Tenda Camping', location: 'Gudang RA', year: 2022, price: 4000000, lifespan: 6, category: 'Public Area' },
  { dept: 'RA', name: 'Alat Panjat Tebing', location: 'Gudang RA', year: 2023, price: 10000000, lifespan: 7, category: 'Public Area' },

  // HR Department (5 assets)
  { dept: 'HR', name: 'Printer Laser', location: 'Office HR', year: 2024, price: 4500000, lifespan: 4, category: 'Office' },
  { dept: 'HR', name: 'Laptop HR', location: 'Office HR', year: 2023, price: 12000000, lifespan: 4, category: 'Office' },
  { dept: 'HR', name: 'Projector Meeting', location: 'Meeting Room HR', year: 2022, price: 8000000, lifespan: 5, category: 'Office' },
  { dept: 'HR', name: 'Whiteboard Elektronik', location: 'Meeting Room HR', year: 2024, price: 15000000, lifespan: 6, category: 'Office' },
  { dept: 'HR', name: 'Filing Cabinet', location: 'Office HR', year: 2021, price: 3000000, lifespan: 10, category: 'Office' },

  // FIN Department (5 assets)
  { dept: 'FIN', name: 'Brankas Kecil', location: 'Office FIN', year: 2020, price: 10000000, lifespan: 20, category: 'Office' },
  { dept: 'FIN', name: 'Mesin Hitung Uang', location: 'Office FIN', year: 2023, price: 12000000, lifespan: 7, category: 'Office' },
  { dept: 'FIN', name: 'Printer Dot Matrix', location: 'Office FIN', year: 2022, price: 5000000, lifespan: 5, category: 'Office' },
  { dept: 'FIN', name: 'Scanner Dokumen', location: 'Office FIN', year: 2024, price: 4000000, lifespan: 5, category: 'Office' },
  { dept: 'FIN', name: 'Laptop Finance', location: 'Office FIN', year: 2023, price: 12000000, lifespan: 4, category: 'Office' },

  // SM Department (5 assets)
  { dept: 'SM', name: 'Projector Mini', location: 'Meeting Room SM', year: 2024, price: 7000000, lifespan: 5, category: 'Office' },
  { dept: 'SM', name: 'Sound System', location: 'Meeting Room SM', year: 2023, price: 15000000, lifespan: 6, category: 'Office' },
  { dept: 'SM', name: 'Display Stand', location: 'Lobby', year: 2024, price: 5000000, lifespan: 5, category: 'Public Area' },
  { dept: 'SM', name: 'Banner Stand', location: 'Lobby', year: 2023, price: 2000000, lifespan: 3, category: 'Public Area' },
  { dept: 'SM', name: 'Laptop Marketing', location: 'Office SM', year: 2023, price: 12000000, lifespan: 4, category: 'Office' },

  // SEC Department (5 assets)
  { dept: 'SEC', name: 'CCTV Outdoor', location: 'Area Pintu Masuk', year: 2023, price: 2500000, lifespan: 7, category: 'Public Area' },
  { dept: 'SEC', name: 'CCTV Indoor', location: 'Lobby', year: 2023, price: 2000000, lifespan: 7, category: 'Public Area' },
  { dept: 'SEC', name: 'Walkie Talkie', location: 'Security Post', year: 2024, price: 3000000, lifespan: 5, category: 'Public Area' },
  { dept: 'SEC', name: 'Metal Detector', location: 'Area Pintu Masuk', year: 2022, price: 8000000, lifespan: 8, category: 'Public Area' },
  { dept: 'SEC', name: 'Access Control System', location: 'Security Post', year: 2023, price: 20000000, lifespan: 10, category: 'Public Area' },

  // GAR Department (5 assets)
  { dept: 'GAR', name: 'Mesin Potong Rumput', location: 'Gudang GAR', year: 2022, price: 4000000, lifespan: 4, category: 'Public Area' },
  { dept: 'GAR', name: 'Chainsaw', location: 'Gudang GAR', year: 2023, price: 5000000, lifespan: 5, category: 'Public Area' },
  { dept: 'GAR', name: 'Blower Daun', location: 'Gudang GAR', year: 2024, price: 2000000, lifespan: 3, category: 'Public Area' },
  { dept: 'GAR', name: 'Sprinkler System', location: 'Area Taman', year: 2021, price: 30000000, lifespan: 15, category: 'Public Area' },
  { dept: 'GAR', name: 'Tractor Mini', location: 'Gudang GAR', year: 2022, price: 50000000, lifespan: 10, category: 'Public Area' },
]

async function seedData() {
  console.log('Starting data seeding...')

  // Get Master Admin user
  const { data: adminUsers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'Master Admin')
    .limit(1)

  if (!adminUsers || adminUsers.length === 0) {
    console.error('No Master Admin user found. Please create one first.')
    process.exit(1)
  }

  const adminId = adminUsers[0].id
  console.log(`Using admin user: ${adminId}`)

  // Get departments
  const { data: departments } = await supabase.from('departments').select('*')
  if (!departments) {
    console.error('No departments found')
    process.exit(1)
  }

  const deptMap = new Map(departments.map((d) => [d.code, d]))

  let successCount = 0
  let errorCount = 0

  for (const assetData of sampleAssets) {
    try {
      const dept = deptMap.get(assetData.dept)
      if (!dept) {
        console.error(`Department ${assetData.dept} not found`)
        errorCount++
        continue
      }

      // Get next sequence number
      const { data: existingAssets } = await supabase
        .from('assets')
        .select('asset_code')
        .like('asset_code', `${dept.initial_code}-%`)
        .order('asset_code', { ascending: false })
        .limit(1)

      let sequenceNumber = 1
      if (existingAssets && existingAssets.length > 0) {
        const lastCode = existingAssets[0].asset_code
        const lastSeq = parseInt(lastCode.split('-')[1]) || 0
        sequenceNumber = lastSeq + 1
      }

      const assetCode = `${dept.initial_code}-${String(sequenceNumber).padStart(4, '0')}`

      // Calculate book value
      const currentYear = new Date().getFullYear()
      const yearsUsed = Math.max(0, currentYear - assetData.year)
      let bookValue = 0
      if (yearsUsed < assetData.lifespan) {
        const annualDep = assetData.price / assetData.lifespan
        bookValue = Math.max(0, assetData.price - annualDep * yearsUsed)
      }

      // Insert asset
      const { error } = await supabase.from('assets').insert({
        asset_name: assetData.name,
        asset_code: assetCode,
        location: assetData.location,
        department_id: dept.id,
        unit: 'Unit',
        acquisition_year: assetData.year,
        acquisition_price: assetData.price,
        estimated_lifespan: assetData.lifespan,
        condition: 'Baik',
        status: 'Aktif',
        category: assetData.category,
        barcode: assetCode,
        book_value: bookValue,
        created_by: adminId,
      })

      if (error) {
        console.error(`Error inserting ${assetData.name}:`, error.message)
        errorCount++
      } else {
        console.log(`✓ Inserted: ${assetCode} - ${assetData.name}`)
        successCount++
      }
    } catch (error: any) {
      console.error(`Error processing ${assetData.name}:`, error.message)
      errorCount++
    }
  }

  console.log(`\nSeeding completed!`)
  console.log(`Success: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
}

// Run seeding
seedData()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

