"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";
import ProductCard from "@/app/userinterface/components/ProductCard";

interface LifestyleSectionsProps {
  sections: any[];
  attributes: any[];
  userId: string | null;
}

export default function LifestyleSections({ sections, attributes, userId }: LifestyleSectionsProps) {
  const getLifestyleAttributeId = (tagName?: string): number | string | null => {
    if (!tagName) return null;
    const match = attributes.find((a) => a.type === "lifestyle_tag" && a.name === tagName);
    return match ? match.id : null;
  };

  return (
    <>
      {sections.map((section, idx) => {
        const bgStyles = [
          "bg-[#fcfaf7] border-[#c4a174]/10 dark:bg-black dark:border-[#333]",
          "bg-[#f2f2f2] border-slate-200 dark:bg-[#111] dark:border-[#333]",
          "bg-white border-[#c4a174]/10 dark:bg-black dark:border-[#333]",
        ][idx % 3];

        const sectionLifestyleId = getLifestyleAttributeId(section.tagName);
        const sectionHref = sectionLifestyleId
          ? `/userinterface/Gproducts?lifestyle=${sectionLifestyleId}`
          : `/userinterface/Gproducts?tag=${section.tagName}`;

        return (
          <section key={idx} className={`w-full py-16 border-b transition-all duration-700 ${bgStyles}`}>
            <div className="max-w-[1400px] mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div className="space-y-3">
                  <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] text-[#2b2652] dark:text-white flex flex-col transition-colors duration-300">
                    <span className="block">{section.tagName}</span>
                    <span
                      className="text-transparent font-sans font-black tracking-[0.15em] uppercase pt-1 text-3xl sm:text-4xl md:text-5xl"
                      style={{ WebkitTextStroke: "1.8px #c4a174" }}
                    >
                      SERIES.
                    </span>
                  </h2>
                </div>

                <Link
                  href={sectionHref}
                  className="group flex items-center gap-4 text-[10px] font-black tracking-[0.3em] text-[#2b2652] dark:text-white transition-all"
                >
                  <span className="border-b border-[#c4a174] pb-1 group-hover:border-[#2b2652] dark:group-hover:border-white transition-colors duration-300">
                    DISCOVER MORE
                  </span>
                  <div className="w-8 h-8 rounded-full border border-[#c4a174]/30 flex items-center justify-center group-hover:bg-[#c4a174] group-hover:text-white transition-all">
                    <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {section.products.map((p: any) => (
                  <div key={p.id} className="relative group">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#111] shadow-[0_10px_30px_rgba(0,0,0,0.02)] dark:shadow-none group-hover:shadow-[0_20px_50px_rgba(196,161,116,0.15)] border border-transparent dark:border-[#333] group-hover:border-[#c4a174]/20 transition-all duration-500">
                      <ProductCard product={p} userId={userId} />
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#c4a174] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    </div>
                    <div className="mt-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <p className="text-[8px] font-black text-[#c4a174] uppercase tracking-widest">
                        Limited Edition • BLR 2026
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}