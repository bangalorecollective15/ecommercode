"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Instagram } from "lucide-react";

interface InstagramFeedProps {
  instagramLinks: any[];
}

// Cap how many real embeds we ever process at once. Instagram's embed.js is
// heavy per-post (each blockquote pulls its own iframe/JS), so this bounds
// the cost even if the instagram_links table grows to 50+ rows over time.
const MAX_EMBEDS = 8;

export default function InstagramFeed({ instagramLinks = [] }: InstagramFeedProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const links = instagramLinks.slice(0, MAX_EMBEDS);

  // Only start loading Instagram's script + embeds once the section is
  // about to scroll into view, instead of on initial page load.
  useEffect(() => {
    if (!sectionRef.current || links.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } // start slightly before it's actually on screen, so it's ready by the time the user scrolls there
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [links.length]);

  useEffect(() => {
    if (scriptLoaded && typeof window !== "undefined" && (window as any).instgrm) {
      try {
        (window as any).instgrm.Embeds.process();
      } catch (err) {
        console.error("Instagram embed initialization error:", err);
      }
    }
  }, [scriptLoaded, links]);

  if (links.length === 0) return null;

  // Duplicate for the marquee loop only after slicing to MAX_EMBEDS, so the
  // duplication never doubles an unbounded list.
  const marqueeLinks = [...links, ...links];

  return (
    <section
      ref={sectionRef}
      className="w-full py-16 bg-white dark:bg-black border-t border-slate-100 dark:border-[#333] overflow-hidden transition-colors duration-300"
    >
      {isNearViewport && (
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="lazyOnload"
          onLoad={() => setScriptLoaded(true)}
        />
      )}

      <div className="text-center mb-14 space-y-3 px-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl shadow-lg">
            <Instagram className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors duration-300">
          The Social <span className="text-slate-300 dark:text-slate-600">Feed.</span>
        </h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium tracking-wide transition-colors duration-300">
          @bangalorecollectiveofficial
        </p>
      </div>

      <div className="relative group w-full overflow-hidden">
        {isNearViewport ? (
          <div className="marquee-container w-full overflow-hidden">
            <div className="animate-marquee flex flex-row flex-nowrap items-center gap-8 w-max">
              {marqueeLinks.map((link, idx) => (
                <div
                  key={`ig-${idx}`}
                  className="flex-shrink-0 w-[326px] min-h-[450px] rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#111] border border-slate-100 dark:border-[#333] shadow-xl transition-all duration-500 hover:scale-[1.02] relative group/card"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-20 cursor-pointer"
                    title="View on Instagram"
                  />
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={link.url}
                    data-instgrm-version="14"
                    style={{
                      background: "transparent",
                      border: "0",
                      margin: "0",
                      padding: "0",
                      width: "100%",
                      minWidth: "326px",
                    }}
                  >
                    <div className="block p-10 text-center text-xs text-slate-400 dark:text-gray-500 italic">
                      Loading Post...
                    </div>
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Lightweight placeholder shown until the section is near the viewport —
          // keeps layout stable without paying the Instagram script/embed cost yet.
          <div className="flex gap-8 overflow-hidden px-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[326px] h-[450px] rounded-[2.5rem] bg-slate-100 dark:bg-[#222] animate-pulse"
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .marquee-container {
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-50% - 1rem)); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}