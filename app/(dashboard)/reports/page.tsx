'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Download, FileText, Plus, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ReportsPage() {
  const { userProfile } = useAuth()
  const [recapData, setRecapData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [assets, setAssets] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [formData, setFormData] = useState({
    asset_id: '',
    work_order_id: '',
    audit_date: new Date().toISOString().split('T')[0],
    auditor: userProfile?.full_name || '',
    findings: '',
    notes: '',
    can_repair: true, // Bisa diperbaiki atau tidak
  })

  useEffect(() => {
    fetchRecapData()
    fetchAssetsAndWorkOrders()
  }, [])

  const fetchAssetsAndWorkOrders = async () => {
    try {
      const [assetsRes, woRes] = await Promise.all([
        supabase.from('assets').select('*, departments(*)').order('asset_code'),
        supabase.from('work_orders').select('*, assets(asset_code, asset_name)').eq('status', 'Pending').order('created_at', { ascending: false }),
      ])
      if (assetsRes.data) setAssets(assetsRes.data)
      if (woRes.data) setWorkOrders(woRes.data)
    } catch (error) {
      console.error('Error fetching assets/work orders:', error)
    }
  }

  const fetchRecapData = async () => {
    try {
      const { data: assets } = await supabase
        .from('assets')
        .select('*, departments(*)')

      const { data: departments } = await supabase.from('departments').select('*')

      if (assets && departments) {
        const recap = departments.map((dept) => {
          const deptAssets = assets.filter((a) => a.department_id === dept.id)
          const totalAssets = deptAssets.length
          const baik = deptAssets.filter((a) => a.condition === 'Baik').length
          const rusakRingan = deptAssets.filter((a) => a.condition === 'Rusak Ringan').length
          const rusakBerat = deptAssets.filter((a) => a.condition === 'Rusak Berat').length
          const dalamPerbaikan = deptAssets.filter((a) => a.status === 'Repair').length
          const nilaiBukuTotal = deptAssets.reduce(
            (sum, a) => sum + Number(a.book_value),
            0
          )

          return {
            department: dept.name,
            totalAssets,
            baik,
            rusakRingan,
            rusakBerat,
            dalamPerbaikan,
            nilaiBukuTotal,
          }
        })

        setRecapData(recap)
      }
    } catch (error) {
      console.error('Error fetching recap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    try {
      // If connected to work order, update asset condition/status based on can_repair
      if (formData.work_order_id) {
        const wo = workOrders.find((w: any) => w.id === formData.work_order_id)
        if (wo && formData.asset_id) {
          // Update asset based on findings
          const updateData: any = {}
          if (!formData.can_repair) {
            // Tidak bisa diperbaiki - ubah status menjadi Disposal
            updateData.status = 'Disposal'
            updateData.condition = 'Rusak Berat'
          } else {
            // Bisa diperbaiki - ubah status menjadi Repair jika belum
            if (wo.assets) {
              updateData.status = 'Repair'
            }
          }
          
          if (Object.keys(updateData).length > 0) {
            await supabase.from('assets').update(updateData).eq('id', formData.asset_id)
          }
        }
      } else if (formData.asset_id && !formData.can_repair) {
        // Direct input - jika tidak bisa diperbaiki, ubah status
        await supabase.from('assets').update({
          status: 'Disposal',
          condition: 'Rusak Berat',
        }).eq('id', formData.asset_id)
      }

      // Insert audit record
      await supabase.from('audits').insert({
        asset_id: formData.asset_id,
        audit_date: formData.audit_date,
        auditor: formData.auditor,
        findings: formData.findings,
        notes: formData.notes + (formData.can_repair ? ' | Status: Bisa diperbaiki' : ' | Status: Tidak bisa diperbaiki - Disposal'),
      })

      setShowForm(false)
      setFormData({
        asset_id: '',
        work_order_id: '',
        audit_date: new Date().toISOString().split('T')[0],
        auditor: userProfile?.full_name || '',
        findings: '',
        notes: '',
        can_repair: true,
      })
      fetchRecapData()
      fetchAssetsAndWorkOrders()
      alert('Laporan BAK berhasil disimpan!')
    } catch (error: any) {
      console.error('Error saving report:', error)
      alert('Terjadi kesalahan saat menyimpan laporan: ' + error.message)
    }
  }

  const exportRecapToCSV = () => {
    const headers = [
      'Departemen',
      'Total Aset',
      'Baik',
      'Rusak Ringan',
      'Rusak Berat',
      'Dalam Perbaikan',
      'Nilai Buku Total',
    ]

    const rows = recapData.map((row) => [
      row.department,
      row.totalAssets,
      row.baik,
      row.rusakRingan,
      row.rusakBerat,
      row.dalamPerbaikan,
      row.nilaiBukuTotal,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rekapitulasi-audit-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return <div className="text-center py-12">Memuat data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan BAK</h1>
          <p className="text-gray-600 mt-1">Rekapitulasi audit departemen dan laporan aset</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Input Laporan BAK
          </Button>
          <Button onClick={exportRecapToCSV} variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {showForm && (
        <Card title="Form Input Laporan BAK">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Jika aset terhubung dengan Work Order yang masih bisa diperbaiki, sistem akan mengubah status aset menjadi "Repair". 
                Jika tidak bisa diperbaiki, status akan menjadi "Disposal" dan kondisi "Rusak Berat".
              </p>
            </div>
            
            <Select
              label="Pilih Aset"
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              options={assets.map((a) => ({
                value: a.id,
                label: `${a.asset_code} - ${a.asset_name} (${(a.departments as any)?.name || ''})`,
              }))}
              placeholder="Pilih Aset"
              required
            />

            <Select
              label="Terhubung dengan Work Order (Opsional)"
              value={formData.work_order_id}
              onChange={(e) => {
                const wo = workOrders.find((w: any) => w.id === e.target.value)
                setFormData({
                  ...formData,
                  work_order_id: e.target.value,
                  asset_id: wo ? wo.asset_id : formData.asset_id,
                })
              }}
              options={[
                { value: '', label: 'Tidak terhubung dengan WO' },
                ...workOrders.map((wo: any) => ({
                  value: wo.id,
                  label: `${wo.assets?.asset_code || ''} - ${wo.assets?.asset_name || ''} (${wo.description.substring(0, 50)}...)`,
                })),
              ]}
              placeholder="Pilih Work Order (opsional)"
            />

            <Input
              label="Tanggal Audit"
              type="date"
              value={formData.audit_date}
              onChange={(e) => setFormData({ ...formData, audit_date: e.target.value })}
              required
            />

            <Input
              label="Auditor"
              value={formData.auditor}
              onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temuan / Findings
              </label>
              <textarea
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                required
                placeholder="Jelaskan temuan audit..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan / Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Catatan tambahan..."
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_repair}
                  onChange={(e) => setFormData({ ...formData, can_repair: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Aset masih bisa diperbaiki</span>
              </label>
              {!formData.can_repair && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Status akan diubah menjadi "Disposal"</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit">Simpan Laporan</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    asset_id: '',
                    work_order_id: '',
                    audit_date: new Date().toISOString().split('T')[0],
                    auditor: userProfile?.full_name || '',
                    findings: '',
                    notes: '',
                    can_repair: true,
                  })
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Rekapitulasi Audit Departemen">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Departemen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Aset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Baik
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rusak Ringan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rusak Berat
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dalam Perbaikan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nilai Buku Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recapData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data. Silakan tambahkan aset terlebih dahulu.
                  </td>
                </tr>
              ) : (
                recapData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold">{row.department}</td>
                    <td className="px-4 py-3 text-sm">{row.totalAssets}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{row.baik}</td>
                    <td className="px-4 py-3 text-sm text-yellow-600 font-medium">{row.rusakRingan}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{row.rusakBerat}</td>
                    <td className="px-4 py-3 text-sm text-orange-600 font-medium">{row.dalamPerbaikan}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {formatCurrency(row.nilaiBukuTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

