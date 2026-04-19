'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

// Mock dispute data
const disputeData = {
  id: 'DISPUTE-001',
  booking: 'BOOKING-123',
  customer: {
    name: 'Nguyễn Thị Lan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer1',
  },
  provider: {
    name: 'Trần Văn Provider',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
  },
  issue: 'Công việc không đạt tiêu chuẩn',
  customerReason: 'Bức tường sơn không đều, có vết bề mặt không bằng',
  customerEvidence: [
    'https://via.placeholder.com/300x300?text=Ảnh+Bức+Tường+1',
    'https://via.placeholder.com/300x300?text=Ảnh+Bức+Tường+2',
  ],
  providerImages: [
    'https://via.placeholder.com/300x300?text=Ảnh+Thợ+1',
    'https://via.placeholder.com/300x300?text=Ảnh+Thợ+2',
  ],
  amount: 500000,
}

export default function AdminDisputeResolution() {
  const [decision, setDecision] = useState<'customer' | 'provider' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCanUndo(true)
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  const handleSubmitDecision = async () => {
    if (!decision) {
      alert('⚠️ Vui lòng chọn phán quyết!')
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    alert(`✅ Phán quyết đã được ghi nhận!\n\n${
      decision === 'customer' 
        ? `💰 Hoàn tiền cho khách: ${disputeData.amount.toLocaleString()} ₫` 
        : `💰 Trả tiền cho thợ: ${disputeData.amount.toLocaleString()} ₫`
    }`)

    setIsSubmitting(false)
    setCountdown(300) // 5 minutes
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Phân Xử Tranh Chấp</h1>
          <div className="flex gap-2 mt-2">
            <Badge>ID: {disputeData.id}</Badge>
            <Badge>Booking: {disputeData.booking}</Badge>
          </div>
        </div>

        {/* Undo Warning */}
        {countdown !== null && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Phán quyết đã được ghi nhận</p>
                    <p className="text-sm text-red-700">Có thể hoàn tác trong {formatTime(countdown)}</p>
                  </div>
                </div>
                <Button 
                  disabled={!canUndo}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  ↩️ Hoàn Tác
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer's Complaint */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <img src={disputeData.customer.avatar} alt="Customer" className="w-8 h-8 rounded-full" />
                Lý do khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Khách hàng</p>
                <p className="font-medium">{disputeData.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Vấn đề</p>
                <p className="font-medium text-red-600">{disputeData.issue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Chi tiết</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{disputeData.customerReason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Bằng chứng</p>
                <div className="grid grid-cols-2 gap-2">
                  {disputeData.customerEvidence.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Evidence ${idx + 1}`}
                      className="rounded border border-gray-200 w-full"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Middle Column - Provider's Work */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2">
                <img src={disputeData.provider.avatar} alt="Provider" className="w-8 h-8 rounded-full" />
                Kết quả thi công
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nhà cung cấp</p>
                <p className="font-medium">{disputeData.provider.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Ảnh thợ tải lên</p>
                <div className="grid grid-cols-2 gap-2">
                  {disputeData.providerImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Provider work ${idx + 1}`}
                      className="rounded border border-gray-200 w-full"
                    />
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-900">
                  📝 Hãy so sánh kỹ lưỡng ảnh của khách và ảnh của thợ để đưa ra quyết định công bằng.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Resolution */}
          <Card className="border-0 shadow-md lg:sticky lg:top-6 lg:h-fit">
            <CardHeader className="bg-purple-50">
              <CardTitle>Phán Quyết</CardTitle>
              <CardDescription>Số tiền tranh chấp: {disputeData.amount.toLocaleString()} ₫</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <RadioGroup value={decision || ''} onValueChange={(val) => setDecision(val as 'customer' | 'provider')}>
                {/* Option 1 - Refund Customer */}
                <div className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900">💰 Hoàn tiền cho khách</div>
                      <p className="text-xs text-gray-500 mt-1">Khách được hoàn lại {disputeData.amount.toLocaleString()} ₫</p>
                    </Label>
                  </div>
                </div>

                {/* Option 2 - Pay Provider */}
                <div className="border rounded-lg p-4 hover:bg-orange-50 cursor-pointer transition">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="provider" id="provider" />
                    <Label htmlFor="provider" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900">✅ Trả tiền cho thợ</div>
                      <p className="text-xs text-gray-500 mt-1">Thợ được nhận {disputeData.amount.toLocaleString()} ₫</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              <div className="border-t pt-4 space-y-3">
                <Button
                  onClick={handleSubmitDecision}
                  disabled={isSubmitting || !decision}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? '⏳ Đang xử lý...' : '✅ Chốt Phán Quyết'}
                </Button>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-900 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Quyết định này không thể thay đổi sau khi confirm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
