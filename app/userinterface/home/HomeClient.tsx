"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import ProductCard from "@/app/userinterface/components/ProductCard";
import OptimizedImage from "@/app/userinterface/components/OptimizedImage";
import {
  MoveRight, Users, Gem, Globe2,
  ArrowUpRight, Sparkles, Instagram
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Script from "next/script";
import { useRouter } from "next/navigation";

interface HeroData {
  id: string;
  images: string[];
  title: string;
  description: string;
  button_text: string;
  lifestyle_tag?: string;
}

const DEFAULT_DATA = {
  middle_badge: "Quality First",
  middle_title: "Elevated Style, Made Effortless \n & Affordable",
  middle_description: "Carefully selected pieces made to fit seamlessly into modern life.",
  cat1_title: "Apparel",
  cat1_description: "Timeless wardrobe staples.",
  cat1_image_url: "",
  cat2_title: "Accessories",
  cat2_description: "Handcrafted leather accents.",
  cat2_image_url: "",
  cat3_title: "Lifestyle",
  cat3_description: "Minimalist home essentials.",
  cat3_image_url: "",
  live_badge: "Live Gallery",
  live_title: "BUILT AROUND \nTrust, Style and Quality",
  live_image_url: "/phto.png",
  live_quote: "The minimalist aesthetic I've been searching for. A true sanctuary for modern living.",
  stat1_value: "10,000+",
  stat1_label: "Trusted Customers",
  stat2_value: "Premium",
  stat2_label: "Quality Craftsmanship",
  stat3_value: "Luxury",
  stat3_label: "Made Affordable",
  stat4_value: "Fast & Secure",
  stat4_label: "Worldwide Shipping",
};

interface HomeClientProps {
  initialHeroSections: HeroData[];
  initialData: any | null;
  initialCategories: any[];
  initialSubcategories: any[];
  initialBrands: any[];
  initialInstagramLinks: any[];
  initialLatestProducts: any[];
  initialLifestyleSections: any[];
}

export default function HomeClient({
  initialHeroSections,
  initialData,
  initialCategories,
  initialSubcategories,
  initialBrands,
  initialInstagramLinks,
  initialLatestProducts,
  initialLifestyleSections,
}: HomeClientProps) {
  const [brands] = useState<any[]>(initialBrands);
  const [lifestyleSections] = useState<any[]>(initialLifestyleSections);
  const [instagramLinks] = useState<any[]>(initialInstagramLinks);
  const [userId, setUserId] = useState<string | null>(null);
  const [latestProducts] = useState<any[]>(initialLatestProducts);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSections] = useState<HeroData[]>(initialHeroSections);
  const [categories] = useState<any[]>(initialCategories);
  const [subcategories] = useState<any[]>(initialSubcategories);
  const [activeCategory, setActiveCategory] = useState<number | null>(
    initialCategories.length > 0 ? initialCategories[0].id : null
  );
  const [data] = useState(initialData || DEFAULT_DATA);
  const router = useRouter();

  const duplicatedBrands = [...brands, ...brands];

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");
      if (type === "recovery") {
        router.push(`/userinterface/auth/update-password/${window.location.hash}`);
      }
    }
  }, [router]);

  useEffect(() => {
    if (heroSections.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSections.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSections]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: session }) => {
      setUserId(session.session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (instagramLinks.length > 0) {
      const timeoutId = setTimeout(() => {
        if (typeof window !== "undefined" && (window as any).instgrm) {
          try {
            (window as any).instgrm.Embeds.process();
          } catch (err) {
            console.error("Instagram embed initialization error:", err);
          }
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [instagramLinks]);

  const categoriesArray = [
    { title: data.cat1_title, description: data.cat1_description, image: data.cat1_image_url },
    { title: data.cat2_title, description: data.cat2_description, image: data.cat2_image_url },
    { title: data.cat3_title, description: data.cat3_description, image: data.cat3_image_url },
  ];

  return (
    <div className="bg-[#fcfcfc] dark:bg-black min-h-screen font-sans selection:bg-orange-100 dark:selection:bg-orange-900 transition-colors duration-300">

      {/* 1. FULL-WIDTH EDITORIAL HERO */}
      <section className="w-full bg-[#fcfcfc] dark:bg-black transition-colors duration-300">
        <div className="relative h-[550px] md:h-[700px] w-full overflow-hidden bg-[#0a0a0a]">
          {heroSections.map((hero, index) => (
            <div
              key={hero.id}
              className={`absolute inset-0 transition-all duration-[1.2s] ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
            >
              <OptimizedImage
                src={hero.images[0]}
                alt={hero.title}
                fill
                priority={index === 0}
                sizes="100vw"
                className={`object-cover transition-transform duration-[8s] ${index === currentSlide ? "scale-105" : "scale-100"
                  }`}
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />

              <div className="absolute inset-0 flex items-center">
                <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12">
                  <div className="max-w-3xl">
                    <div
                      className={`flex items-center gap-4 mb-6 transition-all duration-700 delay-300 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                        }`}
                    >
                      <div className="h-[2px] w-12 bg-orange-600" />
                      <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">
                        New Season Arrival
                      </span>
                    </div>

                    <h2
                      className={`text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase mb-6 transition-all duration-1000 delay-500 ${index === currentSlide ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
                        }`}
                    >
                      {hero.title.split(" ")[0]} <br />
                      <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                        {hero.title.split(" ").slice(1).join(" ")}
                      </span>
                    </h2>

                    <p
                      className={`text-white/50 text-sm md:text-base font-medium leading-relaxed max-w-sm mb-10 transition-all duration-700 delay-700 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                        }`}
                    >
                      {hero.description}
                    </p>

                    <div
                      className={`transition-all duration-700 delay-1000 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                        }`}
                    >
                      <Link
                        href={
                          hero.lifestyle_tag
                            ? `/userinterface/Gproducts?tag=${hero.lifestyle_tag}`
                            : "/userinterface/Gproducts"
                        }
                        className="group flex items-center gap-4 w-fit"
                      >
                        <div className="px-8 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xl">
                          {hero.lifestyle_tag ? "View Products" : hero.button_text || "Shop Now"}
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {heroSections.length > 0 && (
            <div className="absolute bottom-0 left-0 w-full z-30 flex justify-between items-center px-6 md:px-12 py-8 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex items-center gap-2">
                {heroSections.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentSlide(idx)} className="group py-2">
                    <div
                      className={`h-[3px] transition-all duration-500 rounded-full ${idx === currentSlide ? "w-16 bg-orange-600" : "w-6 bg-white/20 group-hover:bg-white/40"
                        }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.3em] text-white/40">
                <span className="text-white">0{currentSlide + 1}</span>
                <div className="w-8 h-px bg-white/20" />
                <span>0{heroSections.length}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= 2. CATEGORY SHOWCASE ================= */}
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
                    ${activeCategory === cat.id
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

      {/* --- 3. PRODUCT SHOWCASE (Luxury Runway Marquee) --- */}
      <section className="max-w-full mx-auto py-4 bg-[#ffffff] dark:bg-black overflow-hidden transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between mb-2 mt-6 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[1.5px] bg-brand-gold"></div>
              <span className="text-brand-gold text-[10px] md:text-[11px] font-black tracking-[0.5em] uppercase">
                Curated For You
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-black tracking-tighter text-brand-blue dark:text-white uppercase leading-[0.85] flex flex-col transition-colors duration-300">
              <span className="block">Spotlight</span>
              <span
                className="text-transparent font-normal italic tracking-wide lowercase normal-case pt-2"
                style={{
                  WebkitTextStroke: "1.2px currentColor",
                  fontFamily: '"Playfair Display", "Georgia", serif',
                  textTransform: "none",
                }}
              >
                Edit.
              </span>
            </h2>
          </div>

          <Link
            href="/userinterface/Gproducts"
            className="group flex items-center gap-4 text-[10px] md:text-[11px] font-black tracking-[0.3em] text-brand-blue dark:text-white uppercase transition-all self-start md:self-auto"
          >
            <span className="border-b-2 border-brand-gold/60 pb-1 group-hover:border-brand-blue dark:group-hover:border-white transition-colors duration-300">
              Shop The Drop
            </span>
            <div className="w-10 h-10 rounded-full border border-slate-200/80 dark:border-[#333] flex items-center justify-center bg-white dark:bg-[#111] group-hover:bg-brand-blue group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black group-hover:border-brand-blue dark:group-hover:border-white transition-all duration-300 shadow-sm">
              <MoveRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Link>
        </div>

        <div className="relative flex group">
          <div className="flex animate-marquee whitespace-nowrap gap-4 py-10">
            {[...latestProducts, ...latestProducts].map((p, idx) => (
              <div key={`${p.id}-${idx}`} className="relative w-[280px] md:w-[300px] shrink-0 group/card">
                <span className="absolute -top-4 left-6 text-[40px] font-black text-slate-100 dark:text-[#222] group-hover/card:text-brand-gold/20 transition-colors z-0">
                  0{(idx % latestProducts.length) + 1}
                </span>
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none">
                  {p.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-4 py-1.5 bg-brand-blue/90 dark:bg-brand-gold/90 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.3em] text-white dark:text-black rounded-full inline-block w-fit shadow-lg border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="group/card relative transition-all duration-700">
                  <ProductCard product={p} userId={userId} />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-blue/5 dark:from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none rounded-[1.5rem]" />
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/40 to-transparent dark:from-black dark:via-black/40 z-20 transition-colors duration-300" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/40 to-transparent dark:from-black dark:via-black/40 z-20 transition-colors duration-300" />
        </div>
      </section>

      {/* --- 4. CATEGORY IMAGES AND DESCRIPTIONS --- */}
      <section className="py-14 bg-[#E5DDD3] dark:bg-black/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-brand-gold font-bold tracking-[0.3em] text-xs uppercase block">
              {data.middle_badge}
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-serif text-slate-900 dark:text-white leading-tight whitespace-pre-line transition-colors duration-300">
              {data.middle_title}
            </h2>
            <p className="mt-6 text-slate-600 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed transition-colors duration-300">
              {data.middle_description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {categoriesArray.map((cat, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/5] shadow-xl">
                  <OptimizedImage
                    src={cat.image || "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a"}
                    alt={cat.title || "Showcase Collection"}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-white text-2xl font-serif tracking-wide">{cat.title}</h3>
                  </div>
                </div>
                <div className="mt-6 px-2 text-center md:text-left">
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm font-medium transition-colors duration-300">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. THE BOUTIQUE ROSTER --- */}
      <section className="bg-[#fcfaf7] dark:bg-black py-14 px-6 overflow-hidden relative transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c4a174]/10 rounded-full blur-[100px] -mr-48 -mt-48" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-10 gap-4">
            <div className="space-y-1">
              <h2 className="text-4xl md:text-6xl font-serif italic text-[#2b2652] dark:text-white tracking-tight transition-colors duration-300">
                World's Most <span className="font-sans not-italic font-black uppercase text-[#c4a174] tracking-tighter">Loved Brands</span>
              </h2>
              <div className="h-1.5 w-32 bg-gradient-to-r from-[#c4a174] via-[#2b2652]/20 dark:via-white/20 to-transparent" />
            </div>
            <div className="flex items-center gap-4">
              <p className="text-[#2b2652] dark:text-gray-300 text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-300">
                Explore exclusive deals across <span className="text-[#c4a174]">top luxury brands before they're gone.</span>
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

      {/* --- 6. SOCIAL MOMENTS --- */}
      <section className="bg-white dark:bg-black pb-20 pt-4 overflow-hidden transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] backdrop-blur-sm transition-colors duration-300">
                <Instagram size={14} className="text-orange-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white transition-colors duration-300">
                  {data.live_badge || "Live Gallery"}
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter leading-[0.9] text-slate-950 dark:text-white whitespace-pre-line transition-colors duration-300">
                  {data.live_title || "BUILT AROUND \nTrust, Style and Quality"}
                </h2>
              </div>

              <div className="space-y-12 pt-8 border-t border-slate-100 dark:border-[#333] transition-colors duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10">
                  <div className="group space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] text-slate-900 dark:text-white flex items-center justify-center transition-colors group-hover:border-orange-600/30 group-hover:bg-orange-50/20 dark:group-hover:bg-orange-900/20">
                      <Users size={16} className="text-slate-800 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">{data.stat1_value || "10,000+"}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">{data.stat1_label || "Trusted Customers"}</p>
                    </div>
                  </div>
                  <div className="group space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] text-slate-900 dark:text-white flex items-center justify-center transition-colors group-hover:border-orange-600/30 group-hover:bg-orange-50/20 dark:group-hover:bg-orange-900/20">
                      <Sparkles size={16} className="text-slate-800 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">{data.stat2_value || "Premium"}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">{data.stat2_label || "Quality Craftsmanship"}</p>
                    </div>
                  </div>
                  <div className="group space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] text-slate-900 dark:text-white flex items-center justify-center transition-colors group-hover:border-orange-600/30 group-hover:bg-orange-50/20 dark:group-hover:bg-orange-900/20">
                      <Gem size={16} className="text-slate-800 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">{data.stat3_value || "Luxury"}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">{data.stat3_label || "Made Affordable"}</p>
                    </div>
                  </div>
                  <div className="group space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] text-slate-900 dark:text-white flex items-center justify-center transition-colors group-hover:border-orange-600/30 group-hover:bg-orange-50/20 dark:group-hover:bg-orange-900/20">
                      <Globe2 size={16} className="text-slate-800 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">{data.stat4_value || "Fast & Secure"}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">{data.stat4_label || "Worldwide Shipping"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-transparent rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              <div className="relative bg-slate-50 dark:bg-[#111] p-3 rounded-[3rem] shadow-sm border border-slate-100 dark:border-[#333] overflow-hidden transition-colors duration-300">
                <div className="relative h-[450px] overflow-hidden rounded-[2.5rem]">
                  <OptimizedImage
                    src={data.live_image_url || "/phto.png"}
                    alt="Community Feature"
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                  />

                  {data.live_quote && (
                    <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-black/40 border border-white/10 p-6 rounded-[2rem] transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-white font-black italic">"</span>
                        </div>
                        <p className="text-white text-sm font-medium leading-snug tracking-tight">{data.live_quote}</p>
                      </div>
                    </div>
                  )}

                  <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white dark:bg-[#222] flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-orange-600 dark:hover:bg-orange-600 hover:text-white text-slate-950 dark:text-white z-10">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. DYNAMIC LIFESTYLE SECTIONS --- */}
      {lifestyleSections.map((section, idx) => {
        const bgStyles = [
          "bg-[#fcfaf7] border-[#c4a174]/10 dark:bg-black dark:border-[#333]",
          "bg-[#f2f2f2] border-slate-200 dark:bg-[#111] dark:border-[#333]",
          "bg-white border-[#c4a174]/10 dark:bg-black dark:border-[#333]",
        ][idx % 3];

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
                  href={`/userinterface/Gproducts?tag=${section.tagName}`}
                  className="group flex items-center gap-4 text-[10px] font-black tracking-[0.3em] text-[#2b2652] dark:text-white transition-all"
                >
                  <span className="border-b border-[#c4a174] pb-1 group-hover:border-[#2b2652] dark:group-hover:border-white transition-colors duration-300">DISCOVER MORE</span>
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

      {/* --- INSTAGRAM SCROLLER --- */}
      <section className="w-full py-16 bg-white dark:bg-black border-t border-slate-100 dark:border-[#333] overflow-hidden transition-colors duration-300">
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="lazyOnload"
          onLoad={() => {
            if (typeof window !== "undefined" && (window as any).instgrm) {
              (window as any).instgrm.Embeds.process();
            }
          }}
        />

        <div className="text-center mb-14 space-y-3 px-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl shadow-lg">
              <Instagram className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors duration-300">
            The Social <span className="text-slate-300 dark:text-slate-600">Feed.</span>
          </h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium tracking-wide transition-colors duration-300">@bangalorecollectiveofficial</p>
        </div>

        <div className="relative group w-full overflow-hidden">
          {instagramLinks.length > 0 ? (
            <div className="marquee-container w-full overflow-hidden">
              <div className="animate-marquee flex flex-row flex-nowrap items-center gap-8 w-max">
                {[...instagramLinks, ...instagramLinks].map((link, idx) => (
                  <div
                    key={`ig-${idx}`}
                    className="flex-shrink-0 w-[326px] min-h-[450px] rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#111] border border-slate-100 dark:border-[#333] shadow-xl transition-all duration-500 hover:scale-[1.02] relative group/card"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-20 cursor-pointer"
                      title="View on Instagram"
                    />
                    <blockquote
                      className="instagram-media"
                      data-instgrm-permalink={link.url}
                      data-instgrm-version="14"
                      style={{ background: "transparent", border: "0", margin: "0", padding: "0", width: "100%", minWidth: "326px" }}
                    >
                      <div className="block p-10 text-center text-xs text-slate-400 dark:text-gray-500 italic">Loading Post...</div>
                    </blockquote>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-8 overflow-hidden px-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[326px] h-[450px] rounded-[2.5rem] bg-slate-100 dark:bg-[#222] animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .marquee-container {
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-50% - 1rem)); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}