'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Trash2, ShoppingBag, Sparkles, MoveUp, MoveDown, 
  Tag, CheckCircle2, Layers, Sliders, AlertCircle, ChevronDown, 
  ChevronUp, Image as ImageIcon, Check, Zap, X, Search,
  CheckSquare, Square, Package, PackagePlus, Filter
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';

export interface NewVariantItem {
  color?: string;
  size?: string;
  sku?: string;
  price?: number | string;
  stock?: number | string;
}

export interface PageProductConfigItem {
  id?: number;
  product_id: number | '';
  title_en?: string;
  title_bn?: string;
  image?: string;
  custom_price?: number | string;
  compare_price?: number | string;
  badge_text?: string;
  is_default?: boolean;
  sort_order?: number;
  variations?: any[];
  new_variants?: NewVariantItem[];
}

interface PageProductBuilderProps {
  products: PageProductConfigItem[];
  onChange: (products: PageProductConfigItem[]) => void;
  catalogProducts: any[];
}

export function PageProductBuilder({ products, onChange, catalogProducts }: PageProductBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Multi-Product Selector Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<number[]>([]);

  // Filter catalog products for modal
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalogProducts;
    const q = searchQuery.toLowerCase();
    return catalogProducts.filter((p) => {
      const matchNameEn = p.name_en?.toLowerCase().includes(q);
      const matchNameBn = p.name_bn?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchCategory = p.category?.name_en?.toLowerCase().includes(q);
      return matchNameEn || matchNameBn || matchSku || matchCategory;
    });
  }, [catalogProducts, searchQuery]);

  // Open modal pre-selecting what's not yet added, or clear
  const openMultiProductModal = () => {
    setSelectedCatalogIds([]);
    setSearchQuery('');
    setIsCatalogModalOpen(true);
  };

  const toggleCatalogProductSelection = (productId: number) => {
    setSelectedCatalogIds((prev) => 
      prev.includes(productId) 
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredCatalog.map((p) => p.id);
    setSelectedCatalogIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const deselectAll = () => {
    setSelectedCatalogIds([]);
  };

  // Confirm adding selected catalog products
  const handleAddSelectedCatalogProducts = () => {
    if (selectedCatalogIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const newItems: PageProductConfigItem[] = selectedCatalogIds.map((id, i) => {
      const prod = catalogProducts.find((p) => p.id === id);
      const currentIdx = products.length + i;
      const variants = prod?.variants || [];
      const firstVarPrice = variants[0]?.price ? Number(variants[0].price) : null;
      const basePrice = firstVarPrice || prod?.base_price || prod?.current_price || '';
      const rawCompare = prod?.compare_price || (basePrice ? Math.round(Number(basePrice) * 1.3) : '');

      return {
        product_id: prod?.id || id,
        title_en: prod?.name_en || `Product Offer #${currentIdx + 1}`,
        title_bn: prod?.name_bn || '',
        image: prod?.primary_image_url || prod?.images?.[0]?.path || '',
        custom_price: basePrice,
        compare_price: rawCompare,
        badge_text: currentIdx === 0 ? '🔥 মোস্ট পপুলার' : currentIdx === 1 ? '⚡ বেস্ট ভ্যালু কম্বো' : '🌟 স্পেশাল বান্ডেল',
        is_default: products.length === 0 && i === 0,
        sort_order: currentIdx,
        variations: variants,
        new_variants: [],
      };
    });

    onChange([...products, ...newItems]);
    setIsCatalogModalOpen(false);
    setSelectedCatalogIds([]);
    setExpandedIndex(products.length); // expand the first newly added item
    toast.success(`Successfully added ${newItems.length} product(s) to landing page!`);
  };

  // Add a single custom package/offer
  const addSingleProductPackage = () => {
    const defaultCatalogProd = catalogProducts.find(
      (p) => !products.some((existing) => existing.product_id === p.id)
    ) || catalogProducts[0];

    const newIdx = products.length;
    const newPkg: PageProductConfigItem = {
      product_id: defaultCatalogProd?.id || '',
      title_en: defaultCatalogProd?.name_en || `Package Offer #${newIdx + 1}`,
      title_bn: defaultCatalogProd?.name_bn || `প্যাকেজ অফার #${newIdx + 1}`,
      image: defaultCatalogProd?.primary_image_url || defaultCatalogProd?.images?.[0]?.path || '',
      custom_price: defaultCatalogProd?.base_price || defaultCatalogProd?.current_price || '',
      compare_price: defaultCatalogProd?.compare_price || '',
      badge_text: newIdx === 0 ? '🔥 মোস্ট পপুলার' : newIdx === 1 ? '⚡ বেস্ট ভ্যালু কম্বো' : '🌟 মেগা সেভার প্যাক',
      is_default: products.length === 0,
      sort_order: newIdx,
      variations: defaultCatalogProd?.variants || [],
      new_variants: [],
    };
    onChange([...products, newPkg]);
    setExpandedIndex(newIdx);
  };

  const removeProductPackage = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    if (products[index]?.is_default && updated.length > 0) {
      updated[0].is_default = true;
    }
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(updated.length > 0 ? 0 : null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateProductPackage = (index: number, field: keyof PageProductConfigItem, value: any) => {
    const updated = [...products];
    if (field === 'is_default' && value === true) {
      updated.forEach((p, i) => {
        p.is_default = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const handleCatalogProductSelect = (index: number, selectedIdStr: string) => {
    const prodId = selectedIdStr ? parseInt(selectedIdStr) : '';
    const selectedProd = catalogProducts.find(p => p.id === prodId);
    const updated = [...products];
    if (selectedProd) {
      updated[index] = {
        ...updated[index],
        product_id: selectedProd.id,
        title_en: updated[index].title_en || selectedProd.name_en,
        title_bn: updated[index].title_bn || selectedProd.name_bn,
        image: updated[index].image || selectedProd.primary_image_url || selectedProd.images?.[0]?.path || '',
        custom_price: updated[index].custom_price || selectedProd.base_price || selectedProd.current_price,
        compare_price: updated[index].compare_price || selectedProd.compare_price,
        variations: selectedProd.variants || [],
      };
    } else {
      updated[index] = {
        ...updated[index],
        product_id: '',
      };
    }
    onChange(updated);
  };

  const movePackage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= products.length) return;
    const updated = [...products];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    updated.forEach((p, i) => {
      p.sort_order = i;
    });
    onChange(updated);
    setExpandedIndex(targetIdx);
  };

  // Add new variant to a package
  const addNewVariantToPackage = (pkgIndex: number, preset?: Partial<NewVariantItem>) => {
    const updated = [...products];
    const currentNew = updated[pkgIndex].new_variants || [];
    const prod = catalogProducts.find(p => p.id === updated[pkgIndex].product_id);
    const prefix = prod?.sku_prefix || 'VAR';
    const newSku = preset?.sku || `${prefix}-${currentNew.length + 1}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
    
    const newVar: NewVariantItem = {
      color: preset?.color || '',
      size: preset?.size || '',
      sku: newSku,
      price: preset?.price || updated[pkgIndex].custom_price || prod?.base_price || '',
      stock: preset?.stock || 50,
    };

    updated[pkgIndex] = {
      ...updated[pkgIndex],
      new_variants: [...currentNew, newVar],
    };
    onChange(updated);
  };

  const updateNewVariant = (pkgIndex: number, varIndex: number, field: keyof NewVariantItem, value: any) => {
    const updated = [...products];
    const currentNew = [...(updated[pkgIndex].new_variants || [])];
    currentNew[varIndex] = { ...currentNew[varIndex], [field]: value };
    updated[pkgIndex] = { ...updated[pkgIndex], new_variants: currentNew };
    onChange(updated);
  };

  const removeNewVariant = (pkgIndex: number, varIndex: number) => {
    const updated = [...products];
    const currentNew = (updated[pkgIndex].new_variants || []).filter((_, i) => i !== varIndex);
    updated[pkgIndex] = { ...updated[pkgIndex], new_variants: currentNew };
    onChange(updated);
  };

  // Quick preset: Apparel sizes (M, L, XL, XXL)
  const addApparelSizesPreset = (pkgIndex: number) => {
    const sizes = ['M', 'L', 'XL', 'XXL'];
    const prod = catalogProducts.find(p => p.id === products[pkgIndex].product_id);
    const prefix = prod?.sku_prefix || 'VAR';
    const basePrice = products[pkgIndex].custom_price || prod?.base_price || 1200;

    const newVars: NewVariantItem[] = sizes.map((size) => ({
      size,
      color: 'Default',
      sku: `${prefix}-${size}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
      price: basePrice,
      stock: 50,
    }));

    const updated = [...products];
    const currentNew = updated[pkgIndex].new_variants || [];
    updated[pkgIndex] = {
      ...updated[pkgIndex],
      new_variants: [...currentNew, ...newVars],
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Multi-Product & Single-Product Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Landing Page Products ({products.length})</span>
            </h3>
            {products.length > 1 ? (
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary dark:text-primary text-[10px] font-black border border-primary/30 flex items-center gap-1">
                <Package className="w-3 h-3" /> Multi-Product Bundle Active
              </span>
            ) : products.length === 1 ? (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[10px] font-black border border-blue-500/30">
                Single Product Funnel
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add 1 product for single-item funnels, or add multiple products for a combo bundle where customers can buy all together.
          </p>
        </div>

        {/* Action Buttons: Multi-Product Modal & Single Add */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openMultiProductModal}
            className="clay-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] transition-transform"
          >
            <PackagePlus className="w-4 h-4 text-primary/40" />
            <span>Select Multiple Products</span>
          </button>

          <button
            type="button"
            onClick={addSingleProductPackage}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-border/80 bg-background hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer transition-all"
            title="Add a single blank offer or custom package tier"
          >
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Add Single Offer</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 ? (
        <div className="clay-card rounded-2xl p-8 text-center space-y-3 border-2 border-dashed border-primary/30">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-black text-foreground">No Products Attached to this Funnel Yet</div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Select multiple products to create a multi-product bundle funnel, or add a single product for a direct landing checkout.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={openMultiProductModal}
              className="clay-btn-primary px-5 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Select Multiple Products from Catalog</span>
            </button>
            <button
              type="button"
              onClick={addSingleProductPackage}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Single Product</span>
            </button>
          </div>
        </div>
      ) : (
        /* Attached Products List */
        <div className="space-y-3">
          {products.map((pkg, idx) => {
            const isExpanded = expandedIndex === idx;
            const linkedProd = catalogProducts.find(p => p.id === pkg.product_id);
            const existingVariants = pkg.variations || linkedProd?.variants || [];
            const newVariants = pkg.new_variants || [];

            return (
              <div 
                key={idx}
                className={`clay-card rounded-2xl transition-all border ${
                  pkg.is_default ? 'border-primary/60 ring-2 ring-primary/20 shadow-md' : 'border-border/60'
                }`}
              >
                {/* Product Header Row */}
                <div 
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full clay-inset inline-flex items-center justify-center font-black text-xs text-primary flex-shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/40">
                      {pkg.image ? (
                        <img src={pkg.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-foreground truncate">
                          {pkg.title_en || linkedProd?.name_en || 'Untitled Product Offer'}
                        </span>
                        {pkg.badge_text && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 border border-amber-500/20 truncate">
                            {pkg.badge_text}
                          </span>
                        )}
                        {pkg.is_default && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Default Showcase
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-primary">
                          {pkg.custom_price ? formatBDT(Number(pkg.custom_price)) : 'Price not set'}
                        </span>
                        {pkg.compare_price && (
                          <span className="line-through text-slate-400">
                            {formatBDT(Number(pkg.compare_price))}
                          </span>
                        )}
                        <span>•</span>
                        <span>{existingVariants.length + newVariants.length} variant(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePackage(idx, 'up')}
                      className="p-1.5 clay-btn rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === products.length - 1}
                      onClick={() => movePackage(idx, 'down')}
                      className="p-1.5 clay-btn rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProductPackage(idx)}
                      className="p-1.5 clay-btn rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                      title="Remove Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="pl-1 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Edit Body */}
                {isExpanded && (
                  <div className="p-4 border-t border-border/40 space-y-4 bg-muted/20 rounded-b-2xl">
                    {/* Catalog Product Link & Default Showcase Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Catalog Product *
                        </label>
                        <select
                          required
                          value={pkg.product_id}
                          onChange={(e) => handleCatalogProductSelect(idx, e.target.value)}
                          className="w-full px-3 py-2 clay-input rounded-xl text-xs font-bold text-primary"
                        >
                          <option value="">Select catalog product...</option>
                          {catalogProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name_en} — ৳{p.base_price || p.current_price}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Default Showcase Switch */}
                      <div className="flex items-end">
                        <label className="w-full flex items-center justify-between p-2.5 clay-inset rounded-xl cursor-pointer">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>Default Showcase on Landing Page</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(pkg.is_default)}
                            onChange={(e) => updateProductPackage(idx, 'is_default', e.target.checked)}
                            className="w-4 h-4 rounded text-primary accent-primary"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Titles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Offer Display Title (English) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1 Pc - Premium Edition"
                          value={pkg.title_en || ''}
                          onChange={(e) => updateProductPackage(idx, 'title_en', e.target.value)}
                          className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Offer Display Title (বাংলা)
                        </label>
                        <input
                          type="text"
                          placeholder="যেমনঃ ১টি কিনুন - প্রিমিয়াম এডিশন"
                          value={pkg.title_bn || ''}
                          onChange={(e) => updateProductPackage(idx, 'title_bn', e.target.value)}
                          className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>

                    {/* Pricing and Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Offer Price (৳) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="1200"
                          value={pkg.custom_price ?? ''}
                          onChange={(e) => updateProductPackage(idx, 'custom_price', e.target.value)}
                          className="w-full px-3 py-2 clay-input rounded-xl text-xs font-bold text-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Regular / Compare Price (৳)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="1500"
                          value={pkg.compare_price ?? ''}
                          onChange={(e) => updateProductPackage(idx, 'compare_price', e.target.value)}
                          className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Promo / Savings Badge Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 🔥 Most Popular"
                          value={pkg.badge_text || ''}
                          onChange={(e) => updateProductPackage(idx, 'badge_text', e.target.value)}
                          className="w-full px-3 py-2 clay-input rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        Offer Image URL (Optional - defaults to product image)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={pkg.image || ''}
                        onChange={(e) => updateProductPackage(idx, 'image', e.target.value)}
                        className="w-full px-3 py-2 clay-input rounded-xl text-xs font-mono"
                      />
                    </div>

                    {/* Variations Manager */}
                    <div className="clay-card rounded-xl p-3 sm:p-4 space-y-3 border border-border/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <div>
                          <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-primary" />
                            <span>Product Variations</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Existing variants from product catalog and custom variations for this landing page offer
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addApparelSizesPreset(idx)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3 h-3" /> Quick Sizes (M-XXL)
                          </button>
                          <button
                            type="button"
                            onClick={() => addNewVariantToPackage(idx)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg clay-btn-primary flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Variation
                          </button>
                        </div>
                      </div>

                      {/* Existing catalog variants */}
                      {existingVariants.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                            Catalog Variants ({existingVariants.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {existingVariants.map((v: any, vIdx: number) => (
                              <span 
                                key={v.id || vIdx}
                                className="px-2.5 py-1 rounded-lg clay-inset text-[11px] font-bold text-foreground flex items-center gap-1.5"
                              >
                                <span>{v.color || 'Default'}</span>
                                {v.size && <span className="text-primary font-black">({v.size})</span>}
                                {v.price && <span className="text-muted-foreground">• ৳{v.price}</span>}
                                {v.stock !== undefined && (
                                  <span className="text-primary dark:text-primary font-normal">[{v.stock} in stock]</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Variations Created In This Builder */}
                      {newVariants.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/40">
                          <span className="text-[10px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> New Variations Created For This Page ({newVariants.length})
                          </span>

                          <div className="space-y-2">
                            {newVariants.map((nv, nIdx) => (
                              <div 
                                key={nIdx}
                                className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 clay-inset rounded-xl items-center text-xs"
                              >
                                <div>
                                  <label className="text-[9px] font-bold text-muted-foreground block">Color</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Navy Blue"
                                    value={nv.color || ''}
                                    onChange={(e) => updateNewVariant(idx, nIdx, 'color', e.target.value)}
                                    className="w-full px-2 py-1 bg-background/80 rounded-lg text-xs font-semibold focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-bold text-muted-foreground block">Size</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. XL (44)"
                                    value={nv.size || ''}
                                    onChange={(e) => updateNewVariant(idx, nIdx, 'size', e.target.value)}
                                    className="w-full px-2 py-1 bg-background/80 rounded-lg text-xs font-semibold focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-bold text-muted-foreground block">Price (৳)</label>
                                  <input
                                    type="number"
                                    placeholder="1200"
                                    value={nv.price ?? ''}
                                    onChange={(e) => updateNewVariant(idx, nIdx, 'price', e.target.value)}
                                    className="w-full px-2 py-1 bg-background/80 rounded-lg text-xs font-bold text-primary focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-bold text-muted-foreground block">Stock</label>
                                  <input
                                    type="number"
                                    placeholder="50"
                                    value={nv.stock ?? ''}
                                    onChange={(e) => updateNewVariant(idx, nIdx, 'stock', e.target.value)}
                                    className="w-full px-2 py-1 bg-background/80 rounded-lg text-xs font-semibold focus:outline-none"
                                  />
                                </div>

                                <div className="flex items-end justify-end col-span-2 sm:col-span-1">
                                  <button
                                    type="button"
                                    onClick={() => removeNewVariant(idx, nIdx)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                                    title="Remove Variant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CATALOG MULTI-PRODUCT SELECTION MODAL */}
      {isCatalogModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCatalogModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal w-full max-w-4xl p-5 sm:p-7 space-y-4 max-h-[90vh] flex flex-col cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between neu-modal-header pb-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary dark:text-primary flex items-center justify-center">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Select Products for Landing Page / Bundle Funnel
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select multiple products to bundle together into a high-converting 1-page checkout.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Search & Bulk Select Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by name, category, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="neu-input w-full pl-9 pr-8 py-2.5 text-xs font-semibold"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="px-3 py-2 rounded-xl text-xs font-bold neu-btn-secondary flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  <span>Select All ({filteredCatalog.length})</span>
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-3 py-2 rounded-xl text-xs font-bold neu-btn-secondary flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Product Cards Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-[300px]">
              {filteredCatalog.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto opacity-40" />
                  <div className="text-xs font-bold">No products found matching &quot;{searchQuery}&quot;</div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredCatalog.map((prod) => {
                    const isSelected = selectedCatalogIds.includes(prod.id);
                    const isAlreadyAdded = products.some((p) => p.product_id === prod.id);
                    const variantsCount = prod.variants ? prod.variants.length : 0;
                    const price = prod.base_price || prod.current_price || 0;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleCatalogProductSelection(prod.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#161d2a]'
                        }`}
                      >
                        <div>
                          {/* Top Row: Checkbox & Status */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-primary text-white shadow-xs'
                                : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            {isAlreadyAdded && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-primary/15 text-primary border border-primary/20">
                                In Funnel
                              </span>
                            )}
                          </div>

                          {/* Image & Titles */}
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {prod.primary_image_url || prod.images?.[0]?.path ? (
                                <img 
                                  src={prod.primary_image_url || prod.images?.[0]?.path} 
                                  alt={prod.name_en} 
                                  className="w-full h-full object-contain" 
                                />
                              ) : (
                                <ShoppingBag className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight">
                                {prod.name_en}
                              </h4>
                              {prod.name_bn && (
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {prod.name_bn}
                                </p>
                              )}
                              <div className="text-xs font-black text-primary dark:text-primary mt-1">
                                {formatBDT(Number(price))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Category & Variants */}
                        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate max-w-[120px]">
                            {prod.category?.name_en || 'General'}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {variantsCount > 0 ? `${variantsCount} variant(s)` : 'Single SKU'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="neu-modal-footer pt-4 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>Selected:</span>
                <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary dark:text-primary/40 font-black">
                  {selectedCatalogIds.length} Product(s)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="neu-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedCatalogIds.length === 0}
                  onClick={handleAddSelectedCatalogProducts}
                  className="neu-btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Selected ({selectedCatalogIds.length}) to Funnel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
