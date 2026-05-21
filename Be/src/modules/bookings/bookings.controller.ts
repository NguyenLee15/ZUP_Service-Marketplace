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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  ConfirmSurveyorDto,
  SendQuoteDto,
  CancelBookingDto,
  RejectQuoteDto,
  DisputeDto,
  ResolveDisputeDto,
} from './dto/bookings.dto';

// ===== Customer Booking Controller =====

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** POST /bookings — Customer tạo booking */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, dto);
  }

  /** GET /bookings — Customer xem danh sách booking */
  @Get()
  async getMyBookings(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userRole = role === 'PROVIDER' ? 'provider' : 'customer';
    return this.bookingsService.getMyBookings(
      userId,
      userRole as 'customer' | 'provider',
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /** GET /bookings/:id — Xem chi tiết booking */
  @Get(':id')
  async getById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.getById(id, userId);
  }

  /** PATCH /bookings/:id/confirm-quote — Customer đồng ý báo giá */
  @Patch(':id/confirm-quote')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async confirmQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.customerConfirmQuote(userId, id);
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
    return this.bookingsService.customerRejectQuote(userId, id, dto);
  }

  /** PATCH /bookings/:id/accept — Customer nghiệm thu */
  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async accept(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.customerAccept(userId, id);
  }

  /** POST /bookings/:id/dispute — Customer khiếu nại */
  @Post(':id/dispute')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  @UseInterceptors(FilesInterceptor('evidences', 5))
  async dispute(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DisputeDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.bookingsService.customerDispute(userId, id, dto, files);
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
    return this.bookingsService.cancelByCustomer(userId, id, dto);
  }

  /** POST /bookings/:id/rebook — UC16.5 Đặt lại nhanh từ booking cũ */
  @Post(':id/rebook')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  async rebook(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.rebook(userId, id);
  }
}

// ===== Provider Booking Controller =====

@Controller('provider/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROVIDER')
export class ProviderBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** GET /provider/bookings */
  @Get()
  async getMyBookings(
    @CurrentUser('id') userId: number,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.getMyBookings(
      userId,
      'provider',
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /** GET /provider/bookings/:id */
  @Get(':id')
  async getById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.getById(id, userId);
  }

  /** PATCH /provider/bookings/:id/accept */
  @Patch(':id/accept')
  async acceptBooking(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.acceptByProvider(userId, id);
  }

  /** PATCH /provider/bookings/:id/decline */
  @Patch(':id/decline')
  async declineBooking(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.declineByProvider(userId, id, dto);
  }

  /** PATCH /provider/bookings/:id/surveyor */
  @Patch(':id/surveyor')
  async confirmSurveyor(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmSurveyorDto,
  ) {
    return this.bookingsService.confirmSurveyor(userId, id, dto);
  }

  /** POST /provider/bookings/:id/quote */
  @Post(':id/quote')
  @UseInterceptors(FilesInterceptor('surveyImages', 5))
  async sendQuote(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendQuoteDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.bookingsService.sendQuote(userId, id, dto, files);
  }

  /** PATCH /provider/bookings/:id/start */
  @Patch(':id/start')
  async startWork(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.startWork(userId, id);
  }

  /** PATCH /provider/bookings/:id/complete */
  @Patch(':id/complete')
  @UseInterceptors(FilesInterceptor('resultImages', 10))
  async completeWork(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.bookingsService.completeWork(userId, id, files);
  }

  /** PATCH /provider/bookings/:id/cancel */
  @Patch(':id/cancel')
  async cancelByProvider(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelByProvider(userId, id, dto);
  }
}

// ===== Admin Dispute Controller =====

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AdminDisputesController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** PATCH /admin/disputes/:id/resolve */
  @Patch(':id/resolve')
  async resolve(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDisputeDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    return this.bookingsService.resolveDispute(adminId, id, dto, ip);
  }
}
