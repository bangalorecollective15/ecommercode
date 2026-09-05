"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import toast from "react-hot-toast";

interface ShareButtonProps {
  /** The canonical https URL to share (works as the website AND the deep-link target). */
  url: string;
  title?: string;
  text?: string;
  /**
   * "icon"   – small circular icon button (used in cards, tight spaces)
   * "square" – bordered square button, stretches to match sibling height
   *            (used next to "Add to Bag")
   * "full"   – full pill button with label
   */
  variant?: "icon" | "square" | "full";
  className?: string;
}

/**
 * Tries, in order:
 *  1. Capacitor native Share sheet (when running inside the app shell)
 *  2. Web Share API (mobile browsers)
 *  3. Returns false so the caller can fall back to clipboard copy
 */
async function nativeShare(payload: { title?: string; text?: string; url: string }) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
        dialogTitle: "Share this product",
      });
      return true;
    }
  } catch {
    // @capacitor/share not installed, or not running natively — fall through.
  }

  if (typeof navigator !== "undefined" && (navigator as any).share) {
    await (navigator as any).share(payload);
    return true;
  }

  return false;
}

export default function ShareButton({
  url,
  title = "Check this out",
  text = "",
  variant = "icon",
  className = "",
}: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || !url) return;

    setLoading(true);
    try {
      const shared = await nativeShare({ title, text, url });
      if (!shared) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      // AbortError just means the user closed the native share sheet.
      if (err?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard");
        } catch {
          toast.error("Couldn't share this link");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const Icon = copied ? Check : Share2;

  if (variant === "full") {
    return (
      <button
        onClick={handleShare}
        disabled={loading}
        className={`flex items-center justify-center gap-2 border-2 border-brand-blue dark:border-white text-brand-blue dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-blue dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300 disabled:opacity-40 py-4 ${className}`}
      >
        <Icon size={16} />
        Share
      </button>
    );
  }

  if (variant === "square") {
    return (
      <button
        onClick={handleShare}
        disabled={loading}
        aria-label="Share"
        className={`w-12 flex-shrink-0 flex items-center justify-center border-2 border-brand-blue dark:border-white text-brand-blue dark:text-white rounded-xl hover:bg-brand-blue dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300 disabled:opacity-40 ${className}`}
      >
        <Icon size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      aria-label="Share"
      className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#222] transition-colors duration-300 ${className}`}
    >
      <Icon size={16} className={copied ? "text-green-500" : "text-slate-400 dark:text-gray-500"} />
    </button>
  );
}