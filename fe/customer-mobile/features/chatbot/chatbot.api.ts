import api from "../../lib/axios";

export type ChatbotAskPayload = {
  message?: string;
  sessionId?: string;
  history?: Array<{ role: string; content: string }>;
  pageContext?: Record<string, unknown>;
  confirmedActionId?: string;
};

export const chatbotApi = {
  ask: (
    payloadOrMessage: ChatbotAskPayload | string,
    pageContext?: Record<string, unknown>,
  ) => {
    const payload =
      typeof payloadOrMessage === "string"
        ? { message: payloadOrMessage, pageContext }
        : payloadOrMessage;
    return api.post("/chatbot/ask", payload);
  },
  prepare: (payloadOrContext?: ChatbotAskPayload | Record<string, unknown>) => {
    const payload =
      payloadOrContext &&
      ("message" in payloadOrContext || "sessionId" in payloadOrContext)
        ? payloadOrContext
        : { pageContext: payloadOrContext };
    return api.post("/chatbot/prepare", payload);
  },
  getSessions: () => api.get("/chatbot/sessions"),
  getSessionMessages: (id: string) =>
    api.get(`/chatbot/sessions/${id}/messages`),
  updateSessionTitle: (id: string, title: string) =>
    api.patch(`/chatbot/sessions/${id}/title`, { title }),
  deleteSession: (id: string) => api.delete(`/chatbot/sessions/${id}`),
};
