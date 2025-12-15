'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { Bell } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase/client'

export function Header() {
  const { userProfile } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!userProfile) return

    const fetchNotifications = async () => {
      try {
        // 1. Get pending work orders
        const { data: pendingWO } = await supabase
          .from('work_orders')
          .select('*, assets(asset_name, asset_code)')
          .eq('status', 'Pending')
          .order('created_at', { ascending: false })
          .limit(10)

        // 2. Get in progress work orders
        const { data: inProgressWO } = await supabase
          .from('work_orders')
          .select('*, assets(asset_name, asset_code)')
          .eq('status', 'In Progress')
          .order('started_date', { ascending: false })
          .limit(5)

        // 3. Get scheduled work orders (maintenance yang akan datang)
        const today = new Date()
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        
        const { data: scheduledWO } = await supabase
          .from('work_orders')
          .select('*, assets(asset_name, asset_code)')
          .eq('is_scheduled', true)
          .in('status', ['Pending', 'In Progress'])
          .gte('scheduled_date', today.toISOString().split('T')[0])
          .lte('scheduled_date', nextMonth.toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .limit(10)

        // 4. Get assets that need repair
        const { data: repairAssets } = await supabase
          .from('assets')
          .select('asset_code, asset_name, condition, status')
          .in('condition', ['Rusak Ringan', 'Rusak Berat'])
          .eq('status', 'Aktif')
          .limit(10)

        // Build notifications
        const woPendingNotifications = (pendingWO || []).map((wo: any) => ({
          id: wo.id,
          type: 'work_order_pending',
          title: 'Work Order Pending',
          message: `${wo.assets?.asset_code} - ${wo.assets?.asset_name}`,
          date: wo.created_at,
          link: '/work-orders',
          priority: 'high',
        }))

        const woInProgressNotifications = (inProgressWO || []).map((wo: any) => ({
          id: wo.id + '-inprogress',
          type: 'work_order_in_progress',
          title: 'Work Order Sedang Dikerjakan',
          message: `${wo.assets?.asset_code} - ${wo.assets?.asset_name}`,
          date: wo.started_date || wo.created_at,
          link: '/work-orders',
          priority: 'medium',
        }))

        const scheduledNotifications = (scheduledWO || []).map((wo: any) => {
          const scheduledDate = new Date(wo.scheduled_date)
          const daysUntil = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          return {
            id: wo.id + '-scheduled',
            type: 'scheduled_maintenance',
            title: daysUntil <= 7 ? '⚠️ Maintenance Mendekati' : '📅 Maintenance Terjadwal',
            message: `${wo.assets?.asset_code} - ${wo.assets?.asset_name} (${daysUntil} hari lagi)`,
            date: wo.scheduled_date,
            link: '/work-orders',
            priority: daysUntil <= 7 ? 'high' : 'low',
          }
        })

        const assetNotifications = (repairAssets || []).map((asset: any) => ({
          id: asset.asset_code,
          type: 'asset_repair',
          title: 'Aset Perlu Perbaikan',
          message: `${asset.asset_code} - ${asset.asset_name} (${asset.condition})`,
          date: new Date().toISOString(),
          link: '/assets',
          priority: asset.condition === 'Rusak Berat' ? 'high' : 'medium',
        }))

        // Combine all notifications and sort by priority and date
        const allNotifications = [
          ...woPendingNotifications,
          ...woInProgressNotifications,
          ...scheduledNotifications,
          ...assetNotifications,
        ].sort((a, b) => {
          // Sort by priority first (high > medium > low)
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                              (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          if (priorityDiff !== 0) return priorityDiff
          // Then by date (newest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        })

        setNotifications(allNotifications)
        setNotificationCount(allNotifications.length)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userProfile])

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="sm" showText={false} />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Selamat Datang, {userProfile?.full_name || 'User'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Bell className="w-6 h-6 transition-transform duration-300 hover:rotate-12" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Tidak ada notifikasi
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notif) => {
                      const isHighPriority = notif.priority === 'high'
                      const isScheduled = notif.type === 'scheduled_maintenance'
                      
                      return (
                        <a
                          key={notif.id}
                          href={notif.link}
                          className={`block p-4 hover:bg-gray-50 transition-colors ${
                            isHighPriority ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                          }`}
                          onClick={() => setShowNotifications(false)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${isHighPriority ? 'text-red-900' : 'text-gray-900'}`}>
                                {notif.title}
                              </div>
                              <div className={`text-xs mt-1 ${isHighPriority ? 'text-red-700' : 'text-gray-600'}`}>
                                {notif.message}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {isScheduled 
                                  ? `Terjadwal: ${new Date(notif.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                  : new Date(notif.date).toLocaleString('id-ID')
                                }
                              </div>
                            </div>
                            {isHighPriority && (
                              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
