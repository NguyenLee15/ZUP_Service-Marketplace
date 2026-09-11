import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { Workbook } from 'exceljs';
import PdfPrinter from 'pdfmake/js/Printer';
import { Prisma } from '@prisma/client';
import type { DashboardReportFilters } from './admin-dashboard.service';

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  DISPUTED: 'Khiếu nại',
  CANCELLED: 'Đã hủy',
};

export interface ExportStatsPayload {
  totalBookings: number;
  totalUsers: number;
  totalProviders: number;
  totalServices: number;
  activeBookings: number;
  pendingBookings: number;
  doneBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  commissionRevenue: number;
  avgOrderValue: number;
  filterSummary: string;
}

export interface ExportChartDataPayload {
  revenueData: Array<{ month: string; commission: number }>;
  statusData: Array<{ status: string; count: number }>;
}

export interface ExportBookingRow {
  bookingCode: string;
  status: string;
  createdAt: Date;
  service?: { name: string } | null;
  provider?: { fullName: string } | null;
  customer?: { fullName: string } | null;
  quotations?: Array<{ actualPrice: number | string | Prisma.Decimal }>;
}

@Injectable()
export class AdminDashboardExportService {
  exportPdf(
    res: Response,
    stats: ExportStatsPayload,
    chartData: ExportChartDataPayload,
    rows: ExportBookingRow[],
    filters: DashboardReportFilters = {},
  ) {
    const printer = new PdfPrinter(this.getFonts());
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [36, 42, 36, 48],
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      content: [
        { text: 'HomeService Marketplace', fontSize: 18, bold: true },
        {
          text: 'Bao cao quan tri he thong',
          fontSize: 14,
          bold: true,
          margin: [0, 4, 0, 8],
        },
        { text: `Ngay xuat: ${this.formatDateTime(new Date())}` },
        {
          text: `Dieu kien loc: ${stats.filterSummary}`,
          margin: [0, 0, 0, 14],
        },
        this.kpiTable([
          ['Tong don hang', stats.totalBookings],
          ['Dang xu ly', stats.activeBookings],
          ['Da hoan thanh', stats.doneBookings],
          ['Doanh thu', this.formatCurrency(stats.totalRevenue)],
          ['Hoa hong uoc tinh', this.formatCurrency(stats.commissionRevenue)],
          ['Dich vu dang cung cap', stats.totalServices],
        ]),
        { text: 'Doanh thu theo ky', bold: true, margin: [0, 16, 0, 6] },
        this.simpleTable(
          ['Ky', 'Hoa hong'],
          chartData.revenueData.map((item) => [
            item.month,
            this.formatCurrency(item.commission),
          ]),
        ),
        { text: 'Don hang gan nhat', bold: true, margin: [0, 16, 0, 6] },
        this.simpleTable(
          ['Ma don', 'Dich vu', 'Nha cung cap', 'Trang thai', 'Gia tri'],
          rows.map((item) => [
            item.bookingCode,
            item.service?.name || '-',
            item.provider?.fullName || '-',
            STATUS_LABELS[item.status] || item.status,
            item.quotations && item.quotations.length > 0
              ? this.formatCurrency(
                  item.quotations.reduce(
                    (s, q) => s + Number(q.actualPrice),
                    0,
                  ),
                )
              : '-',
          ]),
        ),
        {
          columns: [
            { text: 'Nguoi lap bao cao', alignment: 'center' },
            { text: 'Nguoi phe duyet', alignment: 'center' },
          ],
          margin: [0, 32, 0, 0],
        },
      ],
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${this.reportFileName('admin-report', filters, 'pdf')}`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  async exportExcel(
    res: Response,
    stats: ExportStatsPayload,
    chartData: ExportChartDataPayload,
    rows: ExportBookingRow[],
    filters: DashboardReportFilters = {},
  ) {
    const workbook = new Workbook();
    workbook.creator = 'HomeService';
    workbook.created = new Date();

    const overview = workbook.addWorksheet('Tong quan');
    overview.columns = [
      { header: 'Chi so', key: 'metric', width: 30 },
      { header: 'Gia tri', key: 'value', width: 28 },
    ];
    overview.addRows([
      { metric: 'Dieu kien loc', value: stats.filterSummary },
      { metric: 'Tong don hang', value: stats.totalBookings },
      { metric: 'Dang xu ly', value: stats.activeBookings },
      { metric: 'Hoan thanh', value: stats.doneBookings },
      { metric: 'Da huy', value: stats.cancelledBookings },
      { metric: 'Doanh thu', value: stats.totalRevenue },
      { metric: 'Hoa hong uoc tinh', value: stats.commissionRevenue },
      { metric: 'Gia tri don trung binh', value: stats.avgOrderValue },
    ]);

    const revenue = workbook.addWorksheet('Doanh thu');
    revenue.columns = [
      { header: 'Ky', key: 'period', width: 20 },
      { header: 'Hoa hong', key: 'commission', width: 20 },
    ];
    revenue.addRows(
      chartData.revenueData.map((item) => ({
        period: item.month,
        commission: item.commission,
      })),
    );

    const status = workbook.addWorksheet('Trang thai');
    status.columns = [
      { header: 'Trang thai', key: 'status', width: 24 },
      { header: 'So don', key: 'count', width: 14 },
    ];
    status.addRows(chartData.statusData);

    const bookings = workbook.addWorksheet('Don hang');
    bookings.columns = [
      { header: 'Ma don', key: 'code', width: 18 },
      { header: 'Dich vu', key: 'service', width: 32 },
      { header: 'Nha cung cap', key: 'provider', width: 28 },
      { header: 'Khach hang', key: 'customer', width: 28 },
      { header: 'Trang thai', key: 'status', width: 18 },
      { header: 'Gia tri', key: 'value', width: 18 },
      { header: 'Ngay tao', key: 'createdAt', width: 22 },
    ];
    bookings.addRows(
      rows.map((item) => ({
        code: item.bookingCode,
        service: item.service?.name,
        provider: item.provider?.fullName,
        customer: item.customer?.fullName,
        status: STATUS_LABELS[item.status] || item.status,
        value:
          item.quotations && item.quotations.length > 0
            ? item.quotations.reduce((s, q) => s + Number(q.actualPrice), 0)
            : 0,
        createdAt: this.formatDateTime(item.createdAt),
      })),
    );

    for (const sheet of workbook.worksheets) {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7EDF6' },
      };
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${this.reportFileName('admin-report', filters, 'xlsx')}`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }

  private reportFileName(
    prefix: string,
    filters: DashboardReportFilters,
    ext: string,
  ) {
    const from = filters.from ? this.isoDate(new Date(filters.from)) : 'all';
    const to = filters.to
      ? this.isoDate(new Date(filters.to))
      : this.isoDate(new Date());
    return `${prefix}-${from}-${to}.${ext}`;
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

  private kpiTable(rows: Array<[string, string | number]>) {
    return this.simpleTable(['Chi so', 'Gia tri'], rows);
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

  private isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private formatCurrency(value: number) {
    return `${Math.round(value).toLocaleString('vi-VN')} VND`;
  }
}
