import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../constants/api';
import { BOOKING_STATUS_LABEL } from '../constants/booking-status';
import { formatCurrency, formatDateTime } from './format';
import { storage } from './storage';

export type PdfBooking = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  description?: string | null;
  desiredTime?: string | Date | null;
  createdAt?: string | Date | null;
  addressDetail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  quoteAmount?: number | string | null;
  actualPrice?: number | string | null;
  service?: { name?: string | null } | null;
  provider?: { fullName?: string | null; phone?: string | null } | null;
  quotation?: {
    actualPrice?: number | string | null;
    estimatedTime?: string | null;
    note?: string | null;
    quotationItems?: Array<{
      name?: string | null;
      unit?: string | null;
      quantity?: number | string | null;
      price?: number | string | null;
    }>;
  } | null;
  bookingItems?: Array<{
    name?: string | null;
    unit?: string | null;
    quantity?: number | string | null;
    priceSnapshot?: number | string | null;
  }>;
};

export type BookingHistoryExportFilters = {
  status?: string;
  from?: string;
  to?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fullAddress(booking: PdfBooking) {
  return [
    booking.addressDetail,
    booking.ward,
    booking.district,
    booking.province,
  ]
    .filter(Boolean)
    .join(', ');
}

function statusLabel(status?: string | null) {
  return status ? BOOKING_STATUS_LABEL[status] || status : 'Chưa rõ';
}

function bookingAmount(booking: PdfBooking) {
  return (
    booking.actualPrice ||
    booking.quoteAmount ||
    booking.quotation?.actualPrice ||
    null
  );
}

function pdfShell(title: string, body: string) {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; margin: 28px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 22px 0 8px; }
    .muted { color: #475569; font-size: 12px; margin-bottom: 18px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 9px 6px; text-align: left; font-size: 12px; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 700; }
    .note { margin-top: 18px; color: #475569; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <h1>HomeServe</h1>
  <div class="muted">${escapeHtml(title)}<br/>Xuất lúc ${escapeHtml(new Date().toLocaleString('vi-VN'))}</div>
  ${body}
</body>
</html>`;
}

export function createBookingReceiptPdfFallback(booking: PdfBooking) {
  const quoteItems = booking.quotation?.quotationItems || [];
  const bookingItems = booking.bookingItems || [];
  const items = quoteItems.length
    ? quoteItems.map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
      }))
    : bookingItems.map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        price: item.priceSnapshot,
      }));
  const amount = bookingAmount(booking);

  return pdfShell(
    `Biên nhận dịch vụ · #${booking.bookingCode || booking.id || '-'}`,
    `
    <h2>Thông tin đơn hàng</h2>
    <table>
      <tbody>
        <tr><td>Mã đơn</td><td><strong>#${escapeHtml(booking.bookingCode || booking.id || '-')}</strong></td></tr>
        <tr><td>Dịch vụ</td><td>${escapeHtml(booking.service?.name || 'Dịch vụ')}</td></tr>
        <tr><td>Nhà cung cấp</td><td>${escapeHtml(booking.provider?.fullName || '-')}</td></tr>
        <tr><td>Trạng thái</td><td>${escapeHtml(statusLabel(booking.status))}</td></tr>
        <tr><td>Lịch hẹn</td><td>${escapeHtml(formatDateTime(booking.desiredTime))}</td></tr>
        <tr><td>Địa chỉ</td><td>${escapeHtml(fullAddress(booking) || '-')}</td></tr>
        <tr><td>Tổng tiền</td><td><strong>${escapeHtml(amount ? formatCurrency(amount) : 'Chưa có báo giá')}</strong></td></tr>
      </tbody>
    </table>
    <h2>Hạng mục</h2>
    <table>
      <thead><tr><th>Tên hạng mục</th><th>Đơn vị</th><th>SL</th><th>Đơn giá</th></tr></thead>
      <tbody>${(items.length ? items : [{ name: 'Chưa có hạng mục', unit: '-', quantity: '-', price: null }])
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.name || '-')}</td><td>${escapeHtml(item.unit || '-')}</td><td>${escapeHtml(item.quantity || '-')}</td><td>${escapeHtml(item.price ? formatCurrency(item.price) : '-')}</td></tr>`,
        )
        .join('')}</tbody>
    </table>
    <p class="note">Biên nhận này được tạo từ dữ liệu đơn hàng trên HomeServe. Chi phí thực tế phụ thuộc báo giá và xác nhận giữa hai bên.</p>
  `,
  );
}

export function createBookingHistoryPdfFallback({
  bookings,
  filters,
}: {
  bookings: PdfBooking[];
  filters: BookingHistoryExportFilters;
}) {
  const totalAmount = bookings.reduce(
    (sum, booking) => sum + Number(bookingAmount(booking) || 0),
    0,
  );
  const completed = bookings.filter((booking) => booking.status === 'DONE').length;
  const cancelled = bookings.filter((booking) => booking.status === 'CANCELLED').length;
  const filterText = [
    filters.status && filters.status !== 'ALL' ? `trạng thái ${statusLabel(filters.status)}` : '',
    filters.from ? `từ ${filters.from}` : '',
    filters.to ? `đến ${filters.to}` : '',
  ].filter(Boolean).join(', ') || 'tất cả đơn hàng đang hiển thị';

  return pdfShell(
    `Báo cáo lịch sử đặt dịch vụ · ${filterText}`,
    `
    <h2>Tổng quan</h2>
    <table>
      <tbody>
        <tr><td>Tổng đơn trong báo cáo</td><td><strong>${bookings.length}</strong></td></tr>
        <tr><td>Hoàn thành</td><td>${completed}</td></tr>
        <tr><td>Đã hủy</td><td>${cancelled}</td></tr>
        <tr><td>Tổng giá trị hiển thị</td><td><strong>${escapeHtml(formatCurrency(totalAmount))}</strong></td></tr>
      </tbody>
    </table>
    <h2>Danh sách đơn</h2>
    <table>
      <thead><tr><th>Mã đơn</th><th>Dịch vụ</th><th>Nhà cung cấp</th><th>Trạng thái</th><th>Giá trị</th></tr></thead>
      <tbody>${(bookings.length ? bookings : [{ bookingCode: '-', service: { name: 'Chưa có dữ liệu' } }])
        .map(
          (booking) =>
            `<tr><td>#${escapeHtml(booking.bookingCode || booking.id || '-')}</td><td>${escapeHtml(booking.service?.name || '-')}</td><td>${escapeHtml(booking.provider?.fullName || '-')}</td><td>${escapeHtml(statusLabel(booking.status))}</td><td>${escapeHtml(bookingAmount(booking) ? formatCurrency(bookingAmount(booking)) : '-')}</td></tr>`,
        )
        .join('')}</tbody>
    </table>
  `,
  );
}

async function getAccessToken() {
  return storage.getAccessToken();
}

async function sharePdfFromHtml(html: string, dialogTitle: string) {
  const file = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle,
    });
  }
  return file.uri;
}

async function downloadServerPdf(path: string, fileName: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  const targetUri = `${FileSystem.documentDirectory}${fileName}`;
  const result = await FileSystem.downloadAsync(`${API_BASE_URL}${path}`, targetUri, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (result.status && result.status >= 400) {
    throw new Error('Máy chủ chưa tạo được PDF.');
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: fileName,
    });
  }
  return result.uri;
}

export async function exportBookingReceiptPdf(booking: PdfBooking) {
  const bookingId = booking.id;
  const fileName = `homeserve-bien-nhan-${booking.bookingCode || bookingId || Date.now()}.pdf`;
  if (bookingId) {
    try {
      return await downloadServerPdf(`/bookings/${bookingId}/receipt-pdf`, fileName);
    } catch {
      return sharePdfFromHtml(
        createBookingReceiptPdfFallback(booking),
        'Biên nhận dịch vụ',
      );
    }
  }
  return sharePdfFromHtml(createBookingReceiptPdfFallback(booking), 'Biên nhận dịch vụ');
}

export async function exportBookingHistoryPdf({
  bookings,
  filters,
}: {
  bookings: PdfBooking[];
  filters: BookingHistoryExportFilters;
}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const query = params.toString();
  try {
    return await downloadServerPdf(
      `/bookings/export-pdf${query ? `?${query}` : ''}`,
      `homeserve-lich-su-dat-dich-vu-${Date.now()}.pdf`,
    );
  } catch {
    return sharePdfFromHtml(
      createBookingHistoryPdfFallback({ bookings, filters }),
      'Báo cáo lịch sử đặt dịch vụ',
    );
  }
}
