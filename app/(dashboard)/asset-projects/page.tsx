'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Edit, Trash2, Eye, Package, Calendar, DollarSign, User } from 'lucide-react'
import { formatDate, formatRupiah, parseRupiah } from '@/lib/utils'

export default function AssetProjectsPage() {
  const { userProfile } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [projectAssignments, setProjectAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [formData, setFormData] = useState({
    project_name: '',
    project_code: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: 0,
    actual_cost: 0,
    status: 'Planning' as 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled',
    department_id: '',
    project_manager: '',
  })
  const [assignFormData, setAssignFormData] = useState({
    asset_id: '',
    notes: '',
  })

  const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
  const canViewProjects = true // Semua user bisa view, tapi hanya Master Admin bisa edit

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectsRes, assetsRes, deptRes, assignmentsRes] = await Promise.all([
        supabase
          .from('asset_projects')
          .select('*, departments(*), created_by_user:users!asset_projects_created_by_fkey(*)')
          .order('created_at', { ascending: false }),
        supabase.from('assets').select('*, departments(*)').order('asset_code'),
        supabase.from('departments').select('*').order('name'),
        supabase
          .from('asset_project_assignments')
          .select('*, assets(*), projects:asset_projects(*)'),
      ])

      if (projectsRes.data) setProjects(projectsRes.data)
      if (assetsRes.data) setAssets(assetsRes.data)
      if (deptRes.data) setDepartments(deptRes.data)
      if (assignmentsRes.data) setProjectAssignments(assignmentsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !isMasterAdmin) return

    try {
      const projectData = {
        ...formData,
        budget: parseRupiah(formData.budget.toString()) || 0,
        actual_cost: parseRupiah(formData.actual_cost.toString()) || 0,
        department_id: formData.department_id || null,
        project_manager: formData.project_manager || null,
        created_by: userProfile.id,
      }

      if (editingProject) {
        const { error } = await supabase
          .from('asset_projects')
          .update(projectData)
          .eq('id', editingProject.id)

        if (error) throw error
        alert('Project berhasil diperbarui!')
      } else {
        const { error } = await supabase.from('asset_projects').insert(projectData)

        if (error) throw error
        alert('Project berhasil dibuat!')
      }

      setShowForm(false)
      setEditingProject(null)
      setFormData({
        project_name: '',
        project_code: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        budget: 0,
        actual_cost: 0,
        status: 'Planning',
        department_id: '',
        project_manager: '',
      })
      fetchData()
    } catch (error: any) {
      console.error('Error saving project:', error)
      alert(error.message || 'Terjadi kesalahan saat menyimpan project')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus project ini?')) return

    try {
      const { error } = await supabase.from('asset_projects').delete().eq('id', id)

      if (error) throw error
      alert('Project berhasil dihapus!')
      fetchData()
    } catch (error: any) {
      console.error('Error deleting project:', error)
      alert(error.message || 'Terjadi kesalahan saat menghapus project')
    }
  }

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      const { error } = await supabase.from('asset_project_assignments').insert({
        project_id: selectedProject.id,
        asset_id: assignFormData.asset_id,
        notes: assignFormData.notes || null,
      })

      if (error) throw error
      alert('Asset berhasil ditambahkan ke project!')
      setShowAssignModal(false)
      setSelectedProject(null)
      setAssignFormData({ asset_id: '', notes: '' })
      fetchData()
    } catch (error: any) {
      console.error('Error assigning asset:', error)
      alert(error.message || 'Terjadi kesalahan saat menambahkan asset')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Planning: 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
    }
    const color = colors[status as keyof typeof colors] || colors.Planning
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
        {status}
      </span>
    )
  }

  const getProjectAssets = (projectId: string) => {
    return projectAssignments.filter((a) => a.project_id === projectId)
  }

  const filteredProjects = projects.filter((p) =>
    p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.project_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Semua user bisa view, tapi hanya Master Admin bisa edit/create/delete

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Projects</h1>
          <p className="text-gray-600 mt-1">
            {isMasterAdmin ? 'Kelola proyek-proyek asset' : 'Lihat proyek-proyek asset'}
          </p>
        </div>
        {isMasterAdmin && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Project
          </Button>
        )}
      </div>

      {showForm && (
        <Card title={editingProject ? 'Edit Project' : 'Tambah Project Baru'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Project"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                required
              />
              <Input
                label="Kode Project"
                value={formData.project_code}
                onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
              <Input
                label="Tanggal Selesai"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (Rupiah)
                </label>
                <Input
                  value={formatRupiah(formData.budget)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: parseRupiah(e.target.value) || 0,
                    })
                  }
                  placeholder="1.000.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Cost (Rupiah)
                </label>
                <Input
                  value={formatRupiah(formData.actual_cost)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actual_cost: parseRupiah(e.target.value) || 0,
                    })
                  }
                  placeholder="1.000.000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'Planning', label: 'Planning' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'On Hold', label: 'On Hold' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
                required
              />
              <Select
                label="Departemen"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={[
                  { value: '', label: 'Pilih Departemen' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            </div>
            <Input
              label="Project Manager"
              value={formData.project_manager}
              onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
              placeholder="Nama Project Manager"
            />
            <div className="flex gap-3">
              <Button type="submit">{editingProject ? 'Update' : 'Simpan'}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingProject(null)
                  setFormData({
                    project_name: '',
                    project_code: '',
                    description: '',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    budget: 0,
                    actual_cost: 0,
                    status: 'Planning',
                    department_id: '',
                    project_manager: '',
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
        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Cari project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Departemen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Budget
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assets
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Belum ada project
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const projectAssets = getProjectAssets(project.id)
                  return (
                    <tr key={project.id}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {project.project_code}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{project.project_name}</div>
                        {project.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {project.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {(project.departments as any)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{formatDate(project.start_date)}</div>
                        {project.end_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            Selesai: {formatDate(project.end_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{formatRupiah(project.budget)}</div>
                        {project.actual_cost > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Actual: {formatRupiah(project.actual_cost)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(project.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{projectAssets.length} asset</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedProject(project)
                              setShowAssignModal(true)
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Asset
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProject(project)
                              setFormData({
                                project_name: project.project_name,
                                project_code: project.project_code,
                                description: project.description || '',
                                start_date: project.start_date,
                                end_date: project.end_date || '',
                                budget: project.budget,
                                actual_cost: project.actual_cost,
                                status: project.status,
                                department_id: project.department_id || '',
                                project_manager: project.project_manager || '',
                              })
                              setShowForm(true)
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(project.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Assign Asset */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Tambah Asset ke Project
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Project: {selectedProject.project_code} - {selectedProject.project_name}
            </p>
            <form onSubmit={handleAssignAsset} className="space-y-4">
              <Select
                label="Pilih Asset"
                value={assignFormData.asset_id}
                onChange={(e) => setAssignFormData({ ...assignFormData, asset_id: e.target.value })}
                options={assets.map((a) => ({
                  value: a.id,
                  label: `${a.asset_code} - ${a.asset_name}`,
                }))}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={assignFormData.notes}
                  onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Tambah Asset</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedProject(null)
                    setAssignFormData({ asset_id: '', notes: '' })
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

