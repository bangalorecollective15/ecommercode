import { Search, Filter, Ruler, ArrowUpDown, X } from "lucide-react";

interface BrandOption {
  id: number | string;
  name: string;
}

interface ShopFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;

  selectedBrand: string;
  onBrandChange: (value: string) => void;
  availableBrands: BrandOption[];

  selectedVariation: string;
  onVariationChange: (value: string) => void;
  availableVariations: string[];

  sortOrder: string;
  onSortChange: (value: string) => void;

  isFilterActive: boolean;
  onClearFilters: () => void;
}

export default function ShopFilterBar({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  availableBrands,
  selectedVariation,
  onVariationChange,
  availableVariations,
  sortOrder,
  onSortChange,
  isFilterActive,
  onClearFilters,
}: ShopFilterBarProps) {
  return (
    <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row items-center gap-4">
      <div className="relative flex-1 w-full flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 font-medium text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
        {/* Brand Filter */}
        <div className="relative w-full sm:w-56">
          <Filter
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300"
            size={16}
          />
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full pl-12 pr-10 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 cursor-pointer appearance-none"
          >
            <option value="all">All Brands</option>
            {availableBrands.map((brand) => (
              <option key={brand.id} value={String(brand.id)}>
                {brand.name}
              </option>
            ))}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
        </div>

        {/* Variation (Size) Filter */}
        {availableVariations.length > 0 && (
          <div className="relative w-full sm:w-56">
            <Ruler
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300"
              size={16}
            />
            <select
              value={selectedVariation}
              onChange={(e) => onVariationChange(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 cursor-pointer appearance-none"
            >
              <option value="all">All Sizes</option>
              {availableVariations.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
          </div>
        )}

        {/* Sort */}
        <div className="relative w-full sm:w-56">
          <ArrowUpDown
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300"
            size={16}
          />
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full pl-12 pr-10 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 cursor-pointer appearance-none"
          >
            <option value="default">Sort: Featured</option>
            <option value="newest">Newest Arrivals</option>
            <option value="oldest">Oldest / Classic</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
        </div>

        {isFilterActive && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-5 py-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/30 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-sm shrink-0 active:scale-95"
          >
            <X size={14} strokeWidth={2.5} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}