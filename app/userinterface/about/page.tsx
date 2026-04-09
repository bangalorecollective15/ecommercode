"use client";

import React, { useState } from "react";
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
    <div className="bg-[#f8fafc] min-h-screen pb-20 selection:bg-brand-gold/20 overflow-hidden font-sans relative">
      
      {/* ☁️ AMBIENT BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        
        {/* --- 1. HERO SECTION (Updated for Bangalore Collective Only) --- */}
        <section className="pt-32 md:pt-48 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-12 bg-brand-gold"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold">Est. 2026 • Bengaluru</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-brand-blue uppercase">
                BANGALORE <br /> <span className="text-slate-300/60">COLLECTIVE.</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm">
                A sanctuary for the modern minimalist, delivering premium lifestyle essentials from the heart of the city.
              </p>
            </div>
            
            <div className="relative group">
              <div className="aspect-[4/5] md:aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white/50">
                <img 
                  src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  alt="Storefront"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/40 to-transparent" />
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
            <div className="md:col-span-8 bg-white/40 backdrop-blur-2xl border border-white/80 rounded-[3.5rem] p-10 md:p-20 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <Sparkles className="text-brand-gold mb-8" size={24} />
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-brand-blue leading-none mb-8 uppercase">
                  Quality <br/> <span className="text-brand-gold">Reimagined.</span>
                </h2>
                <p className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                  We are more than a destination—we are curators. Every piece in our collection is a testament to 
                  <span className="text-brand-blue font-bold px-2">thoughtful design</span> 
                  and urban sophistication.
                </p>
              </div>
              <div className="absolute bottom-[-10%] right-[-5%] text-[15rem] font-black text-brand-gold/5 pointer-events-none">BC</div>
            </div>

            <div className="md:col-span-4 bg-brand-blue rounded-[3.5rem] p-10 text-white flex flex-col justify-between shadow-xl">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Target className="text-brand-gold" size={28} />
              </div>
              <div className="mt-20">
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Our Mission</h3>
                <p className="text-white/60 text-sm leading-relaxed font-medium">
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
                <h2 className="text-5xl font-black tracking-tighter text-brand-blue">LET'S TALK.</h2>
                <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-widest">Reach out to the collective</p>
              </div>

              <div className="space-y-4">
                <ContactInfoIcon icon={<MapPin size={18}/>} label="Visit Us" value="Jayanagar, Bengaluru, 560070" color="bg-brand-gold/10 text-brand-gold" />
                <ContactInfoIcon icon={<Mail size={18}/>} label="Email" value="hello@bangalorecollective.com" color="bg-brand-blue/10 text-brand-blue" />
                <ContactInfoIcon icon={<Phone size={18}/>} label="Call" value="+91 90608 89995" color="bg-slate-100 text-slate-600" />
              </div>
              
              <div className="h-[280px] w-full rounded-[3rem] overflow-hidden border-8 border-white shadow-lg grayscale opacity-70">
                 <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15554.498845899999!2d77.58!3d12.93!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1590!2sJayanagar%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-8 md:p-14 rounded-[4rem] shadow-2xl border border-white">
              {submitted ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 animate-bounce"><CheckCircle2 size={40}/></div>
                  <h3 className="text-2xl font-black text-brand-blue">Message Received!</h3>
                  <button onClick={() => setSubmitted(false)} className="text-brand-gold font-black text-[10px] uppercase tracking-widest hover:underline">Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <FormInput label="Your Name" placeholder="Full Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
                  <FormInput label="Email" placeholder="example@mail.com" type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Message</label>
                    <textarea required rows={4} placeholder="Tell us something..." value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-white border border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-bold focus:ring-4 focus:ring-brand-gold/10 outline-none transition-all resize-none" />
                  </div>
                  <button disabled={loading} className="w-full py-5 bg-brand-blue text-white rounded-full font-black text-[10px] tracking-[0.3em] hover:bg-brand-gold transition-all shadow-xl flex items-center justify-center gap-4 group">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>DISPATCH <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={14}/></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* --- 4. GALLERY --- */}
        <section className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 relative rounded-[3rem] overflow-hidden aspect-[4/3] md:aspect-auto border-[10px] border-white shadow-xl group">
              <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" alt="Gallery" />
              <div className="absolute top-8 left-8"><span className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full text-[9px] font-black tracking-widest uppercase">The Collection</span></div>
            </div>
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-brand-gold rounded-[3rem] p-10 text-white flex-1 flex flex-col justify-center">
                <Star className="text-white/30 mb-4" fill="currentColor" size={24} />
                <h3 className="text-3xl font-black tracking-tighter leading-none uppercase">Simply <br /> Timeless.</h3>
              </div>
              <div className="rounded-[3rem] overflow-hidden aspect-square flex-1 border-[10px] border-white shadow-xl">
                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Fashion" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function ContactInfoIcon({ icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-6 p-6 bg-white/50 backdrop-blur-md border border-white rounded-[2.5rem] shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-brand-blue">{value}</p>
      </div>
    </div>
  );
}

function FormInput({ label, placeholder, type = "text", value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
      <input 
        required 
        type={type} 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-100 rounded-full px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-brand-gold/10 outline-none transition-all" 
      />
    </div>
  );
}