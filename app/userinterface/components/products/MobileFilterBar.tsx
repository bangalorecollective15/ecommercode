import { SlidersHorizontal } from "lucide-react";

interface MobileFilterBarProps {
  totalCount: number;
  onOpen: () => void;
}

export default function MobileFilterBar({ totalCount, onOpen }: MobileFilterBarProps) {
  return (
    <div className="flex lg:hidden w-full items-center justify-between gap-4 bg-white/40 dark:bg-[#111]/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/50 dark:border-[#333]/50 shadow-sm transition-colors duration-300">
      <button
        onClick={onOpen}
        className="flex items-center gap-3 px-6 py-3 bg-brand-blue dark:bg-white text-white dark:text-black rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-blue/20 dark:shadow-none active:scale-95 transition-all duration-300"
      >
        <SlidersHorizontal size={14} className="text-brand-gold dark:text-brand-gold" />
        <span>Filter & Refine</span>
        <span className="ml-1 bg-white/20 dark:bg-gray-200 dark:text-black text-white text-[9px] px-2 py-0.5 rounded-full">
          {totalCount}
        </span>
      </button>
      <div className="text-right">
        <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300">
          Showing
        </p>
        <p className="text-xs font-black text-brand-blue dark:text-white mt-1 transition-colors duration-300">
          {totalCount} Pcs
        </p>
      </div>
    </div>
  );
}