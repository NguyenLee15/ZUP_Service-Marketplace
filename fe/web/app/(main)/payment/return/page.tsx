import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

interface TransactionVerification {
  id: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number | string;
  type: string;
  processedAt?: string;
  failureReason?: string;
}

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const vnpResponseCode = params['vnp_ResponseCode'] as string | undefined;
  const vnpTxnRef = params['vnp_TxnRef'] as string | undefined;
  const payosOrderCode = params['orderCode'] as string | undefined;
  const payosCode = params['code'] as string | undefined;

  const txnRef = vnpTxnRef || payosOrderCode;
  const backendUrl = process.env.BACKEND_URL;

  // 1. Nếu có thông tin VNPay hợp lệ, đồng bộ IPN phía backend trước khi truy vấn trạng thái
  if (vnpResponseCode === '00' && backendUrl) {
    try {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      await fetch(`${backendUrl}/provider-wallets/vnpay/ipn?${queryString}`, {
        cache: 'no-store',
      });
    } catch (e) {
      console.error('Failed to trigger server IPN verification', e);
    }
  }

  // 2. Xác thực trạng thái giao dịch thực tế từ Database thông qua Server API
  let verifiedTx: TransactionVerification | null = null;
  if (txnRef && backendUrl) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('hs_access_token')?.value;
      const res = await fetch(
        `${backendUrl}/provider-wallets/transactions/status?txnRef=${encodeURIComponent(txnRef)}`,
        {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        const json = await res.json();
        verifiedTx = (json.data || json) as TransactionVerification;
      }
    } catch (e) {
      console.error('Failed to query verified transaction status', e);
    }
  }

  // Phân định trạng thái chuẩn xác dựa trên dữ liệu Backend đã xác thực:
  const isSuccess = verifiedTx?.status === 'SUCCESS';
  const isFailed = verifiedTx?.status === 'FAILED' || vnpResponseCode === '24' || payosCode === '01';
  const isPending = !isSuccess && !isFailed;
  const displayAmount = verifiedTx ? Number(verifiedTx.amount) : 0;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {isPending ? (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
        ) : isSuccess ? (
          <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-20 w-20 text-rose-500" />
        )}
        
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          {isPending
            ? 'Đang xác nhận giao dịch'
            : isSuccess
            ? 'Giao dịch thành công!'
            : 'Giao dịch thất bại'}
        </h1>
        
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {isPending
            ? 'Hệ thống đang chờ kết quả đối soát chính thức từ cổng thanh toán. Vui lòng kiểm tra lại sau ít phút.'
            : isSuccess
            ? displayAmount > 0
              ? `Bạn đã nạp thành công ${displayAmount.toLocaleString('vi-VN')}đ vào ví.`
              : 'Giao dịch nạp tiền đã được ghi nhận thành công vào ví.'
            : verifiedTx?.failureReason || 'Đã có lỗi xảy ra hoặc bạn đã hủy giao dịch.'}
        </p>

        {txnRef && (
          <div className="mt-4 inline-block px-3 py-1 rounded-md bg-muted text-xs font-mono text-muted-foreground">
            Mã tham chiếu: {txnRef}
          </div>
        )}

        <div className="mt-6 rounded-xl bg-muted/60 p-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {isPending
              ? 'Bạn có thể quay lại trang chủ và kiểm tra lịch sử biến động số dư sau.'
              : 'Bạn có thể đóng cửa sổ này và tiếp tục sử dụng ứng dụng.'}
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-sky-600 px-6 font-bold text-white transition-colors hover:bg-sky-700"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
