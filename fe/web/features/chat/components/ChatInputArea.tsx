'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Send, X } from 'lucide-react';

interface ChatInputAreaProps {
  selectedFilePreview: string | null;
  setSelectedFile: (file: File | null) => void;
  setSelectedFilePreview: (preview: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
  handleTypingEvent: () => void;
  handleSendMessage: (e: React.FormEvent) => void;
  selectedFile: File | null;
}

export function ChatInputArea({
  selectedFilePreview,
  setSelectedFile,
  setSelectedFilePreview,
  fileInputRef,
  handleFileChange,
  inputValue,
  setInputValue,
  handleTypingEvent,
  handleSendMessage,
  selectedFile,
}: ChatInputAreaProps) {
  return (
    <div className="bg-card border-t border-action-blue/10 px-4 md:px-6 py-4 flex flex-col">
      {selectedFilePreview && (
        <div className="mb-3 relative inline-block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedFilePreview}
            alt="preview"
            className="h-20 w-auto rounded-lg object-cover border border-outline-variant shadow-sm"
          />
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              URL.revokeObjectURL(selectedFilePreview);
              setSelectedFilePreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow-sm border border-outline-variant hover:bg-gray-100 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <form id="chat-form" onSubmit={handleSendMessage} className="flex gap-3 items-end">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-action-blue hover:bg-action-blue/10"
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handleTypingEvent();
          }}
          placeholder="Nhập tin nhắn…"
          aria-label="Nhập tin nhắn"
          name="message"
          autoComplete="off"
          className="flex-1 px-4 py-2.5 glass-panel text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-action-blue focus:border-action-blue/30 min-h-[44px]"
        />
        <Button
          type="submit"
          aria-label="Gửi tin nhắn"
          disabled={!inputValue.trim() && !selectedFile}
          className="bg-gradient-to-r from-action-blue to-glacier-blue hover:from-glacier-blue hover:to-action-blue text-white rounded-full w-11 h-11 p-0 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(0,107,255,0.3)] transition-all mb-0"
        >
          <Send className="w-4 h-4 ml-[-2px]" />
        </Button>
      </form>
    </div>
  );
}

