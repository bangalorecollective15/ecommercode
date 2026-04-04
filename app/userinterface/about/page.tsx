"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { 
  Target, 
  MapPin, 
  Star, 
  ArrowUpRight,
  Sparkles,
  Quote,
  Mail,
  Phone,
  Send,
  Loader2,
  CheckCircle2
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AboutUsPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

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
    <div className="bg-[#fcfcfc] min-h-screen pb-10 selection:bg-orange-100 overflow-hidden font-sans">
      
      {/* --- 1. HERO SECTION --- */}
     {/* --- 1. HERO SECTION --- */}
<section className="relative pt-40 pb-12 px-6 md:px-12 max-w-[1400px] mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 z-10 text-left">
            <div className="flex items-center gap-3">
              <div className="h-[1.5px] w-8 bg-orange-600"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600">Established 2026</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-slate-900">
              BANGALORE <br /> <span className="text-slate-300">COLLECTIVE.</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm">
              A destination born in the heart of the city, bringing premium lifestyle essentials to the modern individual.
            </p>
          </div>
          <div className="relative group">
            <div className="relative aspect-square md:aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070" className="w-full h-full object-cover transition-all duration-1000 scale-105 group-hover:scale-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white">
                <MapPin size={14} className="text-orange-500" />
                <p className="font-black text-[10px] tracking-widest uppercase">The Heart of Bangalore</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. THE CURATORS --- */}
      <section className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <div className="md:col-span-8 relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-white/80 to-white/20 backdrop-blur-3xl border border-white/60 p-10 md:p-16 shadow-xl">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-10"><Sparkles className="text-slate-900" size={20} /><span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">Our Identity</span></div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-none">WE ARE THE <br/> <span className="text-orange-600">CURATORS.</span></h2>
              <p className="text-slate-600 text-xl font-medium leading-relaxed max-w-xl mt-6">Born in Bangalore, we are more than just a fashion destination—we are a curated lifestyle brand reflecting <span className="text-slate-900 font-bold underline decoration-orange-400/50">quality and trend-forward design.</span></p>
            </div>
          </div>
          <div className="md:col-span-4 bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <Target className="text-orange-500 mb-8" size={32} />
            <div>
              <h3 className="text-2xl font-black mb-4">OUR MISSION</h3>
              <p className="text-white/50 text-sm font-medium">To become a trusted global name by delivering exceptional collections while ensuring affordability and reliability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. THE CONTACT US SECTION (New) --- */}
      <section className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Left: Info */}
          <div className="space-y-10">
            <div>
              <h2 className="text-5xl font-black tracking-tighter">CONTACT US.</h2>
              <p className="text-slate-400 font-medium mt-2">Get in touch — We're here to help.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600"><MapPin size={20}/></div>
                <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Address</p><p className="text-sm font-bold">7th Block, Jayanagar, Bengaluru, 560070</p></div>
              </div>
              <div className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900"><Mail size={20}/></div>
                <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</p><p className="text-sm font-bold">bangalorecollective15@gmail.com</p></div>
              </div>
              <div className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white"><Phone size={20}/></div>
                <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone</p><p className="text-sm font-bold">+91 9060889995</p></div>
              </div>
            </div>

            <div className="h-[250px] w-full rounded-[2.5rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 shadow-xl border-4 border-white">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15554.49841655077!2d77.57041445546875!3d12.932786300000005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15be42036737%3A0xc395b0c950d65a88!2s7th%20Block%2C%20Jayanagar%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1712128000000!5m2!1sen!2sin" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-slate-50 relative">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500"><CheckCircle2 size={40}/></div>
                <h3 className="text-2xl font-black">Message Sent!</h3>
                <p className="text-slate-400 text-sm">We'll get back to you shortly.</p>
                <button onClick={() => setSubmitted(false)} className="text-orange-600 font-black text-xs uppercase tracking-widest pt-4">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Your Name</label>
                  <input required type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 rounded-full px-8 py-5 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                  <input required type="email" placeholder="example@mail.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 rounded-full px-8 py-5 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Message</label>
                  <textarea required rows={5} placeholder="How can we help?" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-slate-50 rounded-[2rem] px-8 py-6 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none" />
                </div>
                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-full font-black text-xs tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center gap-4">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <>SUBMIT <Send size={14}/></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- 4. THE GALLERY --- */}
      <section className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <div className="md:col-span-8 relative rounded-[2.5rem] overflow-hidden group shadow-xl aspect-square md:aspect-auto">
            <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20" />
            <div className="absolute top-6 left-6 md:top-10 md:left-10"><span className="bg-white/90 backdrop-blur-md text-black px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase">The Collection</span></div>
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10"><h3 className="text-white text-4xl md:text-5xl font-black tracking-tighter leading-none">Simply <br /> Shimmering.</h3></div>
          </div>
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-orange-600 rounded-[2.5rem] p-8 flex flex-col justify-center text-white min-h-[220px] md:flex-1"><Star className="text-white/40 mb-4" fill="currentColor" size={24} /><p className="font-black text-2xl tracking-tighter">Something shiny, <br /> everything you.</p></div>
            <div className="rounded-[2.5rem] overflow-hidden shadow-lg aspect-square md:flex-1"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" /></div>
          </div>
        </div>
      </section>

      {/* --- 5. CTA --- */}
      <section className="px-6 py-12">
        <div className="max-w-[1400px] mx-auto backdrop-blur-3xl bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase">JOIN THE <br/> <span className="text-orange-500">COLLECTIVE.</span></h2>
<Link href="/userinterface/Gproducts/">
  <button className="group relative px-12 py-5 bg-white text-slate-900 rounded-full font-black text-[11px] tracking-[0.2em] overflow-hidden transition-all shadow-xl">
    {/* The span keeps the text above the sliding background */}
    <span className="relative z-10 group-hover:text-white transition-colors duration-300">
      START SHOPPING
    </span>
    
    {/* This div is your orange hover slide-up effect */}
    <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
  </button>
</Link>
          </div>
        </div>
      </section>
    </div>
  );
}