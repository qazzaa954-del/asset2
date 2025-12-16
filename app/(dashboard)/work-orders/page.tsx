'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Camera, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function WorkOrdersPage() {
  const { userProfile } = useAuth()
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null)
  const [formData, setFormData] = useState({
    asset_id: '',
    description: '',
    photo_before: null as File | null,
    assigned_to: '', // Engineering or IT user ID
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
  })
  const [startFormData, setStartFormData] = useState({
    started_date: new Date().toISOString().split('T')[0],
    photo_before: null as File | null,
  })
  const [completeFormData, setCompleteFormData] = useState({
    completed_date: new Date().toISOString().split('T')[0],
    photo_after: null as File | null,
  })
  const [engineeringUsers, setEngineeringUsers] = useState<any[]>([])
  const [itUsers, setItUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Check if user is IT or Engineering
  const isIT = userProfile?.role?.trim() === 'IT'
  const isEngineering = userProfile?.role?.trim() === 'Engineering'
  const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
  const isITOrEngineering = isIT || isEngineering || isMasterAdmin
  
  // All users can view work orders, but only Engineering/IT/Master Admin can manage
  const canViewWorkOrders = true // All authenticated users

  useEffect(() => {
    fetchData()
    // Check for scheduled maintenance
    checkScheduledMaintenance()
  }, [])

  const fetchData = async () => {
    try {
      const [woRes, assetsRes, engUsersRes, itUsersRes] = await Promise.all([
        supabase
          .from('work_orders')
          .select('*, assets(*, departments(*)), reported_by_user:users!work_orders_reported_by_fkey(*), assigned_to_user:users!work_orders_assigned_to_fkey(*)')
          .order('created_at', { ascending: false }),
        supabase.from('assets').select('*, departments(*)'),
        supabase.from('users').select('id, full_name, email').eq('role', 'Engineering').eq('is_active', true),
        supabase.from('users').select('id, full_name, email').eq('role', 'IT').eq('is_active', true),
      ])

      if (woRes.data) setWorkOrders(woRes.data)
      if (assetsRes.data) setAssets(assetsRes.data)
      if (engUsersRes.data) setEngineeringUsers(engUsersRes.data)
      if (itUsersRes.data) setItUsers(itUsersRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkScheduledMaintenance = async () => {
    if (!userProfile) return

    try {
      // 1. Check assets that need immediate maintenance (Rusak Ringan/Rusak Berat)
      const { data: assetsNeedingMaintenance } = await supabase
        .from('assets')
        .select('*')
        .in('condition', ['Rusak Ringan', 'Rusak Berat'])
        .eq('status', 'Aktif')

      if (assetsNeedingMaintenance && assetsNeedingMaintenance.length > 0) {
        for (const asset of assetsNeedingMaintenance) {
          // Check if there's already a pending WO for this asset
          const { data: existingWO } = await supabase
            .from('work_orders')
            .select('*')
            .eq('asset_id', asset.id)
            .in('status', ['Pending', 'In Progress'])
            .limit(1)
            .single()

          if (!existingWO) {
            // Calculate next maintenance date (7 days from now for urgent, 30 days for minor)
            const daysToAdd = asset.condition === 'Rusak Berat' ? 7 : 30
            const scheduledDate = new Date()
            scheduledDate.setDate(scheduledDate.getDate() + daysToAdd)

            await supabase.from('work_orders').insert({
              asset_id: asset.id,
              reported_by: userProfile.id,
              reported_date: new Date().toISOString().split('T')[0],
              description: `Maintenance terjadwal untuk aset ${asset.asset_name} - Kondisi: ${asset.condition}. Sistem otomatis membuat work order berdasarkan kondisi aset.`,
              status: 'Pending',
              is_scheduled: true,
              scheduled_date: scheduledDate.toISOString().split('T')[0],
            })
          }
        }
      }

      // 2. Check completed work orders and schedule next maintenance
      const { data: completedWO } = await supabase
        .from('work_orders')
        .select('*, assets(*)')
        .eq('status', 'Completed')
        .not('completed_date', 'is', null)
        .order('completed_date', { ascending: false })

      if (completedWO && completedWO.length > 0) {
        for (const wo of completedWO) {
          const asset = wo.assets as any
          if (!asset) continue

          // Check if there's already a scheduled WO for next maintenance
          const { data: nextScheduledWO } = await supabase
            .from('work_orders')
            .select('*')
            .eq('asset_id', asset.id)
            .eq('is_scheduled', true)
            .gt('scheduled_date', new Date().toISOString().split('T')[0])
            .limit(1)
            .single()

          if (!nextScheduledWO && asset.estimated_lifespan) {
            // Schedule next maintenance based on asset lifespan
            // For assets with lifespan > 5 years: schedule every 6 months
            // For assets with lifespan <= 5 years: schedule every 3 months
            const monthsToAdd = asset.estimated_lifespan > 5 ? 6 : 3
            const scheduledDate = new Date(wo.completed_date || new Date())
            scheduledDate.setMonth(scheduledDate.getMonth() + monthsToAdd)

            // Only create if scheduled date is in the future
            if (scheduledDate > new Date()) {
              await supabase.from('work_orders').insert({
                asset_id: asset.id,
                reported_by: userProfile.id,
                reported_date: new Date().toISOString().split('T')[0],
                description: `Maintenance terjadwal berikutnya untuk aset ${asset.asset_name}. Diperkirakan diperlukan maintenance rutin setiap ${monthsToAdd} bulan berdasarkan umur ekonomis aset.`,
                status: 'Pending',
                is_scheduled: true,
                scheduled_date: scheduledDate.toISOString().split('T')[0],
              })
            }
          }
        }
      }

      fetchData()
    } catch (error) {
      console.error('Error checking scheduled maintenance:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    try {
      let photoBeforeUrl = null
      if (formData.photo_before) {
        const fileExt = formData.photo_before.name.split('.').pop()
        const fileName = `wo-before-${Date.now()}.${fileExt}`
        const { data: uploadData } = await supabase.storage
          .from('work-order-photos')
          .upload(fileName, formData.photo_before)

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('work-order-photos')
            .getPublicUrl(fileName)
          photoBeforeUrl = urlData.publicUrl
        }
      }

      await supabase.from('work_orders').insert({
        asset_id: formData.asset_id,
        reported_by: userProfile.id,
        reported_date: new Date().toISOString().split('T')[0],
        description: formData.description,
        photo_before: photoBeforeUrl,
        status: 'Pending',
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
      })

      setShowForm(false)
      setFormData({ asset_id: '', description: '', photo_before: null, assigned_to: '', priority: 'Medium' })
      fetchData()
    } catch (error) {
      console.error('Error creating work order:', error)
    }
  }

  const handleStartWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkOrder || !isITOrEngineering) return

    try {
      if (!startFormData.photo_before) {
        alert('Foto sebelum pekerjaan wajib diisi!')
        return
      }

      // Upload photo before
      const fileExt = startFormData.photo_before.name.split('.').pop()
      const fileName = `wo-before-${selectedWorkOrder.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('work-order-photos')
        .upload(fileName, startFormData.photo_before)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('work-order-photos')
        .getPublicUrl(fileName)
      const photoBeforeUrl = urlData.publicUrl

      // Update work order
      const updateData: any = {
        status: 'In Progress',
        assigned_to: userProfile?.id,
        started_date: startFormData.started_date,
        photo_before: photoBeforeUrl,
      }

      const { error: updateError } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', selectedWorkOrder.id)

      if (updateError) {
        console.error('Update error:', updateError)
        // Berikan error message yang lebih jelas
        if (updateError.message.includes('row-level security')) {
          alert('Error: Akses ditolak. Pastikan:\n1. Role user adalah IT, Engineering, atau Master Admin\n2. Migration 023 sudah dijalankan di Supabase\n3. User sudah logout dan login lagi')
        }
        throw updateError
      }
      
      setShowStartModal(false)
      setSelectedWorkOrder(null)
      setStartFormData({
        started_date: new Date().toISOString().split('T')[0],
        photo_before: null,
      })
      fetchData()
      alert('Work order berhasil dimulai!')
    } catch (error: any) {
      console.error('Error starting work order:', error)
      alert(error.message || 'Terjadi kesalahan saat memulai work order')
    }
  }

  const handleCompleteWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkOrder || !isITOrEngineering) return

    try {
      if (!completeFormData.photo_after) {
        alert('Foto setelah pekerjaan wajib diisi!')
        return
      }

      // Upload photo after
      const fileExt = completeFormData.photo_after.name.split('.').pop()
      const fileName = `wo-after-${selectedWorkOrder.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('work-order-photos')
        .upload(fileName, completeFormData.photo_after)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('work-order-photos')
        .getPublicUrl(fileName)
      const photoAfterUrl = urlData.publicUrl

      // Update work order
      const updateData: any = {
        status: 'Completed',
        completed_date: completeFormData.completed_date,
        photo_after: photoAfterUrl,
      }

      await supabase.from('work_orders').update(updateData).eq('id', selectedWorkOrder.id)
      
      setShowCompleteModal(false)
      setSelectedWorkOrder(null)
      setCompleteFormData({
        completed_date: new Date().toISOString().split('T')[0],
        photo_after: null,
      })
      fetchData()
      alert('Work order berhasil diselesaikan!')
    } catch (error: any) {
      console.error('Error completing work order:', error)
      alert(error.message || 'Terjadi kesalahan saat menyelesaikan work order')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'In Progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-800',
      Medium: 'bg-blue-100 text-blue-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
    }
    const color = colors[priority as keyof typeof colors] || colors.Medium
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
        {priority}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Order</h1>
          <p className="text-gray-600 mt-1">
            {isITOrEngineering
              ? 'Kelola work order dan maintenance'
              : 'Laporkan kerusakan aset'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {isITOrEngineering ? 'Buat Work Order' : 'Laporkan Kerusakan'}
        </Button>
      </div>

      {showForm && (
        <Card title="Form Work Order Profesional">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Aset"
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              options={assets.map((a) => ({
                value: a.id,
                label: `${a.asset_code} - ${a.asset_name}`,
              }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi Kerusakan
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                required
              />
            </div>
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              options={[
                { value: 'Low', label: 'Low - Rendah' },
                { value: 'Medium', label: 'Medium - Sedang' },
                { value: 'High', label: 'High - Tinggi' },
                { value: 'Urgent', label: 'Urgent - Mendesak' },
              ]}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto Sebelum (Before)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    photo_before: e.target.files?.[0] || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            {isITOrEngineering && (
              <Select
                label="Assign ke Departemen"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                options={[
                  ...engineeringUsers.map((u) => ({ value: u.id, label: `Engineering - ${u.full_name}` })),
                  ...itUsers.map((u) => ({ value: u.id, label: `IT - ${u.full_name}` })),
                ]}
                placeholder={engineeringUsers.length === 0 && itUsers.length === 0 ? "Tidak ada user Engineering/IT" : "Pilih Engineering atau IT"}
                required={false}
              />
            )}
            <div className="flex gap-3">
              <Button type="submit">Kirim Work Order</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ asset_id: '', description: '', photo_before: null, assigned_to: '', priority: 'Medium' })
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  WO ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dilaporkan Oleh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal Laporan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada work order
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                const asset = wo.assets as any
                const reportedBy = wo.reported_by_user as any
                return (
                  <tr key={wo.id}>
                    <td className="px-4 py-3 text-sm font-mono">{wo.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">
                      {asset?.asset_code} - {asset?.asset_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportedBy ? (
                        <div>
                          <div className="font-medium text-gray-900">{reportedBy.full_name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(wo.reported_date)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{formatDate(wo.reported_date)}</div>
                      {wo.started_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Mulai: {formatDate(wo.started_date)}
                        </div>
                      )}
                      {wo.completed_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Selesai: {formatDate(wo.completed_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getPriorityBadge(wo.priority || 'Medium')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(wo.status)}
                        <span>{wo.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isITOrEngineering && wo.status === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedWorkOrder(wo)
                              setShowStartModal(true)
                            }}
                          >
                            Mulai
                          </Button>
                        </div>
                      )}
                      {isITOrEngineering && wo.status === 'In Progress' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedWorkOrder(wo)
                              setShowCompleteModal(true)
                            }}
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            Selesai
                          </Button>
                        </div>
                      )}
                      {!isITOrEngineering && wo.status === 'Pending' && (
                        <span className="text-xs text-gray-500">Menunggu penanganan</span>
                      )}
                      {!isITOrEngineering && wo.status === 'In Progress' && (
                        <span className="text-xs text-blue-600">Sedang dikerjakan</span>
                      )}
                      {wo.status === 'Completed' && (
                        <span className="text-xs text-green-600">Selesai</span>
                      )}
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Mulai Work Order */}
      {showStartModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Mulai Work Order
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Aset: {(selectedWorkOrder.assets as any)?.asset_code} - {(selectedWorkOrder.assets as any)?.asset_name}
            </p>
            <form onSubmit={handleStartWorkOrder} className="space-y-4">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={startFormData.started_date}
                onChange={(e) =>
                  setStartFormData({ ...startFormData, started_date: e.target.value })
                }
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Sebelum Pekerjaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) =>
                    setStartFormData({
                      ...startFormData,
                      photo_before: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Foto kondisi aset sebelum pekerjaan dimulai (wajib)
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Mulai Pekerjaan</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStartModal(false)
                    setSelectedWorkOrder(null)
                    setStartFormData({
                      started_date: new Date().toISOString().split('T')[0],
                      photo_before: null,
                    })
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Selesai Work Order */}
      {showCompleteModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Selesai Work Order
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Aset: {(selectedWorkOrder.assets as any)?.asset_code} - {(selectedWorkOrder.assets as any)?.asset_name}
            </p>
            <form onSubmit={handleCompleteWorkOrder} className="space-y-4">
              <Input
                label="Tanggal Selesai"
                type="date"
                value={completeFormData.completed_date}
                onChange={(e) =>
                  setCompleteFormData({ ...completeFormData, completed_date: e.target.value })
                }
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Setelah Pekerjaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) =>
                    setCompleteFormData({
                      ...completeFormData,
                      photo_after: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Foto kondisi aset setelah pekerjaan selesai (wajib)
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Selesai</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCompleteModal(false)
                    setSelectedWorkOrder(null)
                    setCompleteFormData({
                      completed_date: new Date().toISOString().split('T')[0],
                      photo_after: null,
                    })
                  }}
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

