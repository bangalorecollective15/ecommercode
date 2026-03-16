"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { X, Mail, Lock, Phone, ArrowRight } from "lucide-react";

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
    const tempErrors: { [key: string]: string } = {};
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!email) tempErrors.email = "Required";
    if (!password) tempErrors.password = "Required";
    if (!isLogin) {
      if (!phoneRegex.test(phone)) tempErrors.phone = "Invalid Indian phone number";
      if (password !== confirmPassword) tempErrors.confirmPassword = "Passwords match error";
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
          setErrors({ login: "Invalid credentials" });
        } else if (data.user.user_metadata?.is_blocked) {
          await supabase.auth.signOut();
          setErrors({ login: "Account blocked" });
        } else {
          toast.success("Welcome back!");
          onClose();
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { phone, is_blocked: false } },
        });

        if (error) {
          setErrors({ signup: error.message });
        } else {
          toast.success("Signup successful!");
          setIsLogin(true);
        }
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-orange-600 transition-colors bg-slate-50 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900">
              {isLogin ? "Welcome back" : "Join us"}
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
              {isLogin ? "Enter your vault details" : "Create your account today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              />
            </div>

            {/* Phone (Signup Only) */}
            {!isLogin && (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              />
            </div>

            {/* Confirm Password (Signup Only) */}
            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                {Object.values(errors)[0]}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Sign up"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-orange-600 transition-colors"
            >
              {isLogin ? "Need an account? Signup" : "Already registered? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}