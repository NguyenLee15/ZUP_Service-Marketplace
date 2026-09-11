"use client";

import React from "react";

export function parseInlineStyles(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function ChatMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Bullet lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const itemContent = trimmed.substring(2);
          return (
            <div
              key={lineIdx}
              className="flex items-start gap-1.5 pl-1.5 py-0.5 text-sm"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span className="flex-1 text-slate-800">
                {parseInlineStyles(itemContent)}
              </span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const itemContent = numMatch[2];
          return (
            <div
              key={lineIdx}
              className="flex items-start gap-1.5 pl-1.5 py-0.5 text-sm"
            >
              <span className="font-semibold text-blue-600 shrink-0 text-xs mt-0.5">
                {num}.
              </span>
              <span className="flex-1 text-slate-800">
                {parseInlineStyles(itemContent)}
              </span>
            </div>
          );
        }

        // Standard text lines
        return (
          <p
            key={lineIdx}
            className="text-sm min-h-[1rem] leading-relaxed text-slate-800"
          >
            {parseInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

