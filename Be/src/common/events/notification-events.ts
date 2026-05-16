/**
 * Notification event constants and payload types.
 * Shared contract giữa producers (BookingsService, processors...)
 * và consumer (NotificationListener).
 */
export const NOTIFICATION_EVENTS = {
  /** Gửi notification cho 1 user — persist DB + push WebSocket */
  SEND: 'notification.send',
} as const;

export interface NotificationEventPayload {
  userId: number;
  type: string;
  title: string;
  content: string;
  referenceId?: number;
}
