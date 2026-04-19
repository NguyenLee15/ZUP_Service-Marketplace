'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Upload, X, AlertCircle, Send } from 'lucide-react'

export default function DisputePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reasons = [
    'Dịch vụ không đạt chất lượng như mong đợi',
    'Kết quả xong nhưng không đúng với yêu cầu',
    'Nhà cung cấp không thực hiện theo hợp đồng',
    'Bị tính thêm phí ngoài',
    'Khác',
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setUploadedFiles(prev => [...prev, ...files].slice(0, 5))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files].slice(0, 5))
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason || !description) return

    setIsSubmitting(true)
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      router.push('/bookings')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href={`/bookings/${params.id}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ChevronLeft className="w-5 h-5" />
          Quay Lại
        </Link>

        {/* Dispute Card */}
        <Card className="p-6 md:p-8 border border-gray-200">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Khiếu Nại / Phản Đối</h1>
            <p className="text-gray-600">Vui lòng mô tả chi tiết vấn đề của bạn</p>
          </div>

          {/* Warning Alert */}
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900 mb-1">Quá trình Khiếu Nại</p>
              <p className="text-xs text-orange-800">
                Sau khi bạn gửi khiếu nại, đội hỗ trợ ServiceHub sẽ xem xét trong vòng 3-5 ngày làm việc. Vui lòng chuẩn bị bằng chứng rõ ràng.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason Selection */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">Lý Do Khiếu Nại *</label>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label key={r} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 flex-1">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">Chi Tiết Khiếu Nại *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết vấn đề, bao gồm thời gian xảy ra, những gì không đúng, các bằng chứng, v.v."
                maxLength={1000}
                rows={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {description.length}/1000 ký tự
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">Tải Lên Bằng Chứng (Ảnh/Video)</label>
              <p className="text-sm text-gray-600 mb-3">Tối đa 5 file, mỗi file tối đa 10MB</p>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">Kéo thả file vào đây</p>
                <p className="text-sm text-gray-600 mb-4">hoặc</p>
                <label className="inline-block">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-gray-700"
                    asChild
                  >
                    <span className="cursor-pointer">Chọn File</span>
                  </Button>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="ml-3 text-gray-400 hover:text-red-600 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!reason || !description || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang Gửi...' : 'Gửi Khiếu Nại'}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Khiếu nại của bạn sẽ được xử lý bảo mật. Vui lòng tuân thủ{' '}
              <Link href="#" className="text-blue-600 hover:text-blue-700">
                Chính Sách Khiếu Nại
              </Link>
              .
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
