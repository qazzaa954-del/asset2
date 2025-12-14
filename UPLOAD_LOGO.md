# Cara Upload Logo Asli

## 📁 Lokasi Folder untuk Drag & Drop Logo

**Path lengkap folder:**
```
c:\Users\Sams_town\asset-new\public\images\
```

**Atau relatif dari root project:**
```
public/images/
```

## 🎯 Langkah-langkah Drag & Drop:

1. **Buka folder `public/images/` di File Explorer Windows**
   - Path: `c:\Users\Sams_town\asset-new\public\images\`
   - Jika folder belum ada, folder akan dibuat otomatis

2. **Drag & Drop file logo ke folder tersebut**
   - **Nama file harus:** `damar-langit-logo.png`
   - Jika nama file berbeda, rename menjadi `damar-langit-logo.png`

3. **Struktur folder yang benar:**
   ```
   asset-new/
   └── public/
       └── images/
           └── damar-langit-logo.png  ← File logo di sini
   ```

4. **Refresh browser** - Logo akan otomatis muncul di website

## 📝 Alternatif (Command Line):

```powershell
# Windows PowerShell
Copy-Item "path\to\logo.png" "public\images\damar-langit-logo.png"
```

## ✅ Verifikasi:

Setelah drag & drop, pastikan file ada di:
- `public/images/damar-langit-logo.png`

## 📌 Catatan:
- Logo akan ditampilkan **tanpa modifikasi apapun** (original)
- Jika file tidak ditemukan, akan menggunakan fallback SVG dengan desain yang sama
- Format yang didukung: **PNG, JPG, SVG**
- Ukuran file tidak dibatasi, tapi disarankan < 2MB untuk performa optimal
