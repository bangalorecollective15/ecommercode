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
  UserCircle
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
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subadmin | null>(null);

  const fetchSubadmins = async () => {
    const { data, error } = await supabase
      .from("subadmins")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to fetch subadmins");
    else setSubadmins(data || []);
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
        toast.success("Account updated successfully");
      } else {
        const { error } = await supabase.from("subadmins").insert({
          email: selectedSubadmin.email,
          password: selectedSubadmin.password,
          role: "subadmin",
        });
        if (error) throw error;
        toast.success("New subadmin created");
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
    if (error) toast.error("Delete failed");
    else {
      toast.success("Subadmin removed");
      fetchSubadmins();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="max-w-8xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-orange-600 w-10 h-10" />
            Subadmin Management
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage staff credentials and access control.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          Add New Staff
        </button>
      </div>

      {/* Staff Table Card */}
      <div className="max-w-8xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Account Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subadmins.map((s) => (
                <tr key={s.id} className="group hover:bg-orange-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                        {s.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800">{s.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-tighter border border-orange-200">
                      Staff Admin
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openForm(s)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-xl transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(s)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {selectedSubadmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                  {selectedSubadmin.id ? "Edit Account" : "Register Staff"}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Admin Access Setup</p>
              </div>
              <button onClick={() => setSelectedSubadmin(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 text-gray-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                  <input
                    type="email"
                    value={selectedSubadmin.email}
                    onChange={(e) => setSelectedSubadmin({ ...selectedSubadmin, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="w-full bg-gray-50 border-2 border-gray-50 p-4 pl-12 rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition font-medium text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 text-gray-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={selectedSubadmin.password}
                    onChange={(e) => setSelectedSubadmin({ ...selectedSubadmin, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border-2 border-gray-50 p-4 pl-12 pr-12 rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={saveSubadmin}
                disabled={loading}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Account"}
              </button>
              <button
                onClick={() => setSelectedSubadmin(null)}
                className="px-8 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Delete Access?</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              Are you sure you want to remove <strong>{deleteTarget.email}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={deleteSubadmin} 
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-100"
              >
                Delete
              </button>
              <button 
                onClick={() => setDeleteTarget(null)} 
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}