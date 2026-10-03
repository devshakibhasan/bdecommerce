"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function PosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    district: "Dhaka",
    thana: "Dhanmondi",
    zone: "inside_dhaka"
  });
  
  const [discount, setDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(80);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get(`/products?search=${search}&limit=20`);
      return res.data;
    }
  });
  
  const products = productsData?.data || [];

  const addToCart = (product: any, variant: any = null) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.product_id === product.id && 
        (variant ? item.variant_id === variant.id : !item.variant_id)
      );
      
      if (existing) {
        return prev.map(item => 
          item.id === existing.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, {
        id: Math.random().toString(36),
        product_id: product.id,
        variant_id: variant?.id,
        name: product.name_en,
        variant_name: variant ? `${variant.color ? 'Color: '+variant.color : ''} ${variant.size ? 'Size: '+variant.size : ''}`.trim() : '',
        price: Number(variant?.price || product.base_price),
        quantity: 1,
        image: product.primary_image || null
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee - discount;

  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/admin/orders', payload);
    },
    onSuccess: () => {
      toast.success("Order Created Successfully!");
      setCart([]);
      setCustomer({ name: "", phone: "", address: "", district: "Dhaka", thana: "Dhanmondi", zone: "inside_dhaka" });
      setDiscount(0);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create order");
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!customer.phone) return toast.error("Customer phone is required");

    const payload = {
      customer_name: customer.name || 'Walk-in Customer',
      customer_phone: customer.phone,
      shipping_address: customer.address || 'In-Store',
      district: customer.district,
      thana: customer.thana,
      shipping_zone: customer.zone,
      source: 'manual',
      fulfillment_status: 'confirmed',
      payment_method: 'cod',
      payment_status: 'unpaid',
      delivery_fee: deliveryFee,
      discount_amount: discount,
      advance_amount: 0,
      items: cart.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.name,
        variant_name: item.variant_name,
        unit_price: item.price,
        quantity: item.quantity
      }))
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden p-4">
      
      {/* LEFT: PRODUCTS */}
      <div className="w-2/3 flex flex-col bg-card border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">Loading...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">No products found.</div>
          ) : (
            products.map((p: any) => (
              <div 
                key={p.id} 
                className="border rounded-lg overflow-hidden flex flex-col hover:border-primary cursor-pointer transition-all bg-white"
                onClick={() => {
                  if (!p.variants || p.variants.length === 0) {
                    addToCart(p);
                  } else {
                    addToCart(p, p.variants[0]); // default to first variant for now
                  }
                }}
              >
                <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                  {p.primary_image ? (
                    <img src={p.primary_image} alt={p.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="text-slate-300 w-8 h-8" />
                  )}
                  <div className="absolute inset-0 bg-primary/0 hover:bg-primary/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="p-3 text-sm flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold line-clamp-2 leading-tight mb-1 text-slate-800">{p.name_en}</h3>
                    <p className="text-xs text-muted-foreground">{p.sku_prefix}</p>
                  </div>
                  <div className="font-bold text-primary mt-2">৳{p.base_price}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: CART & CHECKOUT */}
      <div className="w-1/3 flex flex-col bg-card border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-slate-900 text-white rounded-t-lg">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Sale
          </h2>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              Cart is empty
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center border-b pb-3">
                <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" title={item.name}>{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.variant_name}</div>
                  <div className="font-bold text-primary text-sm">৳{item.price}</div>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded"><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Customer & Totals */}
        <div className="border-t p-4 bg-muted/10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="text" placeholder="Customer Phone *" className="border p-2 rounded text-sm focus:border-primary outline-none" 
              value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})}
            />
            <input 
              type="text" placeholder="Customer Name" className="border p-2 rounded text-sm focus:border-primary outline-none" 
              value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})}
            />
            <input 
              type="text" placeholder="Address" className="border p-2 rounded text-sm col-span-2 focus:border-primary outline-none" 
              value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})}
            />
          </div>

          <div className="space-y-2 text-sm pt-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">৳{subtotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Delivery</span>
              <select className="border rounded px-2 py-1 text-xs outline-none" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))}>
                <option value={80}>Inside Dhaka (৳80)</option>
                <option value={150}>Outside Dhaka (৳150)</option>
                <option value={0}>Pickup (৳0)</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center gap-1">
                ৳ <input type="number" className="border w-16 px-2 py-1 rounded text-right outline-none text-xs" value={discount || ''} onChange={e => setDiscount(Number(e.target.value) || 0)} />
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2 flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">৳{total}</span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={createOrderMutation.isPending || cart.length === 0}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {createOrderMutation.isPending ? 'Processing...' : <><CheckCircle2 className="w-5 h-5" /> Complete Sale</>}
          </button>
        </div>
      </div>
    </div>
  );
}
