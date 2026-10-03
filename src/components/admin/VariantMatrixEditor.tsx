'use client';

import { useState } from 'react';
import { Plus, Trash2, Sparkles, Copy, Sliders, Check } from 'lucide-react';
import { ProductVariant } from '@/types';

interface VariantMatrixEditorProps {
  variants: Partial<ProductVariant>[];
  onChange: (variants: Partial<ProductVariant>[]) => void;
  skuPrefix: string;
}

export function VariantMatrixEditor({ variants, onChange, skuPrefix }: VariantMatrixEditorProps) {
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkCostPrice, setBulkCostPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [bulkWeight, setBulkWeight] = useState('');

  const addVariant = () => {
    const prefix = skuPrefix ? skuPrefix.toUpperCase() : 'SKU';
    const newSku = `${prefix}-${variants.length + 1}`;
    onChange([
      ...variants, 
      { 
        sku: newSku, 
        color: '', 
        size: '', 
        weight_grams: 0,
        barcode: '',
        price: 0, 
        cost_price: 0,
        stock: 10, 
        is_active: true 
      }
    ]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  // Quick Preset: Standard Apparel Sizes (S, M, L, XL, XXL)
  const applySizePreset = () => {
    const prefix = skuPrefix ? skuPrefix.toUpperCase() : 'SKU';
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const generated = sizes.map((size, idx) => ({
      sku: `${prefix}-${size}-${idx + 1}`,
      size: size,
      color: variants[0]?.color || 'Standard',
      weight_grams: variants[0]?.weight_grams || 300,
      price: variants[0]?.price || 1200,
      cost_price: variants[0]?.cost_price || 800,
      stock: 20,
      is_active: true
    }));
    onChange([...variants, ...generated]);
  };

  // Quick Preset: Weight Packs (250g, 500g, 1kg)
  const applyWeightPreset = () => {
    const prefix = skuPrefix ? skuPrefix.toUpperCase() : 'SKU';
    const weights = [
      { label: '250g', grams: 250, priceMult: 0.3 },
      { label: '500g', grams: 500, priceMult: 0.55 },
      { label: '1kg', grams: 1000, priceMult: 1.0 },
    ];
    const baseP = variants[0]?.price || 1000;
    const generated = weights.map((w, idx) => ({
      sku: `${prefix}-${w.label}-${idx + 1}`,
      size: w.label,
      weight_grams: w.grams,
      color: 'Natural',
      price: Math.round(baseP * w.priceMult),
      cost_price: Math.round((baseP * w.priceMult) * 0.7),
      stock: 25,
      is_active: true
    }));
    onChange([...variants, ...generated]);
  };

  // Quick Preset: Piece / Combo Packs (1 Pc, 3 Pcs Pack, 6 Pcs Box)
  const applyPiecePreset = () => {
    const prefix = skuPrefix ? skuPrefix.toUpperCase() : 'SKU';
    const packs = [
      { label: '1 Piece', size: '1 Pc', mult: 1 },
      { label: '3 Pcs Pack', size: '3 Pcs Pack', mult: 2.8 },
      { label: '6 Pcs Box', size: '6 Pcs Box', mult: 5.2 },
    ];
    const baseP = variants[0]?.price || 500;
    const generated = packs.map((p, idx) => ({
      sku: `${prefix}-${idx + 1}-PC`,
      size: p.size,
      color: 'Standard',
      price: Math.round(baseP * p.mult),
      cost_price: Math.round((baseP * p.mult) * 0.65),
      stock: 30,
      is_active: true
    }));
    onChange([...variants, ...generated]);
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    const p = parseFloat(bulkPrice);
    onChange(variants.map(v => ({ ...v, price: p })));
  };

  const applyBulkCost = () => {
    if (!bulkCostPrice) return;
    const c = parseFloat(bulkCostPrice);
    onChange(variants.map(v => ({ ...v, cost_price: c })));
  };

  const applyBulkStock = () => {
    if (!bulkStock) return;
    const s = parseInt(bulkStock);
    onChange(variants.map(v => ({ ...v, stock: s, available_stock: s })));
  };

  const applyBulkWeight = () => {
    if (!bulkWeight) return;
    const w = parseInt(bulkWeight);
    onChange(variants.map(v => ({ ...v, weight_grams: w })));
  };

  return (
    <div className="space-y-4">
      {/* Header & Preset Generators */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <span>Variant Matrix</span>
            <span className="px-2.5 py-0.5 rounded-full clay-chip-active text-xs font-black">
              {variants.length} SKU{variants.length !== 1 ? 's' : ''}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">Configure Size, Weight, Piece/Pack, Color, Price, and Stock per variant</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button" 
            onClick={addVariant}
            className="clay-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Single SKU</span>
          </button>
        </div>
      </div>

      {/* Quick Matrix Generators */}
      <div className="clay-card p-3 rounded-2xl flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Presets:</span>
        </span>
        <button
          type="button"
          onClick={applySizePreset}
          className="clay-btn px-3 py-1.5 rounded-xl text-xs font-bold hover:text-primary transition-colors"
        >
          + Sizes (S, M, L, XL, XXL)
        </button>
        <button
          type="button"
          onClick={applyWeightPreset}
          className="clay-btn px-3 py-1.5 rounded-xl text-xs font-bold hover:text-primary transition-colors"
        >
          + Weights (250g, 500g, 1kg)
        </button>
        <button
          type="button"
          onClick={applyPiecePreset}
          className="clay-btn px-3 py-1.5 rounded-xl text-xs font-bold hover:text-primary transition-colors"
        >
          + Piece Packs (1 Pc, 3 Pcs, 6 Pcs)
        </button>
      </div>

      {/* Bulk Fill Tools */}
      {variants.length > 0 && (
        <div className="clay-inset p-3.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Bulk Sell Price (৳)</label>
            <div className="flex gap-1.5">
              <input 
                type="number" 
                value={bulkPrice} 
                onChange={e => setBulkPrice(e.target.value)} 
                className="w-full px-3 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                placeholder="e.g. 1500" 
              />
              <button 
                type="button" 
                onClick={applyBulkPrice} 
                className="clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Bulk Cost Price (৳)</label>
            <div className="flex gap-1.5">
              <input 
                type="number" 
                value={bulkCostPrice} 
                onChange={e => setBulkCostPrice(e.target.value)} 
                className="w-full px-3 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                placeholder="e.g. 950" 
              />
              <button 
                type="button" 
                onClick={applyBulkCost} 
                className="clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Bulk Stock Count</label>
            <div className="flex gap-1.5">
              <input 
                type="number" 
                value={bulkStock} 
                onChange={e => setBulkStock(e.target.value)} 
                className="w-full px-3 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                placeholder="e.g. 50" 
              />
              <button 
                type="button" 
                onClick={applyBulkStock} 
                className="clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Bulk Weight (Grams)</label>
            <div className="flex gap-1.5">
              <input 
                type="number" 
                value={bulkWeight} 
                onChange={e => setBulkWeight(e.target.value)} 
                className="w-full px-3 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                placeholder="e.g. 500" 
              />
              <button 
                type="button" 
                onClick={applyBulkWeight} 
                className="clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variants Table */}
      <div className="overflow-x-auto clay-card rounded-2xl">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
            <tr>
              <th className="px-3 py-3 font-bold">SKU Code *</th>
              <th className="px-3 py-3 font-bold">Color</th>
              <th className="px-3 py-3 font-bold">Size / Pack</th>
              <th className="px-3 py-3 font-bold">Weight (g)</th>
              <th className="px-3 py-3 font-bold">Sell Price (৳) *</th>
              <th className="px-3 py-3 font-bold">Cost Price (৳)</th>
              <th className="px-3 py-3 font-bold">Stock *</th>
              <th className="px-3 py-3 font-bold text-center">Active</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {variants.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  <div className="space-y-2">
                    <p className="font-semibold">No variant SKUs added yet.</p>
                    <p className="text-[11px]">Click "Add Single SKU" or select a Quick Preset above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              variants.map((variant, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="p-2 min-w-[140px]">
                    <input 
                      type="text" 
                      value={variant.sku || ''} 
                      onChange={e => updateVariant(idx, 'sku', e.target.value)} 
                      className="w-full px-2.5 py-1.5 clay-input rounded-xl text-xs font-mono font-bold" 
                      placeholder="SKU" 
                      required 
                    />
                  </td>
                  <td className="p-2 min-w-[110px]">
                    <input 
                      type="text" 
                      value={variant.color || ''} 
                      onChange={e => updateVariant(idx, 'color', e.target.value)} 
                      className="w-full px-2.5 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                      placeholder="e.g. Navy Blue" 
                    />
                  </td>
                  <td className="p-2 min-w-[110px]">
                    <input 
                      type="text" 
                      value={variant.size || ''} 
                      onChange={e => updateVariant(idx, 'size', e.target.value)} 
                      className="w-full px-2.5 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                      placeholder="e.g. XL / 3 Pcs" 
                    />
                  </td>
                  <td className="p-2 min-w-[90px]">
                    <input 
                      type="number" 
                      value={variant.weight_grams ?? ''} 
                      onChange={e => updateVariant(idx, 'weight_grams', parseInt(e.target.value) || 0)} 
                      className="w-full px-2.5 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                      placeholder="grams" 
                      min={0}
                    />
                  </td>
                  <td className="p-2 min-w-[110px]">
                    <input 
                      type="number" 
                      value={variant.price ?? ''} 
                      onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)} 
                      className="w-full px-2.5 py-1.5 clay-input rounded-xl text-xs font-bold text-primary" 
                      placeholder="Price" 
                      required 
                      min={0} 
                    />
                  </td>
                  <td className="p-2 min-w-[100px]">
                    <input 
                      type="number" 
                      value={variant.cost_price ?? ''} 
                      onChange={e => updateVariant(idx, 'cost_price', parseFloat(e.target.value) || 0)} 
                      className="w-full px-2.5 py-1.5 clay-input rounded-xl text-xs font-semibold" 
                      placeholder="Cost" 
                      min={0} 
                    />
                  </td>
                  <td className="p-2 min-w-[90px]">
                    <input 
                      type="number" 
                      value={variant.stock ?? ''} 
                      onChange={e => updateVariant(idx, 'stock', parseInt(e.target.value) || 0)} 
                      className="w-full px-2.5 py-1.5 clay-input rounded-xl text-xs font-bold" 
                      placeholder="Stock" 
                      required 
                      min={0} 
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={variant.is_active ?? true} 
                      onChange={e => updateVariant(idx, 'is_active', e.target.checked)} 
                      className="w-4 h-4 rounded text-primary cursor-pointer" 
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button 
                      type="button" 
                      onClick={() => removeVariant(idx)} 
                      className="p-1.5 clay-btn rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}