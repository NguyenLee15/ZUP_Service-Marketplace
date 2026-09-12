export type CustomerBookingDetail = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  description?: string | null;
  desiredTime?: string | Date | null;
  addressDetail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  quoteAmount?: number | string | null;
  actualPrice?: number | string | null;
  estimatedTime?: string | null;
  quoteNote?: string | null;
  note?: string | null;
  disputeReason?: string | null;
  providerAcceptedAt?: string | Date | null;
  provider?: { id?: number | string; fullName?: string | null; phone?: string | null } | null;
  service?: { id?: number | string; name?: string | null } | null;
};

export type CustomerBookingTimelineItem = {
  id?: number | string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt?: string | Date | null;
  changedBy?: number | null;
};
