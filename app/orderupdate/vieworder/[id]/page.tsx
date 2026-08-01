"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import {
  Printer,
  MapPin,
  User,
  Phone, X,
  Mail,
  CreditCard, ArrowUpRight,
  Package,
  Clock,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CartItem {
  id: number;
  productId: number;
  name: string;
  // Your stored cart_items JSON uses "variationName" (camelCase).
  // Keeping both here so older orders saved with "variation_name" still work.
  variationName?: string;
  variation_name?: string;
  variationId?: number;
  originalPrice?: number;
  stock?: number;
  quantity: number;
  shipping_charge?: number;
  price: number;
  image?: string;
  sku?: string;

  size_id?: number | null;
  color_id?: number | null;
}

interface Order {
  id: string;
  full_name: string;
  phone_number: string;
  alt_phone_number?: string;
  house_number: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  total_price: number;
  shipping_cost: number;
  grand_total: number;
  order_date: string;
  status: string;
  cart_items?: CartItem[];
  email?: string;
  payment_rejection_reason?: string;
  stock_restored?: boolean;
  reference_code?: string;
  payment_status?: string;

  payment_id?: string;
}

// Single helper so the "variation" lookup logic lives in exactly one place.
function getVariationLabel(item: CartItem): string {
  return item.variationName || item.variation_name || "Standard";
}

// Statuses for which restocking should happen.
const RESTORE_STATUSES = ["Cancelled", "refunded", "failed", "draft", "onhold"];

export default function OrderUpdatePage() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const orderId = segments[segments.length - 1];
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [paymentPaid, setPaymentPaid] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const result = await res.json();
        if (!result.order) return;

        const orderData: Order = result.order;
        let items: CartItem[] = Array.isArray(orderData.cart_items) ? orderData.cart_items : [];

        if (items.length > 0) {
          const productIds = items.map((item) => item.productId);

          // Fetch Product data (SKU)
          const { data: productsData } = await supabase
            .from("products")
            .select("id, shipping_charge, sku")
            .in("id", productIds);

          // Fetch Images
          const { data: imagesData } = await supabase
            .from("product_images")
            .select("product_id, image_url")
            .in("product_id", productIds);

          // Map the items with the new data
          items = items.map((item) => {
            // Find the product details
            const product = productsData?.find((p) => Number(p.id) === Number(item.productId));

            // Find the image for this specific product
            const imageEntry = imagesData?.find((img) => Number(img.product_id) === Number(item.productId));

            return {
              ...item,
              shipping_charge: product?.shipping_charge ?? 0,
              sku: product?.sku ?? "N/A",
              // This line now correctly pulls from the imageEntry we found above
              image: imageEntry?.image_url ?? item.image,
              // Preserve whichever variation field the stored JSON used so
              // getVariationLabel() can find it later.
              variationName: item.variationName ?? item.variation_name,
            };
          });
        }

        // IMPORTANT: Merge the updated items back into the order object
        setOrder({ ...orderData, cart_items: items });
        setOrderStatus(orderData.status);
        setPaymentPaid(orderData.payment_status === "paid");
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  // ---------------------------------------------------------------------
  // Restocks every cart item back into product_variations.stock, then
  // marks the order as stock_restored in BOTH the database AND local
  // React state. (Previously only the DB column was updated — local
  // `order.stock_restored` stayed `false`, so a second status change in
  // the same session would call this again and double-restock items.)
  // ---------------------------------------------------------------------
  const restoreStock = async (currentOrder: Order) => {
    if (!currentOrder.cart_items?.length) return;

    let restoredCount = 0;
    let failedCount = 0;

    for (const item of currentOrder.cart_items) {
      // IMPORTANT: your cart_items JSON stores a `variationId` that points
      // directly at product_variations.id (the primary key) — it does NOT
      // store size_id/color_id on the item. The old code filtered by
      // .eq("size_id", item.size_id).eq("color_id", item.color_id), but since
      // those fields never existed on saved cart items, that query matched
      // nothing for every single item, every single time, and silently
      // failed via the `continue` below — so stock was never restored.
      //
      // Fix: look up the variation by its id directly. Fall back to the old
      // size/color matching only if variationId is missing (e.g. very old
      // orders saved before variationId was introduced).
      let variation: { id: number; stock: number } | null = null;

      if (item.variationId != null) {
        const { data, error } = await supabase
          .from("product_variations")
          .select("id, stock")
          .eq("id", item.variationId)
          .single();

        if (error || !data) {
          console.error(`Variation not found by variationId (${item.variationId}) for product ${item.productId}:`, error);
        } else {
          variation = data;
        }
      }

      // Legacy fallback for orders that genuinely have size_id/color_id and
      // no variationId.
      if (!variation && (item.size_id != null || item.color_id != null)) {
        const { data, error } = await supabase
          .from("product_variations")
          .select("id, stock")
          .eq("product_id", item.productId)
          .eq("size_id", item.size_id)
          .eq("color_id", item.color_id)
          .single();

        if (error || !data) {
          console.error("Variation not found by size_id/color_id:", error);
        } else {
          variation = data;
        }
      }

      if (!variation) {
        failedCount++;
        continue;
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from("product_variations")
        .update({
          stock: variation.stock + item.quantity,
        })
        .eq("id", variation.id)
        .select("id, stock");

      if (updateError) {
        console.error("Stock restore error:", updateError);
        failedCount++;
      } else if (!updatedRows || updatedRows.length === 0) {
        // No error, but no row came back either — this is the classic
        // Supabase RLS gotcha: an UPDATE with no matching policy silently
        // "succeeds" while touching 0 rows. Treat it as a failure.
        console.error(
          `Stock update for variation ${variation.id} affected 0 rows — likely missing an UPDATE RLS policy on product_variations.`
        );
        failedCount++;
      } else {
        restoredCount++;
      }
    }

    // Mark the order as restored in the DB so other sessions / re-fetches
    // also know not to restock it again.
    await supabase
      .from("orders")
      .update({ stock_restored: true })
      .eq("id", currentOrder.id);

    // Keep local state in sync so the SAME session can't trigger a second
    // restock if the status is changed again afterwards.
    setOrder((prev) => (prev ? { ...prev, stock_restored: true } : prev));

    if (restoredCount > 0 && failedCount === 0) {
      toast.success(`Stock restocked for ${restoredCount} item${restoredCount > 1 ? "s" : ""}`);
    } else if (restoredCount > 0 && failedCount > 0) {
      toast(`Restocked ${restoredCount} item(s), ${failedCount} couldn't be matched`, { icon: "⚠️" });
    } else if (failedCount > 0) {
      toast.error("Could not restock — check console (variation not found or blocked by database policy)");
    }
  };

  const handleRejectPayment = async () => {
    if (!order || !rejectReason) return;

    const fullReason = rejectNote
      ? `${rejectReason} — ${rejectNote}`
      : rejectReason;

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "rejected",
        status: "Cancelled",
        payment_rejection_reason: fullReason,
      })
      .eq("id", order.id);

    if (!error) {
      if (!order.stock_restored) {
        await restoreStock(order);
      }

      setOrderStatus("Cancelled");
      setPaymentPaid(false);
      setOrder((prev) => prev ? {
        ...prev,
        payment_status: "rejected",
        status: "Cancelled",
        payment_rejection_reason: fullReason,
      } : null);
      setShowRejectModal(false);
      setRejectReason("");
      setRejectNote("");

      try {
        await fetch("/api/send-status-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            fullName: order.full_name,
            status: "payment_rejected",
            email: order.email,
            grandTotal: order.grand_total,
            rejectReason: fullReason,
          }),
        });
      } catch (emailErr) {
        console.error("Rejection email failed:", emailErr);
      }
    } else {
      console.error("Reject update error:", error);
    }
  };

  async function handleStatusChange(newStatus: string) {
    if (!order || !paymentPaid) return;

    // RESTOCK ITEMS — only if this order hasn't already been restored,
    // and the new status is one that should trigger a restock.
    if (!order.stock_restored && RESTORE_STATUSES.includes(newStatus)) {
      await restoreStock(order);
    }

    setStatusUpdating(true);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      console.error("Status update error:", error);
    } else {
      setOrderStatus(newStatus);
      setOrder((prev) => prev ? { ...prev, status: newStatus } : null);

      // Trigger tracking update to the customer
      try {
        await fetch("/api/send-status-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            fullName: order.full_name,
            status: newStatus,
            email: order.email,
            grandTotal: order.grand_total,
          }),
        });
      } catch (emailErr) {
        console.error("Failed handling client email notifications silently:", emailErr);
      }
    }
    setStatusUpdating(false);
  }

  const handleApprovePayment = async () => {
    if (!order) return;
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid", status: "prcoessing" }) // Auto-shift layout to processing upon confirmation
      .eq("id", order.id);

    if (!error) {
      setPaymentPaid(true);
      setOrderStatus("prcoessing");
      setOrder((prev) => prev ? { ...prev, payment_status: "paid", status: "prcoessing" } : null);

      // Trigger automatic clearance confirmation email immediately
      try {
        await fetch("/api/send-status-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            fullName: order.full_name,
            status: "prcoessing",
            email: order.email,
            grandTotal: order.grand_total,
          }),
        });
      } catch (emailErr) {
        console.error("Failed handling client tracking clearance email:", emailErr);
      }
    }
  };

  const printInvoice = () => {
    if (!order) return;
    const gstAmount = order.total_price * 0.18;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${order.id}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; }
              .header h1 { margin: 0; font-size: 2rem; font-weight: 900; letter-spacing: -0.025em; }
              .details { margin: 40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #f8fafc; text-align: left; padding: 14px; border-bottom: 2px solid #e2e8f0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
              td { padding: 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }
              .total-box { margin-left: auto; width: 280px; margin-top: 40px; background: #f8fafc; padding: 20px; rounded: 12px; }
              .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.875rem; }
              .gst-row { color: #64748b; font-style: italic; }
              .grand-total { font-weight: 900; font-size: 1.25rem; color: #ea580c; border-top: 2px solid #e2e8f0; margin-top: 15px; padding-top: 15px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div><h1>INVOICE</h1><p style="color: #64748b; font-weight: 700;">#ORD-${order.id}</p></div>
              <div style="text-align: right;">
                <div style="font-weight: 900; font-size: 1.2rem;">Bangalore Collective STORE</div>
                <div style="font-size: 0.75rem; color: #64748b;">Premium Quality Essentials</div>
              </div>
            </div>
            <div class="details">
              <div><strong style="text-transform: uppercase; font-size: 0.7rem; color: #94a3b8;">Billed To:</strong><br/>
                <span style="font-weight: 800;">${order.full_name}</span><br/>
                ${order.house_number}, ${order.street}<br/>
                ${order.city}, ${order.state} - ${order.pincode}<br/>
                Phone: ${order.phone_number}</div>
              <div style="text-align: right;"><strong style="text-transform: uppercase; font-size: 0.7rem; color: #94a3b8;">Order Summary:</strong><br/>
                Date: ${new Date(order.order_date).toLocaleDateString()}<br/>
                Payment: ${order.payment_method.toUpperCase()}<br/>
                Status: ${order.payment_status?.toUpperCase()}</div>
            </div>
            <table>
              <thead><tr><th>Item Description</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th></tr></thead>

<tbody>
  ${order.cart_items?.map(item => `
    <tr>
      <td style="display: flex; align-items: center; gap: 15px;">
        <img src="${item.image || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />
        <div>
          <div style="font-weight: 700;">${item.name}</div>
          <div style="font-size: 0.7rem; color: #64748b;">SKU: ${item.sku || 'N/A'}</div>
          <div style="font-size: 0.7rem; color: #64748b;">${getVariationLabel(item)}</div>
        </div>
      </td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="text-align: right; font-weight: 700;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')}
</tbody>
            </table>
            <div class="total-box">
              <div class="total-row"><span>Subtotal</span><span>₹${order.total_price.toFixed(2)}</span></div>
              <div class="total-row gst-row"><span>GST (18%)</span><span>+ ₹${gstAmount.toFixed(2)}</span></div>
              <div class="total-row"><span>Shipping Fees</span><span>₹${order.shipping_cost.toFixed(2)}</span></div>
              <div class="total-row grand-total"><span>Grand Total</span><span>₹${order.grand_total.toFixed(2)}</span></div>
            </div>
            <div style="margin-top: 50px; text-align: center; font-size: 0.75rem; color: #94a3b8;">
              Thank you for shopping with Bangalore Collective Store!
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-600"></div></div>;

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-4 md:p-10 text-brand-blue selection:bg-brand-gold selection:text-white">
      <div className="max-w-7xl mx-auto">

        {/* Top Navigation */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-8 font-black tracking-[0.2em]">
          <Package size={14} className="text-brand-gold" />
          <Link href="/orderupdate" className="hover:text-brand-blue transition-colors">REGISTRY</Link>
          <ChevronRight size={12} />
          <span className="text-brand-gold">ORDER ARCHIVE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-brand-blue/5 border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                    <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">Official Statement</span>
                  </div>
                  <h1 className="text-3xl font-black text-brand-blue tracking-tighter uppercase">Order <span className="text-brand-gold">#ORD-{order?.id}</span></h1>
                  <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    <Calendar size={14} className="text-slate-300" />
                    {order?.order_date && new Date(order.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={printInvoice}
                  className="flex items-center gap-3 bg-brand-blue text-brand-gold border border-brand-blue px-8 py-4 rounded-2xl font-black transition-all text-[11px] tracking-widest hover:bg-brand-gold hover:text-brand-blue shadow-lg shadow-brand-blue/10 active:scale-95"
                >
                  <Printer size={18} /> GENERATE INVOICE
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black border-b border-slate-50 bg-slate-50/20">
                      <th className="px-10 py-5 text-left">Manifest Items</th>
                      <th className="px-10 py-5 text-center">Qty</th>
                      <th className="px-10 py-5 text-right">Unit Price</th>
                      <th className="px-10 py-5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order?.cart_items?.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="group hover:bg-slate-50/50 transition-colors">

                        <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="m-auto mt-5 text-slate-200" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-brand-blue text-sm uppercase">{item.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                SKU: {item.sku || "N/A"}
                              </p>
                              <p className="text-[9px] font-black text-brand-gold mt-1 uppercase tracking-[0.15em] px-2 py-0.5 bg-brand-gold/10 rounded-full inline-block">
                                {getVariationLabel(item)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center font-black text-brand-blue text-sm">{item.quantity}</td>
                        <td className="px-10 py-8 text-right font-bold text-slate-400 text-sm">₹{item.price.toFixed(2)}</td>
                        <td className="px-10 py-8 text-right font-black text-brand-blue text-sm">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="p-10 bg-brand-blue flex justify-end">
                <div className="w-full max-w-[320px] space-y-4">
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Registry Subtotal</span> <span className="text-white">₹{order?.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2">Taxes <span className="text-[8px] bg-brand-gold text-brand-blue px-2 py-0.5 rounded-full">GST 18%</span></span>
                    <span className="text-white">₹{(order ? order.total_price * 0.18 : 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Logistics</span> <span className="text-white">₹{order?.shipping_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <div className="flex flex-col">
                      <span className="font-black text-brand-gold leading-none tracking-widest text-xs uppercase">Settlement Total</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase mt-2">Certified Authentic Transaction</span>
                    </div>
                    <span className="text-4xl font-black text-white tracking-tighter">₹{order?.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-8">

            {/* Payment Verification */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-blue/5 border border-slate-100">
              <h3 className="flex items-center gap-3 text-[10px] font-black text-brand-blue uppercase tracking-[0.3em] mb-8">
                <ShieldCheck size={18} className="text-brand-gold" /> Verification
              </h3>

              <div className="space-y-6">
                <div className={`p-5 rounded-2xl flex flex-col gap-3 ${paymentPaid
                    ? 'bg-emerald-50 border border-emerald-100'
                    : order?.payment_status === 'rejected'
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-brand-gold/5 border border-brand-gold/10'
                  }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    {paymentPaid ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] tracking-widest">
                        <CheckCircle2 size={12} /> CLEARED
                      </span>
                    ) : order?.payment_status === 'rejected' ? (
                      <span className="flex items-center gap-1.5 text-red-500 font-black text-[9px] tracking-widest">
                        <X size={12} /> REJECTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-brand-gold font-black text-[9px] tracking-widest">
                        <Clock size={12} /> AWAITING
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-brand-blue leading-relaxed">
                    {paymentPaid
                      ? "Transaction has been authenticated and funds verified."
                      : order?.payment_status === 'rejected'
                        ? "Payment proof was rejected."
                        : "Awaiting manual verification of receipt."
                    }
                  </p>

                  {/* Show rejection reason if rejected */}
                  {order?.payment_status === 'rejected' && order.payment_rejection_reason && (
                    <div className="mt-1 p-3 bg-red-100 rounded-xl border border-red-200">
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Reason</p>
                      <p className="text-xs font-bold text-red-700">{order.payment_rejection_reason}</p>
                    </div>
                  )}
                </div>

                {order?.payment_id ? (
                  <div className="p-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-3 block tracking-[0.2em]">Transaction Artifact</label>
                    <a
                      href={order.payment_id}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:border-brand-gold transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-brand-gold group-hover:text-brand-gold transition-all shadow-sm">
                          <Eye size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-brand-blue uppercase">Evidence.jpg</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">External Link</p>
                        </div>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-300 group-hover:text-brand-gold transition-all" />
                    </a>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Artifact Provided</p>
                  </div>
                )}

                {/* Buttons — hide entirely if already rejected or paid */}
                {!paymentPaid && order?.payment_status !== 'rejected' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-red-100 transition-all"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={handleApprovePayment}
                      className="w-full bg-brand-blue text-brand-gold p-4 rounded-2xl font-black text-[10px] tracking-widest hover:bg-brand-gold hover:text-brand-blue transition-all uppercase"
                    >
                      Authorize
                    </button>
                  </div>
                )}

                {/* Rejected state — order has been cancelled */}
                {!paymentPaid && order?.payment_status === 'rejected' && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                      Order cancelled — payment proof rejected
                    </p>
                  </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-brand-blue uppercase tracking-tight">Reject Proof</h3>
                        <button onClick={() => setShowRejectModal(false)}><X size={18} /></button>
                      </div>
                      <p className="text-xs text-slate-400 font-bold mb-5 uppercase tracking-widest">
                        Order will be cancelled and customer notified.
                      </p>
                      <div className="space-y-2 mb-5">
                        {[
                          { value: "wrong_screenshot", label: "Wrong screenshot / unrelated image" },
                          { value: "amount_mismatch", label: "Amount doesn't match order total" },
                          { value: "suspected_fraud", label: "Suspected fraud / fake receipt" },
                          { value: "spam", label: "Spam / test order" },
                          { value: "other", label: "Other" },
                        ].map(opt => (
                          <label key={opt.value} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer text-sm font-bold text-brand-blue hover:bg-slate-50">
                            <input type="radio" name="reason" value={opt.value}
                              checked={rejectReason === opt.value}
                              onChange={e => setRejectReason(e.target.value)} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                      <textarea
                        placeholder="Add a note (optional)"
                        value={rejectNote}
                        onChange={e => setRejectNote(e.target.value)}
                        className="w-full border border-slate-100 rounded-xl p-3 text-sm mb-5 resize-none h-20"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowRejectModal(false)} className="p-3 border border-slate-200 rounded-xl text-sm font-bold">Cancel</button>
                        <button
                          onClick={handleRejectPayment}
                          disabled={!rejectReason}
                          className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold disabled:opacity-40"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Update */}
            <div className={`bg-brand-blue rounded-[2.5rem] p-8 shadow-xl shadow-brand-blue/20 transition-all ${!paymentPaid ? 'opacity-50 grayscale' : ''}`}>
              <h3 className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8">
                <Package size={18} className="text-brand-gold" /> Logistics
              </h3>

              <div className="space-y-4">
                {!paymentPaid && (
                  <div className="flex items-center gap-2 p-3 bg-white/10 text-brand-gold rounded-xl text-[8px] font-black border border-white/10 uppercase tracking-widest">
                    <AlertCircle size={12} /> Secure: Verification Required
                  </div>
                )}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-3 block tracking-widest">Order Life-cycle</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-[11px] font-black text-white uppercase tracking-widest focus:ring-2 focus:ring-brand-gold transition-all outline-none disabled:cursor-not-allowed appearance-none"
                    value={orderStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={!paymentPaid || statusUpdating}
                  >
                    <option className="text-brand-blue" value="pending">Pending Payment</option>
                    <option className="text-brand-blue" value="prcoessing">Processing</option>
                    <option className="text-brand-blue" value="onhold">On hold</option>
                    <option className="text-brand-blue" value="confirmed">Completed</option>
                    <option className="text-brand-blue" value="Cancelled">Cancelled</option>
                    <option className="text-brand-blue" value="refunded">Refunded</option>
                    <option className="text-brand-blue" value="failed">Failed</option>
                    <option className="text-brand-blue" value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-blue/5 border border-slate-100">
              <h3 className="flex items-center gap-3 text-[10px] font-black text-brand-blue uppercase tracking-[0.3em] mb-8">
                <User size={18} className="text-brand-gold" /> Client Profile
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-brand-blue text-brand-gold rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-brand-blue/10">
                    {order?.full_name[0]}
                  </div>
                  <div>
                    <p className="font-black text-brand-blue uppercase tracking-tight leading-none">{order?.full_name}</p>
                    <p className="text-[9px] font-black text-brand-gold mt-2 uppercase tracking-widest">Legacy ID #{order?.id}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 text-[11px] font-black text-brand-blue/70 uppercase tracking-widest">
                  <div className="flex items-center gap-4"><Phone size={16} className="text-brand-gold" /> {order?.phone_number}</div>
                  <div className="flex items-center gap-4"><Mail size={16} className="text-brand-gold" /> {order?.email || "NOT PROVIDED"}</div>
                  <div className="flex items-center gap-4 border-t border-slate-50 pt-4"><CreditCard size={16} className="text-brand-gold" /> {order?.payment_method?.toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            <div className="bg-brand-gold rounded-[2.5rem] p-8 shadow-xl shadow-brand-gold/10 text-brand-blue">
              <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                <MapPin size={18} /> Destination
              </h3>
              <div className="p-6 bg-white/30 backdrop-blur-sm rounded-2xl text-[11px] font-black uppercase tracking-widest leading-relaxed border border-white/40">
                {order?.house_number}, {order?.street}<br />
                {order?.city}, {order?.state}<br />
                <span className="mt-4 block text-xs underline decoration-2 underline-offset-4 font-black">ZIP: {order?.pincode}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}