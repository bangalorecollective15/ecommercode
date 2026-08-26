import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const goTo = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`flex items-center justify-end gap-5 w-full ${className}`}>
      <button
        onClick={() => goTo(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-[#111] border-2 border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white hover:border-brand-blue dark:hover:border-[#444] hover:shadow-[0_8px_25px_rgba(43,38,82,0.25)] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:scale-75 active:translate-y-0 transition-all duration-300 ease-out"
      >
        <ChevronLeft
          size={24}
          strokeWidth={2.5}
          className="group-hover:-translate-x-1 transition-transform duration-300 ease-out"
        />
      </button>
      <div className="flex flex-col items-center min-w-[3.5rem]">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-0.5 transition-colors duration-300">
          Page
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black text-slate-900 dark:text-white leading-none transition-colors duration-300">
            {currentPage}
          </span>
          <span className="text-lg font-black text-slate-400 dark:text-gray-500 leading-none transition-colors duration-300">
            / {totalPages}
          </span>
        </div>
      </div>
      <button
        onClick={() => goTo(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-[#111] border-2 border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white hover:border-brand-blue dark:hover:border-[#444] hover:shadow-[0_8px_25px_rgba(43,38,82,0.25)] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:scale-75 active:translate-y-0 transition-all duration-300 ease-out"
      >
        <ChevronRight
          size={24}
          strokeWidth={2.5}
          className="group-hover:translate-x-1 transition-transform duration-300 ease-out"
        />
      </button>
    </div>
  );
}