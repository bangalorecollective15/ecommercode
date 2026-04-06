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

export default function HomePage() {
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [lifestyleSections, setLifestyleSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [instagramLinks, setInstagramLinks] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  // 1. Add the missing state at the top
  const [igLinks, setIgLinks] = useState<any[]>([]);
  // Inside your HomePage function
  const [currentSlide, setCurrentSlide] = useState(0);

  // Add this useEffect for the auto-play banner
  useEffect(() => {
    if (heroImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Changes every 5 seconds

    return () => clearInterval(interval);
  }, [heroImages]);
  // 2. Combine into ONE single parallel fetch
  useEffect(() => {
    // Inside your useEffect
   async function fetchData() {
  try {
    const [
      hero,
      brandData,
      session,
      tagsData,
      latestData,
      instagramData
    ] = await Promise.all([
      supabase.from("hero_section").select("images").eq("active", true).limit(1).maybeSingle(),
      supabase.from("brands").select("*").eq("status", true).limit(10),
      supabase.auth.getSession(),
      supabase.from("attributes").select("id, name").eq("type", "lifestyle_tag"),
      // 1. UPDATED QUERY FOR LATEST PRODUCTS
      supabase.from("products")
        .select(`
          *, 
          product_variations(*, attributes:size_id(name)), 
          product_images(image_url)
        `)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("instagram_links")
        .select("url")
        .eq("published", true)
        .order("created_at", { ascending: false })
    ]);

    if (instagramData.data) setInstagramLinks(instagramData.data);
    setUserId(session.data.session?.user?.id || null);
    if (hero.data?.images) setHeroImages(hero.data.images);
    if (brandData.data) setBrands(brandData.data);

    // 2. MAPPING LATEST PRODUCTS WITH SIZES
    if (latestData.data) {
      setLatestProducts(latestData.data.map(p => ({
        ...p,
        price: p.product_variations?.[0]?.price || 0,
        image: p.product_images?.[0]?.image_url,
        // Extracting unique size names
        availableSizes: Array.from(new Set(
          p.product_variations?.map((v: any) => v.attributes?.name).filter(Boolean)
        ))
      })));
    }

    // 3. UPDATED QUERY FOR LIFESTYLE SECTIONS
    if (tagsData.data) {
      const sections = await Promise.all(
        tagsData.data.map(async (tag) => {
          const { data: products } = await supabase
            .from("products")
            .select(`
              *, 
              product_variations(*, attributes:size_id(name)), 
              product_images(image_url)
            `)
            .eq("lifestyle_tag_id", tag.id)
            .eq("active", true)
            .limit(4);

          return {
            tagName: tag.name,
            products: products?.map(p => ({
              ...p,
              price: p.product_variations?.[0]?.price || 0,
              image: p.product_images?.[0]?.image_url,
              // Extracting unique size names
              availableSizes: Array.from(new Set(
                p.product_variations?.map((v: any) => v.attributes?.name).filter(Boolean)
              ))
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

  // Instagram Script Logic
  // Instagram Script Logic
  useEffect(() => {
    if (!instagramLinks.length) return;
    if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => (window as any).instgrm.Embeds.process();
      document.body.appendChild(script);
    }
  }, [instagramLinks]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-600" size={40} />
    </div>
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans selection:bg-orange-100">

      {/* 1. HERO SECTION */}
      {/* --- LUXURY PROMO BANNER: THE GLASS INLAY --- */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="relative h-[500px] md:h-[600px] w-full rounded-[4rem] overflow-hidden group shadow-2xl shadow-orange-950/20">

          {/* 1. Background Image - Multi-Photo Slider */}
          <div className="absolute inset-0 w-full h-full">
            {heroImages.length > 0 ? (
              heroImages.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-0" : "opacity-0"
                    }`}
                >
                  <img
                    src={img}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] scale-110 group-hover:scale-100"
                    alt={`Luxury Banner ${index + 1}`}
                  />
                </div>
              ))
            ) : (
              <img
                src="https://images.unsplash.com/photo-1441984908747-d4125f2670bf?q=80&w=2070"
                className="absolute inset-0 w-full h-full object-cover"
                alt="Fallback Banner"
              />
            )}

            {/* Optional: Slide Indicators (Bottom Dots) */}
            {heroImages.length > 1 && (
              <div className="absolute bottom-8 right-12 z-30 flex gap-2">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1 transition-all duration-500 rounded-full ${idx === currentSlide ? "w-8 bg-orange-500" : "w-2 bg-white/30"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 2. Gradient Overlays for Depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 via-transparent to-transparent z-10" />

          {/* 3. Floating Glassmorphism Content Card */}
          <div className="absolute inset-0 z-20 flex items-center px-10 md:px-20">
            <div className="max-w-2xl backdrop-blur-2xl bg-white/5 border border-white/10 p-10 md:p-16 rounded-[3.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transform transition-transform duration-700 group-hover:-translate-y-2">

              {/* Animated Badge */}
              <div className="flex items-center gap-3 mb-8">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/80">Limited Access Edition</span>
              </div>

              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.85] mb-8">
                REFINING <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">THE UNKNOWN.</span>
              </h2>

              <p className="text-white/60 text-lg font-medium leading-relaxed max-w-md mb-10 border-l-2 border-orange-500/50 pl-6">
                Experience the 2026 Collection — where avant-garde silhouettes meet the serenity of minimalist craft.
              </p>

              {/* Action Button */}
              <div className="flex flex-wrap gap-6">
                <Link
                  href="/userinterface/Gproducts"
                  className="px-10 py-5 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all duration-500 shadow-xl"
                >
                  Access the Vault
                </Link>
                <Link
                  href="/userinterface/about/">
                  <button className="flex items-center gap-3 text-white/80 hover:text-orange-400 transition-colors py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest">Inquiry Only</span>
                    <ArrowUpRight size={18} />
                  </button></Link>
              </div>
            </div>
          </div>

          {/* 4. Decorative Elements */}
          <div className="absolute top-12 right-12 z-20 hidden lg:block">
            <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md animate-spin-slow">
              <Sparkles className="text-white/20" size={32} />
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. THE MINI MAISON GRID (Compact Luxury with Local Assets) --- */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20 pt-8 bg-[#fcfcfc]">

        {/* Compact Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-8 h-[1px] bg-orange-500"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600">Maison 2026</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-950">
              The Noir <span className="text-black italic font-serif font-light">Edit.</span>
            </h2>
          </div>
          <p className="text-slate-400 text-[11px] max-w-[240px] leading-relaxed font-medium">
            A curated selection featuring local aesthetics and global silhouettes from <span className="text-slate-900 font-bold">Coach</span> & <span className="text-slate-900 font-bold">LV</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[220px]">

          {/* 1. PRIMARY FEATURE - Using banner.png */}
          <div className="md:col-span-7 row-span-2 relative rounded-[3rem] overflow-hidden group shadow-xl">
            <img
              src="/banner.png"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
              alt="Main Collection Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

            {/* Floating Glass Card */}
            <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-white/10 border border-white/20 p-6 rounded-[2rem]">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-orange-400 text-[9px] font-black uppercase tracking-widest mb-1">LV Heritage</p>
                  <h3 className="text-2xl font-black text-white tracking-tight">Monogram Series</h3>
                </div>
                <button className="p-3 bg-white text-slate-900 rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-lg">
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. COMPACT COACH CARD */}
          <div className="md:col-span-5 row-span-1 bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-orange-200 transition-all shadow-sm">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-white">
                <ShieldCheck size={22} />
              </div>
              <span className="text-[9px] font-black text-slate-300 tracking-widest">1941</span>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-950">Coach Signature</h4>
              <p className="text-slate-400 text-[10px] font-medium leading-tight mt-1">NYC leathercraft reimagined for the collection.</p>
            </div>
          </div>

          {/* 3. SECONDARY VISUAL - Using ban.png */}
          <div className="md:col-span-5 row-span-1 relative rounded-[2.5rem] overflow-hidden group">
            <img
              src="/ban.png"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="Lifestyle Visual"
            />
            {/* Smoked Glass Overlay */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] group-hover:backdrop-blur-md transition-all flex items-center justify-center">
              <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Instagram className="text-white mx-auto mb-2" size={20} />
                <p className="text-white text-[8px] font-black uppercase tracking-[0.3em]">Bangalore Fashion</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Optional: Thin minimalist divider between sections */}
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="h-px w-full bg-slate-100"></div>
      </div>

      {/* --- 3. PRODUCT SHOWCASE (Infinite Luxury Marquee) --- */}
      <section className="max-w-full mx-auto py-12 bg-[#fdfdfd] overflow-hidden">

        {/* Minimalist Header */}
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-[1px] bg-orange-600"></span>
              <span className="text-orange-600 text-[10px] font-black tracking-[0.5em] uppercase">The Runway</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-950 uppercase italic">
              Essential Drops.
            </h2>
          </div>

          <Link href="/userinterface/Gproducts" className="group flex items-center gap-2 text-[10px] font-black tracking-[0.2em] border-b-2 border-slate-900 pb-2 hover:text-orange-600 hover:border-orange-600 transition-all">
            VIEW ALL PIECES
            <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* MARQUEE CONTAINER */}
        <div className="relative flex overflow-hidden group">
          {/* The Scrolling Track (Duplicated for Seamless Loop) */}
          <div className="flex animate-marquee whitespace-nowrap gap-10 py-10 group-hover:[animation-play-state:paused]">

            {/* First Set of Products + Second Set for Loop */}
            {[...latestProducts, ...latestProducts].map((p, idx) => (
              <div
                key={`${p.id}-${idx}`}
                className="relative w-[280px] md:w-[350px] shrink-0 group/card transition-all duration-700 hover:scale-[1.02]"
              >
                {/* LUXURY PRODUCT TAGS */}
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none">
                  {p.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-4 py-1.5 bg-white/10 backdrop-blur-xl text-[8px] font-black uppercase tracking-[0.3em] text-white rounded-full border border-white/20 inline-block w-fit group-hover/card:bg-orange-600 group-hover/card:border-orange-600 transition-all duration-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Product Card Wrapper with Glassmorphism shadow */}
                <div className="relative overflow-hidden rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
                  <ProductCard product={p} userId={userId} />
                </div>
              </div>
            ))}
          </div>

          {/* Elegant Side Fades (Creates the "Floating" look) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#fdfdfd] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#fdfdfd] to-transparent z-10" />
        </div>
      </section>

      {/* --- 4. SECTION: COMPACT BLACK ROSTER (Zero-Waste Luxury) --- */}
      <section className="bg-[#050505] py-10 px-6 overflow-hidden relative border-y border-white/5">

        {/* Minimalist Top & Bottom Glow Lines */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className="max-w-[1400px] mx-auto relative z-10">

          {/* TIGHT VERTICAL HEADER */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-orange-600 rounded-full" />
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase ">
                Iconic Roster.
              </h2>
            </div>

            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] md:text-right">
              Global Heritage • Modern Craft
            </p>
          </div>

          {/* COMPACT CIRCLE GRID - Reduced Gaps and Size */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            {brands.map((brand, idx) => (
              <div
                key={brand.id}
                className="relative group cursor-pointer transition-all duration-500"
              >
                {/* THE CIRCLE FRAME - Scaled down for zero-spacing feel */}
                <div className={`
            relative aspect-square rounded-full overflow-hidden border border-white/10
            bg-[#111] transition-all duration-500 ease-in-out
            group-hover:scale-110 group-hover:border-orange-500/50
            ${idx % 2 === 0 ? 'w-24 h-24 md:w-32 md:h-32' : 'w-20 h-20 md:w-28 md:h-28'}
          `}>
                  <img
                    src={brand.image_url}
                    alt={brand.name_en}
                    className="w-full h-full object-cover opacity-50  group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700"
                  />
                  {/* Inner Depth Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* MINIMALIST LABEL - Appears only on hover to save space */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                  <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-orange-500/20">
                    {brand.name_en}
                  </span>
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

    {/* --- 2. DYNAMIC LIFESTYLE SECTIONS (Alternating Deep Black & White) --- */}
{lifestyleSections.map((section, idx) => (
  <section 
    key={idx} 
    className={`w-full transition-colors duration-500 ${
      idx % 2 === 0 
        ? 'bg-[#0a0a0a] text-white border-b border-white/5' 
        : 'bg-[#ffffff] text-slate-950 border-b border-slate-100'
    }`}
  >
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      
      {/* COMPACT ARCHITECTURAL HEADER (No Italics) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`h-[2px] w-6 ${idx % 2 === 0 ? 'bg-orange-500' : 'bg-slate-900'}`} />
            <span className={`text-[9px] font-black tracking-[0.4em] uppercase ${
              idx % 2 === 0 ? 'text-orange-500' : 'text-slate-500'
            }`}>
              Section 0{idx + 1}
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
            {section.tagName} <span className={idx % 2 === 0 ? 'text-white/20' : 'text-slate-200'}>COLLECTION</span>
          </h2>
        </div>

        <Link
          href={`/userinterface/Gproducts?tag=${section.tagName}`}
          className={`group flex items-center gap-2 text-[9px] font-black tracking-[0.3em] border-b-2 pb-1.5 transition-all ${
            idx % 2 === 0 
              ? 'border-orange-500 text-orange-500 hover:text-white hover:border-white' 
              : 'border-slate-950 text-slate-950 hover:text-orange-600 hover:border-orange-600'
          }`}
        >
          VIEW ALL PIECES
          <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* COMPACT PRODUCT GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {section.products.map((p: any) => (
          <div 
            key={p.id} 
            className="relative group transition-all duration-500 hover:-translate-y-1"
          >
            {/* Subtle Backdrop Glow for Black Sections */}
            {idx % 2 === 0 && (
              <div className="absolute -inset-1 bg-white/5 rounded-[2rem] blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            
            <div className="relative overflow-hidden rounded-[2rem] shadow-sm border border-transparent group-hover:border-orange-500/30 transition-all">
               <ProductCard product={p} userId={userId} />
            </div>
          </div>
        ))}
      </div>

    </div>
  </section>
))}

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
