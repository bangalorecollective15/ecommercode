"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Mail, 
  MailOpen, 
  Clock, 
  Trash2, 
  Search, 
  Inbox,
  User,
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'unread' | 'read';
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Track runtime errors
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(`Database Error: ${error.message} (Code: ${error.code})`);
        console.error("Supabase error payload:", error);
      } else if (data) {
        setMessages(data as ContactMessage[]);
      }
    } catch (err: any) {
      setErrorMessage(`Unexpected structural crash: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);

    if (msg.status === "unread") {
      // Optimistic layout change updates
      setMessages(prev => 
        prev.map(m => m.id === msg.id ? { ...m, status: "read" } : m)
      );

      const { error } = await supabase
        .from("contact_messages")
        .update({ status: "read" })
        .eq("id", msg.id);

      if (error) {
        console.error("Failed executing database update status field sync:", error);
        fetchMessages(); // Rollback on explicit failure
      }
    }
  };

  const handleDeleteMessage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedMessage?.id === id) setSelectedMessage(null);
    setMessages(prev => prev.filter(m => m.id !== id));

    await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.message && msg.message.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesFilter = filterStatus === "all" || msg.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalUnread = messages.filter(m => m.status === "unread").length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
              Message <span className="text-[#8a6d3b]/60">DESK</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Manage operational contact responses
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/60 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex items-center gap-4 shadow-sm min-w-[140px]">
              <div className="p-3 bg-[#8a6d3b]/10 text-[#8a6d3b] rounded-xl"><Inbox size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-slate-900">{messages.length}</p>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex items-center gap-4 shadow-sm min-w-[140px]">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl"><Clock size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unread</p>
                <p className="text-xl font-black text-amber-600">{totalUnread}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RUNTIME ERROR DIAGNOSTIC PANEL --- */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 flex items-center gap-3 text-sm font-bold">
            <AlertCircle size={20} className="text-rose-500 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* --- CONTROLS --- */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/80 p-4 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search sender name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/60 rounded-full pl-12 pr-6 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#8a6d3b]/10 transition-all"
            />
          </div>

          <div className="flex bg-slate-200/60 p-1 rounded-full">
            {(["all", "unread", "read"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  filterStatus === status ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* --- WORKSPACE VIEWPORT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Master List */}
          <div className="lg:col-span-5 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white">
                <Loader2 className="animate-spin text-[#8a6d3b]" size={28} />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white space-y-2">
                <MailOpen className="mx-auto text-slate-300" size={36} />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching dispatches</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`group relative p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    selectedMessage?.id === msg.id
                      ? "bg-gradient-to-br from-[#c4a174] to-[#8a6d3b] border-[#8a6d3b] text-white shadow-lg translate-x-1"
                      : "bg-white/80 border-slate-100 hover:bg-white shadow-sm"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        msg.status === "unread"
                          ? selectedMessage?.id === msg.id ? "bg-white text-amber-600" : "bg-amber-100 text-amber-700"
                          : selectedMessage?.id === msg.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {msg.status || "unread"}
                      </span>
                      <span className={`text-[10px] font-bold ${selectedMessage?.id === msg.id ? "text-white/70" : "text-slate-400"}`}>
                        {new Date(msg.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                    </div>

                    <h3 className={`text-base font-black tracking-tight truncate ${selectedMessage?.id === msg.id ? "text-white" : "text-slate-900"}`}>
                      {msg.name}
                    </h3>
                    <p className={`text-xs font-semibold truncate ${selectedMessage?.id === msg.id ? "text-white/80" : "text-slate-400"}`}>
                      {msg.email}
                    </p>
                  </div>

                  <p className={`text-xs line-clamp-2 ${selectedMessage?.id === msg.id ? "text-white/90" : "text-slate-500 font-medium"}`}>
                    {msg.message}
                  </p>

                  <button
                    onClick={(e) => handleDeleteMessage(msg.id, e)}
                    className={`absolute right-4 bottom-4 p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${
                      selectedMessage?.id === msg.id ? "text-white/60 hover:text-white" : "text-slate-400 hover:text-rose-500"
                    }`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Details Content Panel */}
          <div className="lg:col-span-7">
            {selectedMessage ? (
              <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#8a6d3b]/10 rounded-2xl flex items-center justify-center text-[#8a6d3b]">
                      <User size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedMessage.name}</h2>
                      <a href={`mailto:${selectedMessage.email}`} className="text-xs font-bold text-[#8a6d3b] hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 px-4 py-2 rounded-full">
                    <Calendar size={14} />
                    <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</p>
                  <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap border border-slate-100">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={(e) => handleDeleteMessage(selectedMessage.id, e as any)}
                    className="flex items-center gap-2 px-6 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 rounded-full uppercase tracking-widest transition-all"
                  >
                    <Trash2 size={14} />
                    Delete Permanently
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-white/20 backdrop-blur-sm rounded-[3rem] p-8 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-300">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">No dispatch curated</h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">Select an item to view contents</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}