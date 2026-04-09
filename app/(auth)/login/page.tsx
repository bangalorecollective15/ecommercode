"use client";

import { Eye, EyeOff, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("subadmins")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data || data.password !== password) {
        toast.error("Invalid Credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      toast.success("Identity Verified");
      router.push("/dashboard");
    } catch (err) {
      toast.error("System Error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fcfcfc] p-4 selection:bg-brand-gold/30 selection:text-brand-blue">
      <Toaster position="top-center" />
      
      {/* Container */}
      <div className="flex w-full max-w-md lg:max-w-4xl bg-white rounded-[2.5rem] overflow-hidden lg:h-[580px] shadow-[0_30px_80px_-20px_rgba(43,38,82,0.15)] border border-slate-50">
        
        {/* LEFT SIDE: LOGIN FORM */}
        <div className="w-full lg:w-[45%] p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-[300px] mx-auto">
            <header className="mb-10 text-center lg:text-left">
              <div className="mb-8 flex justify-center lg:justify-start">
                <img 
                  src="/banglorecollectivelogo.jpg" 
                  alt="Logo" 
                  className="h-12 w-auto object-contain" 
                  style={{ filter: 'contrast(1.1)' }}
                />
              </div>
              <h1 className="text-2xl font-black text-brand-blue tracking-tighter mb-1 uppercase">Vault Access</h1>
              <p className="text-brand-gold text-[9px] font-black uppercase tracking-[0.3em]">Restricted Admin Portal</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs font-bold text-brand-blue transition-all focus:bg-white focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 outline-none placeholder:text-slate-300"
                  placeholder="admin@exclusive.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Keyphrase</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs font-bold text-brand-blue transition-all focus:bg-white focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full mt-4 py-4 bg-brand-blue text-white font-black rounded-2xl shadow-xl shadow-brand-blue/20 hover:bg-brand-blue/95 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 tracking-[0.2em] uppercase text-[10px]"
              >
                {loading ? "Verifying..." : <>Secure Entry <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>

            <footer className="mt-10 flex items-center justify-center lg:justify-start gap-2 text-slate-300">
              <Lock size={12} className="text-brand-gold" />
              <span className="text-[9px] font-black uppercase tracking-widest">Encrypted Admin Session</span>
            </footer>
          </div>
        </div>

        {/* RIGHT SIDE: BRANDED VISUAL */}
        <div className="hidden lg:block lg:w-[55%] relative">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
            alt="Luxury Retail" 
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.7] contrast-125"
          />
          {/* Brand Color Overlay */}
          <div className="absolute inset-0 bg-brand-blue/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-transparent to-transparent opacity-80" />
          
          <div className="absolute bottom-12 left-12 right-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[1px] w-12 bg-brand-gold" />
              <p className="text-brand-gold font-black tracking-[0.5em] text-[8px] uppercase">Bangalore Collective</p>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.9] uppercase">
              Curation <br /> <span className="text-brand-gold">Redefined.</span>
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
}