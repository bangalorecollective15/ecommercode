import { Sparkles, ShoppingBag } from "lucide-react";

interface ShopHeaderProps {
  type: string;
  displayName: string;
  resultCount: number;
}

export default function ShopHeader({ type, displayName, resultCount }: ShopHeaderProps) {
  return (
    <header className="mb-12 text-center">
      <div className="inline-flex items-center gap-3 mb-6 px-5 py-2 bg-white/60 dark:bg-[#111]/60 backdrop-blur-md border border-white dark:border-[#333] rounded-full shadow-sm transition-colors duration-300">
        <Sparkles className="text-brand-gold" size={14} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-gray-400">
          Exploring {type.replace("_", " ")}
        </span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-brand-blue dark:text-white leading-none transition-colors duration-300">
          {displayName}
          <span className="text-brand-gold">.</span>
        </h1>
      </div>

      <div className="mt-10 inline-flex items-center gap-3 px-6 py-3 bg-brand-blue dark:bg-[#111] text-white rounded-full shadow-xl transition-colors duration-300">
        <ShoppingBag size={14} className="text-brand-gold" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {resultCount} Curated Pieces Found
        </span>
      </div>
    </header>
  );
}