import { type UIMessage } from "ai";
import { z } from "zod/v4";

export const chatServiceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  referencePrice: z.number(),
  providerId: z.number(),
  providerName: z.string(),
  avgRating: z.number(),
  totalReviews: z.number(),
  categoryName: z.string(),
  imageUrl: z.string().optional(),
  distanceKm: z.number().optional(),
  providerAddress: z.string().optional(),
});

export const quickReplySchema = z.object({
  label: z.string(),
  message: z.string(),
});

export const assistantActionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "CREATE_BOOKING_DRAFT",
    "CONFIRM_CREATE_BOOKING",
    "OPEN_PROVIDER_CHAT",
    "VIEW_BOOKING",
    "REBOOK",
    "CANCEL_BOOKING_DRAFT",
  ]),
  label: z.string(),
  summary: z.string(),
  payload: z.record(z.string(), z.unknown()),
  requiresConfirmation: z.boolean(),
  href: z.string().optional(),
});

export const chatbotMessageMetaSchema = z.object({
  sessionId: z.string().optional(),
  services: z.array(chatServiceSchema).optional(),
  quickReplies: z.array(quickReplySchema).optional(),
  action: assistantActionSchema.optional(),
});

export type ChatService = z.infer<typeof chatServiceSchema>;
export type QuickReply = z.infer<typeof quickReplySchema>;
export type AssistantAction = z.infer<typeof assistantActionSchema>;
export type ChatbotMessageMeta = z.infer<typeof chatbotMessageMetaSchema>;
export type ChatbotUIMessage = UIMessage<ChatbotMessageMeta>;

/** Extract text content from a UIMessage (v6 parts-based) */
export function getMessageText(msg: ChatbotUIMessage): string {
  if (msg.parts && msg.parts.length > 0) {
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

