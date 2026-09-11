import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../common/decorators/api-contract.decorator';
import { BookingDisputeService } from '../booking-dispute.service';
import { BookingLifecycleService } from '../booking-lifecycle.service';
import { BookingQueryService } from '../booking-query.service';
import { CustomerBookingExportService } from '../customer-booking-export.service';
import { BookingIntentService } from '../booking-intent.service';
import { BookingListQueryDto } from '../dto/booking-query.dto';
import { ExtractBookingIntentDto } from '../dto/booking-intent.dto';
import {
  CreateBookingDto,
  CancelBookingDto,
  RejectQuoteDto,
  DisputeDto,
  RejectSupplementaryDto,
} from '../dto/bookings.dto';

// ===== Customer Booking Controller =====

@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiTags('bookings')
@ApiBearerAuth()
@ApiErrorResponses()
export class BookingsController {
  constructor(
    private readonly bookingLifecycleService: BookingLifecycleService,
    private readonly bookingDisputeService: BookingDisputeService,
    private readonly bookingQueryService: BookingQueryService,
    private readonly customerBookingExportService: CustomerBookingExportService,
    private readonly bookingIntentService: BookingIntentService,
  ) {}

  /** POST /bookings/intent-extract — AI trích xuất ý định đặt lịch */
  @Post('intent-extract')
  @ApiOperation({
    summary: 'AI trích xuất danh mục, thời gian, địa chỉ từ prompt tự nhiên',
  })
  async extractIntent(@Body() dto: ExtractBookingIntentDto) {
    return this.bookingIntentService.extractIntent(dto);
  }

  /** POST /bookings — Khách hàng tạo đơn */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Khách hàng tạo đơn đặt lịch' })
  @ApiSuccessResponse('Tạo đơn thành công')
  async create(
    @CurrentUser('id') customerId: number,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingLifecycleService.create(customerId, dto);
  }

  /** GET /bookings — Danh sách đơn của tôi (Customer hoặc Provider) */
  @Get()
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  async getMyBookings(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
    @Query() query: BookingListQueryDto,
  ) {
    const userRole: 'customer' | 'provider' =
      role === 'PROVIDER' ? 'provider' : 'customer';
    return this.bookingQueryService.getMyBookings(
      userId,
      userRole,
      query.status,
      query.page,
      query.limit,
    );
  }

  /** GET /bookings/:id/receipt-pdf — Xuất PDF biên nhận đơn hàng */
  @Get(':id/receipt-pdf')
  @ApiOperation({ summary: 'Xuất PDF biên nhận đơn hàng (Customer)' })
  async exportReceiptPdf(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdfDoc = await this.customerBookingExportService.exportReceiptPdf(
      userId,
      id,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bien-nhan-don-hang-${id}.pdf"`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  /** GET /bookings/export-pdf — Xuất PDF danh sách lịch sử đơn hàng */
  @Get('export-pdf')
  @ApiOperation({ summary: 'Xuất PDF danh sách đơn hàng đã lọc (Customer)' })
  async exportListPdf(
    @CurrentUser('id') userId: number,
    @Query() query: BookingListQueryDto,
    @Res() res: Response,
  ) {
    const pdfDoc = await this.customerBookingExportService.exportHistoryPdf(
      userId,
      query,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lich-su-don-hang.pdf"`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  /** GET /bookings/:id — Chi tiết đơn hàng */
  @Get(':id')
  async getById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingQueryService.getById(id, userId);
  }

  /** GET /bookings/:id/timeline — Lịch sử trạng thái */
  @Get(':id/timeline')
  async getTimeline(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingQueryService.getTimeline(id, userId);
  }

  /** PATCH /bookings/:id/confirm-quote — Customer đồng ý báo giá gốc */
  @Patch(':id/confirm-quote')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async confirmQuote(
    @CurrentUser('id') customerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.customerConfirmQuote(customerId, id);
  }

  /** PATCH /bookings/:id/reject-quote — Customer từ chối báo giá gốc */
  @Patch(':id/reject-quote')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async rejectQuote(
    @CurrentUser('id') customerId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectQuoteDto,
  ) {
    return this.bookingLifecycleService.customerRejectQuote(
      customerId,
      id,
      dto,
    );
  }

  /** PATCH /bookings/:id/supplementary-quotes/:quoteId/confirm — Customer duyệt báo giá phát sinh */
  @Patch(':id/supplementary-quotes/:quoteId/confirm')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async confirmSupplementaryQuote(
    @CurrentUser('id') customerId: number,
    @Param('id', ParseIntPipe) bookingId: number,
    @Param('quoteId', ParseIntPipe) quoteId: number,
  ) {
    return this.bookingLifecycleService.customerReplySupplementaryQuote(
      customerId,
      bookingId,
      quoteId,
      true,
    );
  }

  /** PATCH /bookings/:id/supplementary-quotes/:quoteId/reject — Customer từ chối báo giá phát sinh */
  @Patch(':id/supplementary-quotes/:quoteId/reject')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async rejectSupplementaryQuote(
    @CurrentUser('id') customerId: number,
    @Param('id', ParseIntPipe) bookingId: number,
    @Param('quoteId', ParseIntPipe) quoteId: number,
  ) {
    return this.bookingLifecycleService.customerReplySupplementaryQuote(
      customerId,
      bookingId,
      quoteId,
      false,
    );
  }

  /** PATCH /bookings/:id/accept — Customer nghiệm thu hoàn thành */
  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async acceptBooking(
    @CurrentUser('id') customerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.customerAccept(customerId, id);
  }

  /** POST /bookings/:id/dispute — Customer mở khiếu nại kèm ảnh/video */
  @Post(':id/dispute')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Customer khiếu nại đơn hàng (kèm bằng chứng)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        description: { type: 'string' },
        evidenceFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['reason', 'description'],
    },
  })
  @UseInterceptors(FilesInterceptor('evidenceFiles', 5))
  async dispute(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DisputeDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.bookingDisputeService.customerDispute(userId, id, dto, files);
  }

  /** PATCH /bookings/:id/cancel — Customer hủy đơn */
  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async cancelByCustomer(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingLifecycleService.cancelByCustomer(userId, id, dto);
  }

  /** POST /bookings/:id/rebook — UC16.5 Đặt lại nhanh từ booking cũ */
  @Post(':id/rebook')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async rebook(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.rebook(userId, id);
  }
}
