import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { ApiErrorResponses } from '../../../common/decorators/api-contract.decorator';
import { BookingLifecycleService } from '../booking-lifecycle.service';
import { BookingQueryService } from '../booking-query.service';
import {
  ConfirmSurveyorDto,
  SendQuoteDto,
  CancelBookingDto,
  SendSupplementaryQuoteDto,
} from '../dto/bookings.dto';

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
    @Query('status') status?: BookingStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingQueryService.getMyBookings(
      userId,
      'provider',
      status,
      page ? Number.parseInt(page, 10) : 1,
      limit ? Number.parseInt(limit, 10) : 20,
    );
  }

  /** PATCH /provider/bookings/:id/accept — Thợ nhận đơn */
  @Patch(':id/accept')
  async providerAccept(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingLifecycleService.acceptByProvider(userId, id);
  }

  /** PATCH /provider/bookings/:id/reject — Thợ từ chối đơn */
  @Patch(':id/reject')
  async providerReject(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.bookingLifecycleService.declineByProvider(userId, id, {
      reason: reason || 'Provider declined',
    });
  }

  /** PATCH /provider/bookings/:id/confirm-surveyor — Thá»£ cá»­ ngÆ°á» i kháº£o sÃ¡t */
  @Patch(':id/confirm-surveyor')
  async confirmSurveyor(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmSurveyorDto,
  ) {
    return this.bookingLifecycleService.confirmSurveyor(userId, id, dto);
  }

  /** POST /provider/bookings/:id/quote — Thá»£ gá»­i bÃ¡o giÃ¡ gá»‘c (kÃ¨m biÃªn báº£n kháº£o sÃ¡t) */
  @Patch(':id/quote')
  @ApiOperation({ summary: 'Thá»£ gá»­i bÃ¡o giÃ¡ gá»‘c kÃ¨m biÃªn báº£n kháº£o sÃ¡t' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        actualPrice: { type: 'number' },
        estimatedTime: { type: 'string' },
        note: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              totalPrice: { type: 'number' },
            },
          },
        },
        surveyImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['actualPrice', 'estimatedTime'],
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

  /** POST /provider/bookings/:id/supplementary-quotes — Thá»£ táº¡o bÃ¡o giÃ¡ phÃ¡t sinh */
  @Patch(':id/supplementary-quotes')
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

  /** PATCH /provider/bookings/:id/arrive — Thá»£ Ä‘Ã£ Ä‘áº¿n nÆ¡i */
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

