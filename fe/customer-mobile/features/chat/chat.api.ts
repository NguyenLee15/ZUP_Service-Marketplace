import api from '../../lib/axios';

export const chatApi = {
  getConversations: () => api.get('/chats'),
  getOrCreateConversation: (data: { serviceId?: number; bookingId?: number }) =>
    api.post('/chats/conversations', data),
  getMessages: (conversationId: number, cursor?: number) =>
    api.get(`/chats/${conversationId}/messages`, { params: cursor ? { cursor } : {} }),
  getSmartReplies: (conversationId: number) => api.get(`/chats/${conversationId}/smart-reply`),
  recallMessage: (messageId: number) => api.patch(`/chats/messages/${messageId}/recall`),
};
