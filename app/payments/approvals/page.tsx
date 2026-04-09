"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Check, 
  X, 
  ArrowLeft, 
  Loader2, 
  Search, 
  Eye, 
  AlertCircle, 
  ChevronRight
} from "lucide-react";
import supabase from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("order_date", { ascending: false });

    if (error) toast.error("Database sync failed");
    else setOrders(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, payStatus: string, reason: string | null = null) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({ 
        status: newStatus, 
        payment_status: payStatus,
        payment_rejection_reason: reason 
      })
      .eq("id", orderId);

    if (error) {
      toast.error("Operation failed");
    } else {
      toast.success(`Protocol: Payment ${payStatus}`);
      setIsRejectModalOpen(false);
      setRejectionReason("");
      fetchOrders();
    }
    setIsUpdating(false);
  };

  const filteredOrders = orders.filter(o => 
    o.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone_number.includes(searchTerm)
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FBFBFC]">
      <Loader2 className="animate-spin text-brand-gold" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 lg:p-12 text-brand-blue selection:bg-brand-gold selection:text-brand-blue">
      <Toaster position="bottom-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-all text-[10px] font-black uppercase tracking-[0.3em]">
              <ArrowLeft size={14} className="text-brand-gold" /> Central Command
            </Link>
            <h1 className="text-5xl font-black tracking-tighter uppercase text-brand-blue leading-none">
              Order <span className="text-brand-gold">Payement Approval</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse shadow-[0_0_8px_rgba(196,161,116,0.6)]" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authenticated Ledger Access</p>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={18} />
            <input 
              placeholder="SEARCH CLIENT OR SIGNAL..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/5 transition-all shadow-xl shadow-brand-blue/5"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-brand-blue/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="p-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Client Entity</th>
                  <th className="p-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Value</th>
                  <th className="p-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Verification Status</th>
                  <th className="p-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Artifact</th>
                  <th className="p-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-10">
                      <p className="font-black text-sm uppercase text-brand-blue tracking-tight">{order.full_name}</p>
                      <p className="text-[9px] font-black text-brand-gold mt-2 tracking-widest uppercase opacity-70">{order.phone_number}</p>
                    </td>
                    <td className="p-10">
                      <p className="font-black text-brand-blue text-xl tracking-tighter">₹{order.grand_total.toLocaleString()}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest px-2 py-0.5 bg-slate-100 rounded-full inline-block">{order.payment_method}</p>
                    </td>
                    <td className="p-10">
                      <div className="flex flex-col gap-3">
                        <span className={`w-fit px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          order.payment_status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                          'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                        }`}>
                          {order.payment_status || 'Awaiting Signal'}
                        </span>
                        {order.payment_rejection_reason && (
                           <span className="text-[9px] font-black text-red-400 italic tracking-tight">Ref: {order.payment_rejection_reason}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-10">
                      {order.payment_id ? (
                        <button 
                          onClick={() => setSelectedImage(order.payment_id)} 
                          className="px-5 py-3 bg-brand-blue text-brand-gold rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest hover:bg-brand-gold hover:text-brand-blue transition-all shadow-lg shadow-brand-blue/10 active:scale-95"
                        >
                          <Eye size={14}/> View Artifact
                        </button>
                      ) : <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest opacity-40 italic">Missing Proof</span>}
                    </td>
                    <td className="p-10 text-right">
                      {order.payment_status !== 'paid' ? (
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => { setRejectionTarget(order.id); setIsRejectModalOpen(true); }}
                            className="w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-90"
                          >
                            <X size={20} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'confirmed', 'paid')}
                            className="px-8 h-12 rounded-2xl bg-brand-gold text-brand-blue flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-xl shadow-brand-gold/20 active:scale-95"
                          >
                            <Check size={16} /> Authorize
                          </button>
                        </div>
                      ) : (
                        <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-2 text-slate-300 hover:text-brand-gold transition-colors text-[9px] font-black uppercase tracking-widest">
                          Audit Profile <ChevronRight size={14} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* REJECTION MODAL */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-[60] bg-brand-blue/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tighter text-brand-blue leading-tight">Void Transaction</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Issue Rejection Protocol</p>
                </div>
              </div>
              
              <textarea 
                className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs font-black outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-200 transition-all mb-8 uppercase placeholder:opacity-30 tracking-widest"
                placeholder="INC-UTR, BLUR-SCR, OR VOID-AMT..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value.toUpperCase())}
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-blue transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={!rejectionReason || isUpdating}
                  onClick={() => handleUpdateStatus(rejectionTarget!, 'cancelled', 'rejected', rejectionReason)}
                  className="flex-[2] py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isUpdating ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE MODAL */}
        {selectedImage && (
          <div className="fixed inset-0 z-[70] bg-brand-blue/95 backdrop-blur-2xl flex items-center justify-center p-8 md:p-20" onClick={() => setSelectedImage(null)}>
             <div className="relative w-full h-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden border border-white/10">
                <Image src={selectedImage} alt="Artifact Proof" fill className="object-contain" unoptimized />
                <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-brand-gold hover:text-brand-blue text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md">
                  <X size={24} />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}