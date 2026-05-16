import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  // Helper tạo mock stream response cho Vercel AI SDK (protocol: 0:"text"\n)
  const createMockStreamResponse = (reply: string, metadata: any) => {
    const chunk = `0:${JSON.stringify(reply)}\n`;
    return new Response(chunk, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-SessionId": metadata.sessionId || "",
        "X-Chat-Metadata": encodeURIComponent(
          JSON.stringify({
            services: metadata.services || [],
            quickReplies: metadata.quickReplies || [],
            action: metadata.action,
            confidence: metadata.confidence,
            citations: metadata.citations || [],
          })
        ),
      },
    });
  };

  try {
    const body = await req.json();
    const { messages, ...extra } = body;

    // Helper: trích xuất text từ message (hỗ trợ cả v5 content và v6 parts)
    const getText = (msg: any) => {
      if (msg.content) return msg.content;
      if (msg.parts && Array.isArray(msg.parts)) {
        return msg.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
      }
      return "";
    };

    // 1. Lấy tin nhắn cuối cùng của user
    const lastUserMessage =
      [...(messages || [])]
        .reverse()
        .find((m: { role: string }) => m.role === "user");
    
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
        history: (messages || [])
          .slice(-8)
          .map((m: any) => ({
            role: m.role,
            content: getText(m),
          })),
      }),
    });

    if (!prepareRes.ok) {
      const errorText = await prepareRes.text().catch(() => "Unknown error");
      console.error(`[chatbot/stream] prepare failed: ${prepareRes.status} ${errorText}`);
      return createMockStreamResponse(
        "Hệ thống đang bận, bạn vui lòng thử lại sau giây lát.",
        {
          quickReplies: [{ label: "Thử lại", message: userText }],
        }
      );
    }

    const prepareData = await prepareRes.json();
    const ctx = prepareData.data;

    // 3. Nếu KHÔNG cần stream (intent đã xử lý xong ở BE) → trả JSON thường
    if (!ctx.needsAiStream) {
      return createMockStreamResponse(ctx.reply || "", ctx);
    }

    // 4. Cần AI stream → gọi Gemini qua Vercel AI SDK
    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: ctx.systemPrompt,
      messages: (messages || []).map(
        (m: any) => ({
          role: m.role as "user" | "assistant",
          content: getText(m),
        }),
      ),
    });

    // 5. Tạo data stream response với metadata
    const response = result.toTextStreamResponse({
      headers: {
        "X-Chat-SessionId": ctx.sessionId || "",
        "X-Chat-Metadata": encodeURIComponent(
          JSON.stringify({
            services: ctx.services || [],
            quickReplies: ctx.quickReplies || [],
            action: ctx.action,
            confidence: ctx.confidence,
            citations: ctx.citations || [],
          }),
        ),
      },
    });

    return response;
  } catch (error) {
    console.error("[chatbot/stream] error:", error);
    return createMockStreamResponse(
      "Tôi đang gặp sự cố kỹ thuật. Bạn vui lòng thử lại sau giây lát.",
      {}
    );
  }
}
