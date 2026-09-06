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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminPermission } from '../../common/constants/admin-permissions';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/decorators/api-contract.decorator';
import { BookingDisputeService } from './booking-dispute.service';
import { BookingLifecycleService } from './booking-lifecycle.service';
import { BookingQueryService } from './booking-query.service';
import { CustomerBookingExportService } from './customer-booking-export.service';
import { BookingIntentService } from './booking-intent.service';
import { BookingListQueryDto } from './dto/booking-query.dto';
import { ExtractBookingIntentDto } from './dto/booking-intent.dto';
import {
  CreateBookingDto,
  ConfirmSurveyorDto,
  SendQuoteDto,
  CancelBookingDto,
  RejectQuoteDto,
  DisputeDto,
  ResolveDisputeDto,
  SendSupplementaryQuoteDto,
  RejectSupplementaryDto,
} from './dto/bookings.dto';

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

  /** POST /bookings/intent-extract — AI bóc tách ý định từ mô tả sự cố */
  @Post('intent-extract')
  @ApiOperation({
    summary: 'Extract booking intent from natural language prompt via AI',
  })
  @ApiSuccessResponse('Extracted booking intent')
  async extractIntent(@Body() dto: ExtractBookingIntentDto) {
    return this.bookingIntentService.extractIntent(dto);
  }

  /** POST /bookings — Customer tạo booking */
  @Post()
  @ApiOperation({ summary: 'Customer creates a booking' })
  @ApiSuccessResponse('Booking created')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingLifecycleService.create(userId, dto);
  }

  /** GET /bookings — Customer xem danh sách booking */
  @Get()
  @ApiOperation({ summary: 'List current user bookings' })
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  @ApiSuccessResponse('Booking list')
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

  @Get('export-pdf')
  @ApiOperation({ summary: 'Export current customer booking history as PDF' })
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async exportHistoryPdf(
    @CurrentUser('id') userId: number,
    @Query() filters: { from?: string; to?: string; status?: string },
    @Res() res: Response,
  ) {
    const pdfDoc = await this.customerBookingExportService.exportHistoryPdf(
      userId,
      filters,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=customer-bookings-${filters.from || 'all'}-${filters.to || new Date().toISOString().slice(0, 10)}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  /** GET /bookings/:id — Xem chi tiết booking */
  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get current user booking timeline' })
  async getTimeline(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingQueryService.getTimeline(id, userId);
  }

  @Get(':id/receipt-pdf')
  @ApiOperation({ summary: 'Export current customer booking receipt as PDF' })
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
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
      `attachment; filename=booking-${id}-receipt.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get(':id')
  async getById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingQueryService.getById(id, userId);
  }

  /** PATCH /bookings/:id/confirm-quote — Customer đồng ý báo giá */
  @Patch(':id/confirm-quote')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async confirmQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.customerConfirmQuote(userId, id);
  }

  /** PATCH /bookings/:id/reject-quote — Customer từ chối báo giá */
  @Patch(':id/reject-quote')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async rejectQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectQuoteDto,
  ) {
    return this.bookingLifecycleService.customerRejectQuote(userId, id, dto);
  }

  /** PATCH /bookings/:id/supplementary-quotes/:quoteId/confirm — Customer đồng ý báo giá bổ sung */
  @Patch(':id/supplementary-quotes/:quoteId/confirm')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async confirmSupplementaryQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('quoteId', ParseIntPipe) quoteId: number,
  ) {
    return this.bookingLifecycleService.customerReplySupplementaryQuote(
      userId,
      id,
      quoteId,
      true,
    );
  }

  /** PATCH /bookings/:id/supplementary-quotes/:quoteId/reject — Customer từ chối báo giá bổ sung */
  @Patch(':id/supplementary-quotes/:quoteId/reject')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async rejectSupplementaryQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('quoteId', ParseIntPipe) quoteId: number,
    @Body() dto: RejectSupplementaryDto,
  ) {
    return this.bookingLifecycleService.customerReplySupplementaryQuote(
      userId,
      id,
      quoteId,
      false,
      dto.reason,
    );
  }

  /** PATCH /bookings/:id/accept — Customer nghiệm thu */
  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async accept(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.customerAccept(userId, id);
  }

  /** POST /bookings/:id/dispute — Customer khiếu nại */
  @Post(':id/dispute')
  @ApiOperation({ summary: 'Customer opens a booking dispute' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        evidences: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['reason'],
    },
  })
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  @UseInterceptors(FilesInterceptor('evidences', 5))
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

// ===== Provider Booking Controller =====

@Controller('provider/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROVIDER')
@ApiTags('provider-bookings')
@ApiBearerAuth()
@ApiErrorResponses()
export class ProviderBookingsController {
  constructor(
    private readonly bookingLifecycleService: BookingLifecycleService,
    private readonly bookingQueryService: BookingQueryService,
  ) {}

  /** GET /provider/bookings */
  @Get()
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  async getMyBookings(
    @CurrentUser('id') userId: number,
    @Query() query: BookingListQueryDto,
  ) {
    return this.bookingQueryService.getMyBookings(
      userId,
      'provider',
      query.status,
      query.page,
      query.limit,
    );
  }

  /** GET /provider/bookings/:id */
  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get provider booking timeline' })
  async getTimeline(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingQueryService.getTimeline(id, userId);
  }

  @Get(':id')
  async getById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingQueryService.getById(id, userId);
  }

  /** PATCH /provider/bookings/:id/accept */
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Provider accepts a pending booking' })
  async acceptBooking(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.acceptByProvider(userId, id);
  }

  /** PATCH /provider/bookings/:id/decline */
  @Patch(':id/decline')
  async declineBooking(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingLifecycleService.declineByProvider(userId, id, dto);
  }

  /** PATCH /provider/bookings/:id/surveyor */
  @Patch(':id/surveyor')
  async confirmSurveyor(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmSurveyorDto,
  ) {
    return this.bookingLifecycleService.confirmSurveyor(userId, id, dto);
  }

  /** POST /provider/bookings/:id/quote */
  @Post(':id/quote')
  @ApiOperation({ summary: 'Provider sends quotation after survey' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        estimatedTime: { type: 'string' },
        note: { type: 'string' },
        items: { type: 'string', description: 'JSON quotation item array' },
        surveyImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['estimatedTime', 'items'],
    },
  })
  @UseInterceptors(FilesInterceptor('surveyImages', 5))
  async sendQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendQuoteDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.bookingLifecycleService.sendQuote(userId, id, dto, files);
  }

  /** POST /provider/bookings/:id/supplementary-quotes — Provider gửi báo giá bổ sung */
  @Post(':id/supplementary-quotes')
  @ApiOperation({ summary: 'Provider sends a supplementary quotation' })
  async sendSupplementaryQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendSupplementaryQuoteDto,
  ) {
    return this.bookingLifecycleService.providerSendSupplementaryQuote(
      userId,
      id,
      dto,
    );
  }

  /** PATCH /provider/bookings/:id/arrive */
  @Patch(':id/arrive')
  async arriveAtLocation(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.arriveAtLocation(userId, id);
  }

  /** PATCH /provider/bookings/:id/start */
  @Patch(':id/start')
  async startWork(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.startWork(userId, id);
  }

  /** PATCH /provider/bookings/:id/complete */
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Provider marks work complete with result images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resultImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['resultImages'],
    },
  })
  @UseInterceptors(FilesInterceptor('resultImages', 10))
  async completeWork(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.bookingLifecycleService.completeWork(userId, id, files);
  }

  /** PATCH /provider/bookings/:id/cancel */
  @Patch(':id/cancel')
  async cancelByProvider(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingLifecycleService.cancelByProvider(userId, id, dto);
  }
}

// ===== Admin Dispute Controller =====

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@Permissions(AdminPermission.DISPUTE_RESOLVE)
@ApiTags('admin-disputes')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminDisputesController {
  constructor(private readonly bookingDisputeService: BookingDisputeService) {}

  /** PATCH /admin/disputes/:id/resolve */
  @Patch(':id/resolve')
  async resolve(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDisputeDto,
    @Req()
    req: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      req.ip ||
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
      '';
    return this.bookingDisputeService.resolveDispute(adminId, id, dto, ip);
  }
}
