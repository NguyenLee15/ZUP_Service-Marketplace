import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import PdfPrinter from 'pdfmake/js/Printer';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../common/errors/error-codes';

export interface CustomerBookingExportFilters {
  from?: string;
  to?: string;
  status?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  DISPUTED: 'Khiếu nại',
  CANCELLED: 'Đã hủy',
};

type NormalizedCustomerFilters = {
  from?: Date;
  to?: Date;
  status?: BookingStatus;
};

@Injectable()
export class CustomerBookingExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportReceiptPdf(customerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId },
      include: {
        service: { select: { id: true, name: true } },
        customer: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        provider: { select: { id: true, fullName: true, phone: true } },
        quotations: {
          where: { status: 'ACCEPTED' },
          include: { quotationItems: true },
        },
        bookingItems: true,
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    const printer = new PdfPrinter(this.getFonts());
    const acceptedQuotations = booking.quotations || [];
    const items = acceptedQuotations.length
      ? acceptedQuotations.flatMap((q) => q.quotationItems || [])
      : booking.bookingItems;
    const amount = acceptedQuotations.length
      ? acceptedQuotations.reduce((sum, q) => sum + Number(q.actualPrice), 0)
      : items.reduce(
          (sum, item) =>
            sum +
            Number('price' in item ? item.price : item.priceSnapshot) *
              Number(item.quantity || 1),
          0,
        );

    const content: Content[] = [
      { text: 'Zup', fontSize: 18, bold: true },
      {
        text: 'Biên nhận dịch vụ',
        fontSize: 15,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      { text: `Mã đơn: ${booking.bookingCode || booking.id}` },
      {
        text: `Ngày xuất: ${this.formatDateTime(new Date())}`,
        margin: [0, 0, 0, 10],
      },
      this.simpleTable(
        ['Thông tin', 'Nội dung'],
        [
          ['Khách hàng', booking.customer.fullName],
          ['Số điện thoại', booking.customer.phone || '-'],
          ['Dịch vụ', booking.service?.name || '-'],
          ['Nhà cung cấp', booking.provider?.fullName || '-'],
          ['Trạng thái', STATUS_LABELS[booking.status] || booking.status],
          ['Lịch hẹn', this.formatDateTime(booking.desiredTime)],
          ['Địa chỉ', this.fullAddress(booking)],
          [
            'Tổng tiền',
            amount ? this.formatCurrency(amount) : 'Chưa có báo giá',
          ],
        ],
      ),
      { text: 'Hạng mục', bold: true, margin: [0, 18, 0, 6] },
      this.simpleTable(
        ['Tên hạng mục', 'Đơn vị', 'SL', 'Đơn giá'],
        items.map((item) => [
          item.name,
          item.unit,
          item.quantity,
          this.formatCurrency(
            Number('price' in item ? item.price : item.priceSnapshot),
          ),
        ]),
      ),
      {
        text: 'Ghi chú: Biên nhận này được tạo từ dữ liệu đơn hàng trên Zup. Chi phí thực tế phụ thuộc báo giá và xác nhận giữa hai bên.',
        margin: [0, 18, 0, 0],
        color: '#64748B',
      },
    ];

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [36, 42, 36, 48],
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      content,
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  async exportHistoryPdf(
    customerId: number,
    filters: CustomerBookingExportFilters = {},
  ) {
    const normalized = this.normalizeFilters(filters);
    const where = this.buildWhere(customerId, normalized);
    const [rows, total, statusCounts] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          service: { select: { id: true, name: true } },
          provider: { select: { id: true, fullName: true } },
          quotations: { where: { status: 'ACCEPTED' } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.booking.count({ where }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    const completed =
      statusCounts.find((item) => item.status === BookingStatus.DONE)?._count
        .id || 0;
    const cancelled =
      statusCounts.find((item) => item.status === BookingStatus.CANCELLED)
        ?._count.id || 0;
    const totalAmount = rows.reduce((sum, item) => {
      const qs = item.quotations || [];
      return sum + qs.reduce((qSum, q) => qSum + Number(q.actualPrice || 0), 0);
    }, 0);

    const printer = new PdfPrinter(this.getFonts());
    const content: Content[] = [
      { text: 'Zup', fontSize: 18, bold: true },
      {
        text: 'Báo cáo lịch sử đặt dịch vụ',
        fontSize: 15,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      { text: `Ngày xuất: ${this.formatDateTime(new Date())}` },
      {
        text: `Điều kiện lọc: ${this.describeFilters(normalized)}`,
        margin: [0, 0, 0, 14],
      },
      this.simpleTable(
        ['Chỉ số', 'Giá trị'],
        [
          ['Tổng đơn', total],
          ['Hoàn thành', completed],
          ['Đã hủy', cancelled],
          ['Tổng giá trị đã báo giá', this.formatCurrency(totalAmount)],
        ],
      ),
      { text: 'Danh sách đơn gần nhất', bold: true, margin: [0, 18, 0, 6] },
      this.simpleTable(
        ['Mã đơn', 'Dịch vụ', 'Nhà cung cấp', 'Trạng thái', 'Giá trị'],
        rows.map((booking) => [
          booking.bookingCode,
          booking.service?.name || '-',
          booking.provider?.fullName || '-',
          STATUS_LABELS[booking.status] || booking.status,
          booking.quotations && booking.quotations.length > 0
            ? this.formatCurrency(
                booking.quotations.reduce(
                  (s, q) => s + Number(q.actualPrice),
                  0,
                ),
              )
            : '-',
        ]),
      ),
    ];

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [36, 42, 36, 48],
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      content,
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  private normalizeFilters(
    filters: CustomerBookingExportFilters,
  ): NormalizedCustomerFilters {
    return {
      from: this.parseDate(filters.from, 'from'),
      to: this.parseDate(filters.to, 'to'),
      status: this.parseStatus(filters.status),
    };
  }

  private buildWhere(
    customerId: number,
    filters: NormalizedCustomerFilters,
  ): Prisma.BookingWhereInput {
    return {
      customerId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };
  }

  private parseDate(value: string | undefined, edge: 'from' | 'to') {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (edge === 'to' && value.length <= 10) date.setHours(23, 59, 59, 999);
    return date;
  }

  private parseStatus(value: string | undefined) {
    if (!value || value === 'ALL') return undefined;
    return Object.values(BookingStatus).includes(value as BookingStatus)
      ? (value as BookingStatus)
      : undefined;
  }

  private describeFilters(filters: NormalizedCustomerFilters) {
    const parts = [
      filters.from ? `từ ${this.formatDate(filters.from)}` : '',
      filters.to ? `đến ${this.formatDate(filters.to)}` : '',
      filters.status
        ? `trạng thái ${STATUS_LABELS[filters.status] || filters.status}`
        : '',
    ].filter(Boolean);
    return parts.join(', ') || 'tất cả đơn hàng';
  }

  private fullAddress(booking: {
    addressDetail?: string | null;
    ward?: string | null;
    district?: string | null;
    province?: string | null;
  }) {
    return [
      booking.addressDetail,
      booking.ward,
      booking.district,
      booking.province,
    ]
      .filter(Boolean)
      .join(', ');
  }

  private getFonts() {
    return {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
  }

  private simpleTable(headers: string[], rows: Array<Array<string | number>>) {
    return {
      table: {
        headerRows: 1,
        widths: headers.map(() => '*'),
        body: [
          headers.map((header) => ({ text: header, bold: true })),
          ...(rows.length ? rows : [headers.map(() => '-')]),
        ],
      },
      layout: 'lightHorizontalLines',
    };
  }

  private formatDateTime(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }

  private formatCurrency(value: number) {
    return `${Math.round(value || 0).toLocaleString('vi-VN')} VND`;
  }
}
