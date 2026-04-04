"use client";

import { Eye, EyeOff, RefreshCw, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateCaptcha(length = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => setCaptchaValue(generateCaptcha()), []);

  const refreshCaptcha = () => {
    setCaptchaValue(generateCaptcha());
    setCaptcha("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captcha.toUpperCase() !== captchaValue.toUpperCase()) {
      toast.error("Code Mismatch");
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subadmins")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data || data.password !== password) {
        toast.error("Access Denied");
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f8f8] p-4 selection:bg-black selection:text-white">
      <Toaster position="top-center" />
      
      {/* Small, Compact Container (Reduced Height) */}
      <div className="flex w-full max-w-md lg:max-w-4xl bg-white rounded-3xl overflow-hidden lg:h-[580px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] border border-gray-100">
        
        {/* LEFT SIDE: COMPACT FORM */}
        <div className="w-full lg:w-[45%] p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="w-full max-w-[280px] mx-auto">
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="mb-8 flex justify-center lg:justify-start">
                <img 
                  src="/banglorecollectivelogo.jpg" 
                  alt="Logo" 
                  className="h-10 w-auto object-contain brightness-0" 
                />
              </div>
              </div>
              <h1 className="text-xl font-black text-black tracking-tighter mb-1 uppercase">Admin panel</h1>
              <p className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">Restricted Access</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Identity</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold text-black transition-all focus:bg-white focus:border-black outline-none placeholder:text-gray-300"
                  placeholder="admin@onlyyou.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold text-black transition-all focus:bg-white focus:border-black outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Human Check</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    className="w-16 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3 text-xs font-black text-center uppercase focus:border-black outline-none"
                    placeholder="CODE"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                  />
                  <div className="flex-grow flex items-center justify-between bg-black rounded-xl px-3 py-3">
                    <span className="font-mono text-xs font-black text-white tracking-[0.3em] italic select-none">
                      {captchaValue}
                    </span>
                    <button type="button" onClick={refreshCaptcha} className="text-gray-500 hover:text-white transition-colors">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full mt-2 py-3.5 bg-black text-white font-black rounded-xl shadow-lg hover:bg-zinc-800 transition-all active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-2 tracking-[0.15em] uppercase text-[9px]"
              >
                {loading ? "Verifying..." : <>Enter Portal <ArrowRight size={14} /></>}
              </button>
            </form>

            <footer className="mt-8 flex items-center gap-2 text-gray-300">
              <ShieldCheck size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Secure Admin Session</span>
            </footer>
          </div>
        </div>

        {/* RIGHT SIDE: IMAGE (DESKTOP) */}
        <div className="hidden lg:block lg:w-[55%] relative">
          <img 
            src="https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&q=80&w=1200" 
            alt="Studio" 
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-90 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-white font-black tracking-[0.4em] text-[7px] uppercase opacity-50 mb-1">OnlyYou Studio</p>
            <h2 className="text-3xl font-black text-white tracking-tighter leading-none uppercase">
              MODERN <br /> LIFESTYLE.
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
}