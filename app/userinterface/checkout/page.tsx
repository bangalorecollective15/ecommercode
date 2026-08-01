"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ChevronLeft,
  CreditCard,
  MapPin,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Info,
  Sparkles,
  QrCode,
  Plus,
  History,
  Copy,
  Check,
  Tag,
  X,
  Percent,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import supabase from "@/lib/supabase";

interface Address {
  fullName: string;
  phone: string;
  altPhone: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
}

type CouponErrorType = 
  | "empty" 
  | "invalid" 
  | "inactive" 
  | "usage_limit_reached" 
  | "already_used" 
  | "min_purchase_not_met" 
  | "sale_item_in_cart"
  | "success" 
  | null;

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryProductId = searchParams.get("productId");
  const queryVariationId = searchParams.get("variationId");
  const queryQty = searchParams.get("qty");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [gateway, setGateway] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [upiCopied, setUpiCopied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Coupon state
// Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<CouponErrorType>(null);
  const [couponErrorMessage, setCouponErrorMessage] = useState("");
  // The amount the discount actually applies to (subtotal minus sale-tagged items)
  const [couponApplicableAmount, setCouponApplicableAmount] = useState(0);
  const [saleItemsInfo, setSaleItemsInfo] = useState<{ count: number; amount: number }>({ count: 0, amount: 0 });
  const [pastAddresses, setPastAddresses] = useState<Address[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [isNewAddress, setIsNewAddress] = useState(true);
  const [address, setAddress] = useState<Address>({
    fullName: "",
    phone: "",
    altPhone: "",
    houseNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please login.");
        return router.push("/login");
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);
      setUserEmail(session.user.email || "");

      try {
        const { data: orders, error: ordersErr } = await supabase
          .from("orders")
          .select("full_name, phone_number, alt_phone_number, house_number, street, city, state, pincode")
          .eq("user_id", currentUserId)
          .order("order_date", { ascending: false });

        if (!ordersErr && orders && orders.length > 0) {
          const uniqueAddresses: Address[] = [];
          const seen = new Set();
          for (const o of orders) {
            const addrObj: Address = {
              fullName: o.full_name || "",
              phone: o.phone_number || "",
              altPhone: o.alt_phone_number || "",
              houseNumber: o.house_number || "",
              street: o.street || "",
              city: o.city || "",
              state: o.state || "",
              pincode: o.pincode || "",
            };
            const key = `${addrObj.fullName}-${addrObj.houseNumber}-${addrObj.pincode}`.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              uniqueAddresses.push(addrObj);
            }
          }
          setPastAddresses(uniqueAddresses);
          if (uniqueAddresses.length > 0) {
            setAddress(uniqueAddresses[0]);
            setSelectedAddressIndex(0);
            setIsNewAddress(false);
          }
        }
      } catch (err) {
        console.error("Failed to parse past delivery locations", err);
      }

      if (queryProductId && queryVariationId) {
        try {
          const [prodRes, varRes] = await Promise.all([
            supabase.from("products").select("name").eq("id", queryProductId).single(),
            supabase.from("product_variations").select("price, sale_price").eq("id", queryVariationId).single(),
          ]);
          if (prodRes.error || varRes.error) throw new Error("Product metadata missing");
          const qty = parseInt(queryQty || "1", 10);
          const activePrice = varRes.data.sale_price || varRes.data.price;
          setCheckoutData({
            subtotal: activePrice * qty,
            items: [{ product_id: queryProductId, variation_id: queryVariationId, quantity: qty, price: activePrice, name: prodRes.data.name }],
          });
        } catch {
          toast.error("Error loading product information.");
          return router.push("/userinterface/cart");
        }
      } else {
        const saved = localStorage.getItem("active_checkout");
        if (!saved) return router.push("/userinterface/cart");
        setCheckoutData(JSON.parse(saved));
      }

      const { data: pay } = await supabase.from("payment_gateways").select("*").eq("is_active", true).single();
      setGateway(pay);
      setLoading(false);
    };
    init();
  }, [queryProductId, queryVariationId, queryQty]);

  // ── COUPON LOGIC ──────────────────────────────────────────────
  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    
    // Clear previous error
    setCouponError(null);
    setCouponErrorMessage("");

    if (!code) {
      setCouponError("empty");
      setCouponErrorMessage("Please enter a coupon code");
      return;
    }
if (!userId) {
      setCouponError("invalid");
      setCouponErrorMessage("Please login to apply coupons");
      return;
    }

    setCouponLoading(true);

    // ── Split cart into sale-tagged vs regular items ──
    // Cart-flow items use `productId` (camelCase); direct-buy flow uses `product_id` (snake_case)
    const items = checkoutData?.items || [];
    const productIdsInCart = items.map((i: any) => i.product_id ?? i.productId).filter(Boolean);

    let regularSubtotal = checkoutData?.subtotal || 0;
    let saleSubtotal = 0;
    let saleCount = 0;

    if (productIdsInCart.length > 0) {
      const { data: saleCheckProducts, error: saleCheckErr } = await supabase
        .from("products")
        .select("id, lifestyle_tag:attributes!products_lifestyle_tag_id_fkey(name)")
        .in("id", productIdsInCart);

      if (!saleCheckErr) {
        const saleIdSet = new Set(
          (saleCheckProducts || [])
            .filter((p: any) => {
              const tagName = Array.isArray(p.lifestyle_tag) ? p.lifestyle_tag[0]?.name : p.lifestyle_tag?.name;
              return tagName && tagName.toLowerCase().includes("sale");
            })
            .map((p: any) => p.id)
        );

        regularSubtotal = 0;
        saleSubtotal = 0;
        saleCount = 0;

        for (const item of items) {
          const pid = item.product_id ?? item.productId;
          const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
          if (saleIdSet.has(pid)) {
            saleSubtotal += lineTotal;
            saleCount += 1;
          } else {
            regularSubtotal += lineTotal;
          }
        }
      }
    }

    setSaleItemsInfo({ count: saleCount, amount: saleSubtotal });

    // If literally everything in the bag is a sale item, there's nothing left to discount
    if (saleCount > 0 && regularSubtotal <= 0) {
      setCouponError("sale_item_in_cart");
      setCouponErrorMessage(`❌ All ${saleCount} item(s) in your bag are on sale. Coupons can't be applied to sale items — remove them or add a regular-priced item to use a coupon.`);
      setCouponLoading(false);
      return;
    }
    try {
      // 1. Look up the coupon
      const { data: coupon, error: couponErr } = await supabase
        .from("coupons")
        .select("id, code, discount_type, discount_value, usage_limit, usage_count, active, min_purchase_amount")
        .eq("code", code)
        .single();

      if (couponErr || !coupon) {
        setCouponError("invalid");
        setCouponErrorMessage("❌ Invalid coupon code");
        setCouponLoading(false);
        return;
      }

      // 2. Check if coupon is active
      if (!coupon.active) {
        setCouponError("inactive");
        setCouponErrorMessage("❌ This coupon is no longer active");
        setCouponLoading(false);
        return;
      }

      // 3. Check if usage limit reached
      if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        setCouponError("usage_limit_reached");
        setCouponErrorMessage(`❌ This coupon has reached its usage limit (${coupon.usage_count}/${coupon.usage_limit})`);
        setCouponLoading(false);
        return;
      }

      // 4. Check if THIS user has already used this coupon (BEFORE min purchase check)
      const { data: existingUsage, error: usageErr } = await supabase
        .from("coupon_usages")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (usageErr) {
        setCouponError("invalid");
        setCouponErrorMessage("❌ Error checking coupon validity");
        setCouponLoading(false);
        return;
      }

      if (existingUsage) {
        setCouponError("already_used");
        setCouponErrorMessage("❌ You have already used this coupon");
        setCouponLoading(false);
        return;
      }

      // 5. Check minimum purchase amount (AFTER already_used check)
// 5. Check minimum purchase amount against ELIGIBLE (non-sale) subtotal only
      if (coupon.min_purchase_amount && regularSubtotal < coupon.min_purchase_amount) {
        const shortfall = coupon.min_purchase_amount - regularSubtotal;
        setCouponError("min_purchase_not_met");
        setCouponErrorMessage(
          saleCount > 0
            ? `⚠️ Minimum purchase of ₹${coupon.min_purchase_amount} required on regular-priced items (sale items don't count). You need ₹${shortfall.toLocaleString()} more of eligible items. Current eligible amount: ₹${regularSubtotal.toLocaleString()}`
            : `⚠️ Minimum purchase amount of ₹${coupon.min_purchase_amount} required. Current: ₹${regularSubtotal.toLocaleString()}`
        );
        setCouponLoading(false);
        return;
      }

      // 6. All checks passed — apply it (discount will apply only to the eligible/regular subtotal)
      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      });
      setCouponApplicableAmount(regularSubtotal);
      setCouponInput("");
      setCouponError("success");
      setCouponErrorMessage(
        saleCount > 0
          ? `✅ Coupon "${coupon.code}" applied! Discount applies to ₹${regularSubtotal.toLocaleString()} of eligible items — ${saleCount} sale item(s) worth ₹${saleSubtotal.toLocaleString()} are excluded.`
          : `✅ Coupon "${coupon.code}" applied successfully!`
      );
    } catch (err: any) {
      setCouponError("invalid");
      setCouponErrorMessage(`❌ ${err.message || "Failed to apply coupon"}`);
    } finally {
      setCouponLoading(false);
    }
  };

const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setCouponErrorMessage("");
    setCouponApplicableAmount(0);
  };
  // ──────────────────────────────────────────────────────────────

  const selectPastAddress = (index: number) => {
    setSelectedAddressIndex(index);
    setAddress(pastAddresses[index]);
    setIsNewAddress(false);
  };

  const switchToNewAddress = () => {
    setSelectedAddressIndex(null);
    setIsNewAddress(true);
    setAddress({ fullName: "", phone: "", altPhone: "", houseNumber: "", street: "", city: "", state: "", pincode: "" });
  };

  const handleCopyUpi = () => {
    if (gateway?.upi_id) {
      navigator.clipboard.writeText(gateway.upi_id);
      setUpiCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setUpiCopied(false), 2000);
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.city) return toast.error("Complete shipping info");
    if (!paymentProof) return toast.error("Upload payment proof to proceed");
    if (!agreedToTerms) return toast.error("Please agree to Terms & Conditions to continue");
    setIsSubmitting(true);

    try {
      const fileName = `${userId}/${Date.now()}-${paymentProof.name}`;
      const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(fileName, paymentProof);
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

      const { data: insertedOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          full_name: address.fullName,
          phone_number: address.phone,
          alt_phone_number: address.altPhone,
          house_number: address.houseNumber,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          payment_method: "Bank Transfer",
          payment_id: publicUrl,
          total_price: subtotal,
          shipping_cost: shipping,
          grand_total: grandTotal,
          discount_amount: discountAmount,
          coupon_code: appliedCoupon?.code || null,
          cart_items: checkoutData.items,
          email: userEmail,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // ── Record coupon usage & increment counter ──
      if (appliedCoupon && insertedOrder) {
        const { error: usageInsertErr } = await supabase.from("coupon_usages").insert({
          coupon_id: appliedCoupon.id,
          user_id: userId,
          order_id: insertedOrder.id,
        });
        if (usageInsertErr) throw new Error("Failed to record coupon usage");

        const { error: incrementErr } = await supabase.rpc("increment_coupon_usage", {
          coupon_id: appliedCoupon.id,
        });
        if (incrementErr) {
          console.error("Failed to increment coupon usage_count:", incrementErr);
        }
      }
      // ────────────────────────────────────────────

      const { error: stockErr } = await supabase.rpc("decrement_product_stock", { items: checkoutData.items });
      if (stockErr) throw new Error("Inventory reservation failed. Please try again.");

      if (queryProductId && queryVariationId) {
        await supabase.from("cart").delete().eq("user_id", userId).eq("variation_id", queryVariationId);
      } else {
        await supabase.from("cart").delete().eq("user_id", userId);
      }

      if (insertedOrder) {
        const emailPayload = {
          orderId: insertedOrder.id,
          fullName: address.fullName,
          phone: address.phone,
          city: address.city,
          paymentMethod: "Bank Transfer",
          grandTotal,
          email: userEmail,
          cartItems: checkoutData.items,
          houseNumber: address.houseNumber,
          street: address.street,
          state: address.state,
          pincode: address.pincode,
          totalPrice: subtotal,
          shippingCost: shipping,
          discountAmount,
          couponCode: appliedCoupon?.code || null,
        };

        try {
          await fetch("/api/send-order-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailPayload),
          });
          await fetch("/api/send-customer-order-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailPayload),
          });
        } catch (emailErr) {
          console.error("Email dispatch error:", emailErr);
        }
      }

      localStorage.removeItem("active_checkout");
      toast.success("Order Created Successfully");
      router.push("/userinterface/order");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-black transition-colors duration-300">
      <Loader2 className="animate-spin text-brand-gold" size={24} />
    </div>
  );

  const subtotal = checkoutData?.subtotal || 0;
  const shipping = subtotal < 1000 && subtotal > 0 ? 100 : 0;

const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.round((couponApplicableAmount * appliedCoupon.discount_value) / 100)
      : Math.min(appliedCoupon.discount_value, couponApplicableAmount)
    : 0;

  const moreToSpend = appliedCoupon && appliedCoupon.discount_type === "fixed"
    ? Math.max(0, appliedCoupon.discount_value - couponApplicableAmount)
    : 0;
  const grandTotal = Math.max(0, subtotal + shipping - discountAmount);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black text-slate-900 dark:text-white pt-24 pb-20 px-3 sm:px-4 transition-colors duration-300">
      {/* BG blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-50 dark:bg-[#111]/50 rounded-full blur-[120px] transition-colors duration-300" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white mb-8 font-bold text-[9px] uppercase tracking-[0.2em] transition-all group"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return to Bag
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── LEFT ── */}
          <div className="lg:col-span-7 space-y-5">

            {/* DESTINATION */}
            <section className="bg-white/40 dark:bg-[#111]/40 backdrop-blur-xl p-5 sm:p-7 rounded-[2rem] border border-white/60 dark:border-[#333] shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 bg-brand-gold/10 text-brand-gold rounded-xl flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white transition-colors duration-300">Destination</h2>
              </div>

              {pastAddresses.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-gray-500 mb-3 flex items-center gap-1.5 transition-colors duration-300">
                    <History size={12} /> Saved Addresses
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {pastAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectPastAddress(idx)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 bg-white/80 dark:bg-[#222]/80 ${
                          selectedAddressIndex === idx
                            ? "border-brand-gold ring-2 ring-brand-gold/20 dark:ring-brand-gold/40 shadow-md"
                            : "border-slate-100 dark:border-[#333] hover:border-slate-300 dark:hover:border-gray-500 shadow-sm"
                        }`}
                      >
                        <p className="text-[11px] font-black text-slate-800 dark:text-gray-200 mb-1 truncate transition-colors duration-300">{addr.fullName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed transition-colors duration-300">
                          {addr.houseNumber}, {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 mt-2 transition-colors duration-300">{addr.phone}</p>
                      </div>
                    ))}
                    <div
                      onClick={switchToNewAddress}
                      className={`p-4 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[92px] ${
                        isNewAddress
                          ? "border-brand-gold bg-brand-gold/[0.02] dark:bg-brand-gold/[0.05] text-brand-gold ring-2 ring-brand-gold/10 dark:ring-brand-gold/20"
                          : "border-slate-200 dark:border-[#444] text-slate-400 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-600 dark:hover:text-gray-300 bg-white/40 dark:bg-[#222]/40"
                      }`}
                    >
                      <Plus size={16} className="mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Use Different Address</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FieldInput placeholder="Full Name" className="col-span-2" value={address.fullName} disabled={!isNewAddress} onChange={v => setAddress({ ...address, fullName: v })} />
                <FieldInput placeholder="Primary Phone" value={address.phone} disabled={!isNewAddress} onChange={v => setAddress({ ...address, phone: v })} />
                <FieldInput placeholder="Secondary Phone" value={address.altPhone} disabled={!isNewAddress} onChange={v => setAddress({ ...address, altPhone: v })} />
                <FieldInput placeholder="Flat / House No." value={address.houseNumber} disabled={!isNewAddress} onChange={v => setAddress({ ...address, houseNumber: v })} />
                <FieldInput placeholder="Pincode" value={address.pincode} disabled={!isNewAddress} onChange={v => setAddress({ ...address, pincode: v })} />
                <textarea
                  required
                  disabled={!isNewAddress}
                  value={address.street}
                  placeholder="Street Address & Landmark"
                  className="col-span-2 p-4 bg-white/50 dark:bg-black/50 rounded-2xl text-[11px] font-bold border border-white dark:border-[#333] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-brand-gold/50 h-24 transition-all disabled:opacity-75 disabled:bg-slate-100/50 dark:disabled:bg-[#111]/50 resize-none"
                  onChange={e => setAddress({ ...address, street: e.target.value })}
                />
                <FieldInput placeholder="City" value={address.city} disabled={!isNewAddress} onChange={v => setAddress({ ...address, city: v })} />
                <FieldInput placeholder="State" value={address.state} disabled={!isNewAddress} onChange={v => setAddress({ ...address, state: v })} />
              </div>
            </section>

            {/* SETTLEMENT */}
            <section className="relative overflow-hidden bg-white/70 dark:bg-[#111]/70 backdrop-blur-2xl border border-white/60 dark:border-[#333] rounded-[2rem] shadow-[0_10px_60px_rgba(0,0,0,0.06)] p-5 sm:p-7 transition-colors duration-300">
              <div className="absolute -top-24 -right-24 w-52 h-52 bg-brand-gold/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-slate-200/30 dark:bg-[#222]/30 blur-3xl rounded-full pointer-events-none transition-colors duration-300" />

              <div className="relative flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg transition-colors duration-300">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900 dark:text-white transition-colors duration-300">Settlement</h2>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium tracking-wide transition-colors duration-300">Secure payment information</p>
                </div>
              </div>

              {gateway?.qr_url && (
                <div className="w-full bg-white dark:bg-[#222] rounded-3xl border border-slate-100 dark:border-[#444] shadow-sm overflow-hidden transition-colors duration-300">
                  <div className="relative w-full aspect-square bg-white p-6">
                    <Image
                      src={gateway.qr_url}
                      alt="Payment QR"
                      fill
                      priority
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="border-t border-slate-100 dark:border-[#444] bg-slate-50/50 dark:bg-[#111]/50 p-4 transition-colors duration-300">
                    <div className="flex flex-col items-center mb-4">
                      <div className="flex items-center gap-2 text-brand-gold mb-1">
                        <QrCode size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Scan to pay</span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-gray-500 font-medium uppercase tracking-widest text-center transition-colors duration-300">
                        Use any UPI app
                      </p>
                    </div>

                    {gateway?.upi_id && (
                      <div className="flex items-center justify-between gap-4 bg-white dark:bg-black border border-slate-200 dark:border-[#333] rounded-xl px-3 py-2 transition-colors duration-300">
                        <div className="truncate">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase transition-colors duration-300">UPI ID</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 truncate transition-colors duration-300">{gateway.upi_id}</p>
                        </div>
                        <button
                          onClick={handleCopyUpi}
                          className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#222] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-600 dark:text-gray-400 flex items-center justify-center transition-all duration-300"
                        >
                          {upiCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RECEIPT UPLOAD */}
              <div className="relative mt-6 rounded-[1.5rem] border border-brand-gold/15 bg-gradient-to-br from-brand-gold/[0.07] to-white dark:from-brand-gold/[0.05] dark:to-black dark:border-brand-gold/20 p-5 overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full pointer-events-none" />
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                    <Info size={15} className="text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-gold">Upload Receipt</p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium transition-colors duration-300">Transaction screenshot or payment proof</p>
                  </div>
                </div>

                <label className="relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-[1.5rem] border-2 border-dashed border-brand-gold/20 bg-white/70 dark:bg-[#222]/70 hover:bg-white dark:hover:bg-[#333] transition-all duration-300 cursor-pointer group overflow-hidden">
                  <input type="file" className="hidden" accept="image/*" onChange={e => setPaymentProof(e.target.files?.[0] || null)} />
                  <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
                  {paymentProof ? (
                    <div className="relative flex flex-col items-center text-center px-4">
                      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-3">
                        <CheckCircle2 size={26} className="text-green-600" />
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-gray-200 break-all transition-colors duration-300">{paymentProof.name}</span>
                      <p className="text-[10px] uppercase tracking-widest text-green-600 mt-2 font-bold">Uploaded</p>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center text-center px-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <Upload size={24} className="text-brand-gold" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 dark:text-gray-300 transition-colors duration-300">Tap To Upload</span>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5 font-semibold uppercase tracking-wider transition-colors duration-300">PNG, JPG or JPEG</p>
                    </div>
                  )}
                </label>
              </div>
            </section>
          </div>

          {/* ── RIGHT: SUMMARY ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white/60 dark:bg-[#111]/60 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] border border-white dark:border-[#333] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 space-y-6 transition-colors duration-300">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <Sparkles size={14} className="text-brand-gold" /> Total Valuation
              </h3>

              <div className="space-y-4 pb-7 border-b border-slate-100 dark:border-[#333] transition-colors duration-300">
                <SummaryRow label="Items Subtotal" value={subtotal} />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-gray-500 transition-colors duration-300">Shipping</span>
                  <span className={shipping === 0 ? "text-brand-gold" : "text-slate-900 dark:text-white transition-colors duration-300"}>
                    {shipping === 0 ? "Complimentary" : `₹${shipping}`}
                  </span>
                </div>
               {discountAmount > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-green-600 flex items-center gap-1">
                      <Tag size={11} /> Coupon ({appliedCoupon?.code})
                    </span>
                    <span className="text-green-600">−₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {saleItemsInfo.count > 0 && (
                  <p className="text-[9px] font-semibold text-brand-gold uppercase tracking-wider">
                    {saleItemsInfo.count} sale item(s) worth ₹{saleItemsInfo.amount.toLocaleString()} are not eligible for coupon discounts
                  </p>
                )}
              </div>

              {/* Grand Amount */}
              <div className="flex flex-col">
                <span className="text-brand-gold font-black text-[9px] uppercase tracking-widest mb-1">Grand Amount</span>
                <span className="text-4xl font-black tracking-tighter text-slate-950 dark:text-white transition-colors duration-300">₹{grandTotal.toLocaleString()}</span>
                {discountAmount > 0 && (
                  <span className="text-[9px] text-green-600 font-black uppercase tracking-widest mt-1">
                    You save ₹{discountAmount.toLocaleString()}!
                  </span>
                )}
              </div>

              {/* ════════════════════════════════════════ */}
              {/* SHOP WITH BALANCE AMOUNT */}
              {/* ════════════════════════════════════════ */}
              {appliedCoupon && appliedCoupon.discount_type === "fixed" && moreToSpend > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800/50 overflow-hidden relative transition-colors duration-300">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-100/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest mb-1.5 transition-colors duration-300">
                        💰 Shop With Balance Amount
                      </p>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-black text-amber-700">₹{moreToSpend.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Balance Left</span>
                      </div>
                      <p className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed transition-colors duration-300">
                        Add ₹{moreToSpend.toLocaleString()} more to get the full ₹{appliedCoupon.discount_value} discount!
                      </p>
                      <button
                        onClick={() => router.push("/userinterface/products")}
                        className="mt-3 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-600 dark:bg-amber-500 text-white rounded-lg hover:bg-amber-700 dark:hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-1 w-fit"
                      >
                        <Plus size={12} /> Shop More
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════ */}
              {/* COUPON FULLY UTILIZED */}
              {/* ════════════════════════════════════════ */}
              {appliedCoupon && appliedCoupon.discount_type === "fixed" && moreToSpend === 0 && discountAmount > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800/50 flex items-start gap-3 transition-colors duration-300">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-green-900 dark:text-green-400 uppercase tracking-widest mb-1 transition-colors duration-300">
                      ✅ Coupon Fully Utilized
                    </p>
                    <p className="text-[10px] text-green-700 dark:text-green-300 font-semibold transition-colors duration-300">
                      You're using the entire ₹{appliedCoupon.discount_value} discount on this order!
                    </p>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════ */}
              {/* ── COUPON BOX WITH INLINE MESSAGES ── */}
              {/* ══════════════════════════════════════════════════ */}
              <div>
                {appliedCoupon ? (
                  /* Applied state */
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        {appliedCoupon.discount_type === "percentage"
                          ? <Percent size={16} className="text-green-600" />
                          : <DollarSign size={16} className="text-green-600" />
                        }
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-green-800 dark:text-green-400 uppercase tracking-widest font-mono transition-colors duration-300">{appliedCoupon.code}</p>
                        <p className="text-[9px] text-green-600 dark:text-green-500 font-bold uppercase tracking-wider transition-colors duration-300">
                          {appliedCoupon.discount_type === "percentage"
                            ? `${appliedCoupon.discount_value}% off applied`
                            : `₹${appliedCoupon.discount_value} off applied`
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-green-600 hover:text-red-600 dark:text-green-500 dark:hover:text-red-400 flex items-center justify-center transition-all duration-300 flex-shrink-0"
                      title="Remove coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  /* Input state with validation messages */
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors duration-300">Have a coupon?</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <Tag
                          size={14}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors"
                        />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={e => {
                            setCouponInput(e.target.value.toUpperCase());
                            // Clear error on input change
                            if (couponError && e.target.value) {
                              setCouponError(null);
                              setCouponErrorMessage("");
                            }
                          }}
                          onKeyDown={e => e.key === "Enter" && applyCoupon()}
                          placeholder="BCXXXXXXXX"
                          className="w-full h-11 pl-10 pr-3 bg-white/70 dark:bg-black/70 border border-slate-200 dark:border-[#333] rounded-xl text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest focus:outline-none focus:border-brand-gold/60 transition-all duration-300 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 dark:placeholder:text-gray-500"
                        />
                      </div>
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="h-11 px-5 bg-slate-950 dark:bg-white text-white dark:text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-brand-gold dark:hover:bg-brand-gold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                      >
                        {couponLoading ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
                      </button>
                    </div>

                    {/* ERROR/SUCCESS MESSAGE BOX */}
                    {couponErrorMessage && (
                      <div
                        className={`p-3 rounded-xl border-2 flex items-start gap-2.5 transition-colors duration-300 ${
                          couponError === "success"
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50"
                            : couponError === "already_used"
                            ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50"
                            : couponError === "min_purchase_not_met"
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50"
                            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {couponError === "success" ? (
                            <CheckCheck size={16} className="text-green-600" />
                          ) : couponError === "already_used" ? (
                            <AlertCircle size={16} className="text-orange-600" />
                          ) : couponError === "min_purchase_not_met" ? (
                            <Info size={16} className="text-blue-600" />
                          ) : (
                            <AlertCircle size={16} className="text-red-600" />
                          )}
                        </div>
                        <p
                          className={`text-[10px] font-semibold leading-relaxed transition-colors duration-300 ${
                            couponError === "success"
                              ? "text-green-700 dark:text-green-400"
                              : couponError === "already_used"
                              ? "text-orange-700 dark:text-orange-400"
                              : couponError === "min_purchase_not_met"
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {couponErrorMessage}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* ══════════════════════════════════════════════════ */}

              {/* ── TERMS & CONDITIONS ── */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222]/50 border border-slate-100 dark:border-[#333] transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <input
                    id="terms-checkbox"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded accent-brand-gold cursor-pointer"
                    style={{ accentColor: "var(--color-brand-gold, #b8860b)" }}
                  />
                  <label htmlFor="terms-checkbox" className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 leading-relaxed cursor-pointer select-none transition-colors duration-300">
                    I have read and agree to the{" "}
                    <Link
                      href="/userinterface/terms-and-conditions"
                      target="_blank"
                      onClick={e => e.stopPropagation()}
                      className="text-brand-gold font-black underline underline-offset-2 hover:text-slate-900 dark:hover:text-white transition-colors duration-300"
                    >
                      Terms &amp; Conditions
                    </Link>
                    {" "}and understand the return &amp; payment policies.
                  </label>
                </div>
              </div>

              <button
                onClick={handleOrder}
                disabled={isSubmitting || !agreedToTerms}
                className="w-full bg-slate-950 dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-brand-gold dark:hover:bg-brand-gold transition-all duration-300 shadow-xl shadow-slate-950/10 dark:shadow-black/40 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-950 dark:disabled:hover:bg-[#222] dark:disabled:bg-[#222] dark:disabled:text-gray-500"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={14} /> Processing...
                  </div>
                ) : "Finalize Order"}
              </button>

              <div className="mt-6 flex items-center gap-3 justify-center text-slate-300 dark:text-gray-600 transition-colors duration-300">
                <ShieldCheck size={14} />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Encrypted Checkout</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

interface InputProps {
  placeholder: string;
  className?: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}

function FieldInput({ placeholder, className = "", value, disabled = false, onChange }: InputProps) {
  return (
    <input
      required
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      className={`p-4 bg-white/50 dark:bg-black/50 rounded-2xl text-[11px] font-bold border border-white dark:border-[#333] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-brand-gold/50 dark:focus:border-brand-gold/50 transition-all disabled:opacity-75 disabled:bg-slate-100/50 dark:disabled:bg-[#111]/50 w-full duration-300 ${className}`}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-colors duration-300">
      <span>{label}</span>
      <span className="text-slate-900 dark:text-white transition-colors duration-300">₹{value.toLocaleString()}</span>
    </div>
  );
}