"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Check, 
  X, 
  ExternalLink, 
  Loader2, 
  Search, 
  Eye, 
  Clock, 
  AlertCircle, 
  Filter,
  MessageSquare 
} from "lucide-react";
import supabase from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // State for Rejection Modal
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

    if (error) toast.error("Error loading orders");
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
      toast.error("Update failed");
    } else {
      toast.success(`Order marked as ${payStatus}`);
      setIsRejectModalOpen(false);
      setRejectionReason("");
      fetchOrders(); // Refresh the list
    }
    setIsUpdating(false);
  };

  const filteredOrders = orders.filter(o => 
    o.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone_number.includes(searchTerm)
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-orange-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <Toaster />
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">Master Order List</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Live Transaction Database</p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              placeholder="SEARCH NAME OR PHONE..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Details</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Financials</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status Tracking</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Proof</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-6">
                  <p className="font-black text-sm uppercase text-slate-900 tracking-tight">{order.full_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{order.phone_number}</p>
                </td>
                <td className="p-6">
                  <p className="font-black text-slate-900 text-lg italic">₹{order.grand_total.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{order.payment_method}</p>
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-2">
                    <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      order.payment_status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 
                      order.payment_status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                      'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {order.payment_status || 'Pending'}
                    </span>
                    {order.payment_rejection_reason && (
                       <span className="text-[9px] font-bold text-red-400 italic">Reason: {order.payment_rejection_reason}</span>
                    )}
                  </div>
                </td>
                <td className="p-6">
                  {order.payment_id ? (
                    <button 
                      onClick={() => setSelectedImage(order.payment_id)} 
                      className="px-4 py-2 bg-slate-100 rounded-xl text-slate-900 flex items-center gap-2 font-black text-[10px] uppercase hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                    >
                      <Eye size={12}/> View Proof
                    </button>
                  ) : <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">No Attachment</span>}
                </td>
                <td className="p-6 text-right">
                  {order.payment_status !== 'paid' && (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setRejectionTarget(order.id); setIsRejectModalOpen(true); }}
                        className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <X size={18} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'confirmed', 'paid')}
                        className="px-6 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg"
                      >
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REJECTION MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-slate-900">Reject Payment</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State the reason for user</p>
              </div>
            </div>
            
            <textarea 
              className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-red-500/5 transition-all mb-6"
              placeholder="EX: BLURRY SCREENSHOT, INCORRECT AMOUNT, FAKE UTR..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value.toUpperCase())}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!rejectionReason || isUpdating}
                onClick={() => handleUpdateStatus(rejectionTarget!, 'cancelled', 'rejected', rejectionReason)}
                className="flex-[2] py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {isUpdating ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-[70] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-10" onClick={() => setSelectedImage(null)}>
           <div className="relative w-full h-full max-w-5xl">
              <Image src={selectedImage} alt="Proof" fill className="object-contain" unoptimized />
              <button className="absolute top-0 right-0 p-4 text-white hover:text-orange-500 transition-all">
                <X size={40} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}