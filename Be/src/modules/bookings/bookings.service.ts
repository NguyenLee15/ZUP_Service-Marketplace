import { Injectable } from '@nestjs/common';
import { BookingDisputeService } from './booking-dispute.service';
import { BookingLifecycleService } from './booking-lifecycle.service';
import { BookingQueryService } from './booking-query.service';
import { BookingTimeoutService } from './booking-timeout.service';
import {
  ProviderDashboardFilters,
  ProviderDashboardService,
} from './provider-dashboard.service';
import {
  CancelBookingDto,
  ConfirmSurveyorDto,
  CreateBookingDto,
  DisputeDto,
  RejectQuoteDto,
  ResolveDisputeDto,
  SendQuoteDto,
} from './dto/bookings.dto';

export type { ProviderDashboardFilters } from './provider-dashboard.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly lifecycle: BookingLifecycleService,
    private readonly dispute: BookingDisputeService,
    private readonly query: BookingQueryService,
    private readonly dashboard: ProviderDashboardService,
    private readonly timeout: BookingTimeoutService,
  ) {}

  create(customerId: number, dto: CreateBookingDto) {
    return this.lifecycle.create(customerId, dto);
  }

  acceptByProvider(providerId: number, bookingId: number) {
    return this.lifecycle.acceptByProvider(providerId, bookingId);
  }

  declineByProvider(
    providerId: number,
    bookingId: number,
    dto?: CancelBookingDto,
  ) {
    return this.lifecycle.declineByProvider(providerId, bookingId, dto);
  }

  confirmSurveyor(
    providerId: number,
    bookingId: number,
    dto: ConfirmSurveyorDto,
  ) {
    return this.lifecycle.confirmSurveyor(providerId, bookingId, dto);
  }

  sendQuote(
    providerId: number,
    bookingId: number,
    dto: SendQuoteDto,
    files?: Express.Multer.File[],
  ) {
    return this.lifecycle.sendQuote(providerId, bookingId, dto, files);
  }

  customerConfirmQuote(customerId: number, bookingId: number) {
    return this.lifecycle.customerConfirmQuote(customerId, bookingId);
  }

  customerRejectQuote(
    customerId: number,
    bookingId: number,
    dto: RejectQuoteDto,
  ) {
    return this.lifecycle.customerRejectQuote(customerId, bookingId, dto);
  }

  startWork(providerId: number, bookingId: number) {
    return this.lifecycle.startWork(providerId, bookingId);
  }

  completeWork(
    providerId: number,
    bookingId: number,
    files: Express.Multer.File[],
  ) {
    return this.lifecycle.completeWork(providerId, bookingId, files);
  }

  customerAccept(customerId: number, bookingId: number) {
    return this.lifecycle.customerAccept(customerId, bookingId);
  }

  cancelByProvider(
    providerId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    return this.lifecycle.cancelByProvider(providerId, bookingId, dto);
  }

  cancelByCustomer(
    customerId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    return this.lifecycle.cancelByCustomer(customerId, bookingId, dto);
  }

  cancelByAdmin(adminId: number, bookingId: number, dto: CancelBookingDto) {
    return this.lifecycle.cancelByAdmin(adminId, bookingId, dto);
  }

  rebook(customerId: number, oldBookingId: number) {
    return this.lifecycle.rebook(customerId, oldBookingId);
  }

  customerDispute(
    customerId: number,
    bookingId: number,
    dto: DisputeDto,
    files?: Express.Multer.File[],
  ) {
    return this.dispute.customerDispute(customerId, bookingId, dto, files);
  }

  resolveDispute(
    adminId: number,
    disputeId: number,
    dto: ResolveDisputeDto,
    ipAddress?: string,
  ) {
    return this.dispute.resolveDispute(adminId, disputeId, dto, ipAddress);
  }

  getById(bookingId: number, userId: number) {
    return this.query.getById(bookingId, userId);
  }

  getMyBookings(
    userId: number,
    role: 'customer' | 'provider',
    status?: string,
    page = 1,
    limit = 20,
  ) {
    return this.query.getMyBookings(userId, role, status, page, limit);
  }

  getProviderStats(providerId: number, filters: ProviderDashboardFilters = {}) {
    return this.dashboard.getProviderStats(providerId, filters);
  }

  exportProviderPdf(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    return this.dashboard.exportProviderPdf(providerId, filters);
  }

  exportProviderExcel(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    return this.dashboard.exportProviderExcel(providerId, filters);
  }

  expirePendingProviderAcceptances() {
    return this.timeout.expirePendingProviderAcceptances();
  }

  expireProviderAcceptance(bookingId: number) {
    return this.timeout.expireProviderAcceptance(bookingId);
  }
}
