'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, Edit, Trash2, UserPlus } from 'lucide-react'

export default function UsersPage() {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
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
          <p className="text-gray-600 mt-1">Kelola pengguna dan hak akses</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

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
    </div>
  )
}

