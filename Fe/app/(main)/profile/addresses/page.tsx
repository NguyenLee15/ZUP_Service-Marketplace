'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Plus, MapPin, Trash2, Check, X } from 'lucide-react'

const addressSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'SĐT phải có 10-11 chữ số'),
  province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
  district: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  ward: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  isDefault: z.boolean().default(false),
})

type AddressFormData = z.infer<typeof addressSchema>

interface Address {
  id: string
  fullName: string
  phone: string
  province: string
  district: string
  ward: string
  address: string
  isDefault: boolean
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
      province: 'Hà Nội',
      district: 'Hoàn Kiếm',
      ward: 'Hàng Đồng',
      address: 'Số 123 đường Phan Chu Trinh, Phường Hàng Đồng',
      isDefault: true,
    },
    {
      id: '2',
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
      province: 'TP Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      address: 'Số 456 đường Nguyễn Hữu Cảnh, Phường Bến Nghé',
      isDefault: false,
    },
  ])

  const [showModal, setShowModal] = useState(false)
  const [selectedMap, setSelectedMap] = useState(false)

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      address: '',
      isDefault: false,
    },
  })

  const onSubmit = async (data: AddressFormData) => {
    const newAddress: Address = {
      id: String(Date.now()),
      ...data,
    }
    setAddresses([...addresses, newAddress])
    form.reset()
    setShowModal(false)
  }

  const deleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id))
  }

  const setDefaultAddress = (id: string) => {
    setAddresses(
      addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Địa Chỉ</h1>
          <p className="text-gray-600 mt-1">Quản lý các địa chỉ giao hàng của bạn</p>
        </div>
        <Button
          onClick={() => {
            setShowModal(true)
            setSelectedMap(false)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm Địa Chỉ
        </Button>
      </div>

      {/* Addresses List */}
      <div className="grid gap-4">
        {addresses.length === 0 ? (
          <Card className="p-8 text-center border border-gray-200">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Bạn chưa có địa chỉ nào. Thêm địa chỉ mới để bắt đầu.</p>
          </Card>
        ) : (
          addresses.map(addr => (
            <Card key={addr.id} className="p-4 md:p-6 border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{addr.fullName}</h3>
                    {addr.isDefault && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Mặc Định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{addr.phone}</p>
                  <p className="text-sm text-gray-700">{addr.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {addr.ward}, {addr.district}, {addr.province}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!addr.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-xs"
                    >
                      Đặt Mặc Định
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAddress(addr.id)}
                    className="text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Thêm Địa Chỉ Mới</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Map Selection */}
              {!selectedMap && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Chọn vị trí trên bản đồ</p>
                  <button
                    onClick={() => setSelectedMap(true)}
                    className="w-full h-40 bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-300 transition cursor-pointer"
                  >
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-700 font-medium">Chọn vị trí trên bản đồ</p>
                      <p className="text-xs text-gray-500">Mapbox / Leaflet</p>
                    </div>
                  </button>
                  {selectedMap && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Đã chọn vị trí
                    </p>
                  )}
                </div>
              )}

              {selectedMap && (
                <div className="space-y-3">
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Vị trí đã chọn: Hà Nội, 10.7769° N, 106.6963° E
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedMap(false)}
                  >
                    Chọn Lại Vị Trí
                  </Button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên Người Nhận</label>
                    <Input
                      placeholder="Nhập tên"
                      {...form.register('fullName')}
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số Điện Thoại</label>
                    <Input
                      placeholder="09xxxxxxxx"
                      {...form.register('phone')}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành Phố</label>
                    <select
                      {...form.register('province')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn Tỉnh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP Hồ Chí Minh">TP Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                    {form.formState.errors.province && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.province.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                    <select
                      {...form.register('district')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn Quận</option>
                      <option value="Hoàn Kiếm">Hoàn Kiếm</option>
                      <option value="Ba Đình">Ba Đình</option>
                      <option value="Quận 1">Quận 1</option>
                    </select>
                    {form.formState.errors.district && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.district.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
                    <select
                      {...form.register('ward')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn Phường</option>
                      <option value="Hàng Đồng">Hàng Đồng</option>
                      <option value="Bến Nghé">Bến Nghé</option>
                    </select>
                    {form.formState.errors.ward && (
                      <p className="text-red-600 text-sm mt-1">{form.formState.errors.ward.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa Chỉ Chi Tiết</label>
                  <textarea
                    placeholder="Số nhà, tên đường..."
                    {...form.register('address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form.formState.errors.address && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('isDefault')}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {form.formState.isSubmitting ? 'Đang Lưu...' : 'Lưu Địa Chỉ'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
