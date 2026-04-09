"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Search, 
  Filter, 
  Download, 
  UserX, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Users,
  Loader2
} from "lucide-react";

export default function CustomerListPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const USERS_PER_PAGE = 15;

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/customers");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBlockUser = async (userId: string, block: boolean) => {
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, block }),
    });
    fetchUsers();
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredUsers.map(u => ({
        Email: u.email,
        Phone: u.user_metadata?.phone ?? "N/A",
        CreatedAt: new Date(u.created_at).toLocaleString(),
        LastLogin: u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never",
        Status: u.user_metadata?.is_blocked ? "Blocked" : "Active",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.user_metadata?.phone ?? "").includes(search);
    const matchesStatus =
      statusFilter === "All"
        ? true
        : statusFilter === "Active"
        ? !u.user_metadata?.is_blocked
        : u.user_metadata?.is_blocked;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * USERS_PER_PAGE,
    page * USERS_PER_PAGE
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#FBFBFC]">
       <Loader2 className="w-12 h-12 text-[#c4a174] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
                <Users className="text-[#c4a174] w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Identity Governance</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Customer <span className="text-[#c4a174] italic">Database</span>
            </h1>
          </div>
          
          <button
            onClick={exportToExcel}
            className="h-14 px-8 bg-white text-[#2b2652] border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-[#c4a174] transition-all flex items-center gap-3 shadow-sm active:scale-95 group"
          >
            <Download size={18} className="text-[#c4a174] group-hover:-translate-y-0.5 transition-transform" />
            Export Archive
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={18} />
            <input
              type="text"
              placeholder="SEARCH BY EMAIL OR PHONE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-16 pl-14 pr-6 bg-white border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-[#c4a174]/5 focus:border-[#c4a174] text-xs font-black uppercase tracking-widest transition-all shadow-sm"
            />
          </div>
          
          <div className="lg:col-span-3 relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-16 pl-12 pr-10 bg-white border border-slate-100 rounded-[1.5rem] outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652] appearance-none cursor-pointer hover:border-[#c4a174] transition-all shadow-sm"
            >
              <option value="All">All Identities</option>
              <option value="Active">Active Only</option>
              <option value="Blocked">Restricted Only</option>
            </select>
          </div>

          <button
            onClick={() => { setSearch(""); setStatusFilter("All"); }}
            className="lg:col-span-1 h-16 flex items-center justify-center bg-slate-100 text-slate-400 rounded-[1.5rem] hover:bg-[#c4a174] hover:text-[#2b2652] transition-all"
            title="Reset Protocol"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">User Identity</th>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Contact Method</th>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Engagement Log</th>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Clearance</th>
                  <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedUsers.length > 0 ? paginatedUsers.map(u => (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="font-black text-sm text-[#2b2652] uppercase tracking-tight">{u.email}</div>
                      <div className="text-[10px] text-[#c4a174] font-black tracking-widest opacity-60">ID: {u.id.slice(0,8)}</div>
                    </td>
                    <td className="px-10 py-6 text-xs font-black text-slate-500 tracking-widest">
                      {u.user_metadata?.phone ?? "UNAVAILABLE"}
                    </td>
                    <td className="px-10 py-6">
                      <div className="text-[10px] font-black text-[#2b2652] uppercase tracking-tighter">Last Login: <span className="text-slate-400">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "NEVER"}</span></div>
                      <div className="text-[10px] font-black text-[#c4a174] uppercase tracking-tighter">Registered: {new Date(u.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-10 py-6">
                      {u.user_metadata?.is_blocked ? (
                        <span className="inline-flex items-center px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">Restricted</span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 bg-[#c4a174]/10 text-[#c4a174] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#c4a174]/20">Verified</span>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-end">
                        {u.user_metadata?.is_blocked ? (
                          <button
                            onClick={() => toggleBlockUser(u.id, false)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#c4a174] text-[#2b2652] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2b2652] hover:text-white transition active:scale-95 shadow-lg shadow-[#c4a174]/20"
                          >
                            <UserCheck size={14} /> Re-Authorize
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleBlockUser(u.id, true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#2b2652] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition active:scale-95 shadow-xl shadow-[#2b2652]/10"
                          >
                            <UserX size={14} /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
                      No matching records found in registry
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-12 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">
              Registry Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl disabled:opacity-20 hover:border-[#c4a174] transition shadow-sm text-[#2b2652]"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${p === page ? 'bg-[#2b2652] text-[#c4a174] shadow-xl shadow-[#2b2652]/20 scale-110' : 'bg-slate-50 text-slate-400 hover:text-[#2b2652]'}`}
                    >
                      {p.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl disabled:opacity-20 hover:border-[#c4a174] transition shadow-sm text-[#2b2652]"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}