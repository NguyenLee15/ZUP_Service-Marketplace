import { Injectable } from '@nestjs/common';
import { BookingCreationService } from './booking-creation.service';
import { BookingQuotationService } from './booking-quotation.service';
import { BookingExecutionService } from './booking-execution.service';
import { BookingCancellationService } from './booking-cancellation.service';
import {
  CancelBookingDto,
  ConfirmSurveyorDto,
  CreateBookingDto,
  RejectQuoteDto,
  SendQuoteDto,
  SendSupplementaryQuoteDto,
} from './dto/bookings.dto';

/**
 * BookingLifecycleService (Facade Pattern)
 * Orchestrates four single-responsibility domain services:
 * 1. BookingCreationService: Creation, surveyor assignment, rebooking
 * 2. BookingQuotationService: Primary and supplementary quotes
 * 3. BookingExecutionService: Arrival, execution, completion, acceptance
 * 4. BookingCancellationService: Cancellation flows across roles
 */
@Injectable()
export class BookingLifecycleService {
  constructor(
    private readonly creationService: BookingCreationService,
    private readonly quotationService: BookingQuotationService,
    private readonly executionService: BookingExecutionService,
    private readonly cancellationService: BookingCancellationService,
  ) {}

  create(customerId: number, dto: CreateBookingDto) {
    return this.creationService.create(customerId, dto);
  }

  acceptByProvider(providerId: number, bookingId: number) {
    return this.creationService.acceptByProvider(providerId, bookingId);
  }

  declineByProvider(
    providerId: number,
    bookingId: number,
    dto?: CancelBookingDto | { reason?: string },
  ) {
    return this.creationService.declineByProvider(providerId, bookingId, dto);
  }

  confirmSurveyor(
    providerId: number,
    bookingId: number,
    dto: ConfirmSurveyorDto,
  ) {
    return this.creationService.confirmSurveyor(providerId, bookingId, dto);
  }

  rebook(customerId: number, oldBookingId: number) {
    return this.creationService.rebook(customerId, oldBookingId);
  }

  sendQuote(
    providerId: number,
    bookingId: number,
    dto: SendQuoteDto,
    surveyFiles?: Express.Multer.File[],
  ) {
    return this.quotationService.sendQuote(
      providerId,
      bookingId,
      dto,
      surveyFiles,
    );
  }

  customerConfirmQuote(customerId: number, bookingId: number) {
    return this.quotationService.customerConfirmQuote(customerId, bookingId);
  }

  customerRejectQuote(
    customerId: number,
    bookingId: number,
    dto: RejectQuoteDto,
  ) {
    return this.quotationService.customerRejectQuote(
      customerId,
      bookingId,
      dto,
    );
  }

  providerSendSupplementaryQuote(
    providerId: number,
    bookingId: number,
    dto: SendSupplementaryQuoteDto,
  ) {
    return this.quotationService.providerSendSupplementaryQuote(
      providerId,
      bookingId,
      dto,
    );
  }

  customerReplySupplementaryQuote(
    customerId: number,
    bookingId: number,
    quoteId: number,
    accept: boolean,
    reason?: string,
  ) {
    return this.quotationService.customerReplySupplementaryQuote(
      customerId,
      bookingId,
      quoteId,
      accept,
      reason,
    );
  }

  arriveAtLocation(providerId: number, bookingId: number) {
    return this.executionService.arriveAtLocation(providerId, bookingId);
  }

  startWork(providerId: number, bookingId: number) {
    return this.executionService.startWork(providerId, bookingId);
  }

  completeWork(
    providerId: number,
    bookingId: number,
    resultFiles?: Express.Multer.File[],
  ) {
    return this.executionService.completeWork(
      providerId,
      bookingId,
      resultFiles,
    );
  }

  customerAccept(customerId: number, bookingId: number) {
    return this.executionService.customerAccept(customerId, bookingId);
  }

  cancelByProvider(
    providerId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    return this.cancellationService.cancelByProvider(
      providerId,
      bookingId,
      dto,
    );
  }

  cancelByCustomer(
    customerId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    return this.cancellationService.cancelByCustomer(
      customerId,
      bookingId,
      dto,
    );
  }

  cancelByAdmin(adminId: number, bookingId: number, dto: CancelBookingDto) {
    return this.cancellationService.cancelByAdmin(adminId, bookingId, dto);
  }
}
