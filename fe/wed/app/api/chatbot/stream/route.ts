import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
import {
  streamText,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";

export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/** Trích xuất text từ message (hỗ trợ cả v5 content và v6 parts) */
function getText(msg: any): string {
  if (typeof msg.content === "string") return msg.content;
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }
  return "";
}

/** Tạo UIMessageStream response cho trường hợp không cần AI streaming */
function createTextOnlyResponse(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: "text-delta", delta: text, id: "fallback" });
      },
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, ...extra } = body;

    // 1. Lấy tin nhắn cuối cùng của user
    const lastUserMessage = [...(messages || [])]
      .reverse()
      .find((m: any) => m.role === "user");
    const userText = lastUserMessage ? getText(lastUserMessage) : "";

    // 2. Gọi NestJS Backend để xử lý logic nghiệp vụ
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    const prepareRes = await fetch(`${BACKEND_URL}/chatbot/prepare`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: userText,
        sessionId: extra.sessionId,
        pageContext: extra.pageContext,
        confirmedActionId: extra.confirmedActionId,
        history: (messages || []).slice(-8).map((m: any) => ({
          role: m.role,
          content: getText(m),
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
    const ctx = prepareData.data;

    // 3. Nếu KHÔNG cần stream (intent đã xử lý xong ở BE) → trả UIMessageStream với text có sẵn
    if (!ctx.needsAiStream) {
      return createTextOnlyResponse(ctx.reply || "");
    }

    // 4. Cần AI stream → gọi Gemini qua Vercel AI SDK
    const modelName = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
    const result = streamText({
      model: google(modelName),
      system: ctx.systemPrompt,
      messages: (messages || []).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: getText(m),
      })),
    });

    // 5. Trả UIMessageStreamResponse (chuẩn v6 cho DefaultChatTransport)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[chatbot/stream] error:", error);
    return createTextOnlyResponse(
      "Tôi đang gặp sự cố kỹ thuật. Bạn vui lòng thử lại sau giây lát.",
    );
  }
}
