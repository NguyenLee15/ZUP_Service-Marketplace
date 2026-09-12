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
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl shadow-lg shadow-sky-950/20 w-full md:max-w-xs xl:max-w-md shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-sky-400" />
        <div className="text-sm font-bold uppercase tracking-widest text-slate-300">Chia sẻ ZUP</div>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        Giúp bạn bè và gia đình tìm dịch vụ tại nhà với thông tin rõ ràng hơn.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-600/15 border border-sky-500/20 px-3 text-xs font-semibold text-cyan-300 hover:bg-sky-600 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="Chia sẻ lên Facebook"
        >
          <Facebook className="w-3.5 h-3.5" />
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-800/80 border border-slate-700/50 px-3 text-xs font-semibold text-slate-200 hover:bg-white hover:text-slate-950 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700/15 border border-blue-600/20 px-3 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Chia sẻ lên LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5" />
          LinkedIn
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-800/80 border border-slate-700/50 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue cursor-pointer"
          aria-label="Sao chép liên kết"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
        </button>
      </div>
    </div>
  );
}
