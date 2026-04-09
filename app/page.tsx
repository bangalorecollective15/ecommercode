"use client";

import React from "react";
import Link from "next/link";
import { 
  Truck, 
  Wallet, 
  ShieldCheck, 
  Headphones, 
  ArrowRight, 
  Instagram,
  Star,
  Compass
} from "lucide-react";

export default function JewelryLandingPage() {
  const navigateToHome = "/userinterface/home";

  // High-quality Jewelry Image Assets
  const images = {
    hero1: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop",
    hero2: "https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?q=80&w=2070&auto=format&fit=crop",
    hero3: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=2070&auto=format&fit=crop",
    sapphire: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop",
    silver: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop",
    gem: "https://images.unsplash.com/photo-1616111721541-0118679f2294?q=80&w=1961&auto=format&fit=crop",
    rose: "https://images.unsplash.com/photo-1569388330292-79cc1ec67270?q=80&w=1974&auto=format&fit=crop",
    promo1: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2000&auto=format&fit=crop",
    promo2: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=2000&auto=format&fit=crop",
  };

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-[#c4a174] selection:text-white overflow-x-hidden">
      
      {/* --- SECTION 1: HERO TRIO --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 h-screen min-h-[700px]">
        {[
          { badge: "Sale!", title: "Love Inspires", img: images.hero1, color: "bg-[#c4a174]" },
          { badge: "Pendant!", title: "Classic Hits", img: images.hero2, color: "bg-black/40 backdrop-blur-md" },
          { badge: "Discover!", title: "New Arrival", img: images.hero3, color: "bg-white text-black" },
        ].map((item, i) => (
          <div key={i} className="relative group overflow-hidden border-r border-slate-100 last:border-0">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" 
              style={{ backgroundImage: `url(${item.img})` }}
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500" />
            <div className="relative h-full flex flex-col justify-end p-12 text-white">
              <span className={`${item.color} w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4`}>
                {item.badge}
              </span>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">{item.title}</h2>
              <Link href={navigateToHome} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] hover:gap-4 transition-all">
                Explore Collection <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* --- SECTION 2: BRAND PROMISE --- */}
      <section className="py-24 px-6 text-center bg-[#fdfdfd]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c4a174] mb-8">Bangalore Collective Maison</p>
          <h1 className="text-5xl md:text-8xl font-serif text-slate-900 mb-10 italic leading-[1.1]">Elegance in every detail.</h1>
          <p className="text-slate-500 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
            Where sophistication meets effortless grace. Our pieces are crafted to be reflections of your inner radiance.
          </p>
          <Link href={navigateToHome} className="inline-block px-14 py-6 bg-black text-white rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#c4a174] transition-all transform hover:-translate-y-1 shadow-2xl">
            Shop The Edit
          </Link>
        </div>
      </section>

      {/* --- SECTION 3: CORE ATTRIBUTES --- */}
      <section className="py-16 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { icon: <Truck size={30} />, label: "Fast Shipping", sub: "Orders Over 500 Rs" },
            { icon: <Wallet size={30} />, label: "Big Cashback", sub: "Over 10% Cashback" },
            { icon: <ShieldCheck size={30} />, label: "Quick Payment", sub: "100% Secure" },
            { icon: <Headphones size={30} />, label: "24/7 Support", sub: "Ready For You" }
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="text-[#c4a174] mb-5 group-hover:scale-110 transition-transform duration-300">{feat.icon}</div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">{feat.label}</h4>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">{feat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION 4: ARTISAN STORY GRID --- */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24">
          {[
            { id: "01", title: "Sapphire Crystal", body: "Symbol of wisdom and royalty — the Sapphire Crystal radiates deep celestial blue. Believed to bring protection and clarity.", img: images.sapphire },
            { id: "02", title: "Silver Ring", body: "Classic yet contemporary, the Silver Ring embodies purity and balance. Its cool sheen enhances any gemstone it embraces.", img: images.silver },
            { id: "03", title: "Gem Layer", body: "A fusion of precious stones representing transformation. Each layer captures a story of color, energy, and artistic depth.", img: images.gem },
            { id: "04", title: "Rose Quartz", body: "Known as the Stone of Love, it glows with soft pink hues that soothe the heart and inspire unconditional compassion.", img: images.rose }
          ].map((item) => (
            <div key={item.id} className="group flex flex-col">
              <div className="overflow-hidden rounded-[2.5rem] mb-10 aspect-[16/10] shadow-xl">
                <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={item.title} />
              </div>
              <div className="flex gap-8">
                <span className="text-5xl font-serif text-slate-100 italic">{item.id}.</span>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-md">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION 5: MARQUEE BANNER --- */}
      <div className="bg-[#2b2652] py-6 overflow-hidden flex">
        <div className="animate-marquee whitespace-nowrap flex gap-16 items-center">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[11px] font-black uppercase tracking-[0.6em] text-white">
              Limited Time Offer • Free Delivery Over 500 • New Collection Available •
            </span>
          ))}
        </div>
      </div>

      {/* --- SECTION 6: PROMO BLOCKS --- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="bg-[#f4f4f4] rounded-[4rem] p-16 md:p-24 relative overflow-hidden group min-h-[500px] flex items-center">
          <div className="relative z-10 max-w-sm">
            <p className="text-[#c4a174] text-[10px] font-black uppercase tracking-widest mb-4">Summer 2026</p>
            <h2 className="text-5xl font-serif mb-6 leading-tight">Maybe You’ve Earned It</h2>
            <p className="text-slate-500 mb-10 text-lg">Get 25% off for this item!</p>
            <Link href={navigateToHome} className="inline-block px-10 py-4 bg-white text-black border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg">
              Claim Offer
            </Link>
          </div>
          <img src={images.promo1} className="absolute -right-20 -bottom-20 w-2/3 opacity-90 group-hover:scale-110 transition-transform duration-1000" alt="Jewelry Promo" />
        </div>

        <div className="bg-[#fdf8f3] rounded-[4rem] p-16 md:p-24 relative overflow-hidden group min-h-[500px] flex items-center">
          <div className="relative z-10 max-w-sm">
            <p className="text-[#c4a174] text-[10px] font-black uppercase tracking-widest mb-4">Elite Edit</p>
            <h2 className="text-5xl font-serif mb-6 leading-tight">Top Sale Diamond</h2>
            <p className="text-slate-500 mb-10 text-lg">Flash deals for the next 24 hours.</p>
            <Link href={navigateToHome} className="inline-block px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#c4a174] transition-all shadow-lg">
              Shop The Sale
            </Link>
          </div>
          <img src={images.promo2} className="absolute -right-20 -bottom-20 w-2/3 opacity-90 group-hover:scale-110 transition-transform duration-1000" alt="Diamond Promo" />
        </div>
      </section>

      {/* --- SECTION 7: TESTIMONIALS --- */}
      <section className="py-32 bg-[#2b2652] text-white rounded-[5rem] mx-6 my-12 relative overflow-hidden">
        <div className="absolute top-10 left-10 opacity-5 text-9xl font-serif">"</div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="flex justify-center gap-1 text-[#c4a174] mb-12">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
          </div>
          <p className="text-2xl md:text-4xl font-light leading-relaxed mb-16 italic font-serif">
            "The quality of the sapphire ring is unmatched. Every facet catches the light in a way that feels truly magical. Bangalore Collective is my new home for elegance."
          </p>
          <div className="space-y-2">
            <h5 className="text-[12px] font-black uppercase tracking-[0.5em] text-[#c4a174]">Devika Swaminathan</h5>
            <p className="text-[9px] text-white/40 uppercase tracking-widest">Prestige Member</p>
          </div>
        </div>
      </section>

      {/* --- FLOATING NAVIGATION (Since No Header) --- */}
      <div className="fixed bottom-10 right-10 z-[100]">
        <Link 
          href={navigateToHome} 
          className="flex items-center gap-3 bg-white border border-slate-200 p-2 pr-6 rounded-full shadow-2xl hover:bg-slate-50 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white group-hover:rotate-45 transition-transform duration-500">
            <Compass size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Enter Maison</span>
        </Link>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}