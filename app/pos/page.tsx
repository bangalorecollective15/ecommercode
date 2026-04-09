"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import {
  Search, ShoppingCart, User, CreditCard, Plus, Minus, X, Check, RefreshCw, Hash, Tag
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [customerType, setCustomerType] = useState<"existing" | "new" | "">("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedVariations, setSelectedVariations] = useState<{ [key: number]: number }>({});
  const [isPlacing, setIsPlacing] = useState(false);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [editingField, setEditingField] = useState<"tax" | "discount" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, custRes] = await Promise.all([
        supabase.from("categories").select("*").order("priority", { ascending: true }),
        supabase.from("products").select(`
          *, 
          product_variations (
            *,
            color:color_id (name),
            size:size_id (name)
          )
        `),
        supabase.from("customers").select("*").order("name", { ascending: true })
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      if (custRes.data) setCustomers(custRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to sync inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const lowerSearch = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.phone?.includes(customerSearch) ||
      c.name?.toLowerCase().includes(lowerSearch)
    );
  }, [customerSearch, customers]);

  const addToCart = (product: any) => {
    const variationId = selectedVariations[product.id];
    const variation =
      product.product_variations?.find((v: any) => v.id === variationId) ||
      (product.product_variations?.length === 1 ? product.product_variations[0] : null);

    if (product.product_variations?.length > 1 && !variation) {
      return toast.error("Select variation first");
    }

    const cid = variation ? `${product.id}-${variation.id}` : `${product.id}`;
    const existing = cart.find((item) => item.cid === cid);
    const availableStock = variation ? variation.stock : product.stock;
    const currentQty = existing ? existing.qty : 0;

    if (currentQty + 1 > availableStock) {
      return toast.error("Stock limit reached");
    }

    // Logic for Sale Price selection
    const originalPrice = variation ? variation.price : product.price;
    const salePrice = variation ? variation.sale_price : product.sale_price;
    const finalPrice = (salePrice && salePrice > 0 && salePrice < originalPrice) ? salePrice : originalPrice;

    if (existing) {
      setCart(cart.map((item) => item.cid === cid ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        cid, 
        id: product.id, 
        name: product.name, 
        variation,
        price: finalPrice, // Use sale price if applicable
        originalPrice: originalPrice,
        qty: 1,
      }]);
    }
    toast.success(`${product.name} added`, { style: { borderRadius: '12px', background: '#000', color: '#fff', fontSize: '10px', fontWeight: 'bold' } });
  };

  const updateQty = (cid: string, change: number) => {
    const item = cart.find((i) => i.cid === cid);
    if (!item) return;
    const availableStock = item.variation ? item.variation.stock : products.find((p) => p.id === item.id)?.stock || 0;
    const newQty = item.qty + change;

    if (newQty > availableStock) return toast.error("Stock limit reached");
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.cid !== cid));
    } else {
      setCart(cart.map((i) => (i.cid === cid ? { ...i, qty: newQty } : i)));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = subtotal + taxAmount - discountAmount;

  const placeOrder = async () => {
    if (!cart.length) return toast.error("Cart is empty");
    if (!customerType) return toast.error("Please select or add a customer");
    if (!paymentMethod) return toast.error("Select payment method");

    setIsPlacing(true);
    let customerId = selectedCustomerId;
    let customerName = "";
    let customerPhone = "";

    try {
      if (customerType === "new") {
        if (!newCustomer.name || !newCustomer.phone) {
          throw new Error("Name and Phone are required");
        }

        const { data: existingCust } = await supabase
          .from("customers")
          .select("id, name, phone")
          .eq("phone", newCustomer.phone)
          .maybeSingle();

        if (existingCust) {
          customerId = existingCust.id;
          customerName = existingCust.name;
          customerPhone = existingCust.phone;
        } else {
          const { data, error: custError } = await supabase
            .from("customers")
            .insert([{
              name: newCustomer.name,
              phone: newCustomer.phone,
              email: newCustomer.email.trim() === "" ? null : newCustomer.email
            }])
            .select()
            .single();

          if (custError) throw custError;
          customerId = data.id;
          customerName = data.name;
          customerPhone = data.phone;
        }
      } else {
        const customer = customers.find((c) => c.id === selectedCustomerId);
        if (!customer) throw new Error("Please select an existing customer");
        customerId = customer.id;
        customerName = customer.name;
        customerPhone = customer.phone;
      }

      const { error: orderError } = await supabase.from("pos_orders").insert([
        {
          customer_id: customerId,
          full_name: customerName,
          phone_number: customerPhone,
          payment_method: paymentMethod.toLowerCase(),
          subtotal: Number(subtotal),
          tax_amount: Number(taxAmount),
          discount_amount: Number(discountAmount),
          grand_total: Number(grandTotal),
          order_items: cart,
        },
      ]);

      if (orderError) throw orderError;

      toast.success("Order Processed Successfully", {
        style: { background: "#000", color: "#fff", borderRadius: "12px", fontWeight: 'bold' }
      });

      setCart([]);
      setCustomerType("");
      setSelectedCustomerId("");
      setCustomerSearch("");
      setNewCustomer({ name: "", email: "", phone: "" });
      setPaymentMethod("");
      setTaxAmount(0);
      setDiscountAmount(0);
      fetchData();

    } catch (err: any) {
      console.error("Checkout Error:", err);
      toast.error(err.message || "Transaction failed");
    } finally {
      setIsPlacing(false);
    }
  };

  const filteredProducts = products
    .filter((p) => searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
    .filter((p) => selectedCategory ? p.category_id === selectedCategory : true);

  if (loading && products.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-black" />
        <div className="text-black font-black tracking-tighter text-xl uppercase">Initialising Terminal...</div>
      </div>
    );
  }

return (
    <div className="flex flex-col md:flex-row h-screen bg-[#fcfcfc] overflow-hidden selection:bg-brand-gold selection:text-white">
      <Toaster position="top-right" />

      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Terminal 01</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-brand-blue uppercase leading-none">
                Studio <span className="text-brand-gold">POS</span>
              </h1>
            </div>

            <div className="flex flex-1 max-w-xl gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-brand-gold transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH COLLECTION..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/20 transition-all text-[10px] font-bold text-brand-blue uppercase placeholder:text-slate-300"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value) || "")}
                className="bg-brand-blue border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-gold/50 text-white cursor-pointer min-w-[160px] transition-all"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#fcfcfc]">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6">
            {filteredProducts.map((p) => {
              const variations = p.product_variations || [];
              const singleVar = variations.length === 1 ? variations[0] : null;
              const hasVariations = variations.length > 1;

              return (
                <div key={p.id} className="group relative flex flex-col justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-brand-gold/50 hover:shadow-2xl hover:shadow-brand-blue/5 transition-all duration-500">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[8px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/5 px-2.5 py-1 rounded-lg">
                        {categories.find(c => c.id === p.category_id)?.name || 'Studio'}
                      </span>
                      <Hash className="w-3 h-3 text-slate-200" />
                    </div>
                    <h3 className="text-[11px] font-black text-brand-blue uppercase leading-tight mb-4 tracking-wider line-clamp-2 h-8">{p.name}</h3>

                    {singleVar ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400">{singleVar.unit_value} {singleVar.unit_type}</span>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded ${singleVar.stock > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-400 bg-rose-50'}`}>
                            {singleVar.stock} IN STOCK
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-black text-brand-blue tracking-tighter">
                            ₹{(singleVar.sale_price && singleVar.sale_price > 0) ? singleVar.sale_price : singleVar.price}
                          </p>
                          {singleVar.sale_price && singleVar.sale_price > 0 && (
                            <p className="text-xs font-bold text-slate-300 line-through">₹{singleVar.price}</p>
                          )}
                        </div>
                      </div>
                    ) : hasVariations ? (
                      <div className="mt-4">
                        <select
                          value={selectedVariations[p.id] || ""}
                          onChange={(e) => setSelectedVariations({ ...selectedVariations, [p.id]: Number(e.target.value) })}
                          className="w-full text-[9px] font-black uppercase tracking-widest border-b-2 border-slate-50 py-2 outline-none focus:border-brand-gold text-brand-blue bg-transparent transition-colors"
                        >
                          <option value="">Select Variation</option>
                          {variations.map((v: any) => {
                            const label = [v.color?.name, v.size?.name].filter(Boolean).join(" / ");
                            const displayPrice = (v.sale_price && v.sale_price > 0) ? v.sale_price : v.price;
                            return (
                              <option key={v.id} value={v.id}>
                                {label || `Item #${v.id}`} — ₹{displayPrice}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400">Standard</span>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded ${p.stock > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-400 bg-rose-50'}`}>
                            {p.stock} IN STOCK
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-black text-brand-blue tracking-tighter">
                            ₹{(p.sale_price && p.sale_price > 0) ? p.sale_price : p.price}
                          </p>
                          {p.sale_price && p.sale_price > 0 && (
                            <p className="text-xs font-bold text-slate-300 line-through">₹{p.price}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={singleVar ? singleVar.stock === 0 : (!hasVariations && p.stock === 0)}
                    className="w-full mt-6 py-4 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-gold transition-all active:scale-95 disabled:bg-slate-50 disabled:text-slate-300 shadow-lg shadow-brand-blue/10"
                  >
                    {singleVar?.stock === 0 || (!hasVariations && p.stock === 0) ? "Archive Only" : "Add to Order"}
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* RIGHT: Checkout Sidebar */}
      <div className="w-full md:w-[450px] bg-white flex flex-col border-l border-slate-100 relative shadow-2xl">
        <div className="p-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-blue rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-blue/20">
              <ShoppingCart className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <h2 className="text-xs font-black text-brand-blue uppercase tracking-[0.2em]">Summary</h2>
              <p className="text-[10px] text-brand-gold font-black uppercase tracking-widest">Active Draft</p>
            </div>
          </div>
          <span className="bg-slate-50 text-brand-blue px-4 py-2 rounded-xl text-[10px] font-black border border-slate-100 tracking-widest">
            {cart.length} ITEMS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-50">
                <ShoppingCart className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">Awaiting Collection Items</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cid} className="group flex gap-4 bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:border-brand-gold/30 transition-all duration-300">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[10px] font-black text-brand-blue uppercase leading-tight tracking-wider">{item.name}</h4>
                    {item.originalPrice > item.price && <Tag className="w-3 h-3 text-brand-gold" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-brand-blue">₹{item.price}</span>
                    {item.variation && (
                      <span className="text-[8px] bg-brand-blue/5 px-2 py-0.5 rounded-md font-black text-brand-blue uppercase tracking-tighter">
                        {item.variation.unit_value}{item.variation.unit_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                    <button onClick={() => updateQty(item.cid, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white hover:text-brand-gold transition-all"><Minus size={12} /></button>
                    <span className="w-8 text-center text-[10px] font-black text-brand-blue">{item.qty}</span>
                    <button onClick={() => updateQty(item.cid, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white hover:text-brand-gold transition-all"><Plus size={12} /></button>
                  </div>
                  <p className="text-[11px] font-black w-16 text-right text-brand-blue tracking-tighter">₹{item.price * item.qty}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-100 space-y-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button onClick={() => setCustomerType("existing")} className={`py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${customerType === 'existing' ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400'}`}>Lookup</button>
              <button onClick={() => setCustomerType("new")} className={`py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${customerType === 'new' ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400'}`}>New Reg</button>
            </div>

            {customerType === "existing" ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="CLIENT IDENTIFIER..."
                  value={customerSearch}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }}
                  className="w-full text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-brand-gold/30 focus:bg-white transition-all text-brand-blue uppercase tracking-widest placeholder:text-slate-300"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="FULL NAME" className="text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-brand-gold/30 text-brand-blue uppercase" onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value.toUpperCase() })} />
                <input placeholder="MOBILE NO" className="text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-brand-gold/30 text-brand-blue" onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-2">
            {['Cash', 'Card', 'UPI'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-4 text-[9px] font-black uppercase tracking-widest rounded-2xl border-2 transition-all ${paymentMethod === method ? 'bg-brand-gold border-brand-gold text-white shadow-xl shadow-brand-gold/20' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'}`}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-50 space-y-3">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-brand-blue">₹{(subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <div>
                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-1">Grand Settlement</p>
                <h3 className="text-4xl font-black text-brand-blue tracking-tighter">₹{(grandTotal || 0).toFixed(2)}</h3>
              </div>
              <button
                onClick={placeOrder}
                disabled={cart.length === 0 || isPlacing}
                className="h-16 px-10 bg-brand-blue text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-brand-gold transition-all active:scale-95 disabled:bg-slate-50 disabled:text-slate-200 shadow-2xl shadow-brand-blue/20 flex items-center justify-center gap-4"
              >
                {isPlacing ? <RefreshCw className="w-4 h-4 animate-spin text-brand-gold" /> : "Authorize Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Adjustment Overlay */}
      {editingField && (
        <div className="fixed inset-0 bg-brand-blue/90 backdrop-blur-xl flex justify-center items-center z-[100] p-6">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-blue">Adjust {editingField}</h3>
              <button onClick={() => setEditingField(null)} className="p-2 bg-slate-50 rounded-full hover:bg-brand-gold hover:text-white transition-all"><X size={18} /></button>
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-brand-gold opacity-50">₹</span>
              <input
                type="number"
                autoFocus
                className="w-full bg-slate-50 border-none rounded-3xl p-8 pl-16 text-5xl font-black text-center focus:ring-0 text-brand-blue outline-none"
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  editingField === "tax" ? setTaxAmount(val) : setDiscountAmount(val);
                }}
              />
            </div>
            <button
              onClick={() => setEditingField(null)}
              className="w-full mt-10 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-brand-gold transition-all"
            >
              Update Settlement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}