"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, LayoutGrid, Sparkles } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("home_status", true)
        .order("priority", { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-black transition-colors duration-300">
      <div className="w-8 h-8 border-2 border-slate-200 dark:border-[#333] border-t-orange-600 dark:border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-[#FAFAFA] dark:bg-black min-h-screen text-slate-900 dark:text-white selection:bg-orange-100 dark:selection:bg-orange-900/30 pb-32 transition-colors duration-300">

      {/* 1. COMPACT HERO SECTION */}
      <section className="relative pt-10 pb-10 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 dark:border-[#333] pb-12 transition-colors duration-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-[1px] w-12 bg-orange-600 dark:bg-orange-500"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 dark:text-orange-500">Signature Collections</span>
            </div>
            <h1 className="text-[clamp(3rem,10vw,7rem)] font-black leading-[0.8] tracking-tighter">
              Our Categories
            </h1>
          </div>

          <div className="max-w-xs md:pb-2">
            <p className="text-slate-500 dark:text-gray-400 text-[13px] font-medium leading-relaxed mb-4 transition-colors duration-300">
              Explore our curated selection of authentic, homemade treasures.
            </p>
            <div className="flex items-center gap-4 text-slate-400 dark:text-gray-500 transition-colors duration-300">
              <LayoutGrid size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">Grid View Enabled</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES GRID SECTION */}
      <section className="px-6 lg:px-12 max-w-[1400px] mx-auto mt-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
          {categories.map((category: any) => (
            <div
              key={category.id}
              className="group relative cursor-pointer"
              onClick={() => router.push(`/userinterface/Gproducts?category_id=${category.id}`)}
            >
              {/* Circle Card */}
              <div className="relative aspect-square rounded-full overflow-hidden bg-white dark:bg-[#111] border border-slate-100 dark:border-[#333] shadow-sm transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-orange-900/10 dark:group-hover:shadow-orange-900/20 group-hover:-translate-y-2">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-[#222] text-slate-300 dark:text-gray-600 transition-colors duration-300">
                    <Sparkles size={32} strokeWidth={1} />
                  </div>
                )}

                {/* Popular Badge */}
                {category.is_popular && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-slate-900/10 dark:bg-black/40 backdrop-blur-[2px]">
                    <span className="bg-white/90 dark:bg-[#111]/90 backdrop-blur-md text-slate-900 dark:text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl transition-colors duration-300">
                      Popular Choice
                    </span>
                  </div>
                )}
              </div>

              {/* Text Information */}
              <div className="mt-6 text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-lg font-black tracking-tighter group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors duration-300">
                    {category.name}
                  </h3>
                  <ArrowUpRight size={14} className="text-slate-300 dark:text-gray-600 group-hover:text-orange-600 dark:group-hover:text-orange-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-gray-500 transition-colors duration-300">
                  Browse Collection
                </p>
              </div>

              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-orange-600 dark:bg-orange-500 group-hover:w-8 transition-all duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. CALL TO ACTION FOOTER */}
      <section className="mt-24 px-6 text-center">
        <div className="bg-slate-900 dark:bg-[#111]/80 dark:border dark:border-[#333] py-16 rounded-[2.5rem] mx-auto max-w-5xl text-white relative overflow-hidden transition-colors duration-300">
          <div className="relative z-10 px-6">
            <h2 className="text-3xl font-black tracking-tighter mb-6 leading-tight">Can't find what you're looking for?</h2>
            <Link href="/userinterface/shop" className="inline-flex items-center gap-4 bg-orange-600 dark:bg-orange-500 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-[#222] hover:text-orange-600 dark:hover:text-white transition-all shadow-2xl active:scale-95">
              View All Products <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 dark:bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
      </section>
    </div>
  );
}