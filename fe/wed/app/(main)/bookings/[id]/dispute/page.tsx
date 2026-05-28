'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, AlertCircle, Send, ShieldAlert, FileImage } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'

import { use } from 'react';

export default function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <BackButton fallbackHref={`/bookings/${id}`} className="mb-6" />

        {/* Dispute Card */}
        <Card className="glass-panel glow-hover rounded-2xl p-6 md:p-8 border-0">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Khiếu nại đơn hàng</h1>
                <p className="text-muted-foreground text-sm">Vui lòng mô tả chi tiết vấn đề của bạn</p>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="mb-6 glass-panel rounded-xl p-4 flex gap-3 border-l-4 border-amber-pop">
            <AlertCircle className="w-5 h-5 text-amber-pop flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Quá trình Khiếu Nại</p>
              <p className="text-xs text-muted-foreground">
                Sau khi bạn gửi khiếu nại, đội hỗ trợ Zup sẽ xem xét trong vòng 3-5 ngày làm việc. Vui lòng chuẩn bị bằng chứng rõ ràng.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason Selection */}
            <div>
              <label className="block text-foreground font-medium mb-3">Lý do khiếu nại *</label>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-3.5 glass-panel rounded-xl cursor-pointer transition-all duration-200 ${
                      reason === r
                        ? 'border-action-blue/40 bg-action-blue/5 shadow-[0_0_10px_rgba(0,107,255,0.1)]'
                        : 'hover:bg-pale-gray/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-action-blue"
                    />
                    <span className={`flex-1 text-sm ${reason === r ? 'text-foreground font-medium' : 'text-foreground'}`}>
                      {r}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-foreground font-medium mb-3">Chi tiết khiếu nại *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết vấn đề, bao gồm thời gian xảy ra, những gì không đúng, các bằng chứng, v.v."
                maxLength={1000}
                rows={6}
                required
                className="w-full px-4 py-3 border border-platinum-tint rounded-xl focus:outline-none focus:ring-2 focus:ring-action-blue resize-none bg-card/50"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {description.length}/1000 ký tự
              </p>
            </div>

            {/* File Upload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileImage className="w-4 h-4 text-action-blue" />
                <label className="block text-foreground font-medium">Tải lên bằng chứng (ảnh/video)</label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Tối đa 5 file, mỗi file tối đa 10MB</p>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`glass-panel border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-action-blue bg-action-blue/5 shadow-[0_0_20px_rgba(0,107,255,0.1)]'
                    : 'border-platinum-tint hover:border-action-blue/30'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-action-blue' : 'text-slate-blue'}`} />
                <p className="text-foreground font-medium mb-1">Kéo thả file vào đây</p>
                <p className="text-sm text-muted-foreground mb-4">hoặc</p>
                <label className="inline-block">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-foreground glass-panel hover:bg-action-blue/10 hover:text-action-blue transition-colors"
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
                      className="flex items-center justify-between p-3 glass-panel rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="ml-3 text-muted-foreground hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
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
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-steel-gray text-white font-semibold py-3 flex items-center justify-center gap-2 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-action-blue/10">
            <p className="text-xs text-muted-foreground text-center">
              Khiếu nại của bạn sẽ được xử lý bảo mật. Vui lòng cung cấp thông tin đúng và rõ ràng.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
