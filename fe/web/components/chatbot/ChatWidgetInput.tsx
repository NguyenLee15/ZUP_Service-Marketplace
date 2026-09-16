"use client";

import React from "react";
import { Loader2, Send } from "lucide-react";

export interface ChatWidgetInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: (text: string) => void;
}

export function ChatWidgetInput({
  input,
  isLoading,
  onInputChange,
  onSendMessage,
}: ChatWidgetInputProps) {
  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="relative">
        <input
          type="text"
          name="chatbot-message"
          aria-label="Nhập tin nhắn cho trợ lý AI"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSendMessage(input);
          }}
          placeholder="Nhập nhu cầu, ví dụ: máy lạnh chảy nước…"
          disabled={isLoading}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => onSendMessage(input)}
          disabled={!input.trim() || isLoading}
          aria-label="Gửi tin nhắn"
          className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

