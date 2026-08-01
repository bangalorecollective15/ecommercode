"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { ShieldCheck, Lock } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Confirm the recovery token successfully initialized a live session context
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setHasSession(true);
      } else {
        toast.error("Recovery token expired or invalid.");
        router.push("/");
      }
    };
    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords Mismatch");
      return;
    }

    setLoading(true);

    try {
      // Updates the user account password using the session active from the clicked link
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Security Credentials Updated!");
      router.push("/"); // Redirect safely to home or dashboard
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent UI flickering while checking session parameters
  if (!hasSession && !loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 dark:bg-black/90 backdrop-blur-2xl text-white text-[10px] tracking-[0.4em] font-black uppercase transition-colors duration-300">
        Verifying Security Routing Token...
      </div>
    );
  }

  return (
    /* FULL SCREEN BLURRED BACKGROUND CONTEXT OVERLAY */
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500 transition-colors duration-300">
      
      {/* FORM INTERACTIVE CARD CONTAINER */}
      <div className="w-full max-w-md bg-white dark:bg-[#111] rounded-[40px] p-8 md:p-12 shadow-[0_40px_80px_rgba(0,0,0,0.5)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.8)] space-y-6 transform animate-in slide-in-from-bottom-4 duration-500 transition-colors duration-300">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-black dark:text-white leading-none transition-colors duration-300">New Secret Access</h2>
          <p className="text-[11px] font-medium text-slate-400 dark:text-gray-500 mt-2 transition-colors duration-300">
            Re-initialize your security variables to restore system dashboard permissions.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          {/* Main Password Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors duration-300">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 dark:text-gray-600 group-focus-within:text-brand-gold transition-colors duration-300" size={14} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-7 pr-4 py-3 border-b border-slate-100 dark:border-[#333] focus:border-black dark:focus:border-white bg-transparent text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-gray-600 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors duration-300">Verify Password</label>
            <div className="relative group">
              <ShieldCheck className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 dark:text-gray-600 group-focus-within:text-brand-gold transition-colors duration-300" size={14} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-7 pr-4 py-3 border-b border-slate-100 dark:border-[#333] focus:border-black dark:focus:border-white bg-transparent text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-gray-600 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Dynamic Password Validation Hint */}
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest italic animate-in fade-in duration-200">
              * Passwords Mismatch
            </p>
          )}

          {/* Action Submission Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-black dark:bg-white text-white dark:text-black hover:bg-slate-900 dark:hover:bg-gray-200 disabled:bg-slate-200 dark:disabled:bg-[#333] dark:disabled:text-gray-500 rounded-full font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all duration-300 active:scale-[0.98] mt-4"
          >
            {loading ? "SAVING STRUCTURE..." : "CONFIRM NEW CREDENTIALS"}
          </button>
        </form>
      </div>
    </div>
  );
}