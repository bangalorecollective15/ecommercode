import { SlidersHorizontal, X } from "lucide-react";
import ProductFilters from "../ProductFilters";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  brands: any[];
  lifestyleTags: any[];
  filters: any;
  setFilters: (next: any) => void;
  totalCount: number;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  brands,
  lifestyleTags,
  filters,
  setFilters,
  totalCount,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[200] animate-in fade-in duration-200 flex flex-col justify-end lg:hidden transition-colors duration-300">
      <div className="bg-[#f8fafc] dark:bg-black w-full max-h-[90vh] rounded-t-[3rem] p-6 flex flex-col overflow-hidden border-t border-white dark:border-[#333] shadow-2xl animate-in slide-in-from-bottom duration-300 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#333] mb-4 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-brand-gold" />
            <h2 className="text-sm font-black uppercase tracking-widest text-brand-blue dark:text-white transition-colors duration-300">
              Filter Parameters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-[#222] text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#333] rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 pb-24 no-scrollbar">
          <ProductFilters
            categories={categories}
            brands={brands}
            lifestyleTags={lifestyleTags}
            filters={filters}
            setFilters={setFilters}
            isMobile={true}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] dark:from-black dark:via-black to-transparent border-t border-slate-100 dark:border-[#333] transition-colors duration-300">
          <button
            onClick={onClose}
            className="w-full py-4 bg-brand-blue dark:bg-brand-gold text-white dark:text-black font-black text-[12px] uppercase tracking-widest rounded-full shadow-xl active:scale-95 transition-all duration-300 text-center block"
          >
            Apply Filter & View ({totalCount} Products)
          </button>
        </div>
      </div>
    </div>
  );
}