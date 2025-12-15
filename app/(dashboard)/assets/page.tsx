'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Edit, Trash2, Eye, Download, ChevronDown, Zap, Package } from 'lucide-react'
import { formatCurrency, formatDate, formatRupiah, parseRupiah } from '@/lib/utils'
import Link from 'next/link'

export default function AssetsPage() {
  const { userProfile } = useAuth()
  const [assets, setAssets] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkCount, setBulkCount] = useState(5)
  const [generatingSample, setGeneratingSample] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [formData, setFormData] = useState({
    asset_name: '',
    location: '',
    department_id: '',
    unit: '1 Pcs',
    acquisition_year: new Date().getFullYear(),
    acquisition_price: 0,
    estimated_lifespan: 5,
    condition: 'Baik',
    status: 'Aktif',
    category: 'Office',
    photo: null as File | null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Check if user is Master Admin
      const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
      
      // Build query for assets
      let assetsQuery = supabase
        .from('assets')
        .select('*, departments(*)')
        .order('asset_code', { ascending: true })
      
      // Filter by department if not Master Admin
      if (!isMasterAdmin && userProfile?.department_id) {
        assetsQuery = assetsQuery.eq('department_id', userProfile.department_id)
      }
      
      const [assetsRes, deptRes] = await Promise.all([
        assetsQuery,
        supabase.from('departments').select('*').order('code', { ascending: true }),
      ])

      if (assetsRes.error) {
        console.error('Error fetching assets:', assetsRes.error)
        // Handle infinite recursion error
        if (assetsRes.error.code === '42P17') {
          alert('Error konfigurasi database: Infinite recursion di RLS policy. Silakan jalankan migration 013_fix_infinite_recursion_users_rls.sql di Supabase SQL Editor.')
        } else {
          alert(`Error fetching assets: ${assetsRes.error.message}`)
        }
      } else {
        setAssets(assetsRes.data || [])
        console.log('Assets loaded:', assetsRes.data?.length || 0)
      }

      if (deptRes.error) {
        console.error('Error fetching departments:', deptRes.error)
        // Handle infinite recursion error
        if (deptRes.error.code === '42P17') {
          alert('Error konfigurasi database: Infinite recursion di RLS policy. Silakan jalankan migration 013_fix_infinite_recursion_users_rls.sql di Supabase SQL Editor.')
        } else {
          alert(`Error fetching departments: ${deptRes.error.message}`)
        }
      } else {
        setDepartments(deptRes.data || [])
        console.log('Departments loaded:', deptRes.data?.length || 0)
      }
    } catch (error: any) {
      console.error('Unexpected error fetching data:', error)
      alert(`Terjadi kesalahan: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createAsset = async (assetData: any, sequenceNumber: number, dept: any) => {
    const assetCode = `${dept.initial_code}-${String(sequenceNumber).padStart(4, '0')}`
    const bookValue = calculateBookValue(
      assetData.acquisition_price,
      assetData.acquisition_year,
      assetData.estimated_lifespan
    )

    // Hapus field 'photo' dari assetData karena tidak ada di database schema
    // Database hanya punya 'photo_url', bukan 'photo'
    const { photo, ...assetDataWithoutPhoto } = assetData

    return {
      ...assetDataWithoutPhoto,
      asset_code: assetCode,
      barcode: assetCode,
      book_value: bookValue,
      created_by: userProfile!.id,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) {
      alert('Anda harus login untuk menambahkan aset')
      return
    }

    // Validasi form
    if (!formData.asset_name || !formData.asset_name.trim()) {
      alert('Nama aset harus diisi')
      return
    }

    // Validasi departemen - pastikan department_id terisi
    const finalDepartmentId = formData.department_id || (userProfile?.department_id && !isMasterAdmin ? userProfile.department_id : null)
    if (!finalDepartmentId || finalDepartmentId.trim() === '') {
      alert('Departemen harus dipilih')
      return
    }

    if (!formData.acquisition_price || formData.acquisition_price <= 0) {
      alert('Harga perolehan harus diisi dan lebih dari 0')
      return
    }

    if (!formData.acquisition_year || formData.acquisition_year < 1900 || formData.acquisition_year > new Date().getFullYear() + 1) {
      alert('Tahun perolehan tidak valid')
      return
    }

    try {
      // Gunakan finalDepartmentId untuk mencari departemen
      const finalDepartmentId = formData.department_id || (userProfile?.department_id && !isMasterAdmin ? userProfile.department_id : null)
      const dept = departments.find((d) => d.id === finalDepartmentId)
      if (!dept) {
        alert('Departemen tidak ditemukan')
        return
      }

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

      // Upload photo if exists
      let photoUrl = null
      if (formData.photo) {
        const assetCode = `${dept.initial_code}-${String(sequenceNumber).padStart(4, '0')}`
        const fileExt = formData.photo.name.split('.').pop()
        const fileName = `${assetCode}-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('asset-photos')
          .upload(fileName, formData.photo)

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('asset-photos')
            .getPublicUrl(fileName)
          photoUrl = urlData.publicUrl
        }
      }

      // Pastikan department_id ter-set dengan benar
      const assetData = await createAsset({ ...formData, department_id: finalDepartmentId }, sequenceNumber, dept)
      assetData.photo_url = photoUrl

      if (editingAsset && isMasterAdmin) {
        const { error: updateError } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editingAsset.id)
        
        if (updateError) {
          throw updateError
        }
        alert('Aset berhasil diupdate!')
      } else if (!editingAsset) {
        // Only allow insert for new assets (all users can add new assets)
        const { error: insertError } = await supabase
          .from('assets')
          .insert(assetData)
        
        if (insertError) {
          throw insertError
        }
        alert('Aset berhasil ditambahkan!')
      } else {
        alert('Hanya Master Admin yang dapat mengedit aset')
        return
      }

      setShowForm(false)
      if (editingAsset && isMasterAdmin) {
        setEditingAsset(null)
      } else if (editingAsset && !isMasterAdmin) {
        // Reset editing asset if not master admin
        setEditingAsset(null)
      }
      setFormData({
        asset_name: '',
        location: '',
        department_id: userProfile?.department_id || '',
        unit: '1 Pcs',
        acquisition_year: new Date().getFullYear(),
        acquisition_price: 0,
        estimated_lifespan: 5,
        condition: 'Baik',
        status: 'Aktif',
        category: 'Office',
        photo: null,
      })
      fetchData()
    } catch (error: any) {
      console.error('Error saving asset:', error)
      const errorMessage = error.message || 'Terjadi kesalahan saat menyimpan aset'
      alert(`Error: ${errorMessage}\n\nPastikan:\n1. Semua field sudah diisi dengan benar\n2. Harga perolehan adalah angka yang valid\n3. Foto tidak melebihi 5MB`)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    // Validasi departemen untuk bulk form
    const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
    const finalDepartmentId = formData.department_id || (userProfile?.department_id && !isMasterAdmin ? userProfile.department_id : null)
    if (!finalDepartmentId || finalDepartmentId.trim() === '') {
      alert('Departemen harus dipilih')
      return
    }

    try {
      const dept = departments.find((d) => d.id === finalDepartmentId)
      if (!dept) {
        alert('Departemen tidak ditemukan')
        return
      }

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

      const assetsToInsert = []
      for (let i = 0; i < bulkCount; i++) {
        const assetData = await createAsset(
          {
            ...formData,
            asset_name: `${formData.asset_name} ${i + 1}`,
            department_id: finalDepartmentId,
          },
          sequenceNumber + i,
          dept
        )
        assetsToInsert.push(assetData)
      }

      await supabase.from('assets').insert(assetsToInsert)

      setShowBulkForm(false)
      setFormData({
        asset_name: '',
        location: '',
        department_id: '',
        unit: '1 Pcs',
        acquisition_year: new Date().getFullYear(),
        acquisition_price: 0,
        estimated_lifespan: 5,
        condition: 'Baik',
        status: 'Aktif',
        category: 'Office',
        photo: null,
      })
      alert(`Berhasil menambahkan ${bulkCount} aset sekaligus!`)
      fetchData()
    } catch (error) {
      console.error('Error saving bulk assets:', error)
      alert('Terjadi kesalahan saat menyimpan aset')
    }
  }

  const calculateBookValue = (
    price: number,
    year: number,
    lifespan: number
  ): number => {
    const currentYear = new Date().getFullYear()
    const yearsUsed = Math.max(0, currentYear - year)
    if (yearsUsed >= lifespan) return 0
    const annualDep = price / lifespan
    return Math.max(0, price - annualDep * yearsUsed)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus aset ini?')) return
    const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
    if (!isMasterAdmin) {
      alert('Hanya Master Admin yang dapat menghapus aset')
      return
    }

    try {
      await supabase.from('assets').delete().eq('id', id)
      fetchData()
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  const generateSampleData = async () => {
    if (!userProfile) {
      alert('Anda harus login untuk membuat sample data')
      return
    }

    if (!confirm('Ini akan membuat 5 contoh aset untuk setiap departemen (total 55 aset). Lanjutkan?')) {
      return
    }

    setGeneratingSample(true)
    try {
      // Sample asset data for each department
      const sampleAssetsByDept: Record<string, Array<{
        name: string
        location: string
        category: 'Room' | 'Public Area' | 'Office'
        unit: string
        year: number
        price: number
        lifespan: number
        condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat'
        status: 'Aktif' | 'Disposal' | 'Repair'
      }>> = {
        'FBS': [
          { name: 'Meja Makan Restoran', location: 'Restoran Utama', category: 'Public Area', unit: 'Unit', year: 2022, price: 2500000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Kursi Restoran', location: 'Restoran Utama', category: 'Public Area', unit: 'Unit', year: 2022, price: 500000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
          { name: 'Piring Makan', location: 'Dapur Restoran', category: 'Public Area', unit: 'Set', year: 2023, price: 150000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Gelas Minum', location: 'Bar Area', category: 'Public Area', unit: 'Set', year: 2023, price: 200000, lifespan: 5, condition: 'Rusak Ringan', status: 'Aktif' },
          { name: 'Kompor Gas', location: 'Dapur Restoran', category: 'Public Area', unit: 'Unit', year: 2021, price: 5000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
        ],
        'FBP': [
          { name: 'Mixer Roti', location: 'Dapur Produksi', category: 'Office', unit: 'Unit', year: 2022, price: 8000000, lifespan: 12, condition: 'Baik', status: 'Aktif' },
          { name: 'Oven Roti', location: 'Dapur Produksi', category: 'Office', unit: 'Unit', year: 2021, price: 12000000, lifespan: 15, condition: 'Baik', status: 'Aktif' },
          { name: 'Kulkas Bahan Baku', location: 'Gudang Bahan', category: 'Office', unit: 'Unit', year: 2020, price: 10000000, lifespan: 10, condition: 'Rusak Ringan', status: 'Repair' },
          { name: 'Timbangan Digital', location: 'Dapur Produksi', category: 'Office', unit: 'Unit', year: 2023, price: 1500000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
          { name: 'Meja Kerja Stainless', location: 'Dapur Produksi', category: 'Office', unit: 'Unit', year: 2022, price: 3000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
        ],
        'HK': [
          { name: 'Vacuum Cleaner', location: 'Lantai 1', category: 'Public Area', unit: 'Unit', year: 2023, price: 2500000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
          { name: 'Mesin Cuci', location: 'Laundry Room', category: 'Office', unit: 'Unit', year: 2022, price: 6000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Pengering Pakaian', location: 'Laundry Room', category: 'Office', unit: 'Unit', year: 2022, price: 5000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Setrika Uap', location: 'Laundry Room', category: 'Office', unit: 'Unit', year: 2023, price: 2000000, lifespan: 7, condition: 'Baik', status: 'Aktif' },
          { name: 'Keranjang Laundry', location: 'Laundry Room', category: 'Office', unit: 'Unit', year: 2023, price: 300000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
        ],
        'HR': [
          { name: 'Laptop HR', location: 'Kantor HR', category: 'Office', unit: 'Unit', year: 2023, price: 12000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Printer HR', location: 'Kantor HR', category: 'Office', unit: 'Unit', year: 2022, price: 3000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Filing Cabinet', location: 'Kantor HR', category: 'Office', unit: 'Unit', year: 2021, price: 2500000, lifespan: 15, condition: 'Baik', status: 'Aktif' },
          { name: 'Meja Kerja HR', location: 'Kantor HR', category: 'Office', unit: 'Unit', year: 2022, price: 2000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Kursi Kantor', location: 'Kantor HR', category: 'Office', unit: 'Unit', year: 2022, price: 1500000, lifespan: 8, condition: 'Rusak Ringan', status: 'Aktif' },
        ],
        'FIN': [
          { name: 'Laptop Finance', location: 'Kantor Finance', category: 'Office', unit: 'Unit', year: 2023, price: 15000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Calculator', location: 'Kantor Finance', category: 'Office', unit: 'Unit', year: 2023, price: 500000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Brankas', location: 'Kantor Finance', category: 'Office', unit: 'Unit', year: 2021, price: 8000000, lifespan: 20, condition: 'Baik', status: 'Aktif' },
          { name: 'Printer Finance', location: 'Kantor Finance', category: 'Office', unit: 'Unit', year: 2022, price: 4000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Meja Kasir', location: 'Kantor Finance', category: 'Office', unit: 'Unit', year: 2022, price: 3000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
        ],
        'SM': [
          { name: 'Banner Promosi', location: 'Lobby', category: 'Public Area', unit: 'Lembar', year: 2023, price: 500000, lifespan: 2, condition: 'Baik', status: 'Aktif' },
          { name: 'Stand Banner', location: 'Lobby', category: 'Public Area', unit: 'Unit', year: 2022, price: 800000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Kamera Promosi', location: 'Kantor Marketing', category: 'Office', unit: 'Unit', year: 2023, price: 10000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Laptop Marketing', location: 'Kantor Marketing', category: 'Office', unit: 'Unit', year: 2023, price: 12000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Projector', location: 'Ruang Meeting', category: 'Office', unit: 'Unit', year: 2022, price: 8000000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
        ],
        'SEC': [
          { name: 'Walkie Talkie', location: 'Pos Security', category: 'Office', unit: 'Unit', year: 2023, price: 1500000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'CCTV Camera', location: 'Lobby', category: 'Public Area', unit: 'Unit', year: 2022, price: 3000000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
          { name: 'Flashlight', location: 'Pos Security', category: 'Office', unit: 'Unit', year: 2023, price: 200000, lifespan: 3, condition: 'Baik', status: 'Aktif' },
          { name: 'Meja Security', location: 'Pos Security', category: 'Office', unit: 'Unit', year: 2021, price: 1500000, lifespan: 10, condition: 'Rusak Ringan', status: 'Aktif' },
          { name: 'Kursi Security', location: 'Pos Security', category: 'Office', unit: 'Unit', year: 2021, price: 800000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
        ],
        'IT': [
          { name: 'Server Rack', location: 'Server Room', category: 'Office', unit: 'Unit', year: 2021, price: 15000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Router Network', location: 'Server Room', category: 'Office', unit: 'Unit', year: 2022, price: 5000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Laptop IT', location: 'Kantor IT', category: 'Office', unit: 'Unit', year: 2023, price: 14000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Monitor', location: 'Kantor IT', category: 'Office', unit: 'Unit', year: 2023, price: 3000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Switch Network', location: 'Server Room', category: 'Office', unit: 'Unit', year: 2022, price: 4000000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
        ],
        'RA': [
          { name: 'Perahu Kano', location: 'Danau', category: 'Public Area', unit: 'Unit', year: 2022, price: 8000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Sepeda Gunung', location: 'Gudang Adventure', category: 'Public Area', unit: 'Unit', year: 2023, price: 5000000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
          { name: 'Tenda Camping', location: 'Gudang Adventure', category: 'Public Area', unit: 'Unit', year: 2022, price: 3000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Alat Panjat Tebing', location: 'Gudang Adventure', category: 'Public Area', unit: 'Set', year: 2023, price: 4000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Life Jacket', location: 'Danau', category: 'Public Area', unit: 'Unit', year: 2023, price: 500000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
        ],
        'FO': [
          { name: 'Komputer Front Desk', location: 'Lobby', category: 'Public Area', unit: 'Unit', year: 2023, price: 10000000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Printer Front Desk', location: 'Lobby', category: 'Public Area', unit: 'Unit', year: 2022, price: 2500000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Meja Reception', location: 'Lobby', category: 'Public Area', unit: 'Unit', year: 2022, price: 4000000, lifespan: 10, condition: 'Baik', status: 'Aktif' },
          { name: 'Kursi Reception', location: 'Lobby', category: 'Public Area', unit: 'Unit', year: 2022, price: 2000000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
          { name: 'Telepon Front Desk', location: 'Lobby', category: 'Public Area', unit: 'Unit', year: 2023, price: 1500000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
        ],
        'GAR': [
          { name: 'Mesin Potong Rumput', location: 'Gudang Alat', category: 'Public Area', unit: 'Unit', year: 2022, price: 6000000, lifespan: 8, condition: 'Baik', status: 'Aktif' },
          { name: 'Selang Air', location: 'Gudang Alat', category: 'Public Area', unit: 'Unit', year: 2023, price: 500000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Gunting Tanaman', location: 'Gudang Alat', category: 'Public Area', unit: 'Unit', year: 2023, price: 300000, lifespan: 5, condition: 'Baik', status: 'Aktif' },
          { name: 'Pupuk Organik', location: 'Gudang Alat', category: 'Public Area', unit: 'Set', year: 2023, price: 800000, lifespan: 2, condition: 'Baik', status: 'Aktif' },
          { name: 'Pot Tanaman', location: 'Gudang Alat', category: 'Public Area', unit: 'Unit', year: 2022, price: 200000, lifespan: 10, condition: 'Rusak Ringan', status: 'Aktif' },
        ],
      }

      const allAssetsToInsert = []

      for (const dept of departments) {
        const deptCode = dept.code
        const sampleAssets = sampleAssetsByDept[deptCode] || []

        // Get next sequence number for this department
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

        // Create assets for this department
        for (let i = 0; i < sampleAssets.length; i++) {
          const assetData = sampleAssets[i]
          const assetCode = `${dept.initial_code}-${String(sequenceNumber + i).padStart(4, '0')}`
          
          const currentYear = new Date().getFullYear()
          const yearsUsed = Math.max(0, currentYear - assetData.year)
          let bookValue = 0
          if (yearsUsed < assetData.lifespan) {
            const annualDep = assetData.price / assetData.lifespan
            bookValue = Math.max(0, assetData.price - annualDep * yearsUsed)
          }

          allAssetsToInsert.push({
            asset_name: assetData.name,
            asset_code: assetCode,
            location: assetData.location,
            department_id: dept.id,
            unit: assetData.unit,
            acquisition_year: assetData.year,
            acquisition_price: assetData.price,
            estimated_lifespan: assetData.lifespan,
            condition: assetData.condition,
            status: assetData.status,
            category: assetData.category,
            barcode: assetCode,
            book_value: bookValue,
            created_by: userProfile.id,
          })
        }
      }

      // Insert all assets in batches
      const batchSize = 10
      for (let i = 0; i < allAssetsToInsert.length; i += batchSize) {
        const batch = allAssetsToInsert.slice(i, i + batchSize)
        await supabase.from('assets').insert(batch)
      }

      alert(`Berhasil membuat ${allAssetsToInsert.length} contoh aset untuk semua departemen!`)
      fetchData()
    } catch (error) {
      console.error('Error generating sample data:', error)
      alert('Terjadi kesalahan saat membuat sample data')
    } finally {
      setGeneratingSample(false)
    }
  }

  const filteredAssets = assets.filter(
    (asset) =>
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Inventory Aset</h1>
          <p className="text-gray-600 mt-1">Kelola data aset perusahaan</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => {
            const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
            setFormData({
              ...formData,
              department_id: isMasterAdmin ? '' : (userProfile?.department_id || ''),
            })
            setShowForm(!showForm)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Aset
          </Button>
        </div>
      </div>

      {showBulkForm && isMasterAdmin && (
        <Card title={`Tambah ${bulkCount} Aset Sekaligus (Input Cerdas)`}>
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Input Cerdas:</strong> Form ini akan membuat {bulkCount} aset dengan data
                yang sama. Nama aset akan otomatis ditambahkan nomor urut (1, 2, 3, ...).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama Aset (Akan ditambahkan nomor urut)"
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                required
                placeholder="Contoh: Laptop"
              />
              <Select
                label="Departemen"
                value={formData.department_id || (userProfile?.department_id && !isMasterAdmin ? userProfile.department_id : '')}
                onChange={(e) => {
                  const selectedValue = e.target.value
                  setFormData({ ...formData, department_id: selectedValue })
                }}
                options={
                  isMasterAdmin
                    ? departments.map((d) => ({ value: d.id, label: d.name }))
                    : departments
                        .filter((d) => d.id === userProfile?.department_id)
                        .map((d) => ({ value: d.id, label: d.name }))
                }
                placeholder={departments.length === 0 ? "Memuat departemen..." : "Pilih Departemen"}
                required
                disabled={departments.length === 0 || (!isMasterAdmin && !!userProfile?.department_id)}
              />
              <Input
                label="Lokasi"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
              <Select
                label="Kategori"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'Room', label: 'Room' },
                  { value: 'Public Area', label: 'Public Area' },
                  { value: 'Office', label: 'Office' },
                ]}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="unit-options-bulk"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ketik atau pilih: 1 Pcs, 2 Unit, 1 Lembar, dll"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm text-gray-900 bg-white"
                  required
                />
                <datalist id="unit-options-bulk">
                  <option value="1 Pcs" />
                  <option value="2 Pcs" />
                  <option value="3 Pcs" />
                  <option value="5 Pcs" />
                  <option value="10 Pcs" />
                  <option value="1 Unit" />
                  <option value="2 Unit" />
                  <option value="3 Unit" />
                  <option value="5 Unit" />
                  <option value="1 Set" />
                  <option value="2 Set" />
                  <option value="3 Set" />
                  <option value="1 Lembar" />
                  <option value="2 Lembar" />
                  <option value="5 Lembar" />
                  <option value="10 Lembar" />
                  <option value="1 Buah" />
                  <option value="2 Buah" />
                  <option value="1 Paket" />
                  <option value="1 Roll" />
                  <option value="1 Meter" />
                  <option value="1 Liter" />
                  <option value="Pcs" />
                  <option value="Unit" />
                  <option value="Set" />
                  <option value="Lembar" />
                  <option value="Buah" />
                  <option value="Paket" />
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  Ketik langsung atau pilih dari daftar: Pcs, Unit, Set, Lembar, Buah, Paket
                </p>
              </div>
              <Input
                label="Tahun Perolehan"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.acquisition_year}
                onChange={(e) => {
                  const year = parseInt(e.target.value) || new Date().getFullYear()
                  setFormData({ ...formData, acquisition_year: year })
                }}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Perolehan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.acquisition_price > 0 ? formatRupiah(formData.acquisition_price) : ''}
                  onChange={(e) => {
                    const parsed = parseRupiah(e.target.value)
                    setFormData({ ...formData, acquisition_price: parsed })
                  }}
                  placeholder="Contoh: 1.500.000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm text-gray-900 bg-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: gunakan titik (.) sebagai pemisah ribuan. Contoh: 1.500.000
                </p>
              </div>
              <Input
                label="Estimasi Umur (Tahun)"
                type="number"
                value={formData.estimated_lifespan}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_lifespan: parseInt(e.target.value) })
                }
                required
              />
              <Select
                label="Kondisi"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                options={[
                  { value: 'Baik', label: 'Baik' },
                  { value: 'Rusak Ringan', label: 'Rusak Ringan' },
                  { value: 'Rusak Berat', label: 'Rusak Berat' },
                ]}
                required
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'Aktif', label: 'Aktif' },
                  { value: 'Disposal', label: 'Disposal' },
                  { value: 'Repair', label: 'Repair' },
                ]}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">
                <Zap className="w-4 h-4 mr-2" />
                Tambah {bulkCount} Unit Sekaligus
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowBulkForm(false)
                  setFormData({
                    asset_name: '',
                    location: '',
                    department_id: '',
                    unit: '1 Pcs',
                    acquisition_year: new Date().getFullYear(),
                    acquisition_price: 0,
                    estimated_lifespan: 5,
                    condition: 'Baik',
                    status: 'Aktif',
                    category: 'Office',
                    photo: null,
                  })
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showForm && !showBulkForm && (
        <Card title={editingAsset && isMasterAdmin ? 'Edit Aset' : 'Tambah Aset Baru'}>
          {editingAsset && !isMasterAdmin && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Peringatan:</strong> Hanya Master Admin yang dapat mengedit aset. Form ini akan menambahkan aset baru.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama Aset"
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                required
              />
              <Select
                label="Departemen"
                value={formData.department_id || (userProfile?.department_id && !isMasterAdmin ? userProfile.department_id : '')}
                onChange={(e) => {
                  const selectedValue = e.target.value
                  setFormData({ ...formData, department_id: selectedValue })
                }}
                options={
                  isMasterAdmin
                    ? departments.map((d) => ({ value: d.id, label: d.name }))
                    : departments
                        .filter((d) => d.id === userProfile?.department_id)
                        .map((d) => ({ value: d.id, label: d.name }))
                }
                placeholder={departments.length === 0 ? "Memuat departemen..." : "Pilih Departemen"}
                required
                disabled={departments.length === 0 || (!isMasterAdmin && !!userProfile?.department_id)}
              />
              <Input
                label="Lokasi"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="Kamar/Area Publik/Office"
              />
              <Select
                label="Kategori"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'Room', label: 'Room' },
                  { value: 'Public Area', label: 'Public Area' },
                  { value: 'Office', label: 'Office' },
                ]}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="unit-options"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ketik atau pilih: 1 Pcs, 2 Unit, 1 Lembar, dll"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm text-gray-900 bg-white"
                  required
                />
                <datalist id="unit-options">
                  <option value="1 Pcs" />
                  <option value="2 Pcs" />
                  <option value="3 Pcs" />
                  <option value="5 Pcs" />
                  <option value="10 Pcs" />
                  <option value="1 Unit" />
                  <option value="2 Unit" />
                  <option value="3 Unit" />
                  <option value="5 Unit" />
                  <option value="1 Set" />
                  <option value="2 Set" />
                  <option value="3 Set" />
                  <option value="1 Lembar" />
                  <option value="2 Lembar" />
                  <option value="5 Lembar" />
                  <option value="10 Lembar" />
                  <option value="1 Buah" />
                  <option value="2 Buah" />
                  <option value="1 Paket" />
                  <option value="1 Roll" />
                  <option value="1 Meter" />
                  <option value="1 Liter" />
                  <option value="Pcs" />
                  <option value="Unit" />
                  <option value="Set" />
                  <option value="Lembar" />
                  <option value="Buah" />
                  <option value="Paket" />
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  Ketik langsung atau pilih dari daftar: Pcs, Unit, Set, Lembar, Buah, Paket
                </p>
              </div>
              <Input
                label="Tahun Perolehan"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.acquisition_year}
                onChange={(e) => {
                  const year = parseInt(e.target.value) || new Date().getFullYear()
                  setFormData({ ...formData, acquisition_year: year })
                }}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Perolehan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.acquisition_price > 0 ? formatRupiah(formData.acquisition_price) : ''}
                  onChange={(e) => {
                    const parsed = parseRupiah(e.target.value)
                    setFormData({ ...formData, acquisition_price: parsed })
                  }}
                  placeholder="Contoh: 1.500.000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm text-gray-900 bg-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: gunakan titik (.) sebagai pemisah ribuan. Contoh: 1.500.000
                </p>
              </div>
              <Input
                label="Estimasi Umur (Tahun)"
                type="number"
                value={formData.estimated_lifespan}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_lifespan: parseInt(e.target.value) })
                }
                required
              />
              <Select
                label="Kondisi"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                options={[
                  { value: 'Baik', label: 'Baik' },
                  { value: 'Rusak Ringan', label: 'Rusak Ringan' },
                  { value: 'Rusak Berat', label: 'Rusak Berat' },
                ]}
                required
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'Aktif', label: 'Aktif' },
                  { value: 'Disposal', label: 'Disposal' },
                  { value: 'Repair', label: 'Repair' },
                ]}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Aset
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) =>
                    setFormData({ ...formData, photo: e.target.files?.[0] || null })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit">{editingAsset && isMasterAdmin ? 'Update' : 'Simpan'}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingAsset(null)
                  setFormData({
                    asset_name: '',
                    location: '',
                    department_id: '',
                    unit: '1 Pcs',
                    acquisition_year: new Date().getFullYear(),
                    acquisition_price: 0,
                    estimated_lifespan: 5,
                    condition: 'Baik',
                    status: 'Aktif',
                    category: 'Office',
                    photo: null,
                  })
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Cari aset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Memuat data aset...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">
              {searchTerm ? 'Tidak ada aset yang sesuai dengan pencarian' : 'Belum ada data aset'}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {searchTerm 
                ? 'Coba gunakan kata kunci lain' 
                : 'Klik tombol "Tambah Aset" untuk menambahkan data'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Aset Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama Aset
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lokasi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Departemen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kondisi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nilai Buku
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-4 py-3 text-sm font-mono">{asset.asset_code}</td>
                  <td className="px-4 py-3 text-sm">{asset.asset_name}</td>
                  <td className="px-4 py-3 text-sm">{asset.location}</td>
                  <td className="px-4 py-3 text-sm">
                    {(asset.departments as any)?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        asset.condition === 'Baik'
                          ? 'bg-green-100 text-green-800'
                          : asset.condition === 'Rusak Ringan'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {asset.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        asset.status === 'Aktif'
                          ? 'bg-blue-100 text-blue-800'
                          : asset.status === 'Repair'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(asset.book_value)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/assets/${asset.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      {/* Only Master Admin can edit and delete */}
                      {isMasterAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAsset(asset)
                              setFormData({
                                asset_name: asset.asset_name,
                                location: asset.location,
                                department_id: asset.department_id,
                                unit: asset.unit,
                                acquisition_year: asset.acquisition_year,
                                acquisition_price: asset.acquisition_price,
                                estimated_lifespan: asset.estimated_lifespan,
                                condition: asset.condition,
                                status: asset.status,
                                category: asset.category,
                                photo: null,
                              })
                              setShowForm(true)
                            }}
                            title="Edit (Hanya Master Admin)"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(asset.id)}
                            title="Hapus (Hanya Master Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

