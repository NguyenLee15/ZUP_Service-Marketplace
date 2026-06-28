import api from '@/lib/axios';

export const chatApi = {
  getConversations: () =>
    api.get('/chats'),

  getMessages: (conversationId: number, params?: Record<string, unknown>) =>
    api.get(`/chats/${conversationId}/messages`, { params }),

  getOrCreateConversation: (data: { bookingId?: number; serviceId?: number }) =>
    api.post('/chats/conversations', data),

  recallMessage: (messageId: number) =>
    api.patch(`/chats/messages/${messageId}/recall`),

  uploadChatImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chats/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
