"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import OptimizedImage from "@/app/userinterface/components/OptimizedImage";

interface BrandsRosterProps {
  brands: any[];
}

export default function BrandsRoster({ brands }: BrandsRosterProps) {
  const duplicatedBrands = [...brands, ...brands];

  return (
    <section className="bg-[#fcfaf7] dark:bg-black py-14 px-6 overflow-hidden relative transition-colors duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#c4a174]/10 rounded-full blur-[100px] -mr-48 -mt-48" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-10 gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl md:text-6xl font-serif italic text-[#2b2652] dark:text-white tracking-tight transition-colors duration-300">
              World's Most{" "}
              <span className="font-sans not-italic font-black uppercase text-[#c4a174] tracking-tighter">
                Loved Brands
              </span>
            </h2>
            <div className="h-1.5 w-32 bg-gradient-to-r from-[#c4a174] via-[#2b2652]/20 dark:via-white/20 to-transparent" />
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[#2b2652] dark:text-gray-300 text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-300">
              Explore exclusive deals across{" "}
              <span className="text-[#c4a174]">top luxury brands before they're gone.</span>
            </p>
          </div>
        </div>

        <div className="relative">
          <motion.div
            className="flex gap-10 cursor-grab active:cursor-grabbing"
            animate={{ x: [0, -150 * brands.length] }}
            transition={{
              duration: Math.max(25, brands.length * 3),
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {duplicatedBrands.map((brand, idx) => (
              <Link
                key={`${brand.id}-${idx}`}
                href={`/userinterface/Gproducts?brand_id=${brand.id}`}
                className="flex-none group w-[220px] md:w-[260px] py-4 block"
              >
                <div className="relative h-[280px] bg-white dark:bg-[#111] border border-slate-200/70 dark:border-[#333] rounded-[2rem] p-4 overflow-hidden transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-[#c4a174]/10 group-hover:border-[#c4a174]/40 flex flex-col items-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#c4a174]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="w-full flex justify-end">
                    <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-[#333] group-hover:bg-[#c4a174] transition-colors duration-500 flex-shrink-0" />
                  </div>
                  <div className="relative w-full flex-1 flex items-center justify-center mt-2 mb-4">
                    <OptimizedImage
                      src={brand.image_url}
                      alt={brand.name_en}
                      fill
                      sizes="220px"
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-110 drop-shadow-sm mix-blend-multiply dark:mix-blend-normal pointer-events-none"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-3 w-full flex-shrink-0 mb-2">
                    <div className="w-8 h-[2px] bg-slate-100 dark:bg-[#333] group-hover:bg-[#c4a174] transition-colors duration-500" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-gray-500 group-hover:text-[#2b2652] dark:group-hover:text-white transition-colors duration-300 text-center truncate w-full relative z-10 select-none px-2">
                      {brand.name_en}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#2b2652]/10 dark:via-white/10 to-transparent" />
    </section>
  );
}