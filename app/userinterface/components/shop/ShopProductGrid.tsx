import { Layers } from "lucide-react";
import ProductCard from "../ProductCard";

interface ShopProductGridProps {
  currentProducts: any[];
  hasAnyProducts: boolean;
  userId: string | null;
  returnUrl: string;
}

export default function ShopProductGrid({
  currentProducts,
  hasAnyProducts,
  userId,
  returnUrl,
}: ShopProductGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 mb-16">
      {currentProducts.length > 0 ? (
        currentProducts.map((product) => (
          <ProductCard key={product.id} product={product} userId={userId} returnUrl={returnUrl} />
        ))
      ) : (
        <div className="col-span-full py-48 text-center border-2 border-dashed border-white dark:border-[#333] bg-white/30 dark:bg-[#111]/30 backdrop-blur-xl rounded-[4rem] transition-colors duration-300">
          <Layers size={24} className="text-slate-300 dark:text-gray-600 mx-auto mb-6" />
          <h3 className="text-xl font-black text-brand-blue dark:text-white uppercase transition-colors duration-300">
            {hasAnyProducts ? "No Results Found" : "Empty Collection"}
          </h3>
          <p className="text-sm text-slate-400 dark:text-gray-500 mt-2 transition-colors duration-300">
            {hasAnyProducts
              ? "Try choosing alternative sort filters or terms."
              : "There are no products listed here yet."}
          </p>
        </div>
      )}
    </div>
  );
}