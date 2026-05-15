/**
 * Notification API
 */
import api from '../../lib/axios';

export const notificationApi = {
  /** GET /notifications */
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/notifications', { params }),

  /** GET /notifications/unread-count */
  getUnreadCount: () => api.get('/notifications/unread-count'),

  /** PATCH /notifications/:id/read */
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),

  /** PATCH /notifications/read-all */
  markAllRead: () => api.patch('/notifications/read-all'),
};
