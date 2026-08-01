"use client";

import React from "react";
import { 
  FileText, 
  RefreshCw, 
  Truck, 
  AlertCircle, 
  ArrowLeft, 
  Scale, 
  ShieldAlert,
  PlayCircle
} from "lucide-react";
import Link from "next/link";

export default function TermsAndConditions() {
  const sections = [
    { id: "general", title: "General Terms", icon: <Scale size={18} /> },
    { id: "exchange", title: "Returns & Exchanges", icon: <RefreshCw size={18} /> },
    { id: "damage", title: "Damaged Products", icon: <ShieldAlert size={18} /> },
    { id: "shipping", title: "Shipping Policy", icon: <Truck size={18} /> },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-black pb-24 transition-colors duration-300">
      {/* --- HEADER --- */}
      <header className="bg-gradient-to-r from-[#c4a174] to-[#8a6d3b] dark:from-[#b08d60] dark:to-[#6b522b] pt-32 pb-20 px-6 text-center text-white transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Return to Maison</span>
          </Link>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 transition-colors duration-300">
            Terms of Service<span className="text-black/20 dark:text-black/40 transition-colors duration-300">.</span>
          </h1>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.4em]">
            Effective April 2026 • Bangalore Collective
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* --- SIDEBAR NAVIGATION --- */}
          <aside className="lg:w-1/4">
            <div className="sticky top-32 bg-white dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-[2rem] p-8 shadow-sm transition-colors duration-300">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-6 transition-colors duration-300">Provisions</p>
              <nav className="space-y-4">
                {sections.map((section) => (
                  <a 
                    key={section.id}
                    href={`#${section.id}`} 
                    className="flex items-center gap-3 text-slate-500 dark:text-gray-400 hover:text-[#c4a174] dark:hover:text-[#c4a174] transition-all group"
                  >
                    <span className="p-2 rounded-xl bg-slate-50 dark:bg-[#222] group-hover:bg-[#c4a174]/10 transition-all duration-300">
                      {section.icon}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-tight">{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* --- CONTENT AREA --- */}
          <div className="lg:w-3/4 bg-white dark:bg-black border border-slate-200 dark:border-[#333] rounded-[3rem] p-8 md:p-16 shadow-sm max-w-none transition-colors duration-300">
            
            {/* 1. GENERAL */}
            <section id="general" className="mb-20">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#2b2652] dark:text-white mb-8 flex items-center gap-3 transition-colors duration-300">
                <span className="w-8 h-[2px] bg-[#c4a174] transition-colors duration-300"></span>
                General Conditions
              </h2>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6 transition-colors duration-300">
                By purchasing from Bangalore Collective, you agree to our terms and conditions outlined below. We encourage you to read these carefully before making a purchase.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-6 space-y-4 transition-colors duration-300">
                <div className="flex gap-4">
                  <AlertCircle className="text-[#c4a174] shrink-0" size={20} />
                  <p className="text-sm text-slate-700 dark:text-amber-200/80 m-0 italic transition-colors duration-300">
                    AI visuals are used solely for illustrative purposes. Minor variations in size, pattern, or detailing may occur. For precise representation, rely on original photographs or scan the article.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. EXCHANGE POLICY */}
            <section id="exchange" className="mb-20">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#2b2652] dark:text-white mb-8 flex items-center gap-3 transition-colors duration-300">
                <span className="w-8 h-[2px] bg-[#c4a174] transition-colors duration-300"></span>
                Return & Exchange Policy
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 border-2 border-red-50 dark:border-red-900/20 bg-transparent dark:bg-red-900/10 rounded-2xl transition-colors duration-300">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-red-400 mb-2 transition-colors duration-300">Refunds</h4>
                  <p className="text-sm text-slate-500 dark:text-gray-400 m-0 font-bold transition-colors duration-300">No Refunds will be issued under any circumstances.</p>
                </div>
                <div className="p-6 border-2 border-slate-50 dark:border-[#333] rounded-2xl transition-colors duration-300">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[#c4a174] mb-2 transition-colors duration-300">Footwear</h4>
                  <p className="text-sm text-slate-500 dark:text-gray-400 m-0 font-bold transition-colors duration-300">Size Exchange only for footwear will be allowed.</p>
                </div>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-4 transition-colors duration-300">Size Change Provisions</h3>
              <ul className="space-y-3 list-none p-0">
                {["Products must be shipped back within 2 days of delivery.", "If requested size is unavailable, store credits will be issued.", "Store credits are valid for 180 days.", "Shipping charges are not included in store credits."].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c4a174] mt-1.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </section>

            {/* 3. DAMAGED PRODUCT CLAIM */}
            <section id="damage" className="mb-20">
              <div className="bg-[#2b2652] dark:bg-black dark:border dark:border-[#333] text-white rounded-[2rem] p-8 md:p-12 transition-colors duration-300">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3 transition-colors duration-300">
                  <ShieldAlert className="text-[#c4a174]" />
                  Damaged Product Policy
                </h2>
                <p className="text-white/70 dark:text-gray-400 mb-8 transition-colors duration-300">Damaged products will be replaced only if reported as per the strict claim process below:</p>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-[#222] flex items-center justify-center shrink-0 font-black text-[#c4a174] transition-colors duration-300">1</div>
                      <p className="text-sm text-white/80 dark:text-gray-300 italic transition-colors duration-300">A clearly recorded unboxing video showing the product from the moment the package is opened.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-[#222] flex items-center justify-center shrink-0 font-black text-[#c4a174] transition-colors duration-300">2</div>
                      <p className="text-sm text-white/80 dark:text-gray-300 italic transition-colors duration-300">The AWB number (tracking label) must be clearly visible in the video.</p>
                    </div>
                  </div>
                  <div className="bg-white/5 dark:bg-[#111] border border-white/10 dark:border-[#333] rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors duration-300">
                    <PlayCircle size={40} className="text-[#c4a174] mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Claims without video will not be accepted</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. SHIPPING POLICY */}
            <section id="shipping" className="mb-20">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#2b2652] dark:text-white mb-8 flex items-center gap-3 transition-colors duration-300">
                <span className="w-8 h-[2px] bg-[#c4a174] transition-colors duration-300"></span>
                Shipping & Logisitics
              </h2>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#c4a174] mb-2 transition-colors duration-300">Processing Time</h4>
                    <p className="text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">1–3 business days after payment confirmation. Weekend orders process on Monday.</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#c4a174] mb-2 transition-colors duration-300">Delivery Estimates</h4>
                    <p className="text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">India: 3–7 business days<br />International: 7–15 business days</p>
                  </div>
                </div>
                <div className="bg-[#f8fafc] dark:bg-[#111] rounded-2xl p-6 border border-slate-100 dark:border-[#333] transition-colors duration-300">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[#2b2652] dark:text-slate-200 mb-4 transition-colors duration-300">Tracking Information</h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                    Once shipped, tracking numbers are provided via WhatsApp. Please allow 24–48 hours for tracking portals to update.
                  </p>
                  <div className="mt-4 p-3 bg-white dark:bg-[#222] rounded-xl text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase transition-colors duration-300">
                    No Shipping to P.O. Boxes / APO
                  </div>
                </div>
              </div>
            </section>

            <footer className="pt-12 border-t border-slate-100 dark:border-[#333] text-center transition-colors duration-300">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 transition-colors duration-300">
                By completing a checkout, you acknowledge these terms in full.
              </p>
              <p className="text-xs text-slate-300 dark:text-gray-600 mt-2 transition-colors duration-300">© 2026 Bangalore Collective Concierge</p>
            </footer>

          </div>
        </div>
      </div>
    </main>
  );
}