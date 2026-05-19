import { NextRequest } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";

export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const FALLBACK_REPLY =
  "Tôi đang gặp sự cố kỹ thuật. Bạn vui lòng thử lại sau giây lát.";

type ChatbotMeta = {
  sessionId?: string;
  services?: unknown[];
  quickReplies?: unknown[];
  action?: unknown;
  citations?: unknown[];
  confidence?: number;
};

type ChatbotPrepareContext = ChatbotMeta & {
  needsAiStream?: boolean;
  systemPrompt?: string;
  reply?: string;
};

type ChatMessage = {
  role?: string;
  content?: unknown;
  parts?: Array<{ type?: string; text?: unknown }>;
};

type PersistStreamInput = {
  auth?: string | null;
  ctx?: ChatbotPrepareContext;
  userMessage: string;
  assistantMessage: string;
};

function getText(msg: ChatMessage): string {
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text as string)
      .join("");
  }
  return "";
}

function buildMetadata(ctx?: ChatbotPrepareContext) {
  return {
    sessionId: ctx?.sessionId || "",
    services: ctx?.services || [],
    quickReplies: ctx?.quickReplies || [],
    action: ctx?.action,
  };
}

async function persistStreamResult({
  auth,
  ctx,
  userMessage,
  assistantMessage,
}: PersistStreamInput) {
  if (!auth || !ctx?.sessionId || !assistantMessage.trim()) return;

  try {
    const response = await fetch(`${BACKEND_URL}/chatbot/stream-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({
        sessionId: ctx.sessionId,
        userMessage,
        assistantMessage,
        services: ctx.services || [],
        quickReplies: ctx.quickReplies || [],
        action: ctx.action,
        citations: ctx.citations || [],
        confidence: ctx.confidence,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[chatbot/stream] persist failed: ${response.status} ${errorText}`,
      );
    }
  } catch (error) {
    console.error("[chatbot/stream] persist error:", error);
  }
}

function createTextOnlyResponse(
  text: string,
  ctx?: ChatbotPrepareContext,
  persist?: Omit<PersistStreamInput, "assistantMessage">,
) {
  const textId = "fallback";
  const assistantMessage = text || FALLBACK_REPLY;

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({
          type: "message-metadata",
          messageMetadata: buildMetadata(ctx),
        });
        writer.write({ type: "text-start", id: textId });
        writer.write({
          type: "text-delta",
          delta: assistantMessage,
          id: textId,
        });
        writer.write({ type: "text-end", id: textId });

        if (persist) {
          await persistStreamResult({
            ...persist,
            assistantMessage,
          });
        }
      },
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages)
      ? (body.messages as ChatMessage[])
      : [];
    const { sessionId, pageContext, confirmedActionId } = body;

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    const userText = lastUserMessage ? getText(lastUserMessage) : "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;

    const prepareRes = await fetch(`${BACKEND_URL}/chatbot/prepare`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: userText,
        sessionId,
        pageContext,
        confirmedActionId,
        history: messages.slice(-8).map((message) => ({
          role: message.role,
          content: getText(message),
        })),
      }),
    });

    if (!prepareRes.ok) {
      const errorText = await prepareRes.text().catch(() => "Unknown error");
      console.error(
        `[chatbot/stream] prepare failed: ${prepareRes.status} ${errorText}`,
      );
      return createTextOnlyResponse(
        "Hệ thống đang bận, bạn vui lòng thử lại sau giây lát.",
      );
    }

    const prepareData = await prepareRes.json();
    const ctx = prepareData.data as ChatbotPrepareContext;

    if (!ctx.needsAiStream) {
      return createTextOnlyResponse(ctx.reply || "", ctx);
    }

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";
    if (!apiKey) {
      return createTextOnlyResponse(FALLBACK_REPLY, ctx, {
        auth,
        ctx,
        userMessage: userText,
      });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
    const result = streamText({
      model: google(modelName),
      system: ctx.systemPrompt,
      messages: messages
        .filter(
          (message) =>
            message.role === "user" || message.role === "assistant",
        )
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: getText(message),
        }))
        .filter((message) => message.content.trim()),
    });

    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: async ({ writer }) => {
          const textId = "ai-stream";
          let assistantMessage = "";

          writer.write({
            type: "message-metadata",
            messageMetadata: buildMetadata(ctx),
          });
          writer.write({ type: "text-start", id: textId });

          const reader = result.textStream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              assistantMessage += value;
              writer.write({ type: "text-delta", delta: value, id: textId });
            }
          } catch (error) {
            console.error("[chatbot/stream] ai stream error:", error);
            if (!assistantMessage.trim()) {
              assistantMessage = FALLBACK_REPLY;
              writer.write({
                type: "text-delta",
                delta: assistantMessage,
                id: textId,
              });
            }
          } finally {
            reader.releaseLock();
            writer.write({ type: "text-end", id: textId });
          }

          await persistStreamResult({
            auth,
            ctx,
            userMessage: userText,
            assistantMessage,
          });
        },
      }),
    });
  } catch (error) {
    console.error("[chatbot/stream] error:", error);
    return createTextOnlyResponse(FALLBACK_REPLY);
  }
}
