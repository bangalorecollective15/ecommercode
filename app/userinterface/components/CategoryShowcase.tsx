"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import OptimizedImage from "@/app/userinterface/components/OptimizedImage";

interface CategoryShowcaseProps {
  categories: any[];
  subcategories: any[];
}

export default function CategoryShowcase({ categories, subcategories }: CategoryShowcaseProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(
    categories.length > 0 ? categories[0].id : null
  );

  return (
    <section className="py-10 bg-[#f8f5f1] dark:bg-black overflow-hidden transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] uppercase tracking-[0.5em] text-[#c4a174] font-black">
            Explore Collections
          </span>
          <h2 className="mt-4 text-5xl md:text-6xl font-black tracking-tight text-[#2b2652] dark:text-white transition-colors duration-300">
            Shop By Category
          </h2>
          <p className="mt-4 text-slate-500 dark:text-gray-400 max-w-xl mx-auto text-sm md:text-base transition-colors duration-300">
            Discover curated luxury selections crafted for every lifestyle.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {categories
            .filter((cat) => subcategories.some((sub) => sub.category_id === cat.id))
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  px-8 py-4 rounded-full text-sm font-black uppercase tracking-[0.2em]
                  transition-all duration-300 border
                  ${
                    activeCategory === cat.id
                      ? "bg-[#2b2652] text-white border-[#2b2652] shadow-xl dark:bg-[#c4a174] dark:text-black dark:border-[#c4a174]"
                      : "bg-white text-[#2b2652] border-slate-200 hover:border-[#c4a174] hover:text-[#c4a174] dark:bg-[#111] dark:text-gray-300 dark:border-[#333] dark:hover:border-[#c4a174] dark:hover:text-[#c4a174]"
                  }
                `}
              >
                {cat.name}
              </button>
            ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {subcategories
            .filter((sub) => sub.category_id === activeCategory)
            .map((sub) => (
              <Link key={sub.id} href={`/userinterface/Gproducts/subcategory/${sub.id}`} className="group">
                <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-100 dark:border-[#333] shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-500">
                  {sub.image_url ? (
                    <div className="relative h-[220px] sm:h-[280px] lg:h-[340px] overflow-hidden">
                      <OptimizedImage
                        src={sub.image_url}
                        alt={sub.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                        <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-black tracking-tight">
                          {sub.name}
                        </h3>
                        <p className="text-white/70 text-xs sm:text-sm mt-1">Explore Collection</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] sm:h-[280px] lg:h-[340px] flex flex-col items-center justify-center bg-gradient-to-br from-[#2b2652] to-[#3c3570] dark:from-[#222] dark:to-black p-4 sm:p-6 lg:p-10 text-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 sm:mb-5 lg:mb-6">
                        <Sparkles className="text-white" size={24} />
                      </div>
                      <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                        {sub.name}
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm mt-2 sm:mt-3 max-w-[220px]">
                        Premium curated styles for modern fashion.
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#c4a174] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}