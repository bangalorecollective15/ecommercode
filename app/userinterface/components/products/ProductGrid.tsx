import { Loader2, SlidersHorizontal } from "lucide-react";
import ProductCard from "../ProductCard";
import LazyMount from "../products/LazyMount";

interface ProductGridProps {
  products: any[];
  productsLoading: boolean;
  showFullScreenLoader: boolean;
  userId: string | null;
  returnUrl: string;
  onClearFilters: () => void;
  wishlistedIds: Set<string>;   // Add this
  cartVariationIds: Set<string>; // Add this
}

export default function ProductGrid({
  products,
  productsLoading,
  showFullScreenLoader,
  userId,
  returnUrl,
  onClearFilters,
  wishlistedIds,   // Destructure this
  cartVariationIds, // Destructure this
}: ProductGridProps) {
  if (showFullScreenLoader) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-brand-gold" size={48} strokeWidth={1} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-brand-blue dark:bg-white rounded-full animate-ping transition-colors duration-300" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 dark:text-gray-500 animate-pulse transition-colors duration-300">
          Syncing Collection
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 transition-opacity duration-300 ${
          productsLoading ? "opacity-40 pointer-events-none" : "opacity-100"
        }`}
      >
        {products.map((item, idx) => {
          const card = (
            <ProductCard
              product={item}
              userId={userId}
              priority={idx < 4}
              returnUrl={returnUrl}
              isWishlistedInitial={wishlistedIds.has(item.id)}
              isInCartInitial={item.product_variations?.some((v: any) => cartVariationIds.has(v.id)) ?? false}
            />
          );

          return (
            <div
              key={item.id}
              className="group product-reveal transition-transform duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${(idx % 8) * 60}ms` }}
            >
              {idx < 8 ? (
                card
              ) : (
                <LazyMount
                  placeholder={
                    <div className="aspect-square rounded-[1.5rem] bg-slate-100 dark:bg-[#1c1c1c] animate-pulse" />
                  }
                >
                  {card}
                </LazyMount>
              )}
            </div>
          );
        })}
      </div>

      {!productsLoading && products.length === 0 && (
        <div className="py-40 text-center rounded-[4rem] border-2 border-dashed border-white dark:border-[#333] bg-white/30 dark:bg-[#111]/30 backdrop-blur-sm mt-8 transition-colors duration-300">
          <div className="w-20 h-20 bg-white dark:bg-[#111] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm transition-colors duration-300">
            <SlidersHorizontal size={24} className="text-brand-gold" />
          </div>
          <h3 className="text-xl font-black text-brand-blue dark:text-white uppercase tracking-tight transition-colors duration-300">
            No Items Match Your Filter
          </h3>
          <p className="text-slate-400 dark:text-gray-500 text-sm mt-2 transition-colors duration-300">
            Try adjusting your selection or reset filters
          </p>
          <button
            onClick={onClearFilters}
            className="mt-8 text-[10px] font-black uppercase tracking-widest text-brand-gold hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <style>{`
        @keyframes productReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .product-reveal {
          opacity: 0;
          animation: productReveal 0.5s ease forwards;
        }
      `}</style>
    </>
  );
}