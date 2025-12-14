'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function DepartmentsPage() {
  const { userProfile } = useAuth()
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    initial_code: '',
  })

  useEffect(() => {
    const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'
    if (!isMasterAdmin) {
      return
    }
    fetchDepartments()
  }, [userProfile])

  const fetchDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('*').order('code')
      if (data) setDepartments(data)
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingDept) {
        await supabase.from('departments').update(formData).eq('id', editingDept.id)
      } else {
        await supabase.from('departments').insert(formData)
      }

      setShowForm(false)
      setEditingDept(null)
      setFormData({ code: '', name: '', initial_code: '' })
      fetchDepartments()
    } catch (error) {
      console.error('Error saving department:', error)
      alert('Terjadi kesalahan saat menyimpan departemen')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus departemen ini?')) return

    try {
      await supabase.from('departments').delete().eq('id', id)
      fetchDepartments()
    } catch (error) {
      console.error('Error deleting department:', error)
      alert('Tidak dapat menghapus departemen yang memiliki aset')
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
          <h1 className="text-3xl font-bold text-gray-900">Master Departemen</h1>
          <p className="text-gray-600 mt-1">Kelola data departemen</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Departemen
        </Button>
      </div>

      {showForm && (
        <Card title={editingDept ? 'Edit Departemen' : 'Tambah Departemen Baru'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Kode"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
              <Input
                label="Nama Departemen"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Inisial Kode Aset"
                value={formData.initial_code}
                onChange={(e) =>
                  setFormData({ ...formData, initial_code: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Simpan</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingDept(null)
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
                  Kode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama Departemen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Inisial Kode Aset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td className="px-4 py-3 text-sm font-mono">{dept.code}</td>
                  <td className="px-4 py-3 text-sm">{dept.name}</td>
                  <td className="px-4 py-3 text-sm font-mono">{dept.initial_code}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDept(dept)
                          setFormData({
                            code: dept.code,
                            name: dept.name,
                            initial_code: dept.initial_code,
                          })
                          setShowForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(dept.id)}
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

