"use client";

import { Users, Gem, Globe2, ArrowUpRight, Instagram } from "lucide-react";
import OptimizedImage from "@/app/userinterface/components/OptimizedImage";

interface CommunityStatsProps {
  data: any;
}

export default function CommunityStats({ data }: CommunityStatsProps) {
  return (
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
                    <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                      {data.stat1_value || "10,000+"}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">
                      {data.stat1_label || "Trusted Customers"}
                    </p>
                  </div>
                </div>
                <div className="group space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] text-slate-900 dark:text-white flex items-center justify-center transition-colors group-hover:border-orange-600/30 group-hover:bg-orange-50/20 dark:group-hover:bg-orange-900/20">
                    <Users size={16} className="text-slate-800 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                      {data.stat2_value || "Premium"}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">
                      {data.stat2_label || "Quality Craftsmanship"}
                    </p>
                  </div>
                </div>
                <div className="group space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] text-slate-900 dark:text-white flex items-center justify-center transition-colors group-hover:border-orange-600/30 group-hover:bg-orange-50/20 dark:group-hover:bg-orange-900/20">
                    <Gem size={16} className="text-slate-800 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                      {data.stat3_value || "Luxury"}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">
                      {data.stat3_label || "Made Affordable"}
                    </p>
                  </div>
                </div>
                <div className="group space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] text-slate-900 dark:text-white flex items-center justify-center transition-colors group-hover:border-orange-600/30 group-hover:bg-orange-50/20 dark:group-hover:bg-orange-900/20">
                    <Globe2 size={16} className="text-slate-800 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-tight">
                      {data.stat4_value || "Fast & Secure"}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">
                      {data.stat4_label || "Worldwide Shipping"}
                    </p>
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
  );
}