"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { X, Mail, Lock, Phone, ShieldCheck, ArrowRight } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "register" | "forgot";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
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
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        toast.success("Welcome Back");
        onClose();
        
        // Redirects user directly to userinterface/home/page.tsx
        router.push("/userinterface/home");
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          setErrors({ auth: "Passwords do not match" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { phone } }
        });
        if (error) throw error;
        toast.success("Account created successfully!");
        setMode("login");
      } else if (mode === "forgot") {
        const isProd = process.env.NODE_ENV === "production";
        const baseDomain = isProd 
          ? "https://ecommercode-w89a.vercel.app" 
          : "http://localhost:3000";

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${baseDomain}/userinterface/auth/update-password`,
        });
        
        if (error) throw error;
        toast.success("Reset blueprint dispatched to email!");
        setMode("login");
      }
    } catch (err: any) {
      setErrors({ auth: err.message || "Authentication failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md transition-all duration-300">
      
      {/* Structural Core container */}
      <div className="relative w-full max-w-[1024px] h-full sm:h-[640px] bg-white dark:bg-[#111] sm:rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white/20 dark:border-[#333] animate-in fade-in zoom-in-95 duration-300">
        
        {/* DESIGN PANEL: Left side on Desktop, top header on Mobile */}
        <div className="relative w-full md:w-[45%] bg-slate-900 dark:bg-black text-white flex flex-col justify-between p-6 sm:p-8 md:p-12 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-radial-gradient from-slate-800 to-slate-950 dark:from-[#222] dark:to-black opacity-70" />
          <img 
            src="https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&q=80&w=1200" 
            alt="Texture" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-15 pointer-events-none"
          />
          
          {/* Top Brand Block */}
          <div className="relative z-10 flex items-center md:items-start justify-between md:flex-col gap-4">
            <div className="flex items-center gap-3 md:gap-0">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-inner flex items-center justify-center">
                <img src="/banglorecollectivelogo.jpg" alt="Logo" className="w-full h-full object-contain rounded-lg invert brightness-200" />
              </div>
              <div className="md:hidden">
                <p className="text-white font-bold text-sm tracking-tight">The Collective</p>
                <p className="text-brand-gold/80 font-semibold text-[10px] tracking-widest uppercase">Bangalore</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="md:hidden p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Desktop Branding Subtext Typography */}
          <div className="relative z-10 hidden md:block">
            <span className="text-[10px] font-bold tracking-[0.4em] text-brand-gold uppercase block mb-3">
              Premium Living Portal
            </span>
            <h2 className="text-3xl font-light text-white tracking-tight leading-snug">
              Elevated Spaces. <br />
              <span className="font-semibold text-white">Curated Collections.</span>
            </h2>
            <div className="w-12 h-[1px] bg-brand-gold/40 my-6" />
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Access your personalized interior portfolios, exclusive drops, and project monitoring.
            </p>
          </div>

          <div className="relative z-10 hidden md:block">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">© Bangalore Collective</p>
          </div>
        </div>

        {/* INTERACTION PANEL: Main form wrapper */}
        <div className="w-full md:w-[55%] bg-white dark:bg-black p-6 sm:p-10 md:p-12 flex flex-col justify-between overflow-y-auto flex-grow rounded-t-[24px] sm:rounded-t-none -mt-4 md:mt-0 shadow-2xl md:shadow-none relative z-20">
          
          <button 
            onClick={onClose}
            className="hidden md:flex self-end items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-[#333] text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="my-auto max-w-md w-full mx-auto">
            
            {/* Aesthetic Segment Tab Controller */}
            <div className="inline-flex p-1 bg-gray-100 dark:bg-[#111] rounded-xl mb-8 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${mode === "login" ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${mode === "register" ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                Join
              </button>
              {mode === "forgot" && (
                <span className="px-6 py-2.5 rounded-lg text-xs font-semibold tracking-wide bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shadow-inner">
                  Recovery
                </span>
              )}
            </div>

            {/* Title Greeting Header */}
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
                {mode === "login" ? "Welcome back" : mode === "register" ? "Create your portal account" : "Reset security key"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {mode === "forgot" ? "Provide your email string to establish verification vectors." : "Please enter authentication metrics to advance."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block ml-0.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#fafafa] dark:bg-[#111] border border-gray-200 dark:border-[#333] focus:border-black dark:focus:border-gray-400 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Contact Number for Registry */}
              {mode === "register" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block ml-0.5">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#fafafa] dark:bg-[#111] border border-gray-200 dark:border-[#333] focus:border-black dark:focus:border-gray-400 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Primary Password Input */}
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block ml-0.5">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors outline-none cursor-pointer"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#fafafa] dark:bg-[#111] border border-gray-200 dark:border-[#333] focus:border-black dark:focus:border-gray-400 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Verify Password Layer */}
              {mode === "register" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block ml-0.5">Confirm Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#fafafa] dark:bg-[#111] border border-gray-200 dark:border-[#333] focus:border-black dark:focus:border-gray-400 rounded-xl text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Explicit Errors Display block */}
              {errors.auth && (
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-rose-600 dark:text-rose-400 text-xs font-medium animate-in shake duration-200">
                  {errors.auth}
                </div>
              )}

              {/* Execution Action CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200 active:scale-[0.99] disabled:bg-gray-300 dark:disabled:bg-[#333] rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 mt-6 cursor-pointer"
              >
                {loading ? "Transmitting state..." : mode === "login" ? "Authorize Login" : mode === "register" ? "Generate Digital Identity" : "Transmit Link"}
                <ArrowRight size={14} className="text-brand-gold" />
              </button>

              {/* Rollback Trigger */}
              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors py-2 cursor-pointer"
                >
                  Return to secure authentication gate
                </button>
              )}
            </form>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-[#333] mt-6 md:mt-0 text-center md:text-left">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal font-medium">
              By using this gateway identity matrix, you agree to our standard terms of encryption and interaction protocols.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}