'use client';

import {  useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/admin/DataTable';
import { formatBDT } from '@/utils/currency';
import { formatImageUrl } from '@/utils/image';
import { Product } from '@/types';
import { 
  Edit, Plus, Package, Trash2, CheckCircle2, XCircle, 
  AlertTriangle, Eye, Layers, Search, RefreshCw, Star, Image as ImageIcon,
  Upload, Link as LinkIcon, Sparkles, ChevronLeft, ChevronRight, X, Check, Loader2
, MoreHorizontal, Copy, History, Printer, List, ChevronDown, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { syncEntityInCache, removeEntityFromCache } from '@/lib/cacheSync';
import toast from 'react-hot-toast';

const PRESET_IMAGES = [
  { name: 'Samsung Galaxy A55', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85' },
  { name: 'MacBook Pro M3', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=85' },
  { name: 'Sony WH-1000XM5', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85' },
  { name: 'Apple Watch Ultra', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85' },
  { name: 'DJI Mini 4 Pro', url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=85' },
  { name: 'iPad Air M2', url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=85' },
];

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [deletingProduct, setDeletingProduct] = useState<{ id: number; name: string } | null>(null);
  const [quickStockProduct, setQuickStockProduct] = useState<any>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.data) {
      setSelectedIds(data.data.map((d: any) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
  
  // Image CRUD Modal State
  const [imageModalProduct, setImageModalProduct] = useState<any>(null);
  const [modalImages, setModalImages] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // 1. Fetch Categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-filter'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/categories');
        const items = res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        const flatten = (arr: any[], depth = 0): any[] => {
          return arr.reduce((acc, cat) => {
            acc.push({ ...cat, depth });
            if (cat.children && cat.children.length > 0) {
              acc = acc.concat(flatten(cat.children, depth + 1));
            }
            return acc;
          }, []);
        };
        return flatten(items);
      } catch {
        return [];
      }
    }
  });

  // 1b. Fetch Product Types for filter & display
  const { data: productTypesData = [] } = useQuery({
    queryKey: ['admin-product-types-filter'],
    queryFn: async () => {
      try {
        const res: any = await api.productTypes.list();
        return Array.isArray(res) ? res : (res?.data || []);
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch Products
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', page, perPage, search, selectedCategory, selectedStatus, selectedProductType],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', String(page));
        queryParams.append('per_page', String(perPage));
        if (search.trim()) queryParams.append('search', search.trim());
        if (selectedCategory) queryParams.append('category_id', selectedCategory);
        if (selectedStatus !== '') queryParams.append('is_active', selectedStatus);
        if (selectedProductType) queryParams.append('product_type_id', selectedProductType);
        
        queryParams.append('_t', new Date().getTime().toString());

        const res: any = await api.get(`/admin/products?${queryParams.toString()}`);
        if (res?.data) {
          const items = Array.isArray(res.data) 
            ? res.data 
            : (res.data.items || res.data.data || []);
          
          const rawMeta = res.data.meta || res.data.pagination || {};
          const meta = {
            current_page: Number(rawMeta.current_page) || page,
            last_page: Number(rawMeta.last_page || rawMeta.total_pages || 1),
            total: Number(rawMeta.total ?? (res.data.counts?.all ?? items.length)),
            per_page: Number(rawMeta.per_page) || perPage,
          };

          const counts = res.data.counts || res.data.meta?.counts || {
            all: meta.total || items.length,
            active: 0,
            deactive: 0
          };

          return { data: items, meta, counts };
        }
      } catch (err) {
        /* silenced */
      }

      return { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: perPage }, counts: { all: 0, active: 0, deactive: 0 } };
    }
  });

  // 3. Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      if (deletingProduct) {
        removeEntityFromCache(queryClient, 'product', deletingProduct.id);
      }
      setDeletingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Failed to delete product');
    }
  });

  // 4. Toggle Active Status Mutation (Targeted update)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await api.put(`/admin/products/${id}`, { is_active });
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.is_active ? 'Product activated successfully' : 'Product deactivated successfully');
      syncEntityInCache(queryClient, 'product', { id: variables.id, is_active: variables.is_active });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  // 4b. Duplicate Product Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.post(`/admin/products/${id}/duplicate`);
    },
    onSuccess: () => {
      toast.success('Product duplicated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Failed to duplicate product');
    }
  });

  // 4c. Import Mutation
  const csvInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await api.post('/admin/products/import', formData);
    },
    onSuccess: (res: any) => {
      toast.success(res.data?.message || 'Products imported successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to import products');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast('Uploading and importing...');
      importMutation.mutate(file);
    }
    // reset input
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

    // 5. Quick Stock Update Mutation (Targeted update)
  const quickStockMutation = useMutation({
    mutationFn: async ({ id, stock, variantId }: { id: number; stock: number; variantId?: number }) => {
      const targetId = variantId || id;
      return await api.put(`/admin/inventory/${targetId}/stock`, { stock });
    },
    onSuccess: (_data, variables) => {
      toast.success('Stock level updated successfully');
      syncEntityInCache(queryClient, 'product', { id: variables.id, stock: variables.stock });
      setQuickStockProduct(null);
    },
    onError: () => {
      toast.error('Failed to update stock');
    }
  });

  // 6. Bulk Action Mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: number[] }) => {
      return await api.post('/admin/products/bulk-action', { action, ids });
    },
    onSuccess: () => {
      toast.success('Bulk action completed successfully');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Failed to perform bulk action');
    }
  });

  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    bulkActionMutation.mutate({ action, ids: selectedIds });
  };
  // --- OPEN IMAGE CRUD MODAL ---
  const handleOpenImageModal = (product: any) => {
    setImageModalProduct(product);
    const existingImages = (product.images || []).map((img: any) => ({
      id: img.id,
      url: img.path || img.url,
      path: img.path || img.url,
      is_primary: Boolean(img.is_primary)
    }));

    if (existingImages.length === 0 && (product.primary_image_url || product.image)) {
      existingImages.push({
        id: null,
        url: product.primary_image_url || product.image,
        path: product.primary_image_url || product.image,
        is_primary: true
      });
    }

    setModalImages(existingImages);
    setPastedUrl('');
    setIsPresetsOpen(false);
  };

  // --- IMAGE CRUD: UPLOAD FILES (>4MB supported) ---
  const handleModalFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || !imageModalProduct) return;
    setIsUploadingImage(true);

    try {
      // 1. Instant local preview
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setModalImages(prev => {
              const preview = e.target!.result as string;
              if (prev.some(im => im.url === preview || im.name === file.name)) return prev;
              return [
                ...prev,
                { url: preview, path: preview, is_primary: prev.length === 0, name: file.name }
              ];
            });
          }
        };
        reader.readAsDataURL(file);
      }

      // 2. Direct Multipart Upload
      const form = new FormData();
      for (let i = 0; i < files.length; i++) {
        form.append('images[]', files[i]);
      }

      const res: any = await api.upload(`/admin/products/${imageModalProduct.id}/images`, form);
      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      
      if (items.length > 0) {
        setModalImages(items.map((img: any, idx: number) => ({
          id: img.id,
          url: img.path || img.url,
          path: img.path || img.url,
          is_primary: Boolean(img.is_primary ?? (idx === 0))
        })));
        toast.success(`${files.length} image(s) uploaded successfully!`);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
    } catch (err) {
      /* silenced */
      toast.success('Image loaded! Click "Save Gallery" to sync.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- IMAGE CRUD: PASTE URL ---
  const handleModalPasteUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pastedUrl.trim() || !imageModalProduct) return;

    try {
      setIsUploadingImage(true);
      const res: any = await api.post(`/admin/products/${imageModalProduct.id}/images`, { url: pastedUrl.trim() });
      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);

      if (items.length > 0) {
        setModalImages(items.map((img: any, idx: number) => ({
          id: img.id,
          url: img.path || img.url,
          path: img.path || img.url,
          is_primary: Boolean(img.is_primary ?? (idx === 0))
        })));
        toast.success('Image URL added to gallery!');
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      } else {
        setModalImages(prev => [
          ...prev,
          { url: pastedUrl.trim(), path: pastedUrl.trim(), is_primary: prev.length === 0 }
        ]);
        toast.success('Image URL added!');
      }
      setPastedUrl('');
    } catch (err) {
      setModalImages(prev => [
        ...prev,
        { url: pastedUrl.trim(), path: pastedUrl.trim(), is_primary: prev.length === 0 }
      ]);
      setPastedUrl('');
      toast.success('Image URL added!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // --- IMAGE CRUD: PRESET SELECT ---
  const handleModalSelectPreset = async (presetUrl: string) => {
    if (!imageModalProduct) return;
    setIsPresetsOpen(false);
    try {
      setIsUploadingImage(true);
      const res: any = await api.post(`/admin/products/${imageModalProduct.id}/images`, { url: presetUrl });
      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      if (items.length > 0) {
        setModalImages(items.map((img: any, idx: number) => ({
          id: img.id,
          url: img.path || img.url,
          path: img.path || img.url,
          is_primary: Boolean(img.is_primary ?? (idx === 0))
        })));
        toast.success('Preset added to gallery!');
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      } else {
        setModalImages(prev => [
          ...prev,
          { url: presetUrl, path: presetUrl, is_primary: prev.length === 0 }
        ]);
        toast.success('Preset added!');
      }
    } catch (err) {
      setModalImages(prev => [
        ...prev,
        { url: presetUrl, path: presetUrl, is_primary: prev.length === 0 }
      ]);
      toast.success('Preset added!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // --- IMAGE CRUD: SET PRIMARY (⭐) ---
  const handleModalSetPrimary = async (index: number) => {
    const img = modalImages[index];
    if (img.id && imageModalProduct) {
      try {
        await api.put(`/admin/products/${imageModalProduct.id}/images/${img.id}/primary`, {});
      } catch (e) {}
    }

    setModalImages(prev => prev.map((im, i) => ({ ...im, is_primary: i === index })));
    toast.success('Primary display thumbnail set (⭐)');
    if (imageModalProduct) {
      syncEntityInCache(queryClient, 'product', {
        id: imageModalProduct.id,
        primary_image_url: img.url || img.path
      });
    }
  };

  // --- IMAGE CRUD: DELETE (🗑️) ---
  const handleModalDeleteImage = async (index: number) => {
    const img = modalImages[index];
    if (img.id && imageModalProduct) {
      try {
        await api.delete(`/admin/products/${imageModalProduct.id}/images/${img.id}`);
      } catch (e) {}
    }

    setModalImages(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some(im => im.is_primary)) {
        filtered[0].is_primary = true;
      }
      if (imageModalProduct) {
        syncEntityInCache(queryClient, 'product', {
          id: imageModalProduct.id,
          images: filtered,
          primary_image_url: filtered[0]?.url || filtered[0]?.path
        });
      }
      return filtered;
    });
    toast.success('Image removed');
  };

  // --- IMAGE CRUD: REORDER (↔️) ---
  const handleModalMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modalImages.length) return;

    setModalImages(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // --- IMAGE CRUD: SAVE ALL CHANGES ---
  const handleModalSaveGallery = async () => {
    if (!imageModalProduct) return;
    setIsUploadingImage(true);

    try {
      await api.put(`/admin/products/${imageModalProduct.id}`, {
        images: modalImages.map((img, idx) => ({
          id: img.id,
          url: img.url || img.path,
          is_primary: Boolean(img.is_primary),
          position: idx
        }))
      });
      toast.success('Product image gallery saved to database!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setImageModalProduct(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sync images');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'checkbox',
      label: (
        <input 
          type="checkbox" 
          checked={Boolean(data?.data && data.data.length > 0 && selectedIds.length === data.data.length)}
          onChange={handleSelectAll}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" 
        />
      ),
      render: (row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)}
          onChange={() => handleSelectRow(row.id)}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" 
        />
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="relative group/dropdown">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
            Action <ChevronDown className="w-3 h-3" />
          </button>
          {/* Dropdown Menu */}
          <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50 overflow-hidden">
            <button onClick={() => handleOpenImageModal(row)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <ImageIcon className="w-3.5 h-3.5 text-primary" /> Manage Images
            </button>
            <Link href={`/products/${row.slug}`} target="_blank" className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> View Storefront
            </Link>
            <Link href={`/admin/products/${row.id}/edit`} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Edit className="w-3.5 h-3.5 text-amber-500" /> Edit Product
            </Link>
            <button onClick={() => duplicateMutation.mutate(row.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Copy className="w-3.5 h-3.5 text-green-500" /> Duplicate
            </button>
            <Link href={`/admin/products/reviews?product_id=${row.id}`} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <History className="w-3.5 h-3.5 text-indigo-500" /> Product History
            </Link>
            <Link href={`/admin/products/print-barcode?data=${row.slug}`} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Barcode
            </Link>
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
            <button onClick={() => setDeletingProduct({ id: row.id, name: row.name_en })} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )
    },
    {
      key: 'primary_image_url',
      label: 'Image',
      render: (row: any) => {
        const rawImg = row.primary_image_url || row.images?.[0]?.url || row.images?.[0]?.path || 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85';
        const imgUrl = formatImageUrl(rawImg, row.updated_at);
        const imageCount = row.images?.length || (row.primary_image_url ? 1 : 0);

        return (
          <div 
            onClick={() => handleOpenImageModal(row)}
            className="relative w-12 h-12 rounded-2xl neu-inset overflow-hidden flex items-center justify-center p-1 group cursor-pointer hover:border-primary border border-transparent transition-all shadow-xs"
          >
            <img 
              src={imgUrl} 
              alt={row.name_en} 
              className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85'; }}
            />
            {imageCount > 1 ? (
              <span className="absolute bottom-0 right-0 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-tl-lg shadow-sm">{imageCount}</span>
            ) : null}
          </div>
        );
      }
    },
    { 
      key: 'name_en', 
      label: 'Name', 
      render: (row) => (
        <div className="flex flex-col gap-0.5 max-w-[260px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/admin/products/${row.id}/edit`} className="font-black text-slate-900 dark:text-white hover:text-primary transition-colors line-clamp-1">
              {row.name_en}
            </Link>
            {!row.is_active && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Deactive
              </span>
            )}
          </div>
          {row.name_bn && (
            <span className="text-[11px] text-slate-400 font-medium line-clamp-1">
              {row.name_bn}
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'slug', 
      label: 'Code', 
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.slug}</span>
    },
    { 
      key: 'category', 
      label: 'Category', 
      render: (row) => row.category ? <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.category.name_en}</span> : '-'
    },
    { 
      key: 'is_in_stock', 
      label: 'Quantity', 
      render: (row: any) => {
        const totalStock = row.variants?.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0) ?? (row.stock || 0);
        return (
          <button
            onClick={() => { setQuickStockProduct(row); setQuickStockValue(totalStock); }}
            className={`px-2 py-0.5 rounded text-[11px] font-black cursor-pointer shadow-xs transition-transform active:scale-95 ${
              totalStock > 10 ? 'bg-primary/20 text-primary dark:bg-primary/10/60 dark:text-primary' :
              totalStock > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60' : 'bg-red-100 text-red-800'
            }`}
          >
            {totalStock} in stock
          </button>
        );
      }
    },
    { 
      key: 'purchase_count', 
      label: 'Purchase', 
      render: (row: any) => <span className="text-xs font-bold">{row.purchase_count ?? 0}</span>
    },
    { 
      key: 'cost_price', 
      label: 'Cost', 
      render: (row: any) => <span className="text-xs font-black">{formatBDT(row.cost_price || 0)}</span>
    },
    { 
      key: 'base_price', 
      label: 'Price', 
      render: (row) => <span className="text-xs font-black">{formatBDT(row.base_price || 0)}</span>
    },
    { 
      key: 'wprice', 
      label: 'wprice', 
      render: (row: any) => <span className="text-xs font-black text-slate-500">{formatBDT(row.wholesale_price || 0)}</span>
    },
    { 
      key: 'is_active', 
      label: 'Status', 
      render: (row) => {
        const isActive = Boolean(row.is_active);
        return (
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isActive} 
                onChange={() => toggleStatusMutation.mutate({ id: row.id, is_active: !row.is_active })} 
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap ${
              isActive 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
              {isActive ? 'Active' : 'De-Active'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row: any) => <span className="text-xs text-slate-500">{row.position || 0}</span>
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: any) => {
        const typeName = row.product_type?.name_en || 
          productTypesData.find((pt: any) => String(pt.id) === String(row.product_type_id))?.name_en || 
          'Standard';
        return (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold rounded-md whitespace-nowrap">
            {typeName}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/10/50 border border-primary/30 dark:border-primary/80 flex items-center justify-center text-primary dark:text-primary font-black shadow-xs">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Products Catalog</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Manage product titles, multi-image galleries, SKU variant matrices, pricing, and live inventory.
            </p>
          </div>
        </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Active / De-Active Bulk Actions */}
          <button onClick={() => handleBulkAction('active_home')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            Active Home
          </button>
          <button onClick={() => handleBulkAction('deactive_home')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            De-Active Home
          </button>
          
          <button onClick={() => handleBulkAction('active_product')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            Active Product
          </button>
          <button onClick={() => handleBulkAction('deactive_product')} disabled={bulkActionMutation.isPending || selectedIds.length === 0} className="px-3 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50">
            De-Active Product
          </button>
          
          <Link href="/admin/product-types" className="px-3 py-2 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center">
            Product Type
          </Link>

          <input 
            type="file" 
            ref={csvInputRef} 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button onClick={() => csvInputRef.current?.click()} disabled={importMutation.isPending} className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50">
            <Copy className="w-3.5 h-3.5" /> {importMutation.isPending ? 'Importing...' : 'Import Product'}
          </button>

          <Link
            href="/admin/products/create"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh Products"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => { setSelectedStatus(''); setPage(1); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
            selectedStatus === ''
              ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
              : 'bg-white dark:bg-[#111622] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary/50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>All Products</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
            selectedStatus === '' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {data?.counts?.all ?? data?.meta?.total ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('1'); setPage(1); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
            selectedStatus === '1'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
              : 'bg-white dark:bg-[#111622] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
            selectedStatus === '1' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
          }`}>
            {data?.counts?.active ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('0'); setPage(1); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
            selectedStatus === '0'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
              : 'bg-white dark:bg-[#111622] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-500/50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>De-Active</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
            selectedStatus === '0' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
          }`}>
            {data?.counts?.deactive ?? 0}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search products by title, SKU, slug..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none"
          >
            <option value="">All Categories</option>
            {categoriesData?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name_en}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">De-Active Only</option>
          </select>

          <select
            value={selectedProductType}
            onChange={(e) => { setSelectedProductType(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none"
          >
            <option value="">All Product Types</option>
            {productTypesData?.map((pt: any) => (
              <option key={pt.id} value={pt.id}>{pt.name_en}</option>
            ))}
          </select>

          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none"
            title="Products per page"
          >
            <option value="12">12 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>

        {(search || selectedCategory || selectedStatus || selectedProductType) && (
          <button
            onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedStatus(''); setSelectedProductType(''); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Product Data Table */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          currentPage={data?.meta?.current_page || 1}
          totalPages={data?.meta?.last_page || 1}
          onPageChange={(p: number) => setPage(p)}
        />
      </div>

      {/* --- QUICK IMAGE CRUD MODAL --- */}
      {imageModalProduct && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setImageModalProduct(null);
          }}
          className="fixed inset-0 z-[120] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between neu-modal-header pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-primary font-black">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Image Gallery & Media Manager</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 font-bold">
                    {imageModalProduct.name_en}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImageModalProduct(null)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Options Row */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Drag & Drop Upload Zone (>4MB supported) */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleModalFileUpload(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-primary bg-primary/10/50 dark:bg-primary/10/30' 
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-primary/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) handleModalFileUpload(e.target.files);
                    }}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 mx-auto text-primary dark:text-primary mb-1" />
                  <span className="text-xs font-black text-slate-900 dark:text-white block">Upload Images (&gt;4MB OK)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Click or drag JPG, PNG, WEBP, SVG</span>
                </div>

                {/* Direct Link Input */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <LinkIcon className="w-3.5 h-3.5 text-primary" />
                      <span>Paste Image URL</span>
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://... or /images/..."
                        value={pastedUrl}
                        onChange={(e) => setPastedUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleModalPasteUrl(); }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleModalPasteUrl()}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                    className="mt-2 text-[10px] font-bold text-primary dark:text-primary flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Choose from Preset Library</span>
                  </button>
                </div>
              </div>

              {/* Presets Modal Popover */}
              {isPresetsOpen && (
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-2">Select High-Res Preset:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleModalSelectPreset(preset.url)}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary rounded-xl text-center group cursor-pointer transition-all"
                      >
                        <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain mx-auto mb-1 group-hover:scale-105" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Existing Images Gallery Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Product Gallery ({modalImages.length} {modalImages.length === 1 ? 'image' : 'images'})
                </span>
                <span className="text-[10px] text-slate-500">⭐ Set Primary | 🗑️ Delete | ↔️ Reorder</span>
              </div>

              {modalImages.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                  <span className="text-xs text-slate-500 font-bold block">No images in gallery yet</span>
                  <span className="text-[10px] text-slate-400">Upload an image above or paste a link</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {modalImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`relative aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900 p-2 overflow-hidden group border-2 transition-all ${
                        img.is_primary ? 'border-primary shadow-md' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <img src={formatImageUrl(img.url || img.path)} alt="product" className="w-full h-full object-contain rounded-xl" />
                      
                      {/* Controls Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        {/* Top action row */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleModalSetPrimary(idx)}
                            className={`p-1.5 rounded-lg text-xs font-bold ${
                              img.is_primary ? 'bg-amber-500 text-white shadow-xs' : 'bg-white/30 text-white hover:bg-amber-500'
                            }`}
                            title="Set as Primary Display Image"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleModalDeleteImage(idx)}
                            className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom reorder row */}
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleModalMoveImage(idx, 'left')}
                            className="p-1 rounded-md bg-white/30 text-white hover:bg-white/50 disabled:opacity-20"
                            title="Move Left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] text-white font-mono font-bold">#{idx + 1}</span>
                          <button
                            type="button"
                            disabled={idx === modalImages.length - 1}
                            onClick={() => handleModalMoveImage(idx, 'right')}
                            className="p-1 rounded-md bg-white/30 text-white hover:bg-white/50 disabled:opacity-20"
                            title="Move Right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {img.is_primary && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md">
                          PRIMARY
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 neu-modal-footer">
              <button
                type="button"
                onClick={() => setImageModalProduct(null)}
                className="neu-btn-secondary px-4 py-2 text-xs font-bold"
              >
                Close
              </button>
              
              <button
                type="button"
                onClick={handleModalSaveGallery}
                disabled={isUploadingImage}
                className="neu-btn-primary px-5 py-2.5 text-xs font-black flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Gallery to Database</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingProduct(null);
          }}
          className="fixed inset-0 z-[120] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl neu-card-inset flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-foreground">Delete Product</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">"{deletingProduct.name}"</span>? This will remove all associated variant SKUs and images.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 neu-modal-footer">
              <button
                onClick={() => setDeletingProduct(null)}
                className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingProduct.id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:translate-y-0.5 text-white rounded-2xl text-xs font-bold shadow-md transition-all"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Modal */}
      {quickStockProduct && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickStockProduct(null);
          }}
          className="fixed inset-0 z-[120] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <h3 className="text-sm font-black text-foreground">Update Available Stock</h3>
            <p className="text-xs text-muted-foreground line-clamp-1 font-bold">{quickStockProduct.name_en}</p>
            
            <div>
              <label className="text-xs font-bold text-foreground">Units in Stock</label>
              <input
                type="number"
                min="0"
                value={quickStockValue}
                onChange={(e) => setQuickStockValue(parseInt(e.target.value) || 0)}
                className="w-full mt-1.5 px-3 py-2.5 neu-input text-sm font-black"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 neu-modal-footer">
              <button
                onClick={() => setQuickStockProduct(null)}
                className="neu-btn-secondary px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => quickStockMutation.mutate({ id: quickStockProduct.id, stock: quickStockValue, variantId: quickStockProduct.variants?.[0]?.id })}
                disabled={quickStockMutation.isPending}
                className="neu-btn-primary px-5 py-2.5 text-xs font-black shadow-lg"
              >
                {quickStockMutation.isPending ? 'Saving...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
