'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Camera, FileText, Wrench, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { BarcodeDisplay } from '@/components/BarcodeDisplay'
// Image component will be handled via img tag for Supabase URLs

export default function AssetDetailPage() {
  const params = useParams()
  const assetId = params.id as string
  const [asset, setAsset] = useState<any>(null)
  const [audits, setAudits] = useState<any[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([])
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_date: new Date().toISOString().split('T')[0],
    maintenance_type: '',
    cost: 0,
    vendor: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (assetId) {
      fetchAssetData()
    }
  }, [assetId])

  const fetchAssetData = async () => {
    try {
      const [assetRes, auditsRes, maintenanceRes] = await Promise.all([
        supabase
          .from('assets')
          .select('*, departments(*)')
          .eq('id', assetId)
          .single(),
        supabase
          .from('audits')
          .select('*')
          .eq('asset_id', assetId)
          .order('audit_date', { ascending: false }),
        supabase
          .from('maintenance_logs')
          .select('*')
          .eq('asset_id', assetId)
          .order('maintenance_date', { ascending: false }),
      ])

      if (assetRes.data) setAsset(assetRes.data)
      if (auditsRes.data) setAudits(auditsRes.data)
      if (maintenanceRes.data) setMaintenanceLogs(maintenanceRes.data)
    } catch (error) {
      console.error('Error fetching asset data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await supabase.from('maintenance_logs').insert({
        asset_id: assetId,
        ...maintenanceForm,
      })

      setShowMaintenanceForm(false)
      setMaintenanceForm({
        maintenance_date: new Date().toISOString().split('T')[0],
        maintenance_type: '',
        cost: 0,
        vendor: '',
        notes: '',
      })
      fetchAssetData()
    } catch (error) {
      console.error('Error saving maintenance log:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Memuat data...</div>
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aset tidak ditemukan</p>
        <Link href="/assets">
          <Button className="mt-4">Kembali ke Daftar Aset</Button>
        </Link>
      </div>
    )
  }

  const dept = asset.departments as any

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{asset.asset_name}</h1>
            <p className="text-gray-600 mt-1">Kode: {asset.asset_code}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Informasi Aset">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Kode Aset</p>
                <p className="font-semibold">{asset.asset_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lokasi</p>
                <p className="font-semibold">{asset.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Departemen</p>
                <p className="font-semibold">{dept?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kategori</p>
                <p className="font-semibold">{asset.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Satuan</p>
                <p className="font-semibold">{asset.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tahun Perolehan</p>
                <p className="font-semibold">{asset.acquisition_year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Harga Perolehan</p>
                <p className="font-semibold">{formatCurrency(asset.acquisition_price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimasi Umur</p>
                <p className="font-semibold">{asset.estimated_lifespan} tahun</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nilai Buku</p>
                <p className="font-semibold text-primary-600">
                  {formatCurrency(asset.book_value)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kondisi</p>
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
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
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
              </div>
            </div>
          </Card>

          <Card
            title="Riwayat Audit"
            actions={
              <Button size="sm" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Lihat Semua
              </Button>
            }
          >
            <div className="space-y-4">
              {audits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada riwayat audit</p>
              ) : (
                audits.slice(0, 5).map((audit) => (
                  <div key={audit.id} className="border-l-4 border-primary-500 pl-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{formatDate(audit.audit_date)}</p>
                      <p className="text-sm text-gray-600">Oleh: {audit.auditor}</p>
                    </div>
                    {audit.findings && (
                      <p className="text-sm text-gray-700 mt-1">Temuan: {audit.findings}</p>
                    )}
                    {audit.notes && (
                      <p className="text-sm text-gray-600 mt-1">{audit.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card
            title="Riwayat Maintenance"
            actions={
              <Button
                size="sm"
                onClick={() => setShowMaintenanceForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah
              </Button>
            }
          >
            <div className="space-y-4">
              {maintenanceLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada riwayat maintenance</p>
              ) : (
                maintenanceLogs.map((log) => (
                  <div key={log.id} className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{formatDate(log.maintenance_date)}</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(log.cost)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      Jenis: {log.maintenance_type}
                    </p>
                    {log.vendor && (
                      <p className="text-sm text-gray-600 mt-1">Vendor: {log.vendor}</p>
                    )}
                    {log.notes && (
                      <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Foto Aset">
            {asset.photo_url ? (
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={asset.photo_url}
                  alt={asset.asset_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </Card>

          <Card title="Barcode">
            {asset.barcode && (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="font-mono text-sm mb-2">{asset.barcode}</p>
                  <BarcodeDisplay value={asset.barcode} />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {showMaintenanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4">Tambah Riwayat Maintenance</h2>
            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <Input
                label="Tanggal Maintenance"
                type="date"
                value={maintenanceForm.maintenance_date}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    maintenance_date: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Jenis Perbaikan"
                value={maintenanceForm.maintenance_type}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })
                }
                required
              />
              <Input
                label="Biaya"
                type="number"
                value={maintenanceForm.cost}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    cost: parseFloat(e.target.value),
                  })
                }
                required
              />
              <Input
                label="Vendor Servis"
                value={maintenanceForm.vendor}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, vendor: e.target.value })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={maintenanceForm.notes}
                  onChange={(e) =>
                    setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Simpan</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMaintenanceForm(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

