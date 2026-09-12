'use client';

import { useState } from 'react';
import { Facebook, Linkedin, Link2, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function SocialShareWidget() {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window === 'undefined' ? '/' : window.location.origin;
  const shareTitle = 'ZUP - Đặt dịch vụ tại nhà rõ ràng hơn';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Đã sao chép liên kết chia sẻ!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép liên kết.');
    }
  };

  return (
    <div className="w-full shrink-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:max-w-xs xl:max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-sky-400" />
        <div className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Chia sẻ ZUP</div>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        Giúp bạn bè và gia đình tìm dịch vụ tại nhà với thông tin rõ ràng hơn.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition-all duration-300 hover:bg-sky-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
          aria-label="Chia sẻ lên Facebook"
        >
          <Facebook className="w-3.5 h-3.5" />
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          aria-label="Chia sẻ lên Twitter/X"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Twitter
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition-all duration-300 hover:bg-sky-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
          aria-label="Chia sẻ lên LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5" />
          LinkedIn
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          aria-label="Sao chép liên kết"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
        </button>
      </div>
    </div>
  );
}
