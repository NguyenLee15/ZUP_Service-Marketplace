import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, ...extra } = body;

    // 1. Lấy tin nhắn cuối cùng của user
    const lastUserMessage =
      [...(messages || [])]
        .reverse()
        .find((m: { role: string }) => m.role === "user")?.content || "";

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
        message: lastUserMessage,
        sessionId: extra.sessionId,
        pageContext: extra.pageContext,
        confirmedActionId: extra.confirmedActionId,
        history: (messages || [])
          .slice(-8)
          .map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
      }),
    });

    if (!prepareRes.ok) {
      const errorText = await prepareRes.text().catch(() => "Unknown error");
      console.error(`[chatbot/stream] prepare failed: ${prepareRes.status} ${errorText}`);
      return NextResponse.json(
        {
          data: {
            reply: "Hệ thống đang bận, bạn vui lòng thử lại sau giây lát.",
            services: [],
            quickReplies: [
              { label: "Thử lại", message: lastUserMessage },
            ],
          },
        },
        { status: 200 },
      );
    }

    const prepareData = await prepareRes.json();
    const ctx = prepareData.data;

    // 3. Nếu KHÔNG cần stream (intent đã xử lý xong ở BE) → trả JSON thường
    if (!ctx.needsAiStream) {
      return NextResponse.json({
        data: {
          reply: ctx.reply || "",
          sessionId: ctx.sessionId,
          services: ctx.services || [],
          quickReplies: ctx.quickReplies || [],
          action: ctx.action,
          confidence: ctx.confidence,
          citations: ctx.citations || [],
        },
      });
    }

    // 4. Cần AI stream → gọi Gemini qua Vercel AI SDK
    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: ctx.systemPrompt,
      messages: (messages || []).map(
        (m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
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
    return NextResponse.json(
      {
        data: {
          reply:
            "Tôi đang gặp sự cố kỹ thuật. Bạn vui lòng thử lại sau giây lát.",
          services: [],
          quickReplies: [],
        },
      },
      { status: 200 },
    );
  }
}
