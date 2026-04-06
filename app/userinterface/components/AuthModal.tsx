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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* COMPACT WHITE GLASS BOX */}
      <div className="relative w-full max-w-[380px] bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_32px_64px_rgba(0,0,0,0.15)] rounded-[40px] overflow-hidden">
        
        {/* LIGHT REFRACTION STRETCH (Subtle Orange) */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

        <div className="p-8">
          {/* HEADER & CLOSE */}
          <div className="flex justify-between items-start mb-6">
            {/* LOGO REPLACEMENT */}
            <div className="w-16 h-16 rounded-3xl overflow-hidden border border-white shadow-lg bg-white p-1">
               <img 
                 src="/banglorecollectivelogo.jpg" 
                 alt="Bangalore Collective Logo" 
                 className="w-full h-full object-contain"
               />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-orange-600 transition-all bg-white rounded-full border border-slate-100 shadow-sm">
              <X size={16} />
            </button>
          </div>

          {/* WHITE GLASS TAB SWITCHER */}
          <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500" size={14} />
              <input
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black tracking-widest text-slate-950 focus:ring-2 focus:ring-orange-200 outline-none placeholder:text-slate-300 transition-all"
              />
            </div>

            {!isLogin && (
              <div className="relative group animate-in slide-in-from-top-2">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500" size={14} />
                <input
                  type="tel"
                  placeholder="PHONE"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black tracking-widest text-slate-950 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              </div>
            )}

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500" size={14} />
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black tracking-widest text-slate-950 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>

            {!isLogin && (
              <div className="relative group animate-in slide-in-from-top-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500" size={14} />
                <input
                  type="password"
                  placeholder="CONFIRM"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black tracking-widest text-slate-950 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              </div>
            )}

            {errors.auth && (
              <p className="text-[8px] font-black text-red-500 uppercase tracking-widest text-center py-2">{errors.auth}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-950 text-white hover:bg-orange-600 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 group"
            >
              {loading ? "..." : isLogin ? "Authorize" : "Confirm"}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="flex items-center justify-center gap-2 mt-6 opacity-60">
            <ShieldCheck size={12} className="text-slate-400" />
            <p className="text-[7px] text-black font-black uppercase tracking-[0.4em]">
              Security Handshake Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}