'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  PlusCircle, Save, Trash2, X, Plus, Minus, MapPinned, 
  MapPin, ShoppingBag, Truck, DollarSign, Calculator, Keyboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatBDT } from '@/utils/currency';
import { BANGLADESH_DISTRICTS, calculateBangladeshShipping } from '@/utils/bangladesh-geo';
import Link from 'next/link';

export default function CreateOrderPage() {
  const router = useRouter();
  
  // -- State: Customer & Address --
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [district, setDistrict] = useState('Dhaka');
  const [thana, setThana] = useState('Dhanmondi');

  // -- State: Items --
  const [items, setItems] = useState<any[]>([]);
  
  // -- State: Financials --
  const [discountAmount, setDiscountAmount] = useState(0);

  // -- Fetch Catalog (Products with their Variants) --
  const { data: productsData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['admin-products-for-order'],
    queryFn: async () => {
      // Fetching products so we can select product first, then variant
      const res: any = await api.get('/products?per_page=500');
      return res?.data?.data || res?.data || [];
    }
  });

  // -- Derived Data --
  const shippingInfo = useMemo(() => {
    return calculateBangladeshShipping(district, thana);
  }, [district, thana]);

  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const deliveryCharge = shippingInfo.fee;
  const totalPayable = itemsSubtotal + deliveryCharge - discountAmount;

  // -- Handlers --
  const handleAddEmptyItem = () => {
    setItems([...items, { product_id: '', variant_id: '', price: 0, quantity: 1, name: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = productsData?.find((p: any) => p.id.toString() === productId);
    if (product) {
      const newItems = [...items];
      const variants = product.variants || [];
      
      // Auto-select the first variant if there is only 1, or just store product for now
      const defaultVariant = variants.length > 0 ? variants[0] : null;

      newItems[index] = {
        product_id: product.id,
        variant_id: defaultVariant ? defaultVariant.id : '',
        price: defaultVariant ? Number(defaultVariant.price) : Number(product.current_price || product.base_price),
        quantity: 1,
        name: product.name_en
      };
      setItems(newItems);
    }
  };

  const handleVariantChange = (index: number, variantId: string) => {
    const newItems = [...items];
    const product = productsData?.find((p: any) => p.id === newItems[index].product_id);
    if (product) {
      const variant = product.variants?.find((v: any) => v.id.toString() === variantId);
      if (variant) {
        newItems[index].variant_id = variant.id;
        newItems[index].price = Number(variant.price);
      }
    }
    setItems(newItems);
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const newItems = [...items];
    newItems[index].quantity = newQty;
    setItems(newItems);
  };

  // -- Submit --
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post('/admin/orders', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Order created successfully');
      router.push('/admin/orders');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create order');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate that variants are selected
    if (items.some(i => !i.variant_id)) {
      toast.error('Please make sure a specific variant is selected for all products.');
      return;
    }
    
    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      shipping_address: `${address}, ${thana}, ${district}`,
      district: district,
      thana: thana,
      shipping_zone: shippingInfo.zone,
      payment_method: 'cod',
      items: items.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        unit_price: i.price,
        quantity: i.quantity,
      })),
      status: 'confirmed', 
      discount: discountAmount,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="clay-card p-6 rounded-3xl flex items-center gap-4">
        <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-primary font-black">
          <Keyboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Create Manual Order</h1>
          <p className="text-xs text-primary font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Order will automatically sync stock and inventory upon confirmation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Location */}
        <div className="clay-card p-6 rounded-3xl space-y-6">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
            <MapPinned className="w-4 h-4 text-primary" /> Customer Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Customer Name *</label>
              <input 
                required 
                placeholder="e.g. Asif Mahmud"
                type="text" 
                className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Mobile Number (11-digit BD) *</label>
              <input 
                required 
                placeholder="017XXXXXXXX"
                type="text" 
                className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">Delivery Address *</label>
            <textarea 
              required 
              placeholder="House, Road, Block/Sector, Area..."
              rows={2}
              className="w-full neu-inset rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">District *</label>
              <select
                required
                value={district}
                onChange={e => {
                  setDistrict(e.target.value);
                  const firstThana = BANGLADESH_DISTRICTS.find(d => d.name === e.target.value)?.thanas[0]?.name || '';
                  setThana(firstThana);
                }}
                className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none cursor-pointer text-foreground"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.name_bn})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Thana / Upazila *</label>
              <select
                required
                value={thana}
                onChange={e => setThana(e.target.value)}
                className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none cursor-pointer text-foreground"
              >
                {(BANGLADESH_DISTRICTS.find(d => d.name === district)?.thanas || []).map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.name_bn})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Shipping Zone</label>
              <div className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-sm font-black text-primary border border-primary/20 flex items-center justify-between">
                <span>{shippingInfo.zoneLabel}</span>
                <span>৳{shippingInfo.fee}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="clay-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Order Items & Quantities
            </h3>
            <button 
              type="button"
              onClick={handleAddEmptyItem}
              className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const selectedProduct = productsData?.find((p: any) => p.id === item.product_id);
              const hasMultipleVariants = selectedProduct?.variants?.length > 1;

              return (
                <div key={index} className="flex flex-col md:flex-row items-end gap-3 p-4 rounded-2xl border-2 border-border/50 bg-muted/10 relative group">
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center font-black text-xs shadow-md shadow-primary/20">
                    {index + 1}
                  </div>
                  
                  {/* Product Selection */}
                  <div className="flex-1 w-full flex flex-col gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Select Product *</label>
                      <select 
                        required
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full neu-inset rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none"
                      >
                        <option value="" disabled>-- Choose Product --</option>
                        {productsData?.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name_en}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selection (Only show if product has variations) */}
                    {hasMultipleVariants && (
                      <div>
                        <label className="block text-[10px] font-bold text-primary mb-1 uppercase">Select Variant (Size/Color) *</label>
                        <select 
                          required
                          value={item.variant_id}
                          onChange={(e) => handleVariantChange(index, e.target.value)}
                          className="w-full neu-inset rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none border border-primary/30"
                        >
                          {selectedProduct.variants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.color ? `Color: ${v.color}` : ''} {v.size ? `Size: ${v.size}` : ''} (Stock: {v.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-28">
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Price (৳)</label>
                    <div className="w-full bg-muted/50 rounded-xl px-3 py-2 text-sm font-black text-foreground cursor-not-allowed">
                      {item.price}
                    </div>
                  </div>

                  <div className="w-full md:w-28">
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Qty</label>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateItemQty(index, item.quantity - 1)} className="w-7 h-7 flex flex-shrink-0 items-center justify-center bg-muted rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <input 
                        type="number" 
                        min="1"
                        className="w-10 neu-inset rounded-lg px-1 py-1 text-center text-sm font-black flex-shrink-0"
                        value={item.quantity}
                        onChange={(e) => updateItemQty(index, parseInt(e.target.value) || 1)}
                      />
                      <button type="button" onClick={() => updateItemQty(index, item.quantity + 1)} className="w-7 h-7 flex flex-shrink-0 items-center justify-center bg-muted rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-32">
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Line Total</label>
                    <div className="w-full bg-primary/10/50 dark:bg-primary/10/20 text-primary rounded-xl px-3 py-2 text-sm font-black border border-primary/20 text-right">
                      ৳ {item.price * item.quantity}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            
            {items.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center opacity-50">
                <ShoppingBag className="w-8 h-8 mb-2" />
                <p className="text-sm font-bold">No items added yet</p>
                <p className="text-xs">Click 'Add Item' to start building the order.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Settings */}
          <div className="md:col-span-7 clay-card p-6 rounded-3xl space-y-4 h-fit">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
              <DollarSign className="w-4 h-4 text-primary" /> Settings & Discounts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Payment Method</label>
                <div className="w-full bg-primary/10 rounded-xl px-4 py-3 text-sm font-black text-primary border border-primary/20">
                  Cash on Delivery (COD)
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Initial Status</label>
                <div className="w-full bg-primary/10 rounded-xl px-4 py-3 text-sm font-black text-primary border border-primary/20">
                  Confirmed (Deducts Stock)
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Discount Amount (৳)</label>
              <input 
                type="number" 
                min="0"
                className="w-full neu-inset rounded-xl px-4 py-3 text-sm font-black text-rose-500 focus:outline-none focus:ring-2 focus:ring-primary"
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="md:col-span-5 clay-card p-6 rounded-3xl bg-slate-900 text-white dark:bg-black dark:border dark:border-slate-800 h-fit">
            <h3 className="text-sm font-black text-white/90 flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <Calculator className="w-4 h-4" /> Order Summary
            </h3>
            
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between items-center text-white/70">
                <span>Items Subtotal:</span>
                <span className="font-bold text-white">৳ {itemsSubtotal}</span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Delivery Charge:</span>
                <span className="font-bold text-white">+৳ {deliveryCharge}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-rose-400">
                  <span>Discount:</span>
                  <span className="font-bold">-৳ {discountAmount}</span>
                </div>
              )}
              
              <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
                <span className="font-black text-white/90">Total Payable:</span>
                <span className="text-2xl font-black text-primary">৳ {totalPayable}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link 
                href="/admin/orders"
                className="px-4 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white text-center transition-colors flex-1"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={createMutation.isPending || items.length === 0}
                className="px-4 py-3 rounded-xl font-black text-sm bg-primary hover:bg-primary text-white shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-2 whitespace-nowrap"
              >
                <Save className="w-4 h-4" /> Confirm & Create Order
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
