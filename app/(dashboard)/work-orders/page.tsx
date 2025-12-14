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
  const [formData, setFormData] = useState({
    asset_id: '',
    description: '',
    photo_before: null as File | null,
    assigned_to: '', // Engineering or IT user ID
  })
  const [engineeringUsers, setEngineeringUsers] = useState<any[]>([])
  const [itUsers, setItUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isEngineeringOrIT =
    userProfile?.role?.trim() === 'Engineering' ||
    userProfile?.role?.trim() === 'IT' ||
    userProfile?.role?.trim() === 'Master Admin'
  
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
        assigned_to: formData.assigned_to || null,
      })

      setShowForm(false)
      setFormData({ asset_id: '', description: '', photo_before: null, assigned_to: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating work order:', error)
    }
  }

  const handleUpdateStatus = async (woId: string, status: string, photoAfter?: File) => {
    if (!isEngineeringOrIT) return

    try {
      let photoAfterUrl = null
      if (photoAfter) {
        const fileExt = photoAfter.name.split('.').pop()
        const fileName = `wo-after-${woId}-${Date.now()}.${fileExt}`
        const { data: uploadData } = await supabase.storage
          .from('work-order-photos')
          .upload(fileName, photoAfter)

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('work-order-photos')
            .getPublicUrl(fileName)
          photoAfterUrl = urlData.publicUrl
        }
      }

      const updateData: any = {
        status,
        assigned_to: userProfile?.id,
      }

      if (photoAfterUrl) {
        updateData.photo_after = photoAfterUrl
      }

      if (status === 'Completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0]
      }

      await supabase.from('work_orders').update(updateData).eq('id', woId)
      fetchData()
    } catch (error) {
      console.error('Error updating work order:', error)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Order</h1>
          <p className="text-gray-600 mt-1">
            {isEngineeringOrIT
              ? 'Kelola work order dan maintenance'
              : 'Laporkan kerusakan aset'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {isEngineeringOrIT ? 'Buat Work Order' : 'Laporkan Kerusakan'}
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
            {isEngineeringOrIT && (
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
                  setFormData({ asset_id: '', description: '', photo_before: null, assigned_to: '' })
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
                  Tanggal
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
                    <td className="px-4 py-3 text-sm">{reportedBy?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(wo.reported_date)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(wo.status)}
                        <span>{wo.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEngineeringOrIT && wo.status === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(wo.id, 'In Progress')}
                          >
                            Mulai
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleUpdateStatus(wo.id, 'Completed', file)
                              }
                            }}
                            className="hidden"
                            id={`photo-after-${wo.id}`}
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              document.getElementById(`photo-after-${wo.id}`)?.click()
                            }
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            Selesai
                          </Button>
                        </div>
                      )}
                      {!isEngineeringOrIT && wo.status === 'Pending' && (
                        <span className="text-xs text-gray-500">Menunggu penanganan</span>
                      )}
                      {wo.status !== 'Pending' && (
                        <span className="text-xs text-gray-500">{wo.status}</span>
                      )}
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

