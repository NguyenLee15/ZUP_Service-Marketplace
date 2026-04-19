'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DollarSign, ArrowDownRight, ArrowUpRight, Download, X } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'withdrawal' | 'deposit';
  description: string;
  amount: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'income', description: 'Thanh toán từ booking #BK-12345', amount: '+500.000 đ', date: '2024-06-15', status: 'completed' },
  { id: '2', type: 'withdrawal', description: 'Rút tiền', amount: '-1.000.000 đ', date: '2024-06-14', status: 'completed' },
  { id: '3', type: 'income', description: 'Thanh toán từ booking #BK-12344', amount: '+2.000.000 đ', date: '2024-06-13', status: 'completed' },
  { id: '4', type: 'deposit', description: 'Nạp tiền cọc', amount: '+500.000 đ', date: '2024-06-12', status: 'pending' },
  { id: '5', type: 'withdrawal', description: 'Rút tiền', amount: '-500.000 đ', date: '2024-06-11', status: 'failed' },
  { id: '6', type: 'income', description: 'Thanh toán từ booking #BK-12343', amount: '+800.000 đ', date: '2024-06-10', status: 'completed' },
];

export default function ProviderWallet() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const balance = 2500000; // in VND

  const handleDeposit = async () => {
    if (!depositAmount || parseInt(depositAmount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    alert(`Thanh toán ${depositAmount.toString()} đ qua VNPay - Mô phỏng thành công!`);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ví Tiền</h1>
        <p className="text-gray-500 mt-1">Quản lý số dư và lịch sử giao dịch</p>
      </div>

      {/* Balance Card */}
      <Card className={`${balance < 0 ? 'border-red-300 bg-red-50' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'}`}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Balance */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Số Dư Hiện Tại</p>
              <div className={`text-4xl font-bold mb-2 ${balance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {balance.toLocaleString('vi-VN')} đ
              </div>
              {balance < 0 && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-700">
                  Cảnh báo: Số dư âm. Vui lòng nạp tiền sớm.
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="bg-white bg-opacity-60 rounded-lg p-3">
                <p className="text-sm text-gray-600">Tổng Thu Nhập (Tháng)</p>
                <p className="text-2xl font-bold text-green-600">7.300.000 đ</p>
              </div>
              <div className="bg-white bg-opacity-60 rounded-lg p-3">
                <p className="text-sm text-gray-600">Tổng Rút (Tháng)</p>
                <p className="text-2xl font-bold text-orange-600">-1.500.000 đ</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              Nạp Tiền
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" />
              Rút Tiền
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Xuất Báo Cáo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch Sử Giao Dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income';
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {/* Icon & Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      isIncome ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {isIncome ? (
                        <ArrowDownRight className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-orange-600'}`} />
                      ) : (
                        <ArrowUpRight className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-orange-600'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right">
                    <p className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-orange-600'}`}>
                      {transaction.amount}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status === 'completed' ? 'Hoàn thành' :
                       transaction.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Nạp Tiền</CardTitle>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số Tiền Cần Nạp (VNĐ)
                </label>
                <Input
                  type="number"
                  placeholder="Nhập số tiền"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  step="10000"
                />
              </div>

              {/* Quick Amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hoặc chọn nhanh:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['100000', '500000', '1000000', '2000000'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount)}
                      className="p-2 border border-blue-200 hover:bg-blue-50 rounded-lg text-sm font-medium"
                    >
                      {parseInt(amount).toLocaleString('vi-VN')} đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phương thức:</span> VNPay (Thẻ tín dụng, Internet Banking)
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleDeposit}
                  disabled={!depositAmount || isProcessing}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  {isProcessing ? 'Đang xử lý...' : 'Thanh Toán'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
