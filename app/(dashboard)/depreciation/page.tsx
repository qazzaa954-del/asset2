'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2, TrendingDown } from 'lucide-react'

export default function DepreciationPage() {
  const { userProfile } = useAuth()
  const [depreciationMethods, setDepreciationMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMethod, setEditingMethod] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    formula: '',
    description: '',
    is_active: true,
  })

  const isMasterAdmin = userProfile?.role?.trim() === 'Master Admin'

  useEffect(() => {
    if (isMasterAdmin) {
      fetchData()
    }
  }, [isMasterAdmin])

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('depreciation_methods')
        .select('*')
        .order('name')
      
      if (data) setDepreciationMethods(data)
    } catch (error) {
      console.error('Error fetching depreciation methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingMethod) {
        await supabase
          .from('depreciation_methods')
          .update(formData)
          .eq('id', editingMethod.id)
      } else {
        await supabase.from('depreciation_methods').insert(formData)
      }

      setShowForm(false)
      setEditingMethod(null)
      setFormData({
        name: '',
        formula: '',
        description: '',
        is_active: true,
      })
      fetchData()
    } catch (error: any) {
      console.error('Error saving depreciation method:', error)
      alert(error.message || 'Terjadi kesalahan saat menyimpan metode depresiasi')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus metode depresiasi ini?')) return

    try {
      await supabase.from('depreciation_methods').delete().eq('id', id)
      fetchData()
    } catch (error) {
      console.error('Error deleting depreciation method:', error)
    }
  }

  if (!isMasterAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Akses ditolak. Hanya Master Admin yang dapat mengakses halaman ini.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Memuat data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metode Depresiasi</h1>
          <p className="text-gray-600 mt-1">Kelola metode perhitungan depresiasi aset</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Metode
        </Button>
      </div>

      {showForm && (
        <Card title={editingMethod ? 'Edit Metode Depresiasi' : 'Tambah Metode Depresiasi Baru'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Metode"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Contoh: Straight-Line"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formula
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                required
                rows={3}
                placeholder="book_value = acquisition_price - ((acquisition_price / estimated_lifespan) * years_used)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Penjelasan metode depresiasi"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Simpan</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingMethod(null)
                  setFormData({
                    name: '',
                    formula: '',
                    description: '',
                    is_active: true,
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
        <div className="space-y-4">
          {depreciationMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Belum ada metode depresiasi</p>
            </div>
          ) : (
            depreciationMethods.map((method) => (
              <div
                key={method.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{method.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          method.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {method.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    {method.description && (
                      <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                    )}
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {method.formula}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingMethod(method)
                        setFormData({
                          name: method.name,
                          formula: method.formula,
                          description: method.description || '',
                          is_active: method.is_active,
                        })
                        setShowForm(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

