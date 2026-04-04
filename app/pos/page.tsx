"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import {
  Search, ShoppingCart, User, CreditCard, Plus, Minus, X, Check, RefreshCw, Hash
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
      // Update this line inside your fetchData function
      /* Replace the prodRes line in your fetchData function */
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
    // Close dropdown on click outside
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

    if (existing) {
      setCart(cart.map((item) => item.cid === cid ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        cid, id: product.id, name: product.name, variation,
        price: variation ? variation.price : product.price, qty: 1,
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

        // Check for existing phone number to prevent duplicates
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

      // Insert Order
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

      // Reset Terminal
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
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden selection:bg-black selection:text-white">
      <Toaster position="top-right" />

      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-black uppercase">Terminal POS</h1>
            </div>

            <div className="flex flex-1 max-w-xl gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition-all text-xs font-bold text-black"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value) || "")}
                className="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-black text-black cursor-pointer min-w-[150px]"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const variations = p.product_variations || [];
              const singleVar = variations.length === 1 ? variations[0] : null;
              const hasVariations = variations.length > 1;

              return (
                <div key={p.id} className="group relative flex flex-col justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-black hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        {categories.find(c => c.id === p.category_id)?.name || 'General'}
                      </span>
                      <Hash className="w-3 h-3 text-gray-200" />
                    </div>
                    <h3 className="text-sm font-black text-black uppercase leading-tight mb-3 line-clamp-2">{p.name}</h3>

                    {singleVar ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400">{singleVar.unit_value} {singleVar.unit_type}</span>
                          <span className={`text-[9px] font-black ${singleVar.stock > 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {singleVar.stock} IN STOCK
                          </span>
                        </div>
                        <p className="text-xl font-black text-black tracking-tighter">₹{singleVar.price}</p>
                      </div>
                    ) : hasVariations ? (
                      <div className="mt-4">
                        <select
                          value={selectedVariations[p.id] || ""}
                          onChange={(e) => setSelectedVariations({ ...selectedVariations, [p.id]: Number(e.target.value) })}
                          className="w-full text-[10px] font-black uppercase tracking-widest border-b border-gray-100 py-2 outline-none focus:border-black text-black bg-transparent"
                        >
                          <option value="">Select Variation</option>
                          {/* Replace your current variations.map with this */}
                          {/* Replace your current variations.map with this logic */}
                          {variations.map((v: any) => {
                            const colorName = v.color?.name;
                            const sizeName = v.size?.name;

                            // Combines color and size (e.g., "Black / 40") or shows just one if the other is null
                            const label = [colorName, sizeName].filter(Boolean).join(" / ");

                            return (
                              <option key={v.id} value={v.id}>
                                {label || `Variation #${v.id}`} — ₹{v.price}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400">Standard</span>
                          <span className={`text-[9px] font-black ${p.stock > 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {p.stock} IN STOCK
                          </span>
                        </div>
                        <p className="text-xl font-black text-black tracking-tighter">₹{p.price}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={singleVar ? singleVar.stock === 0 : (!hasVariations && p.stock === 0)}
                    className="w-full mt-6 py-3 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95"
                  >
                    {singleVar?.stock === 0 || (!hasVariations && p.stock === 0) ? "Sold Out" : "Add to Cart"}
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* RIGHT: Checkout Sidebar */}
      <div className="w-full md:w-[450px] bg-white flex flex-col border-l border-slate-200 relative shadow-2xl">

        {/* Header Section */}
        <div className="p-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Checkout</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Terminal ID: #001</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black border border-slate-200">
              {cart.length} ITEMS
            </span>
          </div>
        </div>

        {/* Cart Items Section */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 no-scrollbar bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <ShoppingCart className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">Your terminal cart <br /> is currently empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cid} className="group flex gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
                <div className="flex-1">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase leading-tight mb-1">{item.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">₹{item.price}</span>
                    {item.variation && (
                      <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500 uppercase">
                        {item.variation.unit_value}{item.variation.unit_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                    <button onClick={() => updateQty(item.cid, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-black transition-all"><Minus className="w-3 h-3" /></button>
                    <span className="w-8 text-center text-xs font-black text-slate-900">{item.qty}</span>
                    <button onClick={() => updateQty(item.cid, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-black transition-all"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-xs font-black w-16 text-right text-slate-900 tracking-tighter">₹{item.price * item.qty}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout Section */}
        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] space-y-5">

          {/* Customer Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <User className="w-3 h-3 text-slate-900" /> Customer
              </div>
              <button onClick={fetchData} className="p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <RefreshCw className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setCustomerType("existing")}
                className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${customerType === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >Lookup</button>
              <button
                onClick={() => setCustomerType("new")}
                className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${customerType === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >New Reg</button>
            </div>

            {customerType === "existing" ? (
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="NAME OR MOBILE..."
                  value={customerSearch}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }}
                  className="w-full text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-xl p-3.5 pl-10 focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all text-slate-900 uppercase"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                {isCustomerDropdownOpen && (
                  <div className="absolute bottom-full mb-3 z-[60] w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="max-h-48 overflow-y-auto no-scrollbar">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => { setSelectedCustomerId(c.id); setCustomerSearch(c.name); setIsCustomerDropdownOpen(false); }}
                            className={`p-4 text-[10px] font-black uppercase cursor-pointer hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-none ${selectedCustomerId === c.id ? 'bg-slate-50' : 'text-slate-900'}`}
                          >
                            <div>
                              <p className="text-slate-900">{c.name}</p>
                              <p className="text-[8px] text-slate-400 mt-0.5">{c.phone}</p>
                            </div>
                            {selectedCustomerId === c.id && <div className="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-[10px] font-black text-slate-300 uppercase text-center">Not found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="FULL NAME" value={newCustomer.name} className="text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-xl p-3.5 focus:ring-2 focus:ring-slate-950 focus:bg-white text-slate-900 uppercase" onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value.toUpperCase() })} />
                <input placeholder="MOBILE NO" value={newCustomer.phone} className="text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-xl p-3.5 focus:ring-2 focus:ring-slate-950 focus:bg-white text-slate-900" onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
              </div>
            )}
          </div>

          {/* Settlement Method */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <CreditCard className="w-3 h-3 text-slate-900" /> Settlement
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Card', 'UPI'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 text-[9px] font-black uppercase tracking-widest rounded-xl border-2 transition-all ${paymentMethod === method ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Financials */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>SUBTOTAL</span>
              <span className="text-slate-900">₹{(subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <button onClick={() => setEditingField('tax')} className="hover:text-slate-900">TAX (GST)</button>
              <span className="text-slate-900">+ ₹{(taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <button onClick={() => setEditingField('discount')} className="hover:text-slate-900">ADJUSTMENT</button>
              <span className="text-emerald-600">- ₹{(discountAmount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-end pt-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{(grandTotal || 0).toFixed(2)}</h3>
              </div>
              <button
                onClick={placeOrder}
                disabled={cart.length === 0 || isPlacing}
                className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
              >
                {isPlacing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Authorize"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MINIMAL MODAL */}
      {editingField && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-6">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black">Adjust {editingField}</h3>
              <button onClick={() => setEditingField(null)} className="p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">₹</span>
              <input
                type="number"
                autoFocus
                value={editingField === "tax" ? (taxAmount || "") : (discountAmount || "")}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  editingField === "tax" ? setTaxAmount(val) : setDiscountAmount(val);
                }}
                className="w-full bg-gray-50 border-none rounded-2xl p-6 pl-12 text-4xl font-black text-center focus:ring-0 text-black outline-none"
              />
            </div>
            <button
              onClick={() => setEditingField(null)}
              className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all"
            >
              Apply Adjustments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}