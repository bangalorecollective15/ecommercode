"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  UserPlus, 
  Pencil, 
  ShieldCheck, 
  X, 
  Mail, 
  Lock,
  AlertTriangle,
  UserCircle,
  Loader2,
  Key
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Subadmin {
  id: string;
  email: string;
  password: string;
  created_at: string;
}

export default function SubadminSettings() {
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [selectedSubadmin, setSelectedSubadmin] = useState<Subadmin | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subadmin | null>(null);

  const fetchSubadmins = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("subadmins")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to fetch subadmins");
    else setSubadmins(data || []);
    setFetching(false);
  };

  useEffect(() => {
    fetchSubadmins();
  }, []);

  const openForm = (subadmin?: Subadmin) => {
    if (subadmin) {
      setSelectedSubadmin(subadmin);
    } else {
      setSelectedSubadmin({
        id: "",
        email: "",
        password: "",
        created_at: new Date().toISOString(),
      });
    }
    setShowPassword(false);
  };

  const saveSubadmin = async () => {
    if (!selectedSubadmin || !selectedSubadmin.email || !selectedSubadmin.password) {
      return toast.error("Please fill in all fields");
    }
    setLoading(true);

    try {
      if (selectedSubadmin.id) {
        const { error } = await supabase
          .from("subadmins")
          .update({
            email: selectedSubadmin.email,
            password: selectedSubadmin.password,
          })
          .eq("id", selectedSubadmin.id);
        if (error) throw error;
        toast.success("Identity profile updated");
      } else {
        const { error } = await supabase.from("subadmins").insert({
          email: selectedSubadmin.email,
          password: selectedSubadmin.password,
          role: "subadmin",
        });
        if (error) throw error;
        toast.success("New administrative access granted");
      }
      fetchSubadmins();
      setSelectedSubadmin(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubadmin = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("subadmins").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Deauthorization failed");
    else {
      toast.success("Access revoked successfully");
      fetchSubadmins();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white p-6 md:p-10">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
              <ShieldCheck className="text-[#c4a174] w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Security Governance</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Staff <span className="text-[#c4a174] italic">Registry</span>
          </h1>
        </div>

        <button
          onClick={() => openForm()}
          className="h-14 px-8 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition-all flex items-center gap-3 shadow-xl shadow-[#2b2652]/10 active:scale-95 group"
        >
          <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
          Authorize New Staff
        </button>
      </div>

      {/* Staff Table Card */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Administrative Identity</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Access Tier</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Operational Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fetching ? (
                <tr>
                  <td colSpan={3} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-[#c4a174] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : subadmins.length > 0 ? (
                subadmins.map((s) => (
                  <tr key={s.id} className="group hover:bg-[#c4a174]/5 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#2b2652] flex items-center justify-center text-[#c4a174] font-black text-lg shadow-md group-hover:scale-110 transition-transform">
                          {s.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-sm text-[#2b2652] uppercase tracking-tight">{s.email}</div>
                          <div className="text-[9px] text-slate-400 font-black tracking-widest mt-1 uppercase">Created: {new Date(s.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="inline-flex items-center px-4 py-1.5 bg-[#c4a174]/10 text-[#c4a174] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#c4a174]/20">
                        Level II Subadmin
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => openForm(s)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-[#2b2652] hover:border-[#c4a174] rounded-xl transition-all shadow-sm"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(s)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
                    No administrative accounts found in registry
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {selectedSubadmin && (
        <div className="fixed inset-0 bg-[#2b2652]/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#c4a174] font-black uppercase tracking-[0.3em]">Access Protocol</span>
                <h3 className="text-2xl font-black text-[#2b2652] uppercase tracking-tighter mt-1">
                  {selectedSubadmin.id ? "Modify Profile" : "Register Staff"}
                </h3>
              </div>
              <button onClick={() => setSelectedSubadmin(null)} className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-[#2b2652] hover:text-[#c4a174] transition-all group">
                <X size={20} className="text-slate-400 group-hover:text-inherit" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              {/* Email */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Secure Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={18} />
                  <input
                    type="email"
                    value={selectedSubadmin.email}
                    onChange={(e) => setSelectedSubadmin({ ...selectedSubadmin, email: e.target.value })}
                    placeholder="ADMIN@COLLECTIVE.COM"
                    className="w-full h-16 pl-16 pr-6 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-xs uppercase tracking-widest"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Access Cipher</label>
                <div className="relative group">
                  <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={selectedSubadmin.password}
                    onChange={(e) => setSelectedSubadmin({ ...selectedSubadmin, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-16 pl-16 pr-16 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#c4a174] outline-none transition font-black text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2b2652] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button
                onClick={saveSubadmin}
                disabled={loading}
                className="flex-[2] h-16 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#c4a174] hover:text-[#2b2652] shadow-xl shadow-[#2b2652]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit Changes"}
              </button>
              <button
                onClick={() => setSelectedSubadmin(null)}
                className="flex-1 h-16 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:border-[#2b2652] hover:text-[#2b2652] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#2b2652]/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-2xl shadow-red-200">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-2xl font-black text-[#2b2652] uppercase tracking-tighter mb-2">Revoke Access?</h2>
            <p className="text-[11px] text-slate-400 mb-10 font-bold uppercase tracking-wide leading-relaxed">
              Permanent deauthorization of <br/>
              <span className="text-[#2b2652]">{deleteTarget.email}</span>. <br/>
              This action is irreversible.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={deleteSubadmin} 
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-200"
              >
                Revoke
              </button>
              <button 
                onClick={() => setDeleteTarget(null)} 
                className="flex-1 py-4 bg-slate-100 text-[#2b2652] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}