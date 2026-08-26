import { Sparkles } from "lucide-react";

interface GalleryHeaderProps {
  activeBrandName?: string;
  activeCategoryName?: string;
}

export default function GalleryHeader({ activeBrandName, activeCategoryName }: GalleryHeaderProps) {
  return (
    <header className="pt-32 pb-12 text-center space-y-4">
      <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/60 dark:bg-[#111]/60 backdrop-blur-md border border-white dark:border-[#333] rounded-full shadow-sm transition-colors duration-300">
        <Sparkles className="text-brand-gold" size={14} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-gray-400">
          {activeBrandName ? "Brand Showcase" : "Curated Selection"}
        </span>
      </div>
      <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-brand-blue dark:text-white uppercase transition-colors duration-300">
        {activeBrandName || activeCategoryName || "The Gallery"}
        <span className="text-brand-gold">.</span>
      </h1>
      <div className="flex items-center justify-center gap-4 text-slate-400 dark:text-gray-500 transition-colors duration-300">
        <div className="h-[1px] w-8 bg-brand-gold/30"></div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Bengaluru Collective</p>
        <div className="h-[1px] w-8 bg-brand-gold/30"></div>
      </div>
    </header>
  );
}