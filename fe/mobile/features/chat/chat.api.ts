/**
 * Chat API — REST endpoints + socket helpers
 */
import api from '../../lib/axios';

export const chatApi = {
  /** GET /chats — Danh sách conversations */
  getConversations: () => api.get('/chats'),

  /** GET /chats/:id/messages — Lịch sử tin nhắn (cursor-based) */
  getMessages: (conversationId: number, cursor?: number) =>
    api.get(`/chats/${conversationId}/messages`, { params: cursor ? { cursor } : {} }),

  /** GET /chats/:id/smart-reply — Lấy gợi ý câu trả lời từ AI */
  getSmartReplies: (conversationId: number) =>
    api.get(`/chats/${conversationId}/smart-reply`),

  uploadChatImage: (file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chats/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
