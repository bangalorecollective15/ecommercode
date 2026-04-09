"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { X, Mail, Lock, Phone, ArrowRight, ShieldCheck } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Identity Verified");
        onClose();
        router.refresh();
      } else {
        if (password !== confirmPassword) {
          setErrors({ auth: "Passwords Mismatch" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { phone } }
        });
        if (error) throw error;
        toast.success("Account Initialized");
        setIsLogin(true);
      }
    } catch (err: any) {
      setErrors({ auth: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
      
      {/* MASTER CONTAINER */}
      <div className="relative w-full max-w-[900px] h-fit md:h-[600px] bg-white rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
        
        {/* LEFT SIDE: LIFESTYLE & BRAND */}
        <div className="relative w-full md:w-1/2 h-[200px] md:h-full bg-brand-blue overflow-hidden">
          {/* Background Lifestyle Image */}
          <img 
            src="https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&q=80&w=1200" 
            alt="Lifestyle"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 scale-105 hover:scale-100 transition-transform duration-1000"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue via-brand-blue/40 to-transparent" />

          {/* Brand Content */}
          <div className="relative h-full p-10 flex flex-col justify-between">
            <div className="w-24 h-24 bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
  <img 
    src="/banglorecollectivelogo.jpg" 
    alt="Logo" 
    className="w-full h-full object-contain" 
  />
</div>
            
            <div className="hidden md:block">
              <h2 className="text-3xl font-black text-white leading-none tracking-tighter mb-4">
                THE <br /> <span className="text-brand-gold">COLLECTIVE</span> <br /> EXPERIENCE
              </h2>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Curated Living • Bangalore</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: AUTH FORM */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col">
          {/* Close Button */}
          <button onClick={onClose} className="self-end p-2 text-slate-300 hover:text-black transition-colors mb-4 md:mb-0">
            <X size={20} />
          </button>

          <div className="flex-1 flex flex-col justify-center">
            {/* Tab Selector */}
            <div className="flex gap-8 mb-10">
              <button 
                onClick={() => setIsLogin(true)}
                className={`text-[11px] font-black uppercase tracking-[0.3em] transition-all pb-2 border-b-2 ${isLogin ? 'border-brand-gold text-black' : 'border-transparent text-slate-300'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`text-[11px] font-black uppercase tracking-[0.3em] transition-all pb-2 border-b-2 ${!isLogin ? 'border-brand-gold text-black' : 'border-transparent text-slate-300'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={14} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-7 pr-4 py-3 border-b border-slate-100 focus:border-brand-gold bg-transparent text-[12px] font-bold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone (Register Only) */}
              {!isLogin && (
                <div className="space-y-1 animate-in fade-in slide-in-from-left-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact</label>
                  <div className="relative group">
                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={14} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-7 pr-4 py-3 border-b border-slate-100 focus:border-brand-gold bg-transparent text-[12px] font-bold outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Access</label>
                <div className="relative group">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={14} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-7 pr-4 py-3 border-b border-slate-100 focus:border-brand-gold bg-transparent text-[12px] font-bold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password (Register Only) */}
              {!isLogin && (
                <div className="space-y-1 animate-in fade-in slide-in-from-left-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Verify Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={14} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-7 pr-4 py-3 border-b border-slate-100 focus:border-brand-gold bg-transparent text-[12px] font-bold outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {errors.auth && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest py-2 italic">{errors.auth}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-black text-white hover:bg-brand-blue rounded-full font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-8"
              >
                {loading ? "PROCESSING..." : isLogin ? "AUTHORIZE" : "CREATE ACCOUNT"}
                <ArrowRight size={14} className="text-brand-gold" />
              </button>
            </form>
          </div>

          {/* Footer Footer */}
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between opacity-40">
            <p className="text-[7px] font-black uppercase tracking-[0.3em]">Secure Node 01</p>
            <ShieldCheck size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}