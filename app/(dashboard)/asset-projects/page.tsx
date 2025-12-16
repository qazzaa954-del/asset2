'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Edit, Trash2, Eye, Package, Calendar, DollarSign, User, FileText, Image as ImageIcon, X } from 'lucide-react'
import { formatDate, formatRupiah, parseRupiah } from '@/lib/utils'
import Image from 'next/image'

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
    photo_before: null as File | null,
    photo_after: null as File | null,
  })
  const [showAssetsModal, setShowAssetsModal] = useState(false)
  const [selectedProjectForAssets, setSelectedProjectForAssets] = useState<any>(null)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

  const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
  // Semua user bisa manage project mereka sendiri (untuk department mereka atau jika Master Admin)
  const canManageProjects = true
  const canViewProjects = true // Semua user bisa view
  
  // Helper function untuk check apakah user bisa edit/delete project tertentu
  const canEditProject = (project: any) => {
    if (isMasterAdmin) return true
    if (!userProfile) return false
    // User bisa edit project yang dibuat oleh mereka atau untuk department mereka
    return project.created_by === userProfile.id || 
           (project.department_id && project.department_id === userProfile.department_id)
  }

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
    if (!userProfile) return

    try {
      const projectData = {
        ...formData,
        budget: parseRupiah(formData.budget.toString()) || 0,
        actual_cost: parseRupiah(formData.actual_cost.toString()) || 0,
        department_id: formData.department_id || userProfile.department_id || null,
        project_manager: formData.project_manager || null,
        created_by: editingProject ? editingProject.created_by : userProfile.id,
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

  const uploadPhoto = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('asset-photos')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        return null
      }

      const { data } = supabase.storage.from('asset-photos').getPublicUrl(filePath)
      return data.publicUrl
    } catch (error) {
      console.error('Error in uploadPhoto:', error)
      return null
    }
  }

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      let photoBeforeUrl = null
      let photoAfterUrl = null

      // Upload foto before jika ada
      if (assignFormData.photo_before) {
        photoBeforeUrl = await uploadPhoto(assignFormData.photo_before, 'project-assets')
        if (!photoBeforeUrl) {
          alert('Gagal upload foto before, tetapi akan melanjutkan...')
        }
      }

      // Upload foto after jika ada
      if (assignFormData.photo_after) {
        photoAfterUrl = await uploadPhoto(assignFormData.photo_after, 'project-assets')
        if (!photoAfterUrl) {
          alert('Gagal upload foto after, tetapi akan melanjutkan...')
        }
      }

      const assignmentData: any = {
        project_id: selectedProject.id,
        asset_id: assignFormData.asset_id,
        notes: assignFormData.notes || null,
      }

      if (photoBeforeUrl) assignmentData.photo_before = photoBeforeUrl
      if (photoAfterUrl) assignmentData.photo_after = photoAfterUrl

      if (editingAssignment) {
        const { error } = await supabase
          .from('asset_project_assignments')
          .update(assignmentData)
          .eq('id', editingAssignment.id)
        if (error) throw error
        alert('Asset assignment berhasil diperbarui!')
      } else {
        const { error } = await supabase.from('asset_project_assignments').insert(assignmentData)
        if (error) throw error
        alert('Asset berhasil ditambahkan ke project!')
      }

      setShowAssignModal(false)
      setSelectedProject(null)
      setEditingAssignment(null)
      setAssignFormData({ asset_id: '', notes: '', photo_before: null, photo_after: null })
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
        {canManageProjects && (
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
                              setSelectedProjectForAssets(project)
                              setShowAssetsModal(true)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Lihat Assets
                          </Button>
                          {canManageProjects && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedProject(project)
                                  setEditingAssignment(null)
                                  setAssignFormData({ asset_id: '', notes: '', photo_before: null, photo_after: null })
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
                              {canEditProject(project) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(project.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </Button>
                              )}
                            </>
                          )}
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
                disabled={!!editingAssignment}
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
              
              {/* Foto Before */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Before (Sebelum Project)
                </label>
                {assignFormData.photo_before ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(assignFormData.photo_before)}
                      alt="Before"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setAssignFormData({ ...assignFormData, photo_before: null })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : editingAssignment?.photo_before ? (
                  <div className="relative">
                    <img
                      src={editingAssignment.photo_before}
                      alt="Before"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setAssignFormData({ ...assignFormData, photo_before: file })
                      }}
                      className="hidden"
                      id="photo-before"
                    />
                    <label
                      htmlFor="photo-before"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Klik untuk upload foto before</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Foto After */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto After (Sesudah Project)
                </label>
                {assignFormData.photo_after ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(assignFormData.photo_after)}
                      alt="After"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setAssignFormData({ ...assignFormData, photo_after: null })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : editingAssignment?.photo_after ? (
                  <div className="relative">
                    <img
                      src={editingAssignment.photo_after}
                      alt="After"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setAssignFormData({ ...assignFormData, photo_after: file })
                      }}
                      className="hidden"
                      id="photo-after"
                    />
                    <label
                      htmlFor="photo-after"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Klik untuk upload foto after</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit">{editingAssignment ? 'Update' : 'Tambah Asset'}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedProject(null)
                    setEditingAssignment(null)
                    setAssignFormData({ asset_id: '', notes: '', photo_before: null, photo_after: null })
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Lihat Assets dalam Project */}
      {showAssetsModal && selectedProjectForAssets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Assets dalam Project: {selectedProjectForAssets.project_code}
                </h2>
                <p className="text-sm text-gray-600">{selectedProjectForAssets.project_name}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssetsModal(false)
                  setSelectedProjectForAssets(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {getProjectAssets(selectedProjectForAssets.id).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Belum ada asset dalam project ini</p>
              ) : (
                getProjectAssets(selectedProjectForAssets.id).map((assignment: any) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {assignment.assets?.asset_code} - {assignment.assets?.asset_name}
                        </h3>
                        {assignment.notes && (
                          <p className="text-sm text-gray-600 mt-1">{assignment.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Ditambahkan: {formatDate(assignment.assigned_date)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {canManageProjects && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingAssignment(assignment)
                                setSelectedProject(selectedProjectForAssets)
                                setAssignFormData({
                                  asset_id: assignment.asset_id,
                                  notes: assignment.notes || '',
                                  photo_before: null,
                                  photo_after: null,
                                })
                                setShowAssetsModal(false)
                                setShowAssignModal(true)
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!confirm('Yakin ingin menghapus asset dari project?')) return
                                try {
                                  const { error } = await supabase
                                    .from('asset_project_assignments')
                                    .delete()
                                    .eq('id', assignment.id)
                                  if (error) throw error
                                  alert('Asset berhasil dihapus dari project!')
                                  fetchData()
                                  setShowAssetsModal(false)
                                } catch (error: any) {
                                  alert(error.message || 'Terjadi kesalahan')
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {(assignment.photo_before || assignment.photo_after) && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {assignment.photo_before && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Foto Before</p>
                            <img
                              src={assignment.photo_before}
                              alt="Before"
                              className="w-full h-32 object-cover rounded border border-gray-300"
                            />
                          </div>
                        )}
                        {assignment.photo_after && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Foto After</p>
                            <img
                              src={assignment.photo_after}
                              alt="After"
                              className="w-full h-32 object-cover rounded border border-gray-300"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Section Laporan Tabel Asset Projects */}
      <Card title="Laporan Asset Projects">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total Projects: {projects.length} | Total Assets dalam Projects: {projectAssignments.length}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Assets</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mulai</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Selesai</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data project
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => {
                  const projectAssets = getProjectAssets(project.id)
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{project.project_code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.project_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {(project.departments as any)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(project.status)}</td>
                      <td className="px-4 py-3 text-sm text-center">{projectAssets.length}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatRupiah(project.budget)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatRupiah(project.actual_cost)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(project.start_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {project.end_date ? formatDate(project.end_date) : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

