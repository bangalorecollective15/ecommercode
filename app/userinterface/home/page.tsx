"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProductCard from "../components/ProductCard";
import {
  Loader2, MoveRight, ChevronLeft, ChevronRight,
  ArrowUpRight, ShieldCheck, Sparkles, Zap, Instagram
} from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define Interface for Hero Data
// Updated Interface
interface HeroData {
  id: string;
  images: string[];
  title: string;
  description: string;
  button_text: string;
  lifestyle_tag?: string; // Add this line (the '?' makes it optional)
}


export default function HomePage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [lifestyleSections, setLifestyleSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [instagramLinks, setInstagramLinks] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  // Inside your HomePage function, update the state:
  const [heroSections, setHeroSections] = useState<HeroData[]>([]); // Note: Changed to Array

  // Auto-play Slider Logic
  useEffect(() => {
    if (heroSections.length <= 1) return; // Watch the array length
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSections.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSections]); // Update dependency

  useEffect(() => {
    async function fetchData() {
      try {
        // Inside your useEffect / fetchData function:
        const [heroData, brandData, session, tagsData, latestData, instagramData] = await Promise.all([
          // REMOVED .limit(1).maybeSingle() to get all active banners
          supabase.from("hero_section").select("*").eq("active", true).order("created_at", { ascending: false }),
          supabase.from("brands").select("*").eq("status", true).limit(10),
          supabase.auth.getSession(),
          supabase.from("attributes").select("id, name").eq("type", "lifestyle_tag"),
          supabase.from("products")
            .select(`*, product_variations(*, attributes:size_id(name)), product_images(image_url)`)
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(4),
          supabase.from("instagram_links").select("url").eq("published", true).order("created_at", { ascending: false })
        ]);

        if (heroData.data) setHeroSections(heroData.data);

        if (instagramData.data) setInstagramLinks(instagramData.data);
        setUserId(session.data.session?.user?.id || null);
        if (brandData.data) setBrands(brandData.data);

        // Map Products
        if (latestData.data) {
          setLatestProducts(latestData.data.map(p => ({
            ...p,
            price: p.product_variations?.[0]?.price || 0,
            image: p.product_images?.[0]?.image_url,
            availableSizes: Array.from(new Set(p.product_variations?.map((v: any) => v.attributes?.name).filter(Boolean)))
          })));
        }

        // Map Lifestyle Sections
        if (tagsData.data) {
          const sections = await Promise.all(
            tagsData.data.map(async (tag) => {
              const { data: products } = await supabase
                .from("products")
                .select(`*, product_variations(*, attributes:size_id(name)), product_images(image_url)`)
                .eq("lifestyle_tag_id", tag.id).eq("active", true).limit(4);
              return {
                tagId: tag.id,
                tagName: tag.name,
                products: products?.map(p => ({
                  ...p,
                  price: p.product_variations?.[0]?.price || 0,
                  image: p.product_images?.[0]?.image_url,
                  availableSizes: Array.from(new Set(p.product_variations?.map((v: any) => v.attributes?.name).filter(Boolean)))
                })) || []
              };
            })
          );
          setLifestyleSections(sections.filter(s => s.products.length > 0));
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categories = [
    {
      title: "Men's Footwear",
      description: "Find luxury men's footwear crafted for comfort, style, and lasting quality. Each pair blends classic design with fine craftsmanship.",
      image: "/path-to-your-men-image.jpg",
    },
    {
      title: "Ladies Handbags",
      description: "Explore our range of stylish ladies' handbags from premium brands, made with fine materials and timeless designs.",
      image: "/path-to-your-bag-image.jpg",
    },
    {
      title: "Premium Stoles",
      description: "Wrap yourself in pure comfort with our cashmere wool stoles and shawls. Soft, warm, and elegant for any look.",
      image: "/path-to-your-stole-image.jpg",
    }
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#050505]">
      <Loader2 className="animate-spin text-orange-600" size={40} />
    </div>
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans selection:bg-orange-100">

      {/* 1. FULL-WIDTH EDITORIAL HERO */}
      <section className="w-full bg-[#fcfcfc]">
        <div className="relative h-[550px] md:h-[700px] w-full overflow-hidden bg-[#0a0a0a]">

          {/* The Slider Track */}
          {heroSections.map((hero, index) => (
            <div
              key={hero.id}
              className={`absolute inset-0 transition-all duration-[1.2s] ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
            >
              {/* Background Image - Reduced Zoom for smaller height */}
              <img
                src={hero.images[0]}
                className={`w-full h-full object-cover transition-transform duration-[8s] ${index === currentSlide ? "scale-105" : "scale-100"
                  }`}
                alt={hero.title}
              />

              {/* Gradient Overlay - Darker on left for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />

              {/* Content Overlay - Aligned to max-width container but section is full-width */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12">
                  <div className="max-w-3xl">

                    {/* Animated Line + Tagline */}
                    <div className={`flex items-center gap-4 mb-6 transition-all duration-700 delay-300 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                      }`}>
                      <div className="h-[2px] w-12 bg-orange-600" />
                      <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">
                        New Season Arrival
                      </span>
                    </div>

                    {/* Title - Reduced font size for smaller height */}
                    <h2 className={`text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase mb-6 transition-all duration-1000 delay-500 ${index === currentSlide ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
                      }`}>
                      {hero.title.split(' ')[0]} <br />
                      <span
                        className="text-transparent"
                        style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}
                      >
                        {hero.title.split(' ').slice(1).join(' ')}
                      </span>
                    </h2>

                    {/* Description - Shorter line height */}
                    <p className={`text-white/50 text-sm md:text-base font-medium leading-relaxed max-w-sm mb-10 transition-all duration-700 delay-700 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                      }`}>
                      {hero.description}
                    </p>

                    {/* Action Button */}
                    <div className={`transition-all duration-700 delay-1000 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                      }`}>
                      <Link
                        href={
                          hero.lifestyle_tag
                            ? `/userinterface/Gproducts?tag=${hero.lifestyle_tag}`
                            : "/userinterface/Gproducts"
                        }
                        className="group flex items-center gap-4 w-fit"
                      >
                        <div className="px-8 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xl">

                          {/* Dynamic Button Name */}
                          {hero.lifestyle_tag
                            ? "View Products"
                            : (hero.button_text || "Shop Now")}

                        </div>

                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Minimalist Navigation Bar - Positioned at the very bottom edge */}
          <div className="absolute bottom-0 left-0 w-full z-30 flex justify-between items-center px-6 md:px-12 py-8 bg-gradient-to-t from-black/50 to-transparent">

            {/* Slide Indicators */}
            <div className="flex items-center gap-2">
              {heroSections.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className="group py-2"
                >
                  <div className={`h-[3px] transition-all duration-500 rounded-full ${idx === currentSlide ? "w-16 bg-orange-600" : "w-6 bg-white/20 group-hover:bg-white/40"
                    }`} />
                </button>
              ))}
            </div>

            {/* Numeric Counter */}
            <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.3em] text-white/40">
              <span className="text-white">0{currentSlide + 1}</span>
              <div className="w-8 h-px bg-white/20" />
              <span>0{heroSections.length}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. catory images and descoptions*/}
      <section className="py-24 bg-[#E5DDD3]">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header Section */}
          <div className="text-center mb-16">
            <span className="text-brand-gold font-bold tracking-[0.3em] text-xs uppercase">Quality First</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-serif text-slate-900 leading-tight">
              Elevated Style, Made Effortless <br /> & Affordable
            </h2>
            <p className="mt-6 text-slate-600 max-w-xl mx-auto text-lg">
              Carefully selected pieces made to fit seamlessly into modern life.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {categories.map((cat, index) => (
              <div key={index} className="group cursor-pointer">
                {/* Image Container */}
                <div className="relative overflow-hidden rounded-2xl aspect-[4/5] shadow-xl">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Label on Image */}
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-white text-2xl font-serif">{cat.title}</h3>
                  </div>
                </div>

                {/* Text Content */}
                <div className="mt-6 px-2 text-center md:text-left">
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {cat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 3. PRODUCT SHOWCASE (Infinite Luxury Marquee) --- */}
      {/* --- 3. PRODUCT SHOWCASE (Luxury Runway Marquee) --- */}
      <section className="max-w-full mx-auto py-4 bg-[#ffffff] overflow-hidden">

        {/* Refined Luxury Header */}
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-brand-gold"></div>
              <span className="text-brand-gold text-[11px] font-black tracking-[0.6em] uppercase">The Runway</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-brand-blue uppercase leading-none">
              Essential <br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #2b2652' }}>Drops.</span>
            </h2>
          </div>

          <Link
            href="/userinterface/Gproducts"
            className="group flex items-center gap-4 text-[11px] font-black tracking-[0.3em] text-brand-blue transition-all"
          >
            <span className="border-b-2 border-brand-gold pb-1 group-hover:border-brand-blue transition-colors">
              EXPLORE THE ARCHIVE
            </span>
            <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all">
              <MoveRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* MARQUEE CONTAINER */}
        {/* MARQUEE CONTAINER */}
        <div className="relative flex group">
          {/* Changed gap-12 to gap-6 for tighter spacing */}
          <div className="flex animate-marquee whitespace-nowrap gap-6 py-10">
            {[...latestProducts, ...latestProducts].map((p, idx) => (
              <div
                key={`${p.id}-${idx}`}
                /* Match the width to your ProductCard's max-width (300px) */
                className="relative w-[280px] md:w-[300px] shrink-0 group/card"
              >
                {/* Subtle Numbering */}
                <span className="absolute -top-4 left-6 text-[40px] font-black text-slate-100 group-hover/card:text-brand-gold/20 transition-colors z-0">
                  0{(idx % latestProducts.length) + 1}
                </span>

                {/* Luxury Tags Container */}
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none">
                  {p.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-4 py-1.5 bg-brand-blue/90 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.3em] text-white rounded-full inline-block w-fit shadow-lg border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* The Card Wrapper */}
                <div className="group/card relative transition-all duration-700">
                  <ProductCard product={p} userId={userId} />

                  {/* Overlay - Adjusted opacity and radius to match card */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-blue/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none rounded-[1.5rem]" />
                </div>
              </div>
            ))}
          </div>

          {/* Elegant Fade Edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/40 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/40 to-transparent z-20" />
        </div>
      </section>


      {/* --- 2. THE MINI MAISON GRID (Compact Luxury with Local Assets) --- */}
      {/* --- 2. THE NOIR EDIT (Luxury Bento Grid) --- */}
      <section className="w-full py-24 bg-[#E5DDD3] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">

          {/* Section Header: Minimalist & Elegant */}
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-px bg-brand-gold"></span>
                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-gold">Maison 2026</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-brand-blue leading-[0.8]">
                Modern Essentials · Premium Touch · Accessible Luxury <br />
                <span className="text-black font-serif font-light"></span>
              </h2>
            </div>
            <p className="text-slate-500 text-sm max-w-[320px] leading-relaxed font-medium border-l border-slate-200 pl-6">
              A curated selection of local aesthetics and global silhouettes featuring <span className="text-brand-blue font-bold">Coach</span> & <span className="text-brand-blue font-bold">LV</span> heritage pieces.
            </p>
          </div>

          {/* The Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">

            {/* 1. PRIMARY FEATURE (LV Heritage) - Spans 7 columns, 2 rows */}
            <div className="md:col-span-7 md:row-span-2 relative rounded-[4rem] overflow-hidden group shadow-2xl shadow-brand-blue/5">
              <img
                src="/2ndbanner.jpg"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-110"
                alt="LV Heritage Monogram"
              />
              {/* Deep Blue Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/90 via-brand-blue/20 to-transparent opacity-80" />

              {/* Floating Luxury Badge */}
              <div className="absolute top-8 left-8">
                <div className="px-5 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-full">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Global Silhouette</span>
                </div>
              </div>

              {/* Bottom Glass Content Card */}
              <div className="absolute bottom-8 left-8 right-8 backdrop-blur-2xl bg-white/[0.03] border border-white/10 p-8 rounded-[3rem] transition-all duration-500 group-hover:bg-white/[0.08]">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">Heritage Collection</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">Monogram Series</h3>
                  </div>
                  <button className="w-14 h-14 bg-white text-brand-blue rounded-full flex items-center justify-center hover:bg-brand-gold hover:text-white transition-all transform group-hover:rotate-45 shadow-lg">
                    <ArrowUpRight size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. COMPACT COACH CARD - Spans 5 columns, 1 row */}
            <div className="md:col-span-5 md:row-span-1 bg-brand-blue rounded-[3.5rem] p-10 flex flex-col justify-between group relative overflow-hidden">
              {/* Subtle Background Pattern/Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px]" />

              <div className="flex justify-between items-start relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-brand-gold/20 backdrop-blur-md border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                  <ShieldCheck size={28} />
                </div>
                <span className="text-[11px] font-black text-brand-gold/50 tracking-[0.4em]">SINCE 2023</span>
              </div>

              <div className="relative z-10">
                <h4 className="text-2xl font-black text-white mb-2">It’s Live! Your Luxury Just Launched</h4>
                <p className="text-white/50 text-[12px] font-medium leading-relaxed max-w-[290px]">
                  Celebrate our grand launch with irresistible offers on designer handbags, shoes, and more. Limited-time deals. Unlimited style. Shop now before it’s gone!
                </p>
              </div>
            </div>

            {/* 3. LIFESTYLE VISUAL - Spans 5 columns, 1 row */}
            <div className="md:col-span-5 md:row-span-1 relative rounded-[3.5rem] overflow-hidden group">
              <img
                src="/banner01.jpg"
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                alt="Lifestyle Feed"
              />
              {/* Glassmorphic Overlay with Gold Border on Hover */}
              <div className="absolute inset-0 bg-brand-blue/40 opacity-0 group-hover:opacity-100 backdrop-blur-md transition-all duration-500 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-brand-gold flex items-center justify-center mb-4 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <Instagram className="text-white" size={24} />
                </div>
                <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] transform translate-y-4 group-hover:translate-y-0 transition-transform delay-75">
                  Street Style Feed
                </p>
              </div>

              {/* Permanent Minimal Label */}
              <div className="absolute bottom-6 right-8 text-white/80 group-hover:opacity-0 transition-opacity">
                <p className="text-[10px] font-black uppercase tracking-widest">© BLR 2026</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- 4. SECTION: THE BOUTIQUE ROSTER (Creme & Gold - Refined Compact) --- */}
      <section className="bg-[#fcfaf7] py-8 px-6 relative overflow-hidden">

        <div className="max-w-[1200px] mx-auto">

          {/* Tightened Header */}
          <div className="flex items-end justify-between mb-10 border-b border-[#c4a174]/20 pb-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#2b2652] uppercase">
              The <span className="text-[#c4a174]">Roster</span>
            </h2>
            <p className="text-[#c4a174] text-[8px] font-black uppercase tracking-[0.5em] hidden md:block opacity-70">
              Official Partners • 2026
            </p>
          </div>

          {/* Small-Scale Horizontal Gallery (Always Visible & Staggered) */}
          <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 justify-center">
            {brands.map((brand, idx) => (
              <div
                key={brand.id}
                className={`relative group flex-none w-[140px] md:w-full max-w-[180px] transition-all duration-700 ${idx % 2 === 0 ? "mt-0" : "mt-6"
                  }`}
              >
                {/* Compact Image Card */}
                {/* --- 4. THE REFINED COMPACT BRAND CARD --- */}
                <div className="relative group flex-none w-[120px] md:w-[150px] transition-all duration-700">

                  {/* The Card: Smaller Fixed Aspect Ratio */}
                  <div className="relative aspect-square bg-white border border-[#c4a174]/20 p-6 shadow-sm group-hover:shadow-[0_10px_30px_rgba(196,161,116,0.15)] group-hover:-translate-y-1.5 transition-all duration-500 flex items-center justify-center overflow-hidden">

                    {/* Micro Index Number */}
                    <span className="absolute top-2 left-2 text-[7px] font-mono text-[#c4a174]/50">
                      0{idx + 1}
                    </span>

                    {/* Logo Container: Ensures the image fits without touching borders */}
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <img
                        src={brand.image_url}
                        alt={brand.name_en}
                        /* - h-full w-full + object-contain: Makes it fit the box 
                           - group-hover:scale-110: Makes it feel alive on hover
                        */
                        className="h-full w-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
                      />
                    </div>

                    {/* Decorative Gold Corner - Adds a premium touch */}
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#c4a174]/0 group-hover:border-[#c4a174]/40 transition-all duration-500" />

                    {/* Bottom Accent Line */}
                    <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#c4a174] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />
                  </div>

                  {/* Brand Name: Elegant & Small */}
                  <div className="mt-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#2b2652] group-hover:text-[#c4a174] transition-colors">
                      {brand.name_en}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>


        </div>
      </section>


      {/* --- 5. SOCIAL MOMENTS (Refined & Compact Gallery) --- */}
      <section className="bg-white pb-20 pt-4 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Small, High-Impact Text */}
            <div className="lg:col-span-5 space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 backdrop-blur-sm">
                <Instagram size={14} className="text-orange-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Live Gallery</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter leading-[0.9] text-slate-950">
                  SEEN ON <br /> The Streets.
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
                  Our community defines the narrative. Tag us to be featured in our curated global lifestyle feed.
                </p>
              </div>

              {/* Compact Stats Grid */}
              <div className="flex gap-12 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-2xl font-black text-slate-950">98%</p>
                  <p className="text-[8px] font-bold text-orange-600 tracking-widest uppercase mt-1">Satisfaction</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-950">24/7</p>
                  <p className="text-[8px] font-bold text-orange-600 tracking-widest uppercase mt-1">Concierge</p>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Image Card with /phto.png */}
            <div className="lg:col-span-7 relative group">
              {/* Subtle Decorative Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-transparent rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

              <div className="relative bg-slate-50 p-3 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="relative h-[450px] overflow-hidden rounded-[2.5rem]">
                  <img
                    src="/phto.png"
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                    alt="Community Feature"
                  />

                  {/* Minimalist Glass Quote */}
                  <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-slate-950/40 border border-white/10 p-6 rounded-[2rem] transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-white font-black italic">"</span>
                      </div>
                      <p className="text-white text-sm font-medium leading-snug tracking-tight">
                        The minimalist aesthetic I’ve been searching for. A true sanctuary for modern living.
                      </p>
                    </div>
                  </div>

                  {/* Hover Floating Action */}
                  <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-orange-600 hover:text-white">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- 2. DYNAMIC LIFESTYLE SECTIONS (Alternating Gold, Grey & White) --- */}
      {lifestyleSections.map((section, idx) => {
        // Logic to alternate between Brand Gold, Soft Grey, and White
        const bgStyles = [
          'bg-[#fcfaf7] border-[#c4a174]/10', // Section 1: Warm White/Creme
          'bg-[#f2f2f2] border-slate-200',    // Section 2: Soft Architectural Grey
          'bg-white border-[#c4a174]/10',     // Section 3: Pure White
        ][idx % 3];

        return (
          <section
            key={idx}
            className={`w-full py-16 border-b transition-all duration-700 ${bgStyles}`}
          >
            <div className="max-w-[1400px] mx-auto px-6">

              {/* ELEGANT MINIMALIST HEADER */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] w-10 bg-[#c4a174]" />
                    <span className="text-[10px] font-black tracking-[0.5em] uppercase text-[#c4a174]">
                      Collection 0{idx + 1}
                    </span>
                  </div>

                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.85] text-[#2b2652]">
                    {section.tagName}
                    {' '} {/* This adds the space */}
                    <span
                      className="text-transparent"
                      style={{ WebkitTextStroke: '1px #c4a174' }}
                    >
                      Series.
                    </span>
                  </h2>
                </div>

                <Link
                  href={`/userinterface/Gproducts?tag=${section.tagName}`}
                  className="group flex items-center gap-4 text-[10px] font-black tracking-[0.3em] text-[#2b2652] transition-all"
                >
                  <span className="border-b border-[#c4a174] pb-1 group-hover:border-[#2b2652]">
                    DISCOVER MORE
                  </span>
                  <div className="w-8 h-8 rounded-full border border-[#c4a174]/30 flex items-center justify-center group-hover:bg-[#c4a174] group-hover:text-white transition-all">
                    <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              {/* CLEAN PRODUCT GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {section.products.map((p: any) => (
                  <div
                    key={p.id}
                    className="relative group"
                  >
                    {/* Card Container: Using White background to pop against Grey/Creme sections */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] group-hover:shadow-[0_20px_50px_rgba(196,161,116,0.15)] border border-transparent group-hover:border-[#c4a174]/20 transition-all duration-500">
                      <ProductCard product={p} userId={userId} />

                      {/* Subtle Bottom Gold Bar on Hover */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#c4a174] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    </div>

                    {/* Tag Label underneath for visual balance */}
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
      <section className="w-full py-2 bg-white border-t border-slate-100 overflow-hidden">
        <div className="text-center mb-14 space-y-3 px-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl shadow-lg">
              <Instagram className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
            The Social <span className="text-slate-300">Feed.</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium tracking-wide">@bangalorecollectiveofficial</p>
        </div>

        <div className="relative group">
          {instagramLinks.length > 0 ? (
            <div className="marquee-container">
              <div className="animate-marquee flex gap-8">
                {/* Loop twice for seamless scrolling */}
                {[...instagramLinks, ...instagramLinks].map((link, idx) => (
                  <div
                    key={`ig-${idx}`}
                    className="flex-shrink-0 w-[320px] rounded-[2.5rem] overflow-hidden bg-white border border-slate-100 shadow-xl transition-transform duration-500 hover:scale-[1.02]"
                  >
                    <blockquote
                      className="instagram-media"
                      data-instgrm-permalink={link.url}
                      data-instgrm-version="14"
                      style={{
                        background: '#FFF',
                        border: '0',
                        margin: '0',
                        padding: '0',
                        width: '100%'
                      }}
                    >
                      {/* Fallback link while loading */}
                      <a href={link.url} className="block p-10 text-center text-xs text-slate-400 italic">
                        View Post
                      </a>
                    </blockquote>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-slate-300">
              <Loader2 className="animate-spin mb-4" size={24} />
              <p className="text-xs font-bold tracking-widest uppercase">Syncing Style Feed...</p>
            </div>
          )}
        </div>
      </section>

      {/* Updated Styles for Smoother Performance */}
      <style jsx>{`
  .marquee-container {
    mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
  }

    .animate-spin-slow {
      animation: spin 8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-50% - 1rem)); } /* Shift by exactly half the list */
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
