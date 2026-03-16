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
  Users
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

  // Filter & Search logic
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
    <div className="flex items-center justify-center min-h-screen">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen space-y-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Users className="text-orange-600 w-10 h-10" />
              Customer Database
            </h1>
            <p className="text-gray-500 font-medium mt-1">Manage and monitor your user base efficiently.</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} className="text-orange-600" />
            Export Excel
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Email or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent border-2 rounded-xl focus:bg-white focus:border-orange-500 outline-none transition font-medium"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl outline-none font-bold text-sm text-gray-600 appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Blocked">Blocked Only</option>
              </select>
            </div>
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); }}
              className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-orange-100 hover:text-orange-600 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Contact</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Activity</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedUsers.map(u => (
                  <tr key={u.id} className="group hover:bg-orange-50/20 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-800">{u.email}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {u.id.slice(0,8)}</div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-600">
                      {u.user_metadata?.phone ?? "—"}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-gray-700">Last: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}</div>
                      <div className="text-[10px] text-gray-400">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-8 py-5">
                      {u.user_metadata?.is_blocked ? (
                        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase">Blocked</span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Active</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end">
                        {u.user_metadata?.is_blocked ? (
                          <button
                            onClick={() => toggleBlockUser(u.id, false)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 transition active:scale-95"
                          >
                            <UserCheck size={14} /> Unblock
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleBlockUser(u.id, true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition active:scale-95 shadow-md shadow-orange-100"
                          >
                            <UserX size={14} /> Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-white transition shadow-sm"
              >
                <ChevronLeft size={20} className="text-orange-600" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${p === page ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-gray-50 text-gray-500 hover:bg-orange-50'}`}
                    >
                      {p}
                    </button>
                  );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-white transition shadow-sm"
              >
                <ChevronRight size={20} className="text-orange-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}