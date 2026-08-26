import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ShopPagination({ currentPage, totalPages, onPageChange }: ShopPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-5 w-full mb-8">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="group relative w-12 h-12 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white dark:hover:text-white hover:border-brand-blue dark:hover:border-[#444] transition-all duration-300 ease-out shadow-sm"
      >
        <ChevronLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <div className="flex flex-col items-center min-w-[3.5rem]">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-0.5 transition-colors duration-300">
          Page
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-slate-900 dark:text-white leading-none transition-colors duration-300">
            {currentPage}
          </span>
          <span className="text-sm font-black text-slate-400 dark:text-gray-500 leading-none transition-colors duration-300">
            / {totalPages}
          </span>
        </div>
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="group relative w-12 h-12 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white dark:hover:text-white hover:border-brand-blue dark:hover:border-[#444] transition-all duration-300 ease-out shadow-sm"
      >
        <ChevronRight size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}