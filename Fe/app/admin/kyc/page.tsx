'use client';

import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KYCData {
  id: string;
  name: string;
  provider: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  cccdNumber: string;
  identityImages: {
    front: string;
    back: string;
    portrait: string;
  };
  address: string;
  dateOfBirth: string;
  bankAccount?: string;
}

const mockKYCData: KYCData[] = [
  {
    id: 'KYC001',
    name: 'Trần Thị B',
    provider: 'Digital Marketing Pro',
    email: 'tranthib@example.com',
    phone: '0923456789',
    status: 'pending',
    submittedAt: '2024-04-08',
    cccdNumber: '123456789101',
    identityImages: {
      front: '/placeholder-cccd-front.jpg',
      back: '/placeholder-cccd-back.jpg',
      portrait: '/placeholder-portrait.jpg',
    },
    address: '123 Đường ABC, Quận 1, TP.HCM',
    dateOfBirth: '1995-05-15',
    bankAccount: '123456789 - Vietcombank',
  },
  {
    id: 'KYC002',
    name: 'Phạm Văn D',
    provider: 'Tech Solutions',
    email: 'phamvand@example.com',
    phone: '0934567890',
    status: 'approved',
    submittedAt: '2024-03-20',
    cccdNumber: '987654321098',
    identityImages: {
      front: '/placeholder-cccd-front.jpg',
      back: '/placeholder-cccd-back.jpg',
      portrait: '/placeholder-portrait.jpg',
    },
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    dateOfBirth: '1990-08-20',
    bankAccount: '987654321 - Techcombank',
  },
  {
    id: 'KYC003',
    name: 'Hoàng Văn E',
    provider: 'Social Connect',
    email: 'hoangvane@example.com',
    phone: '0945678901',
    status: 'rejected',
    submittedAt: '2024-02-15',
    cccdNumber: '555666777888',
    identityImages: {
      front: '/placeholder-cccd-front.jpg',
      back: '/placeholder-cccd-back.jpg',
      portrait: '/placeholder-portrait.jpg',
    },
    address: '789 Đường DEF, Quận 5, TP.HCM',
    dateOfBirth: '1992-03-10',
    bankAccount: '555666777 - Sacombank',
  },
];

const statusConfig = {
  pending: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Đã Duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Từ Chối', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function KYCPage() {
  const [kycList, setKycList] = useState<KYCData[]>(mockKYCData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKYC, setSelectedKYC] = useState<KYCData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [selectedImage, setSelectedImage] = useState<'front' | 'back' | 'portrait'>('front');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredKYC =
    filterStatus === 'all'
      ? kycList.filter(
          (k) =>
            k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            k.provider.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : kycList.filter(
          (k) =>
            k.status === filterStatus &&
            (k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              k.provider.toLowerCase().includes(searchTerm.toLowerCase()))
        );

  const handleApprove = () => {
    if (selectedKYC) {
      console.log('Approving KYC:', selectedKYC.id);
      alert(`KYC của ${selectedKYC.name} đã được duyệt`);
      setShowDetailModal(false);
      setSelectedKYC(null);
    }
  };

  const handleReject = () => {
    if (selectedKYC) {
      console.log('Rejecting KYC:', selectedKYC.id);
      alert(`KYC của ${selectedKYC.name} đã bị từ chối`);
      setShowDetailModal(false);
      setSelectedKYC(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quản Lý KYC</h3>
          <p className="text-gray-600 mt-1">
            {kycList.filter((k) => k.status === 'pending').length} đang chờ duyệt
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc nhà cung cấp..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status)}
              size="sm"
            >
              {status === 'all'
                ? 'Tất Cả'
                : statusConfig[status as keyof typeof statusConfig]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KYC Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nhà Cung Cấp</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">CCCD</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng Thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày Gửi</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredKYC.map((kyc) => {
                  const statusInfo = statusConfig[kyc.status];
                  const StatusIcon = statusInfo?.icon;

                  return (
                    <tr
                      key={kyc.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        kyc.status === 'pending' ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{kyc.name}</p>
                          <p className="text-xs text-gray-600">{kyc.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{kyc.provider}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{kyc.cccdNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusInfo?.color}`}>
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {statusInfo?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{kyc.submittedAt}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedKYC(kyc);
                            setShowDetailModal(true);
                            setImageZoom(1);
                            setImageRotation(0);
                            setSelectedImage('front');
                          }}
                        >
                          Xem Chi Tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal - 2 Column Layout */}
      {showDetailModal && selectedKYC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle>Chi Tiết KYC - {selectedKYC.name}</CardTitle>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedKYC(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Images */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Ảnh Chứng Thực</h4>
                  
                  {/* Image Viewer */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <div className="relative h-80 flex items-center justify-center">
                      <div
                        className="transition-transform"
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                        }}
                      >
                        <div className="w-64 h-64 bg-gray-300 rounded-lg flex items-center justify-center text-white">
                          {selectedImage === 'front' && 'CCCD Mặt Trước'}
                          {selectedImage === 'back' && 'CCCD Mặt Sau'}
                          {selectedImage === 'portrait' && 'Ảnh Chân Dung'}
                        </div>
                      </div>
                    </div>

                    {/* Image Controls */}
                    <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-200 bg-white">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImageZoom(Math.max(imageZoom - 0.1, 0.5))}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium w-12 text-center">{(imageZoom * 100).toFixed(0)}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImageZoom(Math.min(imageZoom + 0.1, 2))}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageRotation((imageRotation + 90) % 360)}
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Image Selection Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'front', label: 'Mặt Trước' },
                      { key: 'back', label: 'Mặt Sau' },
                      { key: 'portrait', label: 'Chân Dung' },
                    ].map((img) => (
                      <button
                        key={img.key}
                        onClick={() => {
                          setSelectedImage(img.key as 'front' | 'back' | 'portrait');
                          setImageZoom(1);
                          setImageRotation(0);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedImage === img.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Column - Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Thông Tin Cá Nhân</h4>

                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Họ Tên</p>
                      <p className="font-medium text-gray-900">{selectedKYC.name}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Nhà Cung Cấp</p>
                      <p className="font-medium text-gray-900">{selectedKYC.provider}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">CCCD</p>
                      <p className="font-mono font-medium text-gray-900">{selectedKYC.cccdNumber}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Ngày Sinh</p>
                      <p className="font-medium text-gray-900">{selectedKYC.dateOfBirth}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Địa Chỉ</p>
                      <p className="font-medium text-gray-900 text-sm">{selectedKYC.address}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="font-medium text-gray-900">{selectedKYC.email}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Số Điện Thoại</p>
                      <p className="font-medium text-gray-900">{selectedKYC.phone}</p>
                    </div>

                    {selectedKYC.bankAccount && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 mb-1">Tài Khoản Ngân Hàng</p>
                        <p className="font-medium text-blue-900">{selectedKYC.bankAccount}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedKYC(null);
                      }}
                      className="flex-1"
                    >
                      Đóng
                    </Button>
                    {selectedKYC.status === 'pending' && (
                      <>
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          className="flex-1"
                        >
                          Từ Chối
                        </Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={handleApprove}
                        >
                          Duyệt
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
