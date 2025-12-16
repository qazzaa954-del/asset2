'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Edit, Trash2, UserPlus, Settings, Lock, Unlock } from 'lucide-react'

export default function UsersPage() {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedDeptForPermissions, setSelectedDeptForPermissions] = useState<any>(null)
  const [permissions, setPermissions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users')
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'User',
    department_id: '',
    password: '',
  })

  useEffect(() => {
    const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
    if (isMasterAdmin) {
      fetchData()
    }
  }, [userProfile])

  const fetchData = async () => {
    try {
      const [usersRes, deptRes] = await Promise.all([
        supabase.from('users').select('*, departments(*)'),
        supabase.from('departments').select('*'),
      ])

      if (usersRes.data) setUsers(usersRes.data)
      if (deptRes.data) setDepartments(deptRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchPermissions = async (departmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('department_menu_permissions')
        .select('*')
        .eq('department_id', departmentId)
        .order('menu_label')

      if (error) throw error
      setPermissions(data || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
      alert('Gagal memuat permissions')
    }
  }

  const handleOpenPermissions = async (dept: any) => {
    setSelectedDeptForPermissions(dept)
    setShowPermissionsModal(true)
    await fetchPermissions(dept.id)
  }

  const handleTogglePermission = async (permission: any) => {
    try {
      const { error } = await supabase
        .from('department_menu_permissions')
        .update({ is_allowed: !permission.is_allowed })
        .eq('id', permission.id)

      if (error) throw error
      await fetchPermissions(selectedDeptForPermissions.id)
      alert('Permission berhasil diupdate!')
    } catch (error: any) {
      console.error('Error updating permission:', error)
      alert(error.message || 'Gagal update permission')
    }
  }

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/assets', label: 'Master Inventory' },
    { path: '/asset-projects', label: 'Asset Projects' },
    { path: '/departments', label: 'Master Departemen' },
    { path: '/financial', label: 'Finansial & Audit' },
    { path: '/depreciation', label: 'Depresiasi' },
    { path: '/work-orders', label: 'Work Order' },
    { path: '/users', label: 'Manajemen Pengguna' },
    { path: '/reports', label: 'Laporan BAK' },
  ]

  const initializePermissions = async (deptId: string) => {
    try {
      // Check existing permissions
      const { data: existing } = await supabase
        .from('department_menu_permissions')
        .select('menu_path')
        .eq('department_id', deptId)

      const existingPaths = (existing || []).map(p => p.menu_path)

      // Insert missing permissions
      const toInsert = menuItems
        .filter(m => !existingPaths.includes(m.path))
        .map(m => ({
          department_id: deptId,
          menu_path: m.path,
          menu_label: m.label,
          is_allowed: true,
          created_by: userProfile!.id,
        }))

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('department_menu_permissions')
          .insert(toInsert)

        if (error) throw error
      }

      await fetchPermissions(deptId)
    } catch (error: any) {
      console.error('Error initializing permissions:', error)
      alert(error.message || 'Gagal initialize permissions')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingUser) {
        // Update existing user via API
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            email: formData.email,
            password: formData.password || undefined,
            full_name: formData.full_name,
            role: formData.role,
            department_id: formData.department_id || null,
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Gagal update user')
        }
      } else {
        // Create new user via API
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            department_id: formData.department_id || null,
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Gagal membuat user')
        }
      }

      setShowForm(false)
      setEditingUser(null)
      setFormData({
        email: '',
        full_name: '',
        role: 'User',
        department_id: '',
        password: '',
      })
      fetchData()
      alert(editingUser ? 'User berhasil diupdate!' : 'User berhasil dibuat!')
    } catch (error: any) {
      console.error('Error saving user:', error)
      alert(error.message || 'Terjadi kesalahan saat menyimpan user')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return

    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus user')
      }

      fetchData()
      alert('User berhasil dihapus!')
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(error.message || 'Terjadi kesalahan saat menghapus user')
    }
  }

  const handleToggleActive = async (user: any) => {
    try {
      await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)
      fetchData()
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  // Check if userProfile is loaded
  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Profil User Tidak Ditemukan</h3>
          <p className="text-sm text-yellow-700 mb-4">
            User profile Anda tidak ditemukan di database. Silakan hubungi administrator untuk membuat profil user.
          </p>
          <div className="text-left bg-white p-4 rounded border border-yellow-200">
            <p className="text-xs text-gray-600 mb-2"><strong>Langkah perbaikan:</strong></p>
            <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
              <li>Buka Supabase Dashboard → SQL Editor</li>
              <li>Jalankan query untuk cek user: <code className="bg-gray-100 px-1 rounded">SELECT id, email FROM auth.users;</code></li>
              <li>Copy UUID dari hasil query</li>
              <li>Insert user ke tabel users dengan UUID tersebut</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // Fix role checking - trim and case insensitive
  const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
  
  if (!isMasterAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Akses ditolak. Hanya Master Admin yang dapat mengakses halaman ini.</p>
        <p className="text-sm text-gray-500 mt-2">Role saat ini: <strong>{userProfile.role}</strong></p>
        <p className="text-xs text-gray-400 mt-1">User ID: {userProfile.id}</p>
        <p className="text-xs text-gray-400 mt-1">Email: {userProfile.email}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna dan hak akses menu per departemen</p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => setShowForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Pengguna
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Daftar Pengguna
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'permissions'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔐 Kelola Akses Menu
            </button>
          </nav>
        </div>

        {activeTab === 'users' && (
          <>
            {showForm && (
        <Card title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Nama Lengkap"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'Master Admin', label: 'Master Admin' },
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'IT', label: 'IT' },
                  { value: 'User', label: 'User' },
                ]}
                required
              />
              <Select
                label="Departemen"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={[
                  { value: '', label: 'Tidak Ada' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
              {!editingUser && (
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              )}
              {editingUser && (
                <Input
                  label="Password Baru (kosongkan jika tidak diubah)"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit">Simpan</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingUser(null)
                  setFormData({
                    email: '',
                    full_name: '',
                    role: 'User',
                    department_id: '',
                    password: '',
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nama Lengkap
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Departemen
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
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.full_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.role === 'Master Admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'Engineering' || user.role === 'IT'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(user.departments as any)?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(user)
                                setFormData({
                                  email: user.email,
                                  full_name: user.full_name,
                                  role: user.role,
                                  department_id: user.department_id || '',
                                  password: '',
                                })
                                setShowForm(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={user.is_active ? 'danger' : 'secondary'}
                              onClick={() => handleToggleActive(user)}
                            >
                              {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'permissions' && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Atur akses menu untuk setiap departemen. Master Admin selalu memiliki akses penuh ke semua menu.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} onClick={() => handleOpenPermissions(dept)} className="cursor-pointer">
                  <Card className="hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Kode: {dept.code}</p>
                      </div>
                      <Settings className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedDeptForPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Kelola Akses Menu - {selectedDeptForPermissions.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Aktifkan atau nonaktifkan akses menu untuk departemen ini
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPermissionsModal(false)
                  setSelectedDeptForPermissions(null)
                  setPermissions([])
                }}
              >
                ✕
              </Button>
            </div>

            {permissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Belum ada permissions untuk departemen ini</p>
                <Button onClick={() => initializePermissions(selectedDeptForPermissions.id)}>
                  Initialize Permissions
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{permission.menu_label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{permission.menu_path}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePermission(permission)}
                      className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        permission.is_allowed
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {permission.is_allowed ? (
                        <>
                          <Unlock className="w-4 h-4 inline mr-1" />
                          Diizinkan
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 inline mr-1" />
                          Diblokir
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

