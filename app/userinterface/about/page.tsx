"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Target,
  MapPin,
  Star,
  Sparkles,
  Mail,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AboutUsPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  // --- DATABASE STATES ---
  const [longDescription, setLongDescription] = useState<string>(
    "A sanctuary for the modern minimalist, delivering premium lifestyle essentials from the heart of the city."
  );
  const [topImageUrl, setTopImageUrl] = useState<string>(
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070"
  );
  const [bottomTitle, setBottomTitle] = useState<string>("Simply \n Timeless.");
  const [bottomImageUrl1, setBottomImageUrl1] = useState<string>(
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070"
  );
  const [bottomImageUrl2, setBottomImageUrl2] = useState<string>(
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
  );

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        const { data, error } = await supabase
          .from("site_info")
          .select("long_description, top_image_url, bottom_title, bottom_image_url_1, bottom_image_url_2")
          .eq("id", 1)
          .single();

        if (data && !error) {
          if (data.long_description) setLongDescription(data.long_description);
          if (data.top_image_url) setTopImageUrl(data.top_image_url);
          if (data.bottom_title) setBottomTitle(data.bottom_title);
          if (data.bottom_image_url_1) setBottomImageUrl1(data.bottom_image_url_1);
          if (data.bottom_image_url_2) setBottomImageUrl2(data.bottom_image_url_2);
        }
      } catch (err) {
        console.error("Failed loading about-us live parameters:", err);
      }
    };

    fetchSiteData();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("contact_messages")
      .insert([{ ...formData }]);

    if (!error) {
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-black min-h-screen pb-20 selection:bg-brand-gold/20 overflow-hidden font-sans relative transition-colors duration-300">

      {/* ☁️ AMBIENT BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/5 dark:bg-white/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">

        {/* --- 1. HERO SECTION --- */}
        <section className="pt-32 md:pt-48 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-12 bg-brand-gold"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold">Est. 2018 • Bengaluru</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-brand-blue dark:text-white uppercase transition-colors duration-300">
                BANGALORE <br /> <span className="text-slate-300/60 dark:text-gray-600">COLLECTIVE.</span>
              </h1>
              <p className="text-slate-500 dark:text-gray-400 text-lg font-medium leading-relaxed max-w-sm transition-colors duration-300">
                {longDescription}
              </p>
            </div>

            <div className="relative group">
              <div className="aspect-[4/5] md:aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white/50 dark:border-[#222]/50 transition-colors duration-300">
                <img
                  src={topImageUrl}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  alt="Storefront"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/40 dark:from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8 flex items-center gap-2 text-white">
                  <MapPin size={16} className="text-brand-gold" />
                  <p className="font-bold text-[10px] tracking-widest uppercase">The Heart of Bangalore</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 2. THE IDENTITY --- */}
        <section className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-white/40 dark:bg-[#111]/40 backdrop-blur-2xl border border-white/80 dark:border-[#333]/80 rounded-[3.5rem] p-10 md:p-20 shadow-sm relative overflow-hidden transition-colors duration-300">
              <div className="relative z-10">
                <Sparkles className="text-brand-gold mb-8" size={24} />
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-brand-blue dark:text-white leading-none mb-8 uppercase transition-colors duration-300">
                  Quality <br /> <span className="text-brand-gold">Reimagined.</span>
                </h2>
                <p className="text-slate-600 dark:text-gray-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl transition-colors duration-300">
                  We are more than a destination—we are curators. Every piece in our collection is a testament to
                  <span className="text-brand-blue dark:text-white font-bold px-2 transition-colors duration-300">thoughtful design</span>
                  and urban sophistication.
                </p>
              </div>
              <div className="absolute bottom-[-10%] right-[-5%] text-[15rem] font-black text-brand-gold/5 pointer-events-none">BC</div>
            </div>

            <div className="md:col-span-4 bg-brand-blue dark:bg-[#111] rounded-[3.5rem] p-10 text-white flex flex-col justify-between shadow-xl transition-colors duration-300">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Target className="text-brand-gold" size={28} />
              </div>
              <div className="mt-20">
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Our Mission</h3>
                <p className="text-white/60 dark:text-gray-400 text-sm leading-relaxed font-medium transition-colors duration-300">
                  To elevate daily living through collections that balance global trends with local reliability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 3. CONTACT SECTION --- */}
        <section className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-10">
              <div>
                <h2 className="text-5xl font-black tracking-tighter text-brand-blue dark:text-white transition-colors duration-300">LET'S TALK.</h2>
                <p className="text-slate-400 dark:text-gray-500 font-bold mt-2 uppercase text-[10px] tracking-widest">Reach out to the collective</p>
              </div>

              <div className="space-y-4">
                <ContactInfoIcon icon={<MapPin size={18} />} label="Visit Us" value="Jayanagar, Bengaluru, 560070" color="bg-brand-gold/10 text-brand-gold" />
                <ContactInfoIcon icon={<Mail size={18} />} label="Email" value="bangalorecollective15@gmail.com" color="bg-brand-blue/10 text-brand-blue dark:text-blue-400" />
                <ContactInfoIcon icon={<Phone size={18} />} label="Call" value="+91 90608 89995" color="bg-slate-100 dark:bg-[#222] text-slate-600 dark:text-gray-300" />
              </div>
            </div>

            <div className="bg-white/60 dark:bg-[#111]/60 backdrop-blur-xl p-8 md:p-14 rounded-[4rem] shadow-2xl border border-white dark:border-[#333] transition-colors duration-300">
              {submitted ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500 animate-bounce"><CheckCircle2 size={40} /></div>
                  <h3 className="text-2xl font-black text-brand-blue dark:text-white transition-colors duration-300">Message Received!</h3>
                  <button onClick={() => setSubmitted(false)} className="text-brand-gold font-black text-[10px] uppercase tracking-widest hover:underline">Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <FormInput label="Your Name" placeholder="Full Name" value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} />
                  <FormInput label="Email" placeholder="example@mail.com" type="email" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-4">Message</label>
                    <textarea 
                      required 
                      rows={4} 
                      placeholder="Tell us something..." 
                      value={formData.message} 
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
                      className="w-full bg-white dark:bg-black border border-slate-100 dark:border-[#333] rounded-[2rem] px-8 py-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:ring-4 focus:ring-brand-gold/10 outline-none transition-all resize-none" 
                    />
                  </div>
                  <button disabled={loading} className="w-full py-5 bg-brand-blue dark:bg-white text-white dark:text-black rounded-full font-black text-[10px] tracking-[0.3em] hover:bg-brand-gold dark:hover:bg-brand-gold dark:hover:text-white transition-all shadow-xl flex items-center justify-center gap-4 group">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>DISPATCH <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={14} /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* --- 4. GALLERY (Asymmetric Luxury Masonry Layout) --- */}
        <section className="py-12 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:auto-rows-[240px]">

            {/* Left Image Side */}
            <div className="md:col-span-7 md:row-span-2 relative rounded-[2.5rem] overflow-hidden border-[8px] border-white dark:border-black shadow-xl group min-h-[350px] md:min-h-0 transition-colors duration-300">
              <img
                src={bottomImageUrl1}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                alt="The Main Collection Gallery"
              />
              <div className="absolute top-6 left-6">
                <span className="bg-white/90 dark:bg-black/90 backdrop-blur-md px-5 py-2 rounded-full text-[9px] font-black tracking-widest uppercase text-brand-blue dark:text-white transition-colors duration-300">
                  The Collection
                </span>
              </div>
            </div>

            {/* Premium Typography Statement Card */}
            <div className="md:col-span-5 md:row-span-1 bg-brand-gold rounded-[2.5rem] p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-xl min-h-[180px] md:min-h-0">
              <div className="relative z-10">
                <Star className="text-white/20 mb-3" fill="currentColor" size={20} />
                <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none whitespace-pre-line">
                  {bottomTitle}
                </h3>
              </div>
              <div className="absolute right-[-10%] bottom-[-20%] text-[8rem] font-black text-white/5 select-none pointer-events-none">
                ★
              </div>
            </div>

            {/* Secondary Image Card */}
            <div className="md:col-span-5 md:row-span-1 relative rounded-[2.5rem] overflow-hidden border-[8px] border-white dark:border-black shadow-xl group min-h-[220px] md:min-h-0 transition-colors duration-300">
              <img
                src={bottomImageUrl2}
                className="w-full h-full object-cover contrast-[1.05] transition-all duration-[1s] ease-in-out"
                alt="Fashion Minimalist Details"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

function ContactInfoIcon({ icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-6 p-6 bg-white/50 dark:bg-[#111]/50 backdrop-blur-md border border-white dark:border-[#333] rounded-[2.5rem] shadow-sm transition-colors duration-300">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-brand-blue dark:text-white transition-colors duration-300">{value}</p>
      </div>
    </div>
  );
}

function FormInput({ label, placeholder, type = "text", value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-4">{label}</label>
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-black border border-slate-100 dark:border-[#333] rounded-full px-8 py-5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:ring-4 focus:ring-brand-gold/10 outline-none transition-all"
      />
    </div>
  );
}