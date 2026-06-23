import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const responseCode = params['vnp_ResponseCode'] as string;
  const amountStr = params['vnp_Amount'] as string;
  const amount = amountStr ? parseInt(amountStr, 10) / 100 : 0;
  
  const isSuccess = responseCode === '00';

  // Manual IPN fallback: If the VNPay server webhook hasn't reached our backend yet,
  // we trigger the IPN verification manually from the frontend.
  if (isSuccess && process.env.BACKEND_URL) {
    try {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      await fetch(`${process.env.BACKEND_URL}/provider-wallets/vnpay/ipn?${queryString}`, {
        cache: 'no-store',
      });
    } catch (e) {
      console.error('Failed to trigger manual IPN fallback', e);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-900">
        {isSuccess ? (
          <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-20 w-20 text-rose-500" />
        )}
        
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          {isSuccess ? 'Giao dịch thành công!' : 'Giao dịch thất bại'}
        </h1>
        
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {isSuccess 
            ? `Bạn đã nạp thành công ${amount.toLocaleString('vi-VN')}đ vào ví.`
            : 'Đã có lỗi xảy ra hoặc bạn đã hủy giao dịch.'}
        </p>

        <div className="mt-8 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Bạn có thể đóng cửa sổ này và quay lại ứng dụng.
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
