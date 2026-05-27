import api from '../../lib/axios';

export const notificationApi = {
  getUnread: () => api.get('/notifications/unread-count'),
  getAll: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
