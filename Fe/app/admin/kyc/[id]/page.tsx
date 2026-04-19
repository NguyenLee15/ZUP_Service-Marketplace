'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ZoomIn, ZoomOut, RotateCw, CheckCircle, XCircle } from 'lucide-react'

// Mock KYC data
const kycData = {
  id: '[id]',
  provider: {
    fullName: 'Trần Văn Provider',
    email: 'provider@marketplace.com',
    phone: '0912345678',
    address: '123 Đường A, Quận 1, TP.HCM',
    businessName: 'Dịch vụ sửa chữa điện tử ABC',
    taxId: '0123456789',
    bankAccount: '123456789',
    status: 'pending',
  },
  documents: {
    cccdFront: 'https://via.placeholder.com/400x250?text=CCCD+Mặt+Trước',
    cccdBack: 'https://via.placeholder.com/400x250?text=CCCD+Mặt+Sau',
    portrait: 'https://via.placeholder.com/300x300?text=Chân+Dung',
  }
}

export default function AdminKYCDetail() {
  const [selectedImage, setSelectedImage] = useState<string>(kycData.documents.cccdFront)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 50))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const handleApprove = async () => {
    setIsApproving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    alert('✅ Đã phê duyệt hồ sơ KYC!')
    setIsApproving(false)
  }

  const handleReject = async () => {
    setIsRejecting(true)
    const reason = prompt('Nhập lý do từ chối:')
    if (reason) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert(`❌ Đã từ chối hồ sơ. Lý do: ${reason}`)
    }
    setIsRejecting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Duyệt Hồ Sơ KYC</h1>
          <p className="text-gray-600 mt-1">ID: {kycData.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Provider Info */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Thông Tin Nhà Cung Cấp</CardTitle>
                <Badge className="w-fit mt-2" variant={kycData.provider.status === 'pending' ? 'secondary' : 'outline'}>
                  {kycData.provider.status === 'pending' ? '⏳ Chờ duyệt' : '✅ Đã duyệt'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Họ tên</p>
                  <p className="font-medium text-gray-900">{kycData.provider.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 break-all">{kycData.provider.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Điện thoại</p>
                  <p className="font-medium text-gray-900">{kycData.provider.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p className="font-medium text-gray-900">{kycData.provider.address}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Tên kinh doanh</p>
                  <p className="font-medium text-gray-900">{kycData.provider.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mã số thuế</p>
                  <p className="font-medium text-gray-900 font-mono">{kycData.provider.taxId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tài khoản ngân hàng</p>
                  <p className="font-medium text-gray-900 font-mono">{kycData.provider.bankAccount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Image Viewer */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Xem Ảnh</CardTitle>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setSelectedImage(kycData.documents.cccdFront)}>
                    CCCD Mặt Trước
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedImage(kycData.documents.cccdBack)}>
                    CCCD Mặt Sau
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedImage(kycData.documents.portrait)}>
                    Chân Dung
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Display */}
                <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center" style={{ minHeight: '400px' }}>
                  <img
                    src={selectedImage}
                    alt="Document"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s',
                      maxHeight: '100%',
                      maxWidth: '100%',
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4 mr-1" /> Phóng to
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4 mr-1" /> Thu nhỏ
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4 mr-1" /> Xoay
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setZoom(100); setRotation(0) }}>
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">Zoom: {zoom}% | Xoay: {rotation}°</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Action Buttons */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Quyết Định</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-900 font-medium">ℹ️ Hãy xem kỹ các tài liệu trước khi quyết định</p>
                </div>

                <Button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {isApproving ? 'Đang xử lý...' : 'Phê Duyệt'}
                </Button>

                <Button
                  onClick={handleReject}
                  disabled={isApproving || isRejecting}
                  variant="destructive"
                  className="w-full h-12"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  {isRejecting ? 'Đang xử lý...' : 'Từ Chối'}
                </Button>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium text-gray-900">Danh sách kiểm tra:</p>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>✓ CCCD còn hạn?</li>
                    <li>✓ Người dùng rõ mặt?</li>
                    <li>✓ Thông tin khớp?</li>
                    <li>✓ Không bị cấm?</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
