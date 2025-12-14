# Ringkasan Permissions & Akses Menu

## Master Admin
✅ **Akses Penuh:**
- Dashboard
- Master Inventory (Assets) - **Bisa Edit & Delete**
- Master Departemen - **Full Access**
- Finansial & Audit - **Full Access**
- Depresiasi - **Full Access**
- Work Order - **Full Access**
- Manajemen Pengguna - **Full Access**
- Laporan BAK - **Full Access**

## Engineering & IT
✅ **Akses Terbatas:**
- Dashboard
- Master Inventory (Assets) - **Hanya Input Baru, Tidak Bisa Edit/Delete**
- Work Order - **Full Access (Bisa assign, update status)**
- Laporan BAK - **Bisa Input Laporan**

❌ **Tidak Bisa Akses:**
- Master Departemen
- Finansial & Audit
- Depresiasi
- Manajemen Pengguna

## User (Departemen Lain)
✅ **Akses Terbatas:**
- Dashboard
- Master Inventory (Assets) - **Hanya Input Baru, Tidak Bisa Edit/Delete**
- Work Order - **Hanya Lihat & Input Baru (Tidak Bisa Update Status)**
- Laporan BAK - **Bisa Input Laporan**

❌ **Tidak Bisa Akses:**
- Master Departemen
- Finansial & Audit
- Depresiasi
- Manajemen Pengguna

## Detail Permissions

### Assets (Master Inventory)
- **Master Admin:** Create, Read, Update, Delete
- **Engineering/IT/User:** Create, Read (Tidak bisa Update/Delete)

### Work Orders
- **Master Admin/Engineering/IT:** Create, Read, Update Status, Assign
- **User:** Create, Read (Tidak bisa Update Status)

### Laporan BAK
- **Semua User:** Bisa input laporan baru
- **Master Admin:** Bisa lihat semua laporan dan export

### Departments
- **Hanya Master Admin:** Full Access

### Users Management
- **Hanya Master Admin:** Full Access

### Financial & Audit
- **Hanya Master Admin:** Full Access

### Depreciation
- **Hanya Master Admin:** Full Access
