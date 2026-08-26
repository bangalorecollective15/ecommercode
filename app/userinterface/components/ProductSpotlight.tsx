"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";
import ProductCard from "@/app/userinterface/components/ProductCard";

interface ProductSpotlightProps {
  latestProducts: any[];
  userId: string | null;
}

export default function ProductSpotlight({ latestProducts, userId }: ProductSpotlightProps) {
  return (
    <section className="max-w-full mx-auto py-4 bg-[#ffffff] dark:bg-black overflow-hidden transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between mb-2 mt-6 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1.5px] bg-brand-gold"></div>
            <span className="text-brand-gold text-[10px] md:text-[11px] font-black tracking-[0.5em] uppercase">
              Curated For You
            </span>
          </div>
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-black tracking-tighter text-brand-blue dark:text-white uppercase leading-[0.85] flex flex-col transition-colors duration-300">
            <span className="block">Spotlight</span>
            <span
              className="text-transparent font-normal italic tracking-wide lowercase normal-case pt-2"
              style={{
                WebkitTextStroke: "1.2px currentColor",
                fontFamily: '"Playfair Display", "Georgia", serif',
                textTransform: "none",
              }}
            >
              Edit.
            </span>
          </h2>
        </div>

        <Link
          href="/userinterface/Gproducts"
          className="group flex items-center gap-4 text-[10px] md:text-[11px] font-black tracking-[0.3em] text-brand-blue dark:text-white uppercase transition-all self-start md:self-auto"
        >
          <span className="border-b-2 border-brand-gold/60 pb-1 group-hover:border-brand-blue dark:group-hover:border-white transition-colors duration-300">
            Shop The Drop
          </span>
          <div className="w-10 h-10 rounded-full border border-slate-200/80 dark:border-[#333] flex items-center justify-center bg-white dark:bg-[#111] group-hover:bg-brand-blue group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black group-hover:border-brand-blue dark:group-hover:border-white transition-all duration-300 shadow-sm">
            <MoveRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </Link>
      </div>

      <div className="relative flex group">
        <div className="flex animate-marquee whitespace-nowrap gap-4 py-10">
          {[...latestProducts, ...latestProducts].map((p, idx) => (
            <div key={`${p.id}-${idx}`} className="relative w-[280px] md:w-[300px] shrink-0 group/card">
              <span className="absolute -top-4 left-6 text-[40px] font-black text-slate-100 dark:text-[#222] group-hover/card:text-brand-gold/20 transition-colors z-0">
                0{(idx % latestProducts.length) + 1}
              </span>
              <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none">
                {p.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 bg-brand-blue/90 dark:bg-brand-gold/90 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.3em] text-white dark:text-black rounded-full inline-block w-fit shadow-lg border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="group/card relative transition-all duration-700">
                <ProductCard product={p} userId={userId} />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-blue/5 dark:from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none rounded-[1.5rem]" />
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/40 to-transparent dark:from-black dark:via-black/40 z-20 transition-colors duration-300" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/40 to-transparent dark:from-black dark:via-black/40 z-20 transition-colors duration-300" />
      </div>
    </section>
  );
}