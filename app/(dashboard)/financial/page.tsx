'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Download, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function FinancialPage() {
  const { userProfile } = useAuth()
  const [assets, setAssets] = useState<any[]>([])
  const [depreciationMethods, setDepreciationMethods] = useState<any[]>([])
  const [showAuditForm, setShowAuditForm] = useState(false)
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [auditForm, setAuditForm] = useState({
    audit_date: new Date().toISOString().split('T')[0],
    auditor: userProfile?.full_name || '',
    findings: '',
    notes: '',
  })
  const [methodForm, setMethodForm] = useState({
    name: '',
    formula: '',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [assetsRes, methodsRes] = await Promise.all([
        supabase.from('assets').select('*, departments(*)').order('asset_code'),
        supabase.from('depreciation_methods').select('*').order('name'),
      ])

      if (assetsRes.data) setAssets(assetsRes.data)
      if (methodsRes.data) setDepreciationMethods(methodsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return

    try {
      await supabase.from('audits').insert({
        asset_id: selectedAsset.id,
        ...auditForm,
      })

      setShowAuditForm(false)
      setSelectedAsset(null)
      setAuditForm({
        audit_date: new Date().toISOString().split('T')[0],
        auditor: userProfile?.full_name || '',
        findings: '',
        notes: '',
      })
      fetchData()
    } catch (error) {
      console.error('Error saving audit:', error)
    }
  }

  const handleMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await supabase.from('depreciation_methods').insert(methodForm)
      setShowMethodForm(false)
      setMethodForm({ name: '', formula: '', description: '' })
      fetchData()
    } catch (error) {
      console.error('Error saving method:', error)
    }
  }

  const exportToCSV = () => {
    // Group assets by department
    const assetsByDepartment: { [key: string]: any[] } = {}
    
    assets.forEach((asset) => {
      const deptName = (asset.departments as any)?.name || 'Tanpa Departemen'
      if (!assetsByDepartment[deptName]) {
        assetsByDepartment[deptName] = []
      }
      assetsByDepartment[deptName].push(asset)
    })

    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    let csvContent = ''
    
    // Header Laporan
    csvContent += '"LAPORAN INVENTARIS ASET"\n'
    csvContent += '"PT. DAMAR LANGIT"\n'
    csvContent += `"Tanggal: ${currentDate}"\n`
    csvContent += '\n'

    // Summary
    const totalAssets = assets.length
    const totalValue = assets.reduce((sum, a) => sum + Number(a.acquisition_price || 0), 0)
    const totalBookValue = assets.reduce((sum, a) => sum + Number(a.book_value || 0), 0)
    
    csvContent += '"RINGKASAN"\n'
    csvContent += `"Total Aset","${totalAssets}"\n`
    csvContent += `"Total Nilai Perolehan","${formatCurrency(totalValue)}"\n`
    csvContent += `"Total Nilai Buku","${formatCurrency(totalBookValue)}"\n`
    csvContent += `"Total Akumulasi Penyusutan","${formatCurrency(totalValue - totalBookValue)}"\n`
    csvContent += '\n'

    // Detail per Departemen
    const headers = [
      'No',
      'Kode Aset',
      'Nama Aset',
      'Kategori',
      'Lokasi',
      'Tahun Perolehan',
      'Umur Ekonomis (Thn)',
      'Harga Perolehan (Rp)',
      'Nilai Buku (Rp)',
      'Penyusutan (Rp)',
      'Kondisi',
      'Status',
    ]

    Object.keys(assetsByDepartment).sort().forEach((deptName) => {
      const deptAssets = assetsByDepartment[deptName]
      const deptTotalValue = deptAssets.reduce((sum, a) => sum + Number(a.acquisition_price || 0), 0)
      const deptBookValue = deptAssets.reduce((sum, a) => sum + Number(a.book_value || 0), 0)
      
      csvContent += '\n'
      csvContent += `"DEPARTEMEN: ${deptName.toUpperCase()}"\n`
      csvContent += `"Jumlah Aset: ${deptAssets.length}"\n`
      csvContent += `"Total Nilai: ${formatCurrency(deptTotalValue)}"\n`
      csvContent += '\n'
      csvContent += headers.map(h => `"${h}"`).join(',') + '\n'
      
      deptAssets.forEach((asset, index) => {
        const depreciation = Number(asset.acquisition_price || 0) - Number(asset.book_value || 0)
        const row = [
          index + 1,
          asset.asset_code || '-',
          asset.asset_name || '-',
          asset.category || '-',
          asset.location || '-',
          asset.acquisition_year || '-',
          asset.estimated_lifespan || '-',
          Number(asset.acquisition_price || 0).toLocaleString('id-ID'),
          Number(asset.book_value || 0).toLocaleString('id-ID'),
          depreciation.toLocaleString('id-ID'),
          asset.condition || '-',
          asset.status || '-',
        ]
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
      })
      
      // Subtotal per departemen
      csvContent += `"","","","","","","SUBTOTAL","${deptTotalValue.toLocaleString('id-ID')}","${deptBookValue.toLocaleString('id-ID')}","${(deptTotalValue - deptBookValue).toLocaleString('id-ID')}","",""\n`
    })

    // Grand Total
    csvContent += '\n'
    csvContent += `"","","","","","","GRAND TOTAL","${totalValue.toLocaleString('id-ID')}","${totalBookValue.toLocaleString('id-ID')}","${(totalValue - totalBookValue).toLocaleString('id-ID')}","",""\n`

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Laporan-Aset-Per-Departemen-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finansial & Audit</h1>
          <p className="text-gray-600 mt-1">Kelola depresiasi dan audit aset</p>
        </div>
        <div className="flex gap-3">
          {isMasterAdmin && (
            <>
              <Button onClick={() => setShowMethodForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Metode Depresiasi
              </Button>
              <Button onClick={exportToCSV} variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Depreciation Methods */}
      {isMasterAdmin && (
        <Card title="Metode Depresiasi">
          <div className="space-y-4">
            {depreciationMethods.map((method) => (
              <div
                key={method.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{method.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{method.formula}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      method.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {method.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit Menu - Master Admin Only */}
      {isMasterAdmin && (
        <Card title="Menu Audit Aset (Real Time)">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Total Aset: {assets.length} | Total Nilai Buku:{' '}
              {formatCurrency(assets.reduce((sum, a) => sum + Number(a.book_value), 0))}
            </p>
          </div>
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
                    Departemen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Harga Perolehan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nilai Buku
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kondisi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Belum ada data aset. Silakan tambahkan aset terlebih dahulu.</p>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{asset.asset_code}</td>
                      <td className="px-4 py-3 text-sm">{asset.asset_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {(asset.departments as any)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(asset.acquisition_price)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatCurrency(asset.book_value)}
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setShowAuditForm(true)
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Audit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Audit Form Modal */}
      {showAuditForm && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4">
              Form Audit: {selectedAsset.asset_name}
            </h2>
            <form onSubmit={handleAuditSubmit} className="space-y-4">
              <Input
                label="Tanggal Audit"
                type="date"
                value={auditForm.audit_date}
                onChange={(e) =>
                  setAuditForm({ ...auditForm, audit_date: e.target.value })
                }
                required
              />
              <Input
                label="Auditor"
                value={auditForm.auditor}
                onChange={(e) => setAuditForm({ ...auditForm, auditor: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temuan
                </label>
                <textarea
                  value={auditForm.findings}
                  onChange={(e) => setAuditForm({ ...auditForm, findings: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={auditForm.notes}
                  onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Simpan Audit</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAuditForm(false)
                    setSelectedAsset(null)
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Method Form Modal */}
      {showMethodForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4">Tambah Metode Depresiasi</h2>
            <form onSubmit={handleMethodSubmit} className="space-y-4">
              <Input
                label="Nama Metode"
                value={methodForm.name}
                onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formula
                </label>
                <textarea
                  value={methodForm.formula}
                  onChange={(e) => setMethodForm({ ...methodForm, formula: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={methodForm.description}
                  onChange={(e) =>
                    setMethodForm({ ...methodForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Simpan</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMethodForm(false)}
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

