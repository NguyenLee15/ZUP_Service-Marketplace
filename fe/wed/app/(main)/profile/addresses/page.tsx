'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Check, Loader2, MapPin, Plus, Trash2, X } from 'lucide-react'
import { userApi } from '@/features/user/services/user.api'

const DEFAULT_COORDINATES = {
  latitude: 10.7769,
  longitude: 106.6963,
}

const addressSchema = z.object({
  label: z.string().max(50, 'Nhãn địa chỉ tối đa 50 ký tự').optional(),
  province: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),
  district: z.string().min(1, 'Vui lòng chọn quận/huyện'),
  ward: z.string().min(1, 'Vui lòng chọn phường/xã'),
  addressDetail: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  isDefault: z.boolean().default(false),
})

type AddressFormData = z.infer<typeof addressSchema>

interface Address {
  id: number
  label?: string | null
  province: string
  district: string
  ward: string
  addressDetail: string
  latitude?: number | null
  longitude?: number | null
  isDefault: boolean
}

type ApiError = {
  response?: {
    data?: {
      message?: string
      error?: { message?: string }
    }
  }
}

const emptyAddressValues: AddressFormData = {
  label: '',
  province: '',
  district: '',
  ward: '',
  addressDetail: '',
  isDefault: false,
}

function getApiMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError
  return apiError.response?.data?.message || apiError.response?.data?.error?.message || fallback
}

function normalizeAddresses(payload: unknown): Address[] {
  const response = payload as { data?: { data?: unknown } }
  const data = response.data?.data
  return Array.isArray(data) ? data as Address[] : []
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedMap, setSelectedMap] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: emptyAddressValues,
  })

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setErrorMessage('')
    window.setTimeout(() => setSuccessMessage(''), 3500)
  }

  const showError = (message: string) => {
    setErrorMessage(message)
    setSuccessMessage('')
    window.setTimeout(() => setErrorMessage(''), 5000)
  }

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await userApi.getAddresses()
      setAddresses(normalizeAddresses(response))
    } catch (error) {
      setAddresses([])
      showError(getApiMessage(error, 'Không thể tải danh sách địa chỉ. Vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAddresses()
  }, [loadAddresses])

  const closeModal = () => {
    setShowModal(false)
    setSelectedMap(false)
    form.reset(emptyAddressValues)
  }

  const onSubmit = async (data: AddressFormData) => {
    try {
      await userApi.createAddress({
        label: data.label?.trim() || undefined,
        province: data.province,
        district: data.district,
        ward: data.ward,
        addressDetail: data.addressDetail,
        latitude: selectedMap ? DEFAULT_COORDINATES.latitude : 0,
        longitude: selectedMap ? DEFAULT_COORDINATES.longitude : 0,
        isDefault: data.isDefault,
      })

      closeModal()
      await loadAddresses()
      showSuccess('Thêm địa chỉ thành công')
    } catch (error) {
      showError(getApiMessage(error, 'Không thể thêm địa chỉ. Vui lòng thử lại.'))
    }
  }

  const deleteAddress = async (id: number) => {
    try {
      setActionId(id)
      await userApi.deleteAddress(id)
      await loadAddresses()
      showSuccess('Đã xóa địa chỉ')
    } catch (error) {
      showError(getApiMessage(error, 'Không thể xóa địa chỉ. Vui lòng thử lại.'))
    } finally {
      setActionId(null)
    }
  }

  const setDefaultAddress = async (id: number) => {
    try {
      setActionId(id)
      await userApi.setDefaultAddress(id)
      await loadAddresses()
      showSuccess('Đã đặt làm địa chỉ mặc định')
    } catch (error) {
      showError(getApiMessage(error, 'Không thể đặt địa chỉ mặc định. Vui lòng thử lại.'))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold brand-heading">Quản lý địa chỉ</h1>
          <p className="text-muted-foreground mt-1">Danh sách này được tải theo tài khoản đang đăng nhập.</p>
        </div>
        <Button
          onClick={() => {
            form.reset(emptyAddressValues)
            setSelectedMap(false)
            setShowModal(true)
          }}
          className="bg-action-blue hover:bg-glacier-blue text-white flex items-center gap-2 shadow-[var(--brand-shadow-button)]"
        >
          <Plus className="w-5 h-5" />
          Thêm địa chỉ
        </Button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800" aria-live="polite">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          [...Array(2)].map((_, index) => (
            <Card key={index} className="surface-card h-32 animate-pulse rounded-[20px]" />
          ))
        ) : addresses.length === 0 ? (
          <Card className="surface-card rounded-[20px] p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="font-semibold text-foreground">Bạn chưa có địa chỉ nào</p>
            <p className="text-sm text-muted-foreground mt-1">Thêm địa chỉ mới để đặt dịch vụ nhanh hơn.</p>
          </Card>
        ) : (
          addresses.map((addr) => (
            <Card key={addr.id} className="surface-card rounded-[20px] p-4 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{addr.label || 'Địa chỉ'}</h3>
                    {addr.isDefault && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{addr.addressDetail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {addr.ward}, {addr.district}, {addr.province}
                  </p>
                  {addr.latitude != null && addr.longitude != null && (Number(addr.latitude) !== 0 || Number(addr.longitude) !== 0) && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Tọa độ: {Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  {!addr.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultAddress(addr.id)}
                      disabled={actionId === addr.id}
                      className="text-xs"
                    >
                      {actionId === addr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đặt mặc định'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAddress(addr.id)}
                    disabled={actionId === addr.id}
                    aria-label="Xóa địa chỉ"
                    className="text-xs"
                  >
                    {actionId === addr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-indigo/45 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl overflow-hidden rounded-[20px] border border-platinum-tint bg-white shadow-[var(--brand-shadow-card)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-platinum-tint bg-white p-6">
              <h2 className="text-xl font-semibold text-foreground">Thêm địa chỉ mới</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Đóng"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-pale-gray hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              <div className="mb-6 space-y-3">
                <p className="text-sm font-medium text-foreground">Vị trí trên bản đồ</p>
                {!selectedMap ? (
                  <button
                    type="button"
                    onClick={() => setSelectedMap(true)}
                    className="flex h-36 w-full items-center justify-center rounded-xl border-2 border-dashed border-platinum-tint bg-cloud-mist transition-colors hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                  >
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground/80">Chọn vị trí mô phỏng</p>
                      <p className="text-xs text-muted-foreground">Tọa độ sẽ được gửi kèm địa chỉ</p>
                    </div>
                  </button>
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="flex items-center gap-2 text-sm text-green-700">
                      <Check className="w-4 h-4" />
                      Đã chọn vị trí: {DEFAULT_COORDINATES.latitude}° N, {DEFAULT_COORDINATES.longitude}° E
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setSelectedMap(false)}
                    >
                      Bỏ chọn vị trí
                    </Button>
                  </div>
                )}
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="address-label" className="mb-2 block text-sm font-medium text-foreground/80">Nhãn địa chỉ</label>
                  <Input
                    id="address-label"
                    placeholder="Nhà riêng, công ty..."
                    autoComplete="off"
                    {...form.register('label')}
                  />
                  {form.formState.errors.label && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.label.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="address-province" className="mb-2 block text-sm font-medium text-foreground/80">Tỉnh/thành phố</label>
                    <select
                      id="address-province"
                      autoComplete="address-level1"
                      {...form.register('province')}
                      className="w-full rounded-lg border border-platinum-tint bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-action-blue"
                    >
                      <option value="">Chọn tỉnh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP Hồ Chí Minh">TP Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                    {form.formState.errors.province && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.province.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address-district" className="mb-2 block text-sm font-medium text-foreground/80">Quận/huyện</label>
                    <select
                      id="address-district"
                      autoComplete="address-level2"
                      {...form.register('district')}
                      className="w-full rounded-lg border border-platinum-tint bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-action-blue"
                    >
                      <option value="">Chọn quận</option>
                      <option value="Hoàn Kiếm">Hoàn Kiếm</option>
                      <option value="Ba Đình">Ba Đình</option>
                      <option value="Quận 1">Quận 1</option>
                    </select>
                    {form.formState.errors.district && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.district.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address-ward" className="mb-2 block text-sm font-medium text-foreground/80">Phường/xã</label>
                    <select
                      id="address-ward"
                      autoComplete="address-level3"
                      {...form.register('ward')}
                      className="w-full rounded-lg border border-platinum-tint bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-action-blue"
                    >
                      <option value="">Chọn phường</option>
                      <option value="Hàng Đồng">Hàng Đồng</option>
                      <option value="Bến Nghé">Bến Nghé</option>
                    </select>
                    {form.formState.errors.ward && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.ward.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address-detail" className="mb-2 block text-sm font-medium text-foreground/80">Địa chỉ chi tiết</label>
                  <textarea
                    id="address-detail"
                    placeholder="Số nhà, tên đường..."
                    autoComplete="street-address"
                    {...form.register('addressDetail')}
                    rows={3}
                    className="w-full rounded-lg border border-platinum-tint bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                  {form.formState.errors.addressDetail && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.addressDetail.message}</p>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    {...form.register('isDefault')}
                    className="h-4 w-4 rounded border-platinum-tint text-action-blue focus:ring-action-blue"
                  />
                  <span className="text-sm text-foreground/80">Đặt làm địa chỉ mặc định</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="flex-1 bg-action-blue text-white hover:bg-glacier-blue"
                  >
                    {form.formState.isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </span>
                    ) : (
                      'Lưu địa chỉ'
                    )}
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
