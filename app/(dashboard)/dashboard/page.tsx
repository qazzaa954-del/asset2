'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts'
import { Package, AlertTriangle, Wrench, DollarSign, Plus, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Logo } from '@/components/Logo'

const COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#0ea5e9']

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    pendingWorkOrders: 0,
    assetsInRepair: 0,
    scheduledWorkOrders: 0,
  })
  const [scheduledWorkOrders, setScheduledWorkOrders] = useState<any[]>([])
  const [conditionData, setConditionData] = useState<Array<{ name: string; value: number }>>([])
  const [departmentData, setDepartmentData] = useState<Array<{ name: string; value: number }>>([])
  const [statusData, setStatusData] = useState<Array<{ name: string; value: number }>>([])
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number }>>([])
  const [yearlyAcquisitionData, setYearlyAcquisitionData] = useState<Array<{ year: number; count: number; value: number }>>([])
  const [projectStatusData, setProjectStatusData] = useState<Array<{ name: string; value: number }>>([])
  const [projectAssetsData, setProjectAssetsData] = useState<Array<{ project: string; assets: number }>>([])
  const [loading, setLoading] = useState(true)
  const [creatingSample, setCreatingSample] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch assets
      const { data: assets } = await supabase.from('assets').select('*')

      if (assets) {
        const totalAssets = assets.length
        const totalValue = assets.reduce((sum, asset) => sum + Number(asset.book_value), 0)
        const assetsInRepair = assets.filter((a) => a.status === 'Repair').length

        // Condition distribution
        const conditionCounts = assets.reduce((acc: any, asset) => {
          acc[asset.condition] = (acc[asset.condition] || 0) + 1
          return acc
        }, {})

        const conditionChartData = Object.entries(conditionCounts).map(([name, value]) => ({
          name,
          value: Number(value),
        }))

        // Department distribution
        const { data: departments } = await supabase.from('departments').select('*')
        const deptMap = new Map(departments?.map((d) => [d.id, d.name]) || [])

        const deptCounts = assets.reduce((acc: any, asset) => {
          const deptName = deptMap.get(asset.department_id) || 'Unknown'
          acc[deptName] = (acc[deptName] || 0) + 1
          return acc
        }, {})

        const deptChartData = Object.entries(deptCounts).map(([name, value]) => ({
          name,
          value: Number(value),
        }))

        // Status distribution
        const statusCounts = assets.reduce((acc: any, asset) => {
          acc[asset.status] = (acc[asset.status] || 0) + 1
          return acc
        }, {})
        const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value: Number(value),
        }))

        // Category distribution
        const categoryCounts = assets.reduce((acc: any, asset) => {
          acc[asset.category] = (acc[asset.category] || 0) + 1
          return acc
        }, {})
        const categoryChartData = Object.entries(categoryCounts).map(([name, value]) => ({
          name,
          value: Number(value),
        }))

        // Yearly acquisition data
        const yearlyData = assets.reduce((acc: any, asset) => {
          const year = asset.acquisition_year
          if (!acc[year]) {
            acc[year] = { count: 0, value: 0 }
          }
          acc[year].count += 1
          acc[year].value += Number(asset.acquisition_price)
          return acc
        }, {})
        const yearlyChartData = Object.entries(yearlyData)
          .map(([year, data]: [string, any]) => ({
            year: Number(year),
            count: data.count,
            value: data.value,
          }))
          .sort((a, b) => a.year - b.year)

        setConditionData(conditionChartData)
        setDepartmentData(deptChartData)
        setStatusData(statusChartData)
        setCategoryData(categoryChartData)
        setYearlyAcquisitionData(yearlyChartData)

        // Fetch Asset Projects data for charts
        const { data: projects, error: projectsError } = await supabase
          .from('asset_projects')
          .select('*, asset_project_assignments(*)')
        
        console.log('Asset Projects data:', { projects, error: projectsError })
        
        if (projects && projects.length > 0) {
          // Project Status Distribution
          const projectStatusCounts = projects.reduce((acc: any, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1
            return acc
          }, {})
          const projectStatusChartData = Object.entries(projectStatusCounts).map(([name, value]) => ({
            name,
            value: Number(value),
          }))
          setProjectStatusData(projectStatusChartData)
          console.log('Project Status Chart Data:', projectStatusChartData)

          // Assets per Project
          const projectAssetsChartData = projects.map((project) => ({
            project: project.project_name,
            assets: (project.asset_project_assignments as any[])?.length || 0,
          })).filter((p) => p.assets > 0)
          setProjectAssetsData(projectAssetsChartData)
          console.log('Project Assets Chart Data:', projectAssetsChartData)
        } else {
          console.log('No projects found or empty array')
          setProjectStatusData([])
          setProjectAssetsData([])
        }

        // Fetch work orders
        const { data: workOrders } = await supabase
          .from('work_orders')
          .select('*')
          .eq('status', 'Pending')

        // Fetch scheduled work orders (for Engineering & IT)
        const isEngineeringOrIT = userProfile?.role?.trim() === 'Engineering' || 
                                  userProfile?.role?.trim() === 'IT' || 
                                  userProfile?.role?.trim() === 'Master Admin'
        
        let scheduledWO: any[] = []
        if (isEngineeringOrIT) {
          const { data: scheduled } = await supabase
            .from('work_orders')
            .select('*, assets(asset_code, asset_name, condition)')
            .eq('is_scheduled', true)
            .in('status', ['Pending', 'In Progress'])
            .gte('scheduled_date', new Date().toISOString().split('T')[0])
            .order('scheduled_date', { ascending: true })
            .limit(10)
          
          scheduledWO = scheduled || []
        }

        setScheduledWorkOrders(scheduledWO)
        setStats({
          totalAssets,
          totalValue,
          pendingWorkOrders: workOrders?.length || 0,
          assetsInRepair,
          scheduledWorkOrders: scheduledWO.length,
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSampleAssets = async () => {
    if (!userProfile) {
      alert('Anda harus login untuk membuat sample assets')
      return
    }

    setCreatingSample(true)
    try {
      // Get departments
      const { data: departments } = await supabase.from('departments').select('*')
      if (!departments || departments.length === 0) {
        alert('Tidak ada departemen. Silakan buat departemen terlebih dahulu.')
        return
      }

      // Get IT department (or first department)
      const itDept = departments.find(d => d.code === 'IT') || departments[0]
      
      // Get next sequence number
      const { data: existingAssets } = await supabase
        .from('assets')
        .select('asset_code')
        .like('asset_code', `${itDept.initial_code}-%`)
        .order('asset_code', { ascending: false })
        .limit(1)

      let sequenceNumber = 1
      if (existingAssets && existingAssets.length > 0) {
        const lastCode = existingAssets[0].asset_code
        const lastSeq = parseInt(lastCode.split('-')[1]) || 0
        sequenceNumber = lastSeq + 1
      }

      // Sample assets data
      const sampleAssets = [
        {
          asset_name: 'Laptop Dell Inspiron',
          location: 'Office IT',
          department_id: itDept.id,
          unit: 'Unit',
          acquisition_year: 2024,
          acquisition_price: 12000000,
          estimated_lifespan: 4,
          condition: 'Baik',
          status: 'Aktif',
          category: 'Office',
          asset_code: `${itDept.initial_code}-${String(sequenceNumber).padStart(4, '0')}`,
          barcode: `${itDept.initial_code}-${String(sequenceNumber).padStart(4, '0')}`,
          book_value: 12000000,
          created_by: userProfile.id,
        },
        {
          asset_name: 'Printer HP LaserJet',
          location: 'Office IT',
          department_id: itDept.id,
          unit: 'Unit',
          acquisition_year: 2023,
          acquisition_price: 4500000,
          estimated_lifespan: 4,
          condition: 'Baik',
          status: 'Aktif',
          category: 'Office',
          asset_code: `${itDept.initial_code}-${String(sequenceNumber + 1).padStart(4, '0')}`,
          barcode: `${itDept.initial_code}-${String(sequenceNumber + 1).padStart(4, '0')}`,
          book_value: 3375000, // Depreciated value
          created_by: userProfile.id,
        },
        {
          asset_name: 'Server Utama',
          location: 'Server Room',
          department_id: itDept.id,
          unit: 'Unit',
          acquisition_year: 2022,
          acquisition_price: 50000000,
          estimated_lifespan: 7,
          condition: 'Baik',
          status: 'Aktif',
          category: 'Public Area',
          asset_code: `${itDept.initial_code}-${String(sequenceNumber + 2).padStart(4, '0')}`,
          barcode: `${itDept.initial_code}-${String(sequenceNumber + 2).padStart(4, '0')}`,
          book_value: 35714286, // Depreciated value
          created_by: userProfile.id,
        },
      ]

      // Insert sample assets
      const { error } = await supabase.from('assets').insert(sampleAssets)

      if (error) {
        console.error('Error creating sample assets:', error)
        alert('Error: ' + error.message)
      } else {
        alert('3 contoh asset berhasil dibuat!')
        // Refresh data
        await fetchDashboardData()
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert('Terjadi kesalahan: ' + error.message)
    } finally {
      setCreatingSample(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="md" showText={false} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Ringkasan data aset dan aktivitas</p>
            </div>
          </div>
          {stats.totalAssets === 0 && (
            <Button
              onClick={createSampleAssets}
              disabled={creatingSample}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {creatingSample ? 'Membuat...' : 'Buat 3 Contoh Asset'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium truncate">Total Aset</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 break-words">
                {stats.totalAssets}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">Semua aset terdaftar</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium truncate">Nilai Total Aset</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 break-words leading-tight">
                {formatCurrency(stats.totalValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">Total nilai buku</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium truncate">Work Order Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 break-words">
                {stats.pendingWorkOrders}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">Menunggu penanganan</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
              <Wrench className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium truncate">Aset Dalam Perbaikan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 break-words">
                {stats.assetsInRepair}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">Memerlukan perhatian</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg flex-shrink-0 ml-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts - Professional Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Condition Distribution Pie Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Distribusi Kondisi Aset</h3>
            <p className="text-sm text-gray-500">Persentase kondisi aset secara keseluruhan</p>
          </div>
          {conditionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {conditionData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Belum ada data</p>
            </div>
          )}
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Distribusi Status Aset</h3>
            <p className="text-sm text-gray-500">Status aset: Aktif, Repair, atau Disposal</p>
          </div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#6b7280'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Belum ada data</p>
            </div>
          )}
        </Card>
      </div>

      {/* Department & Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department Bar Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Aset per Departemen</h3>
            <p className="text-sm text-gray-500">Distribusi aset berdasarkan departemen</p>
          </div>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="value" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Belum ada data</p>
            </div>
          )}
        </Card>

        {/* Category Bar Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Aset per Kategori</h3>
            <p className="text-sm text-gray-500">Distribusi aset berdasarkan kategori</p>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Belum ada data</p>
            </div>
          )}
        </Card>
      </div>

      {/* Yearly Acquisition Chart */}
      {yearlyAcquisitionData.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow duration-300 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tren Perolehan Aset per Tahun</h3>
            <p className="text-sm text-gray-500">Jumlah dan nilai aset yang diperoleh setiap tahun</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={yearlyAcquisitionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Tahun', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Jumlah Aset', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`}
                label={{ value: 'Nilai (Rupiah)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'value') {
                    return [`Rp ${formatCurrency(value)}`, 'Nilai Total']
                  }
                  return [value, 'Jumlah Aset']
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Jumlah Aset" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 5 }}
                name="Nilai Total"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Asset Projects Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project Status Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Status Asset Projects</h3>
            <p className="text-sm text-gray-500">Distribusi status project asset</p>
          </div>
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Belum ada data project</p>
            </div>
          )}
        </Card>

        {/* Assets per Project */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assets per Project</h3>
            <p className="text-sm text-gray-500">Jumlah asset yang ter-assign ke setiap project</p>
          </div>
          {projectAssetsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectAssetsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="project" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="assets" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Jumlah Asset" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <p>Belum ada asset yang ter-assign ke project</p>
            </div>
          )}
        </Card>
      </div>

      {/* Scheduled Work Orders - Only for Engineering & IT */}
      {(userProfile?.role?.trim() === 'Engineering' || 
        userProfile?.role?.trim() === 'IT' || 
        userProfile?.role?.trim() === 'Master Admin') && 
        scheduledWorkOrders.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Work Order Terjadwal
              </h3>
              <p className="text-sm text-gray-500">Jadwal perbaikan yang akan datang (Otomatis dibuat oleh sistem)</p>
            </div>
            <Link href="/work-orders">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {scheduledWorkOrders.slice(0, 5).map((wo: any) => {
              const asset = wo.assets as any
              const scheduledDate = new Date(wo.scheduled_date)
              const daysUntil = Math.ceil((scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <div
                  key={wo.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {asset?.asset_code || 'N/A'}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Terjadwal
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{asset?.asset_name || 'N/A'}</p>
                      <p className="text-xs text-gray-600 mb-2">{wo.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {scheduledDate.toLocaleDateString('id-ID', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {daysUntil > 0 ? `${daysUntil} hari lagi` : 'Hari ini'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {scheduledWorkOrders.length > 5 && (
            <div className="mt-4 text-center">
              <Link href="/work-orders">
                <Button variant="outline" size="sm">
                  Lihat {scheduledWorkOrders.length - 5} work order terjadwal lainnya
                </Button>
              </Link>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
