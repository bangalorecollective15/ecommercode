import { LayoutGrid } from "lucide-react";
import ProductFilters from "../ProductFilters";

interface DesktopFilterBarProps {
  categories: any[];
  brands: any[];
  lifestyleTags: any[];
  filters: any;
  setFilters: (next: any) => void;
  totalCount: number;
}

export default function DesktopFilterBar({
  categories,
  brands,
  lifestyleTags,
  filters,
  setFilters,
  totalCount,
}: DesktopFilterBarProps) {
  return (
    <div className="hidden lg:flex items-center justify-between gap-4 bg-white/40 dark:bg-[#111]/40 backdrop-blur-xl py-3 px-6 rounded-[2rem] border border-white/60 dark:border-[#333]/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-colors duration-300">
      <div className="flex-1">
        <ProductFilters
          categories={categories}
          brands={brands}
          lifestyleTags={lifestyleTags}
          filters={filters}
          setFilters={setFilters}
          isMobile={false}
        />
      </div>
      <div className="flex items-center gap-4 pl-5 border-l border-slate-300/40 dark:border-[#444]/40 shrink-0 transition-colors duration-300">
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300">
            Catalog
          </p>
          <p className="text-xs font-black text-brand-blue dark:text-white mt-1 whitespace-nowrap transition-colors duration-300">
            {totalCount} Products
          </p>
        </div>
        <div className="w-9 h-9 bg-brand-blue dark:bg-[#222] text-white rounded-xl flex items-center justify-center shadow-md shadow-brand-blue/10 dark:shadow-none transition-colors duration-300">
          <LayoutGrid size={16} />
        </div>
      </div>
    </div>
  );
}