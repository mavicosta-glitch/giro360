"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/noticia/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleNativeShare = async () => {
    const url = `${window.location.origin}/noticia/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled share sheet
      }
    } else {
      await handleCopy();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#123B50]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#263746] transition hover:border-[#123B50] hover:bg-[#EAF0F2] hover:text-[#123B50]"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Compartilhar
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#123B50]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#263746] transition hover:border-[#123B50] hover:bg-[#EAF0F2] hover:text-[#123B50]"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-[#123B50]" aria-hidden="true" />
            Link copiado
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Copiar URL
          </>
        )}
      </button>
    </div>
  );
}

