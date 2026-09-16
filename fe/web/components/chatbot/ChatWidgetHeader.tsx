"use client";

import React from "react";
import { Bot, Check, Loader2, Pencil, X } from "lucide-react";

export interface ChatWidgetHeaderProps {
  sessionTitle: string;
  editingTitle: boolean;
  titleInput: string;
  titleSaving: boolean;
  sessionId: string | null;
  accessToken: string | null;
  isLoading: boolean;
  onStartEditingTitle: () => void;
  onTitleInputChange: (value: string) => void;
  onSaveSessionTitle: () => void;
  onCancelEditingTitle: () => void;
  onClose: () => void;
}

export function ChatWidgetHeader({
  sessionTitle,
  editingTitle,
  titleInput,
  titleSaving,
  sessionId,
  accessToken,
  isLoading,
  onStartEditingTitle,
  onTitleInputChange,
  onSaveSessionTitle,
  onCancelEditingTitle,
  onClose,
}: ChatWidgetHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            {editingTitle ? (
              <div className="flex min-w-0 items-center gap-1">
                <input
                  value={titleInput}
                  onChange={(event) =>
                    onTitleInputChange(event.target.value.slice(0, 120))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSaveSessionTitle();
                    if (event.key === "Escape") onCancelEditingTitle();
                  }}
                  autoFocus
                  className="h-7 min-w-0 rounded-md border border-slate-200 px-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={onSaveSessionTitle}
                  disabled={titleSaving || !titleInput.trim()}
                  aria-label="Lưu tên phiên chat"
                  className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                >
                  {titleSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-1">
                <h3 className="truncate text-sm font-semibold text-slate-950">
                  {sessionTitle}
                </h3>
                {sessionId && accessToken && (
                  <button
                    type="button"
                    onClick={onStartEditingTitle}
                    aria-label="Đổi tên phiên chat"
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isLoading
                ? "Đang suy nghĩ…"
                : "Tìm dịch vụ, đặt lịch, tra cứu đơn"}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Đóng trợ lý AI"
          className="rounded-lg p-2 text-slate-500 transition-[background-color,color] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

