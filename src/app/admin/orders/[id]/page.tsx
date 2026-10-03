'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { formatBDT } from '@/utils/currency';
import { BANGLADESH_DISTRICTS } from '@/utils/bangladesh-geo';
import { Order, OrderStatus } from '@/types';
import { ScanBarcode } from 'lucide-react';
import { 
  ArrowLeft, MapPin, Phone, User, Package, Truck, Printer, 
  CheckCircle, AlertTriangle, ShieldCheck, Clock, ExternalLink,
  Edit3, Trash2, CheckCircle2, XCircle, Send, RefreshCw, X,
  Save, Plus, Minus, Tag, CreditCard, Layers, DollarSign, History,
  Palette, Ruler, Copy, Check, Megaphone, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { syncEntityInCache } from '@/lib/cacheSync';
import toast from 'react-hot-toast';
import { OrderPrintSlip, PrintSlipOrder } from '@/components/admin/OrderPrintSlip';
import { BarcodePrintModal } from '@/components/admin/BarcodePrintModal';
import { CustomerRiskBadge } from '@/components/admin/CustomerRiskBadge';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintSlipModalOpen, setIsPrintSlipModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Master Editable Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    district: 'Dhaka',
    thana: 'Dhanmondi',
    shipping_zone: 'inside_dhaka',
    courier_name: '',
    tracking_code: '',
    payment_method: 'cod',
    payment_status: 'pending',
    fulfillment_status: 'confirmed',
    delivery_fee: 80,
    discount_amount: 0,
    advance_amount: 0,
    payment_transaction_id: '',
    notes: '',
    admin_notes: '',
    items: [] as any[],
  });

  // State for adding a new item
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState<string>('');
  const [selectedNewColor, setSelectedNewColor] = useState<string>('');
  const [selectedNewSize, setSelectedNewSize] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [isCustomItemMode, setIsCustomItemMode] = useState<boolean>(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    product_name: '',
    sku: '',
    color: '',
    size: '',
    variant_name: '',
    unit_price: 500,
    quantity: 1,
    variant_id: undefined as number | undefined,
    product_id: undefined as number | undefined,
  });

  // 1. Fetch Real Order Data
  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['admin-order-detail', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/admin/orders/${id}`);
        const item = res?.data?.data || res?.data;
        if (item) {
          return item as Order;
        }
      } catch (e) {
        /* silenced */
      }
      return null;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Automatically synchronize form state whenever order data is loaded, refreshed, or mutated
  useEffect(() => {
    if (!order) return;
    setFormData({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      customer_email: order.customer_email || '',
      shipping_address: order.shipping_address || '',
      district: order.district || 'Dhaka',
      thana: order.thana || 'Dhanmondi',
      shipping_zone: order.shipping_zone || 'inside_dhaka',
      courier_name: order.courier_name || '',
      tracking_code: order.tracking_code || '',
      payment_method: order.payment_method || 'cod',
      payment_status: order.payment_status || 'pending',
      fulfillment_status: order.fulfillment_status || 'confirmed',
      delivery_fee: Number(order.delivery_fee) || 80,
      discount_amount: Number(order.discount_amount) || 0,
      advance_amount: Number(order.advance_amount) || 0,
      payment_transaction_id: (order as any).payment_transaction_id || (order as any).transaction_id || (order as any).payment?.transaction_id || '',
      notes: order.notes || '',
      admin_notes: (order as any).admin_notes || order.notes || '',
      items: order.items && Array.isArray(order.items) ? order.items.map((it: any) => ({
        id: it.id,
        product_id: it.product_id,
        variant_id: it.variant_id,
        product_name: it.product_name || it.product?.name_en || 'Product Item',
        sku: it.sku || 'SKU-STD',
        color: it.color || it.variant?.color || '',
        size: it.size || it.variant?.size || '',
        variant_name: it.variant_name || '',
        unit_price: Number(it.unit_price) || 0,
        quantity: Number(it.quantity) || 1,
      })) : [],
    });
  }, [order]);

  // Fetch catalog products for quick item selector
  const { data: catalogProducts = [] } = useQuery({
    queryKey: ['admin-catalog-products-for-orders'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/products?per_page=150');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  // Calculate Subtotal & Total
  const subtotal = useMemo(() => {
    return formData.items.reduce((acc, it) => acc + ((Number(it.unit_price) || 0) * (Number(it.quantity) || 1)), 0);
  }, [formData.items]);

  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal + (Number(formData.delivery_fee) || 0) - (Number(formData.discount_amount) || 0));
  }, [subtotal, formData.delivery_fee, formData.discount_amount]);

  const totalUnits = useMemo(() => {
    return formData.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  }, [formData.items]);

  const currentDistrict = useMemo(() => {
    return BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === formData.district.toLowerCase()) || BANGLADESH_DISTRICTS[0];
  }, [formData.district]);

  // Prepared data object for the official Print Slip
  const printOrderData: PrintSlipOrder = useMemo(() => {
    return {
      id: order?.id,
      order_number: order?.order_number || 'BD-ORDER',
      created_at: order?.created_at,
      customer_name: formData.customer_name || order?.customer_name || 'Valued Customer',
      customer_phone: formData.customer_phone || order?.customer_phone || '',
      customer_email: formData.customer_email || order?.customer_email || '',
      shipping_address: formData.shipping_address || order?.shipping_address || '',
      district: formData.district || order?.district || 'Dhaka',
      thana: formData.thana || order?.thana || '',
      shipping_zone: formData.shipping_zone || (order as any)?.shipping_zone || '',
      shipping_zone_label: (order as any)?.shipping_zone_label || '',
      delivery_speed: (order as any)?.delivery_speed || 'standard',
      courier_name: formData.courier_name || order?.courier_name || '',
      tracking_code: formData.tracking_code || order?.tracking_code || '',
      payment_method: formData.payment_method || order?.payment_method || 'cod',
      payment_status: formData.payment_status || order?.payment_status || 'pending',
      fulfillment_status: formData.fulfillment_status || order?.fulfillment_status || 'confirmed',
      subtotal,
      delivery_fee: Number(formData.delivery_fee) || 0,
      discount_amount: Number(formData.discount_amount) || 0,
      advance_amount: Number(formData.advance_amount) || 0,
      coupon_code: (order as any)?.coupon_code,
      total_payable: totalPayable,
      payment_transaction_id: formData.payment_transaction_id || (order as any)?.payment_transaction_id,
      notes: formData.notes || order?.notes,
      admin_notes: formData.admin_notes || (order as any)?.admin_notes,
      items: formData.items.map((it: any) => ({
        id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        sku: it.sku,
        color: it.color,
        size: it.size,
        variant_name: it.variant_name,
        unit_price: Number(it.unit_price) || 0,
        quantity: Number(it.quantity) || 1,
        total: (Number(it.unit_price) || 0) * (Number(it.quantity) || 1),
        image: it.image,
      })),
    };
  }, [order, formData, subtotal, totalPayable]);

  // Handle District Switch
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDistName = e.target.value;
    const selectedDist = BANGLADESH_DISTRICTS.find(d => d.name === selectedDistName);
    const defaultThana = selectedDist?.thanas[0]?.name || '';
    const zone = selectedDistName.toLowerCase() === 'dhaka' ? 'inside_dhaka' : 'outside_dhaka';
    const fee = zone === 'inside_dhaka' ? 80 : 130;

    setFormData(prev => ({
      ...prev,
      district: selectedDistName,
      thana: defaultThana,
      shipping_zone: zone,
      delivery_fee: fee,
    }));
  };

  // 2. Master Update Mutation (Saves all fields, items, financials & triggers auto-stock)
  const updateOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.put(`/admin/orders/${id}`, payload);
    },
    onSuccess: (res: any) => {
      toast.success('Order details, line items & inventory synced successfully!');
      const orderPayload = res?.data?.data || res?.data || formData;
      syncEntityInCache(queryClient, 'order', orderPayload);
      queryClient.setQueryData(['admin-order-detail', id], orderPayload);
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['scan-stats'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update order');
    }
  });

  // 3. Quick Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      return await api.put(`/admin/orders/${id}/status`, { status, note });
    },
    onSuccess: (res: any, vars) => {
      toast.success(`Fulfillment status updated to ${vars.status.replace(/_/g, ' ')} (Stock auto-synced)`);
      const orderPayload = res?.data?.data || res?.data;
      if (orderPayload) {
        syncEntityInCache(queryClient, 'order', orderPayload);
        queryClient.setQueryData(['admin-order-detail', id], orderPayload);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      refetch();
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  // 4. Delete Order Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/admin/orders/${id}`);
    },
    onSuccess: () => {
      toast.success('Order moved to Recycle Bin! Reserved inventory restored.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-deleted-count'] });
      router.push('/admin/orders/deleted');
    },
    onError: () => {
      toast.error('Failed to delete order');
    }
  });

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!formData.customer_phone.trim()) {
      toast.error('Customer phone number is required');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('At least one item is required in the order');
      return;
    }

    updateOrderMutation.mutate({
      ...formData,
      subtotal: subtotal,
      total_payable: totalPayable,
    });
  };

  // 5. Dedicated Item-Level CRUD Mutations (Instant Execution & Cache Sync)
  const addItemMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post(`/admin/orders/${id}/items`, payload);
    },
    onSuccess: (res: any) => {
      toast.success('New item added & inventory synced!');
      const orderPayload = res?.data?.data || res?.data;
      if (orderPayload) {
        syncEntityInCache(queryClient, 'order', orderPayload);
        queryClient.setQueryData(['admin-order-detail', id], orderPayload);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['scan-stats'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add item to order');
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, payload }: { itemId: number; payload: any }) => {
      return await api.put(`/admin/orders/${id}/items/${itemId}`, payload);
    },
    onSuccess: (res: any) => {
      toast.success('Order item updated & inventory synced!');
      const orderPayload = res?.data?.data || res?.data;
      if (orderPayload) {
        syncEntityInCache(queryClient, 'order', orderPayload);
        queryClient.setQueryData(['admin-order-detail', id], orderPayload);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['scan-stats'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update order item');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return await api.delete(`/admin/orders/${id}/items/${itemId}`);
    },
    onSuccess: (res: any) => {
      toast.success('Item deleted and reserved inventory restored');
      const orderPayload = res?.data?.data || res?.data;
      if (orderPayload) {
        syncEntityInCache(queryClient, 'order', orderPayload);
        queryClient.setQueryData(['admin-order-detail', id], orderPayload);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['scan-stats'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete order item');
    }
  });

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      toast.error('An order must contain at least 1 item');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleQtyChange = (idx: number, delta: number) => {
    const current = Number(formData.items[idx].quantity) || 1;
    const next = Math.max(1, current + delta);
    handleItemChange(idx, 'quantity', next);
  };

  const handleAddNewItem = async () => {
    if (!newItem.product_name.trim()) {
      toast.error('Please select a product from the catalog');
      return;
    }

    try {
      await addItemMutation.mutateAsync({
        product_id: newItem.product_id,
        variant_id: newItem.variant_id,
        product_name: newItem.product_name,
        sku: newItem.sku,
        color: newItem.color,
        size: newItem.size,
        variant_name: newItem.variant_name,
        unit_price: newItem.unit_price,
        quantity: newItem.quantity,
      });

      setNewItem({
        product_name: '',
        sku: '',
        color: '',
        size: '',
        variant_name: '',
        unit_price: 500,
        quantity: 1,
        variant_id: undefined,
        product_id: undefined,
      });
      setSelectedCatalogProductId('');
      setSelectedNewColor('');
      setSelectedNewSize('');
      setSelectedVariantId('');
      setIsCustomItemMode(false);
      setIsAddItemModalOpen(false);
    } catch {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem }]
      }));
      setIsAddItemModalOpen(false);
      toast.success('Item added to matrix. Click Save Changes to commit all.');
    }
  };

  const handleSelectCatalogProduct = (productId: string) => {
    setSelectedCatalogProductId(productId);
    const prod = catalogProducts.find((p: any) => String(p.id) === productId);
    if (prod) {
      const variants = prod.variants || [];
      const firstVariant = variants[0];
      const initialColor = firstVariant?.color || '';
      const initialSize = firstVariant?.size || '';
      setSelectedNewColor(initialColor);
      setSelectedNewSize(initialSize);
      setSelectedVariantId(firstVariant ? String(firstVariant.id) : '');
      setNewItem({
        product_name: prod.name_en,
        sku: firstVariant?.sku || prod.sku_prefix || 'SKU-STD',
        color: initialColor,
        size: initialSize,
        variant_name: firstVariant ? [firstVariant.color ? `Color: ${firstVariant.color}` : '', firstVariant.size ? `Size: ${firstVariant.size}` : ''].filter(Boolean).join(' | ') : '',
        unit_price: Number(firstVariant?.price || prod.base_price || prod.current_price || 0),
        quantity: 1,
        variant_id: firstVariant?.id,
        product_id: prod.id,
      });
    } else {
      setSelectedNewColor('');
      setSelectedNewSize('');
      setSelectedVariantId('');
      setNewItem({
        product_name: '',
        sku: '',
        color: '',
        size: '',
        variant_name: '',
        unit_price: 500,
        quantity: 1,
        variant_id: undefined,
        product_id: undefined,
      });
    }
  };

  const handleModalColorChange = (newColor: string, prod: any) => {
    setSelectedNewColor(newColor);
    if (!prod || !prod.variants) return;

    let matching = prod.variants.find((v: any) => 
      (!newColor || v.color?.toLowerCase() === newColor.toLowerCase()) &&
      (!selectedNewSize || v.size?.toLowerCase() === selectedNewSize.toLowerCase())
    );

    if (!matching && newColor) {
      matching = prod.variants.find((v: any) => v.color?.toLowerCase() === newColor.toLowerCase());
      if (matching && matching.size) {
        setSelectedNewSize(matching.size);
      }
    }

    if (!matching) {
      matching = prod.variants[0];
    }

    if (matching) {
      setSelectedVariantId(String(matching.id));
      setNewItem(prev => ({
        ...prev,
        variant_id: matching.id,
        sku: matching.sku,
        color: matching.color || newColor || '',
        size: matching.size || selectedNewSize || '',
        variant_name: [matching.color ? `Color: ${matching.color}` : '', matching.size ? `Size: ${matching.size}` : ''].filter(Boolean).join(' | '),
        unit_price: Number(matching.price),
      }));
    }
  };

  const handleModalSizeChange = (newSize: string, prod: any) => {
    setSelectedNewSize(newSize);
    if (!prod || !prod.variants) return;

    let matching = prod.variants.find((v: any) => 
      (!selectedNewColor || v.color?.toLowerCase() === selectedNewColor.toLowerCase()) &&
      (!newSize || v.size?.toLowerCase() === newSize.toLowerCase())
    );

    if (!matching && newSize) {
      matching = prod.variants.find((v: any) => v.size?.toLowerCase() === newSize.toLowerCase());
      if (matching && matching.color) {
        setSelectedNewColor(matching.color);
      }
    }

    if (!matching) {
      matching = prod.variants[0];
    }

    if (matching) {
      setSelectedVariantId(String(matching.id));
      setNewItem(prev => ({
        ...prev,
        variant_id: matching.id,
        sku: matching.sku,
        color: matching.color || selectedNewColor || '',
        size: matching.size || newSize || '',
        variant_name: [matching.color ? `Color: ${matching.color}` : '', matching.size ? `Size: ${matching.size}` : ''].filter(Boolean).join(' | '),
        unit_price: Number(matching.price),
      }));
    }
  };

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    const prod = catalogProducts.find((p: any) => String(p.id) === selectedCatalogProductId);
    if (prod) {
      const variant = prod.variants?.find((v: any) => String(v.id) === variantId);
      if (variant) {
        setSelectedNewColor(variant.color || '');
        setSelectedNewSize(variant.size || '');
        setNewItem(prev => ({
          ...prev,
          variant_id: variant.id,
          sku: variant.sku,
          color: variant.color || '',
          size: variant.size || '',
          variant_name: [variant.color ? `Color: ${variant.color}` : '', variant.size ? `Size: ${variant.size}` : ''].filter(Boolean).join(' | '),
          unit_price: Number(variant.price),
        }));
      }
    }
  };

  const handleRowProductChange = (idx: number, pIdStr: string) => {
    const pId = Number(pIdStr);
    const prod = catalogProducts.find((p: any) => p.id === pId);
    if (prod) {
      const v = prod.variants?.[0];
      setFormData(prev => {
        const updated = [...prev.items];
        updated[idx] = {
          ...updated[idx],
          product_id: prod.id,
          product_name: prod.name_en,
          variant_id: v?.id,
          sku: v?.sku || prod.sku_prefix || 'SKU-STD',
          color: v?.color || '',
          size: v?.size || '',
          variant_name: v ? [v.color ? `Color: ${v.color}` : '', v.size ? `Size: ${v.size}` : ''].filter(Boolean).join(' | ') : '',
          unit_price: Number(v?.price || prod.base_price || prod.current_price || 0),
        };
        return { ...prev, items: updated };
      });
    }
  };

  const handleRowColorChange = (idx: number, newColor: string, prod: any) => {
    if (!prod || !prod.variants) return;
    const currentSize = formData.items[idx]?.size || '';
    
    let matchingVar = prod.variants.find((v: any) => 
      (!newColor || v.color?.toLowerCase() === newColor.toLowerCase()) &&
      (!currentSize || v.size?.toLowerCase() === currentSize.toLowerCase())
    );
    
    if (!matchingVar && newColor) {
      matchingVar = prod.variants.find((v: any) => v.color?.toLowerCase() === newColor.toLowerCase());
    }

    if (!matchingVar) {
      matchingVar = prod.variants[0];
    }

    if (matchingVar) {
      setFormData(prev => {
        const updated = [...prev.items];
        updated[idx] = {
          ...updated[idx],
          variant_id: matchingVar.id,
          sku: matchingVar.sku,
          color: matchingVar.color || newColor || '',
          size: matchingVar.size || '',
          variant_name: [matchingVar.color ? `Color: ${matchingVar.color}` : '', matchingVar.size ? `Size: ${matchingVar.size}` : ''].filter(Boolean).join(' | '),
          unit_price: Number(matchingVar.price),
        };
        return { ...prev, items: updated };
      });
    }
  };

  const handleRowSizeChange = (idx: number, newSize: string, prod: any) => {
    if (!prod || !prod.variants) return;
    const currentColor = formData.items[idx]?.color || '';

    let matchingVar = prod.variants.find((v: any) => 
      (!currentColor || v.color?.toLowerCase() === currentColor.toLowerCase()) &&
      (!newSize || v.size?.toLowerCase() === newSize.toLowerCase())
    );

    if (!matchingVar && newSize) {
      matchingVar = prod.variants.find((v: any) => v.size?.toLowerCase() === newSize.toLowerCase());
    }

    if (!matchingVar) {
      matchingVar = prod.variants[0];
    }

    if (matchingVar) {
      setFormData(prev => {
        const updated = [...prev.items];
        updated[idx] = {
          ...updated[idx],
          variant_id: matchingVar.id,
          sku: matchingVar.sku,
          color: matchingVar.color || '',
          size: matchingVar.size || newSize || '',
          variant_name: [matchingVar.color ? `Color: ${matchingVar.color}` : '', matchingVar.size ? `Size: ${matchingVar.size}` : ''].filter(Boolean).join(' | '),
          unit_price: Number(matchingVar.price),
        };
        return { ...prev, items: updated };
      });
    }
  };

  const handleQuickAddRow = () => {
    const defaultProd = catalogProducts[0];
    if (defaultProd) {
      const firstVar = defaultProd.variants?.[0];
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product_id: defaultProd.id,
            variant_id: firstVar?.id,
            product_name: defaultProd.name_en,
            sku: firstVar?.sku || defaultProd.sku_prefix || 'SKU-STD',
            color: firstVar?.color || '',
            size: firstVar?.size || '',
            variant_name: firstVar ? [firstVar.color ? `Color: ${firstVar.color}` : '', firstVar.size ? `Size: ${firstVar.size}` : ''].filter(Boolean).join(' | ') : '',
            unit_price: Number(firstVar?.price || defaultProd.base_price || defaultProd.current_price || 0),
            quantity: 1,
          }
        ]
      }));
      toast.success('New row added. Select attributes or adjust details.');
    } else {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            product_name: 'New Product Item',
            sku: 'SKU-STD',
            color: '',
            size: '',
            variant_name: '',
            unit_price: 500,
            quantity: 1,
          }
        ]
      }));
    }
  };

  const handleDuplicateRow = (idx: number) => {
    const itemToClone = formData.items[idx];
    if (!itemToClone) return;
    const cloned = { ...itemToClone, id: undefined };
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(idx + 1, 0, cloned);
      return { ...prev, items: newItems };
    });
    toast.success(`Duplicated item #${idx + 1}`);
  };

  const handleQuickSaveItem = async (idx: number) => {
    const item = formData.items[idx];
    if (!item) return;

    if (!item.product_name?.trim()) {
      toast.error('Product name is required');
      return;
    }

    setSavingItemId(idx);
    try {
      if (item.id) {
        await updateItemMutation.mutateAsync({
          itemId: item.id,
          payload: {
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            sku: item.sku,
            color: item.color,
            size: item.size,
            variant_name: item.variant_name,
            unit_price: item.unit_price,
            quantity: item.quantity,
          }
        });
      } else {
        await addItemMutation.mutateAsync({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          sku: item.sku,
          color: item.color,
          size: item.size,
          variant_name: item.variant_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
        });
      }
    } catch {
      // Handled in mutation
    } finally {
      setSavingItemId(null);
    }
  };

  const handleDeleteItemWithApi = async (idx: number) => {
    if (formData.items.length <= 1) {
      toast.error('An order must contain at least 1 item');
      return;
    }

    const item = formData.items[idx];
    if (item?.id) {
      if (confirm(`Remove "${item.product_name}" from this order? Reserved inventory will be automatically restored.`)) {
        deleteItemMutation.mutate(item.id);
      }
    } else {
      handleRemoveItem(idx);
    }
  };

  const handleQuickDispatch = (courier: string) => {
    const currentTracking = formData.tracking_code?.trim() || '';
    const itemsToSave = formData.items && formData.items.length > 0 
      ? formData.items 
      : (order?.items ? order.items.map((it: any) => ({
          id: it.id,
          product_id: it.product_id,
          variant_id: it.variant_id,
          product_name: it.product_name || (it as any).product?.name_en || 'Product Item',
          sku: it.sku || 'SKU-STD',
          color: it.color || (it as any).variant?.color || '',
          size: it.size || (it as any).variant?.size || '',
          variant_name: it.variant_name || '',
          unit_price: Number(it.unit_price) || 0,
          quantity: Number(it.quantity) || 1,
        })) : []);

    const updatedForm = {
      ...formData,
      items: itemsToSave,
      courier_name: courier,
      tracking_code: currentTracking,
      fulfillment_status: 'handed_to_courier',
      admin_notes: currentTracking 
        ? `Dispatched via ${courier} with tracking code ${currentTracking}` 
        : `Dispatched via ${courier}`
    };
    setFormData(updatedForm);
    updateOrderMutation.mutate(updatedForm);
    setIsDispatchModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center clay-card rounded-3xl space-y-4">
        <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin" />
        <p className="text-sm font-bold text-foreground">Loading Order Consignment Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center clay-card rounded-3xl space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
        <h2 className="text-xl font-black text-foreground">Order Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested order does not exist or has been removed.</p>
        <Link href="/admin/orders" className="neu-btn-primary px-6 py-2.5 rounded-2xl text-xs font-bold inline-block">
          Return to Orders List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <div className="print:hidden space-y-6">
        {/* Top Header Card */}
        <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  Order #{order.order_number}
                </h1>
                <OrderStatusBadge status={formData.fulfillment_status as OrderStatus} />
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-2">
                <span>Placed {new Date(order.created_at).toLocaleString('en-GB')}</span>
                <span>•</span>
                <span>Tracking:</span>
                <span className="font-mono font-bold text-primary">{formData.tracking_code || 'Unassigned'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => handleSaveAll()}
              disabled={updateOrderMutation.isPending}
              className="neu-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{updateOrderMutation.isPending ? 'Saving All...' : 'Save All Changes'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintSlipModalOpen(true)}
              className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Preview & Print Thermal / A4 Packing Slip"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const trackingCode = order.consignment?.consignment_id || order.tracking_code;
                if (!trackingCode) {
                  toast.error("Update Live Tracking Code / Consignment ID first");
                  return;
                }
                setIsBarcodeModalOpen(true);
              }}
              className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Print Thermal Sticker"
            >
              <ScanBarcode className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Print Label</span>
            </button>

          <Link
            href={`/order-confirmation/${order.order_number}`}
            target="_blank"
            className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Customer View"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Storefront View</span>
          </Link>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-3 neu-btn rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs"
            title="Delete Order (Restores Stock)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Order Editor Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* Fast Fulfillment & Shipped Workflow Hub */}
        <div className="clay-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Fulfillment & Shipped Workflow Hub (⚡ Auto Stock & Inventory Sync)</span>
            </h3>
            <span className="text-[11px] text-muted-foreground font-bold">
              Current: <span className="uppercase text-primary">{formData.fulfillment_status}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'confirmed', note: 'Confirmed order via phone' })}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md ${
                formData.fulfillment_status === 'confirmed' ? 'bg-primary/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1. Confirm (Deducts Stock)</span>
            </button>

            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'processing', note: 'Packed goods at distribution hub' })}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md ${
                formData.fulfillment_status === 'processing' ? 'bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>2. Pack & Processing</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(true)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md ${
                ['handed_to_courier', 'in_transit'].includes(formData.fulfillment_status) ? 'bg-cyan-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>3. Dispatch & Ship Consignment</span>
            </button>

            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'delivered', note: 'Delivered to doorstep and paid' })}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md ${
                formData.fulfillment_status === 'delivered' ? 'bg-primary/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>4. Mark Delivered & Paid</span>
            </button>

            {formData.fulfillment_status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2.5 neu-btn rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 ml-auto"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Order (Restocks Items)</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Grid for Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Items Matrix & Courier Tracking */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ordered Line Items Full CRUD: Order Items Matrix */}
            <div className="clay-card p-4 sm:p-6 rounded-3xl space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-primary">
                      <Package className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
                      <span>Order Items Matrix</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                        {formData.items.length} {formData.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground font-semibold border border-border/50">
                        {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Live inventory management, variant specifications (color & size), and itemized pricing matrix.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Items Subtotal</span>
                    <span className="text-sm font-black text-foreground font-mono">{formatBDT(subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickAddRow}
                      className="px-3 py-2 neu-btn rounded-xl text-xs font-bold flex items-center gap-1.5 text-foreground hover:text-primary cursor-pointer transition-colors"
                      title="Add a new row directly into the matrix table"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      <span>+ Quick Add Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddItemModalOpen(true)}
                      className="px-3.5 py-2 neu-btn-primary rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Add Catalog Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop / Tablet Table View (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase font-black tracking-wider text-muted-foreground bg-muted/20">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Product Item</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Color Select</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Size Select</th>
                      <th className="py-2.5 px-3 min-w-[140px]">SKU & Stock</th>
                      <th className="py-2.5 px-3 w-28 text-right">Unit Price (৳)</th>
                      <th className="py-2.5 px-3 w-32 text-center">Quantity</th>
                      <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                      <th className="py-2.5 px-3 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {formData.items.map((item, idx) => {
                      const matchedProduct = catalogProducts.find((p: any) => p.id === item.product_id || p.name_en === item.product_name);
                      const productVariants = matchedProduct?.variants || [];
                      const availableColors = Array.from(new Set(productVariants.map((v: any) => v.color).filter(Boolean))) as string[];
                      const filteredSizes = Array.from(new Set(productVariants.filter((v: any) => !item.color || v.color?.toLowerCase() === item.color?.toLowerCase()).map((v: any) => v.size).filter(Boolean))) as string[];
                      const availableSizes = filteredSizes.length > 0 ? filteredSizes : Array.from(new Set(productVariants.map((v: any) => v.size).filter(Boolean))) as string[];
                      
                      const activeVariant = productVariants.find((v: any) => v.id === item.variant_id) || 
                        productVariants.find((v: any) => (!item.color || v.color?.toLowerCase() === item.color?.toLowerCase()) && (!item.size || v.size?.toLowerCase() === item.size?.toLowerCase()));

                      return (
                        <tr key={idx} className="group hover:bg-muted/15 transition-colors">
                          {/* Index */}
                          <td className="py-3 px-3 text-center align-middle font-mono font-bold text-muted-foreground">
                            <span className="w-6 h-6 rounded-lg neu-inset inline-flex items-center justify-center text-[11px]">
                              {idx + 1}
                            </span>
                          </td>

                          {/* Product Selection */}
                          <td className="py-3 px-3 align-middle min-w-[200px]">
                            <div className="space-y-1">
                              {catalogProducts.length > 0 ? (
                                <select
                                  value={item.product_id || (matchedProduct ? matchedProduct.id : '')}
                                  onChange={(e) => handleRowProductChange(idx, e.target.value)}
                                  className="w-full p-2 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                  <option value="">{item.product_name || '-- Select Product --'}</option>
                                  {catalogProducts.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name_en}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={item.product_name}
                                  onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                                  placeholder="Product Title"
                                  className="w-full p-1.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                                />
                              )}
                              <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                                <span>SKU:</span>
                                <span className="font-bold text-foreground">{item.sku || 'SKU-STD'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Color Attribute Select Option */}
                          <td className="py-3 px-3 align-middle min-w-[130px]">
                            {availableColors.length > 0 ? (
                              <div className="space-y-1">
                                <select
                                  value={item.color || ''}
                                  onChange={(e) => handleRowColorChange(idx, e.target.value, matchedProduct)}
                                  className="w-full p-1.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                  <option value="">-- Select Color --</option>
                                  {availableColors.map((col: string) => (
                                    <option key={col} value={col}>
                                      {col}
                                    </option>
                                  ))}
                                </select>
                                {item.color ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px] border border-primary/20">
                                    <Palette className="w-2.5 h-2.5" />
                                    <span>{item.color}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">None selected</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/40 rounded-lg inline-block">
                                Standard
                              </span>
                            )}
                          </td>

                          {/* Size Attribute Select Option */}
                          <td className="py-3 px-3 align-middle min-w-[120px]">
                            {availableSizes.length > 0 ? (
                              <div className="space-y-1">
                                <select
                                  value={item.size || ''}
                                  onChange={(e) => handleRowSizeChange(idx, e.target.value, matchedProduct)}
                                  className="w-full p-1.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                  <option value="">-- Select Size --</option>
                                  {availableSizes.map((sz: string) => (
                                    <option key={sz} value={sz}>
                                      {sz}
                                    </option>
                                  ))}
                                </select>
                                {item.size ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-semibold text-[10px] border border-border/50">
                                    <Ruler className="w-2.5 h-2.5" />
                                    <span>Size: {item.size}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">None selected</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/40 rounded-lg inline-block">
                                Standard
                              </span>
                            )}
                          </td>

                          {/* Live Specs & Stock Level */}
                          <td className="py-3 px-3 align-middle min-w-[140px]">
                            <div className="space-y-1">
                              {activeVariant ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  activeVariant.stock > 5 
                                    ? 'bg-primary/10 text-primary dark:text-primary border border-primary/20' 
                                    : activeVariant.stock > 0 
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                }`}>
                                  {activeVariant.stock > 5 ? `✓ In Stock: ${activeVariant.stock}` : (activeVariant.stock > 0 ? `⚠️ Low: ${activeVariant.stock}` : '✕ Out of Stock')}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Catalog Item</span>
                              )}
                              <div className="text-[9px] text-muted-foreground font-mono truncate max-w-[130px]">
                                {item.variant_name || (item.color || item.size ? `${item.color || ''} ${item.size || ''}` : 'Standard Spec')}
                              </div>
                            </div>
                          </td>

                          {/* Unit Price */}
                          <td className="py-3 px-3 align-middle text-right">
                            <div className="relative inline-block w-full">
                              <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">৳</span>
                              <input
                                type="number"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 pl-6 neu-input rounded-xl text-xs font-black text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                              />
                            </div>
                          </td>

                          {/* Quantity with Stepper */}
                          <td className="py-3 px-3 align-middle text-center">
                            <div className="inline-flex items-center gap-1 p-1 neu-inset rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(idx, -1)}
                                disabled={item.quantity <= 1}
                                className="w-6 h-6 rounded-lg neu-btn flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                                title="Decrease"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-10 bg-transparent text-center text-xs font-black text-foreground focus:outline-none font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(idx, 1)}
                                className="w-6 h-6 rounded-lg neu-btn flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Increase"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Line Total */}
                          <td className="py-3 px-3 align-middle text-right">
                            <div className="font-mono font-black text-sm text-foreground">
                              {formatBDT(item.unit_price * item.quantity)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              ৳{item.unit_price} × {item.quantity}
                            </div>
                          </td>

                          {/* Actions: Quick Save, Duplicate, Delete */}
                          <td className="py-3 px-3 align-middle text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickSaveItem(idx)}
                                disabled={savingItemId === idx}
                                className="p-1.5 neu-btn rounded-lg text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                                title="Quick Save single item to database"
                              >
                                {savingItemId === idx ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(idx)}
                                className="p-1.5 neu-btn rounded-lg text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                                title="Duplicate this row"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItemWithApi(idx)}
                                className="p-1.5 neu-btn rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (shown on screens < 768px) */}
              <div className="md:hidden space-y-3">
                {formData.items.map((item, idx) => {
                  const matchedProduct = catalogProducts.find((p: any) => p.id === item.product_id || p.name_en === item.product_name);
                  const productVariants = matchedProduct?.variants || [];
                  const availableColors = Array.from(new Set(productVariants.map((v: any) => v.color).filter(Boolean))) as string[];
                  const filteredSizes = Array.from(new Set(productVariants.filter((v: any) => !item.color || v.color?.toLowerCase() === item.color?.toLowerCase()).map((v: any) => v.size).filter(Boolean))) as string[];
                  const availableSizes = filteredSizes.length > 0 ? filteredSizes : Array.from(new Set(productVariants.map((v: any) => v.size).filter(Boolean))) as string[];
                  
                  const activeVariant = productVariants.find((v: any) => v.id === item.variant_id) || 
                    productVariants.find((v: any) => (!item.color || v.color?.toLowerCase() === item.color?.toLowerCase()) && (!item.size || v.size?.toLowerCase() === item.size?.toLowerCase()));

                  return (
                    <div key={idx} className="p-4 neu-inset rounded-2xl space-y-3">
                      {/* Item Top: #, Product Select Dropdown, Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-1">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                          {catalogProducts.length > 0 ? (
                            <select
                              value={item.product_id || (matchedProduct ? matchedProduct.id : '')}
                              onChange={(e) => handleRowProductChange(idx, e.target.value)}
                              className="w-full p-2 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                              <option value="">{item.product_name || '-- Select Product --'}</option>
                              {catalogProducts.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name_en}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={item.product_name}
                              onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                              placeholder="Product Name"
                              className="w-full p-2 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                            />
                          )}
                          <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                            <span>SKU:</span>
                            <span className="font-bold text-foreground">{item.sku || 'SKU-STD'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(idx)}
                            className="p-1.5 text-primary hover:text-primary/80 cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItemWithApi(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Dual Attribute Selectors: Color & Size */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1 mb-1">
                            <Palette className="w-2.5 h-2.5 text-primary" />
                            <span>Color Option</span>
                          </label>
                          {availableColors.length > 0 ? (
                            <select
                              value={item.color || ''}
                              onChange={(e) => handleRowColorChange(idx, e.target.value, matchedProduct)}
                              className="w-full p-2 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Color --</option>
                              {availableColors.map((c: string) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-2 neu-input rounded-xl text-[11px] text-muted-foreground italic">Standard</div>
                          )}
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1 mb-1">
                            <Ruler className="w-2.5 h-2.5 text-primary" />
                            <span>Size Option</span>
                          </label>
                          {availableSizes.length > 0 ? (
                            <select
                              value={item.size || ''}
                              onChange={(e) => handleRowSizeChange(idx, e.target.value, matchedProduct)}
                              className="w-full p-2 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Size --</option>
                              {availableSizes.map((s: string) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-2 neu-input rounded-xl text-[11px] text-muted-foreground italic">Standard</div>
                          )}
                        </div>
                      </div>

                      {/* Badges for Color, Size, Stock */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.color && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20 text-[10px]">
                            <Palette className="w-2.5 h-2.5" />
                            <span>{item.color}</span>
                          </span>
                        )}
                        {item.size && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-foreground font-semibold border border-border/50 text-[10px]">
                            <Ruler className="w-2.5 h-2.5" />
                            <span>{item.size}</span>
                          </span>
                        )}
                        {activeVariant && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            activeVariant.stock > 5 
                              ? 'bg-primary/10 text-primary dark:text-primary border border-primary/20' 
                              : activeVariant.stock > 0 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                            Stock: {activeVariant.stock}
                          </span>
                        )}
                      </div>

                      {/* Price, Stepper, Total Row */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-muted-foreground block">Unit Price (৳)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-20 p-1.5 neu-input rounded-xl text-xs font-bold font-mono text-foreground focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-muted-foreground block text-center">Qty</label>
                          <div className="inline-flex items-center gap-1 p-0.5 neu-inset rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, -1)}
                              disabled={item.quantity <= 1}
                              className="w-5 h-5 rounded neu-btn flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold font-mono">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, 1)}
                              className="w-5 h-5 rounded neu-btn flex items-center justify-center text-xs cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Total</span>
                          <span className="text-xs font-black font-mono text-foreground">
                            {formatBDT(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Row Quick Save Action */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleQuickSaveItem(idx)}
                          disabled={savingItemId === idx}
                          className="px-3 py-1 neu-btn rounded-xl text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>{savingItemId === idx ? 'Saving...' : 'Quick Save Item'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Footer: Breakdown & Auto-Stock Indicator */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-semibold text-[11px]">
                    Warehouse stock synchronizes automatically based on fulfillment status.
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                  <div className="text-muted-foreground">
                    <span className="font-bold text-foreground">{formData.items.length}</span> items • <span className="font-bold text-foreground">{totalUnits}</span> units
                  </div>
                  <div className="font-mono text-sm font-black text-foreground">
                    Subtotal: <span className="text-primary">{formatBDT(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier Consignment & Live Tracking Settings */}
            <div className="clay-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>Courier Consignment & Live Dispatch Settings</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Assigned Courier Partner</label>
                  <select
                    value={formData.courier_name}
                    onChange={(e) => setFormData({ ...formData, courier_name: e.target.value })}
                    className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="">Unassigned / Pending Admin Dispatch</option>
                    <option value="Steadfast Courier">Steadfast Courier</option>
                    <option value="Pathao Courier">Pathao Courier</option>
                    <option value="RedX Logistics">RedX Logistics</option>
                    <option value="Paperfly">Paperfly Doorstep</option>
                    <option value="eCourier">eCourier Hub</option>
                    <option value="Sundarban Courier">Sundarban Courier Service</option>
                    <option value="SA Paribahan">SA Paribahan Parcel Service</option>
                    <option value="Karatoa Courier">Karatoa Courier</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Live Tracking Code / Consignment ID</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={formData.tracking_code}
                      onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
                      placeholder="Enter courier consignment or tracking code"
                      className="flex-1 p-3 neu-input rounded-2xl text-xs font-mono font-bold focus:outline-none"
                    />
                    {formData.tracking_code && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tracking_code: '' })}
                        className="neu-btn px-3 py-2 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Clear Tracking Code"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {formData.tracking_code && (
                <div className="neu-flat p-4 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Public Customer Tracking Link:</span>
                    <span className="font-mono font-bold text-primary">/track?code={formData.tracking_code}</span>
                  </div>
                  <Link
                    href={`/track?code=${formData.tracking_code}`}
                    target="_blank"
                    className="neu-btn px-3 py-1 rounded-xl text-xs font-bold text-primary flex items-center gap-1"
                  >
                    <span>Test Track</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Notes & Remarks */}
            <div className="clay-card p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-black text-foreground">Admin Internal Notes & Customer Remarks</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Admin Internal Notes</label>
                  <textarea
                    rows={2}
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                    placeholder="Internal warehouse instructions or dispatch remarks..."
                    className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Customer Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Customer delivery request..."
                    className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Status History & Audit Log */}
            {order.status_logs && order.status_logs.length > 0 && (
              <div className="clay-card p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <History className="w-4 h-4 text-primary" />
                  <span>Audit Trail & Status Transition History</span>
                </h3>
                <div className="space-y-2.5 divide-y divide-border/30">
                  {order.status_logs.map((log: any, idx: number) => (
                    <div key={idx} className="pt-2 flex items-start justify-between text-xs">
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <span className="capitalize">{log.from_status || 'Initial'}</span>
                          <span>→</span>
                          <span className="uppercase text-primary font-black">{log.to_status}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{log.note || 'Status updated'}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(log.created_at).toLocaleString('en-GB')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Col: Customer & Financials Editor */}
          <div className="space-y-6">
            
            {/* EXTRA PART: Meta Marketing Campaign Attribution & Message Lead Dossier */}
            <div className="clay-card p-6 rounded-3xl space-y-4 border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-primary/5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">Marketing & Ad Attribution</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Multi-channel campaign & Meta message lead tracking
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  order?.source === 'meta_message' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300' :
                  order?.source === 'google_ads' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300' :
                  order?.source === 'tiktok_ads' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {order?.source === 'meta_message' ? '💬 Meta Message Lead' :
                   order?.source === 'google_ads' ? '🔍 Google Search Ad' :
                   order?.source === 'tiktok_ads' ? '🎵 TikTok Video Ad' :
                   order?.source === 'manual' ? '✍️ Manual Creation' : '🌐 Organic Web'}
                </span>
              </div>

              {/* Attribution Dossier Content */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-black/20 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-semibold">Ad Campaign:</span>
                    <span className="font-bold text-foreground truncate max-w-[200px]" title={order?.marketing_campaign?.campaign_name || order?.meta_payload?.campaign_name || 'Direct / Organic'}>
                      {order?.marketing_campaign?.campaign_name || order?.meta_payload?.campaign_name || (order?.source === 'meta_message' ? 'Meta Click-to-Messenger Campaign' : 'Organic Direct')}
                    </span>
                  </div>
                  {order?.meta_conversation_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">Meta Thread / PSID:</span>
                      <span className="font-mono text-[11px] text-primary font-bold">
                        {order.meta_conversation_id}
                      </span>
                    </div>
                  )}
                  {order?.marketing_lead_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">Lead Reference ID:</span>
                      <span className="font-mono text-[11px] text-foreground font-bold">
                        #{order.marketing_lead_id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Customer Original Inquired Message */}
                {(order?.meta_payload?.customer_original_inquiry || order?.marketing_lead?.customer_message) && (
                  <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Original Customer Inquiry (Meta Messenger / WhatsApp):</span>
                    </div>
                    <p className="text-[11px] text-foreground/90 italic pl-5">
                      "{order?.meta_payload?.customer_original_inquiry || order?.marketing_lead?.customer_message}"
                    </p>
                  </div>
                )}

                {/* Moderator Confirmation Details */}
                {order?.meta_payload?.moderator_confirmed_items && (
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/40 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                      <span>Moderator Confirmed Quote:</span>
                      <span className="text-primary dark:text-primary font-black">
                        Delivery: ৳{order?.meta_payload?.delivery_fee ?? order?.delivery_fee}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      {order.meta_payload.moderator_confirmed_items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span>• {it.product_name} x {it.quantity}</span>
                          <span className="font-mono font-bold text-foreground">৳{it.total}</span>
                        </div>
                      ))}
                    </div>
                    {order.meta_payload.converted_by && (
                      <div className="pt-1 text-[10px] text-muted-foreground text-right">
                        Confirmed by: <span className="font-bold text-foreground">{order.meta_payload.converted_by}</span>
                      </div>
                    )}
                  </div>
                )}

                <Link
                  href="/admin/marketing"
                  className="w-full py-2.5 neu-btn rounded-xl text-xs font-black text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Open Marketing Hub & Live Chat Inbox</span>
                </Link>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="clay-card p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
                <User className="w-4 h-4 text-primary" />
                <span>Customer & Destination</span>
              </h3>
              {formData.customer_phone && (
                <CustomerRiskBadge phone={formData.customer_phone} size="md" />
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Contact Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Full Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">District (64 BD)</label>
                    <select
                      value={formData.district}
                      onChange={handleDistrictChange}
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                    >
                      {BANGLADESH_DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>{d.name} ({d.name_bn})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Thana / Upazila</label>
                    <select
                      value={formData.thana}
                      onChange={(e) => setFormData({ ...formData, thana: e.target.value })}
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                    >
                      {currentDistrict.thanas.map((th) => (
                        <option key={th.name} value={th.name}>{th.name} ({th.name_bn})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Shipping Zone</label>
                  <select
                    value={formData.shipping_zone}
                    onChange={(e) => setFormData({ ...formData, shipping_zone: e.target.value })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="inside_dhaka">Inside Dhaka City (৳80)</option>
                    <option value="suburb">Dhaka Suburbs (৳100)</option>
                    <option value="outside_dhaka">Outside Dhaka (৳130)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment & Financial Ledger */}
            <div className="clay-card p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Payment & Financials</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                    >
                      <option value="cod">Cash on Delivery (COD)</option>
                      <option value="bkash">bKash Merchant</option>
                      <option value="nagad">Nagad Direct</option>
                      <option value="sslcommerz">SSLCommerz Multi-Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-foreground">Payment Status</label>
                    <select
                      value={formData.payment_status}
                      onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground">Delivery Fee (৳)</label>
                    <input
                      type="number"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-foreground">Discount (৳)</label>
                    <input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground">Advance Paid (৳)</label>
                  <input
                    type="number"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground flex items-center justify-between">
                    <span>Transaction ID (TrxID)</span>
                    {formData.payment_transaction_id ? (
                      <span className="text-[10px] text-primary dark:text-primary font-mono font-bold">Recorded</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Not paid yet</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BK7890ABCD, TrxID from SMS"
                    value={formData.payment_transaction_id}
                    onChange={(e) => setFormData({ ...formData, payment_transaction_id: e.target.value.toUpperCase() })}
                    className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono font-bold focus:outline-none uppercase"
                  />
                </div>

                {/* Totals Summary */}
                <div className="neu-flat p-4 rounded-2xl space-y-2 text-xs pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items Subtotal:</span>
                    <span className="font-bold">{formatBDT(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee:</span>
                    <span className="font-bold">+{formatBDT(formData.delivery_fee)}</span>
                  </div>
                  {formData.discount_amount > 0 && (
                    <div className="flex justify-between text-primary dark:text-primary">
                      <span>Discount Amount:</span>
                      <span className="font-bold">-{formatBDT(formData.discount_amount)}</span>
                    </div>
                  )}
                  {formData.advance_amount > 0 && (
                    <div className="flex justify-between text-cyan-600 dark:text-cyan-400">
                      <span>Advance Paid:</span>
                      <span className="font-bold">-{formatBDT(formData.advance_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border/40">
                    <span>Total Payable Amount:</span>
                    <span className="text-primary">{formatBDT(totalPayable)}</span>
                  </div>
                  {formData.payment_method === 'cod' && (
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>COD Due on Doorstep:</span>
                      <span className="text-foreground">{formatBDT(Math.max(0, totalPayable - formData.advance_amount))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </form>

      {/* Modal: Add Product Item */}
      {isAddItemModalOpen && (() => {
        const selectedProduct = catalogProducts.find((p: any) => String(p.id) === selectedCatalogProductId);
        const selectedVariant = selectedProduct?.variants?.find((v: any) => String(v.id) === selectedVariantId) || selectedProduct?.variants?.[0];

        return (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsAddItemModalOpen(false);
                setIsCustomItemMode(false);
              }
            }}
            className="fixed inset-0 z-[110] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="neu-modal rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 cursor-default"
            >
              <div className="flex items-center justify-between neu-modal-header pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl neu-card-inset flex items-center justify-center text-primary">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">Add Product Item to Order</h3>
                    <p className="text-[11px] text-muted-foreground">Select a product and variant from your catalog</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddItemModalOpen(false);
                    setIsCustomItemMode(false);
                  }} 
                  className="neu-close-btn"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isCustomItemMode ? (
                <div className="space-y-4">
                  {/* 1. Product Select Option */}
                  <div>
                    <label className="text-xs font-bold text-foreground flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span>1. Select Product Option *</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {catalogProducts.length} catalog products
                      </span>
                    </label>
                    <select
                      value={selectedCatalogProductId}
                      onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                      className="w-full p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="">-- Choose a Product from Catalog --</option>
                      {catalogProducts.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name_en} (From ৳{p.base_price || p.current_price}) • {p.variants?.length || 0} variant(s)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Proper Attribute Select Options (Color & Size) */}
                  {selectedProduct && (() => {
                    const modalColors = Array.from(new Set((selectedProduct.variants || []).map((v: any) => v.color).filter(Boolean))) as string[];
                    const filteredModalSizes = Array.from(new Set((selectedProduct.variants || []).filter((v: any) => !selectedNewColor || v.color?.toLowerCase() === selectedNewColor.toLowerCase()).map((v: any) => v.size).filter(Boolean))) as string[];
                    const modalSizes = filteredModalSizes.length > 0 ? filteredModalSizes : Array.from(new Set((selectedProduct.variants || []).map((v: any) => v.size).filter(Boolean))) as string[];

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>2. Select Attributes (Color & Size Options) *</span>
                          </span>
                          <span className="text-[10px] text-primary font-bold">
                            {selectedProduct.variants?.length || 0} variant(s) available
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Color Select Option */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mb-1">
                              <Palette className="w-3 h-3 text-primary" />
                              <span>Color Select Option</span>
                            </label>
                            {modalColors.length > 0 ? (
                              <select
                                value={selectedNewColor}
                                onChange={(e) => handleModalColorChange(e.target.value, selectedProduct)}
                                className="w-full p-2.5 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                              >
                                <option value="">-- Select Color ({modalColors.length}) --</option>
                                {modalColors.map((col: string) => (
                                  <option key={col} value={col}>
                                    {col}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="p-2.5 neu-input rounded-2xl text-xs text-muted-foreground italic">
                                Standard / Single Color
                              </div>
                            )}
                          </div>

                          {/* Size Select Option */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mb-1">
                              <Ruler className="w-3 h-3 text-primary" />
                              <span>Size Select Option</span>
                            </label>
                            {modalSizes.length > 0 ? (
                              <select
                                value={selectedNewSize}
                                onChange={(e) => handleModalSizeChange(e.target.value, selectedProduct)}
                                className="w-full p-2.5 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                              >
                                <option value="">-- Select Size ({modalSizes.length}) --</option>
                                {modalSizes.map((sz: string) => (
                                  <option key={sz} value={sz}>
                                    {sz}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="p-2.5 neu-input rounded-2xl text-xs text-muted-foreground italic">
                                Standard / Single Size
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Direct Variant Selector Dropdown fallback */}
                        {selectedProduct.variants && selectedProduct.variants.length > 1 && (
                          <details className="text-[11px] group">
                            <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-semibold list-none flex items-center gap-1">
                              <span>▸ View / Pick from full variant list ({selectedProduct.variants.length} options)</span>
                            </summary>
                            <div className="pt-2">
                              <select
                                value={selectedVariantId}
                                onChange={(e) => handleSelectVariant(e.target.value)}
                                className="w-full p-2 neu-input rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                              >
                                {selectedProduct.variants.map((v: any) => (
                                  <option key={v.id} value={v.id}>
                                    {v.color ? `Color: ${v.color}` : 'Default'} {v.size ? `• Size: ${v.size}` : ''} | SKU: {v.sku} — ৳{v.price} [Stock: {v.stock}]
                                  </option>
                                ))}
                              </select>
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. Selected Variant Specifications Preview Card */}
                  {selectedProduct && selectedVariant && (
                    <div className="p-4 neu-inset rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-black text-foreground">{selectedProduct.name_en}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {selectedVariant.sku}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-primary font-mono">{formatBDT(selectedVariant.price)}</span>
                          <div className="text-[10px] text-muted-foreground">unit price</div>
                        </div>
                      </div>

                      {/* Variant Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
                        {selectedVariant.color && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-bold border border-primary/20 text-xs">
                            <Palette className="w-3 h-3" />
                            <span>{selectedVariant.color}</span>
                          </span>
                        )}
                        {selectedVariant.size && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted text-foreground font-semibold border border-border/50 text-xs">
                            <Ruler className="w-3 h-3" />
                            <span>Size: {selectedVariant.size}</span>
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ${
                          selectedVariant.stock > 5 
                            ? 'bg-primary/15 text-primary dark:text-primary border border-primary/30' 
                            : selectedVariant.stock > 0 
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}>
                          {selectedVariant.stock > 5 ? '✓ In Stock' : (selectedVariant.stock > 0 ? '⚠️ Low Stock' : '✕ Out of Stock')} ({selectedVariant.stock} available)
                        </span>
                      </div>

                      {/* Price and Quantity Stepper */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Unit Price (৳)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">৳</span>
                            <input
                              type="number"
                              min="0"
                              value={newItem.unit_price}
                              onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                              className="w-full p-2 pl-6 neu-input rounded-xl text-xs font-black font-mono text-foreground focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Quantity</label>
                          <div className="inline-flex items-center w-full gap-1 p-1 neu-inset rounded-xl">
                            <button
                              type="button"
                              onClick={() => setNewItem(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                              disabled={newItem.quantity <= 1}
                              className="w-7 h-7 rounded-lg neu-btn flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                              className="w-full bg-transparent text-center text-xs font-black text-foreground focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setNewItem(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                              className="w-7 h-7 rounded-lg neu-btn flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calculated Line Total */}
                  {selectedProduct && (
                    <div className="p-3 neu-flat rounded-2xl flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Calculated Line Total:</span>
                      <span className="font-mono font-black text-foreground text-base text-primary">
                        {formatBDT(Number(newItem.unit_price || 0) * Number(newItem.quantity || 1))}
                      </span>
                    </div>
                  )}

                  {/* Fallback to manual text toggle */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCustomItemMode(true)}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Custom / Non-catalog item? Switch to manual text entry
                    </button>
                  </div>
                </div>
              ) : (
                /* Custom mode fallback */
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-bold">Custom Manual Entry Mode</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomItemMode(false)}
                      className="text-[11px] underline font-bold cursor-pointer"
                    >
                      Back to Catalog Select
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={newItem.product_name}
                      onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                      placeholder="e.g. Wireless Mouse"
                      className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-bold text-foreground">SKU</label>
                      <input
                        type="text"
                        value={newItem.sku}
                        onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                        placeholder="SKU-01"
                        className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Price (৳) *</label>
                      <input
                        type="number"
                        value={newItem.unit_price}
                        onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Qty *</label>
                      <input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-black text-center focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-foreground">Color (Optional)</label>
                      <input
                        type="text"
                        value={newItem.color}
                        onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                        placeholder="e.g. Black"
                        className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Size (Optional)</label>
                      <input
                        type="text"
                        value={newItem.size}
                        onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                        placeholder="e.g. XL"
                        className="w-full mt-1 p-2.5 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 neu-modal-footer">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddItemModalOpen(false);
                    setIsCustomItemMode(false);
                  }} 
                  className="neu-btn-secondary px-4 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  disabled={!newItem.product_name.trim()}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-black disabled:opacity-40 cursor-pointer shadow-lg"
                >
                  Add Item to Order
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Dispatch Courier */}
      {isDispatchModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDispatchModalOpen(false);
          }}
          className="fixed inset-0 z-[110] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl neu-card-inset flex items-center justify-center text-primary">
                  <Truck className="w-4 h-4" />
                </div>
                <span>Dispatch Parcel with Courier</span>
              </h3>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select your integrated courier service to register consignment and generate the official tracking code.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {['Steadfast Courier', 'Pathao Courier', 'RedX Logistics', 'Paperfly'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleQuickDispatch(c)}
                  className="p-3.5 neu-tile-inactive rounded-2xl text-xs font-bold text-foreground hover:text-primary transition-all flex flex-col items-center gap-1 text-center cursor-pointer"
                >
                  <Truck className="w-5 h-5 mb-1 text-primary" />
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Order */}
      {isCancelModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCancelModalOpen(false);
          }}
          className="fixed inset-0 z-[110] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 mx-auto neu-card-inset rounded-2xl flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-foreground">Cancel Order #{order.order_number}</h3>
            <p className="text-xs text-muted-foreground">
              Cancelling this order will automatically restore and restock all reserved items back into the inventory matrix.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 neu-modal-footer">
              <button onClick={() => setIsCancelModalOpen(false)} className="neu-btn-secondary px-5 py-2.5 text-xs font-bold">
                Don't Cancel
              </button>
              <button
                onClick={() => {
                  updateStatusMutation.mutate({ status: 'cancelled', note: 'Customer requested cancellation' });
                  setIsCancelModalOpen(false);
                }}
                disabled={updateStatusMutation.isPending}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-md transition-all"
              >
                {updateStatusMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation & Restock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Order */}
      {isDeleteModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
          }}
          className="fixed inset-0 z-[110] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 mx-auto neu-card-inset rounded-2xl flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-foreground">Permanently Delete Order</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this order? All items will be restocked automatically.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 neu-modal-footer">
              <button onClick={() => setIsDeleteModalOpen(false)} className="neu-btn-secondary px-5 py-2.5 text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-md transition-all"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div> {/* End print:hidden */}

      {/* PRINT SLIP PREVIEW MODAL */}
      {isPrintSlipModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPrintSlipModalOpen(false);
          }}
          className="fixed inset-0 z-[120] neu-backdrop flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 neu-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-card-inset text-primary flex items-center justify-center font-black">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Official Print Slip & Consignment Preview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Order #{order.order_number} &bull; Items Matrix, Customer & Destination, Payment & Financials
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="neu-btn-primary px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintSlipModalOpen(false)}
                  className="neu-close-btn"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Slip */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 dark:bg-slate-900/70 flex justify-center">
              <div className="shadow-2xl bg-white text-slate-900 rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-300">
                <OrderPrintSlip order={printOrderData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY CONTAINER: Active when window.print() is executed */}
      <div className="hidden print:block w-full">
        <OrderPrintSlip order={printOrderData} />
      </div>

      {isBarcodeModalOpen && (
        <BarcodePrintModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          orders={[order as any]}
        />
      )}
    </div>
  );
}
