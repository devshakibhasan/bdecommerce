'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, Table as TableIcon, Sparkles, CheckCircle2, Eye, Ruler } from 'lucide-react';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import toast from 'react-hot-toast';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSizeGuideId: number, guideName: string) => void;
  initialName?: string;
}

// 4-Column Presets (Standard Clothing Matrix)
export const FOUR_COLUMN_PRESETS = {
  sweatshirt_shirt: {
    name: "Shirt / Sweatshirt Size Guide",
    units: ['inch'],
    columns: ['Size', 'Chest (Inch)', 'Length (Inch)', 'Sleeve (Inch)'],
    rows: [
      ['S', '38', '27.5', '24.0'],
      ['M', '40', '28.5', '24.5'],
      ['L', '42', '29.5', '25.0'],
      ['XL', '44', '30.5', '25.5'],
      ['2XL', '46', '31.5', '26.0'],
    ],
    notes: 'Regular comfortable fit. If you prefer a relaxed fit, choose one size up.'
  },
  panjabi: {
    name: "Men's Panjabi & Kurta Size Guide",
    units: ['inch'],
    columns: ['Size', 'Chest (Inch)', 'Length (Inch)', 'Sleeve (Inch)'],
    rows: [
      ['S (38)', '38', '38', '24.0'],
      ['M (40)', '40', '40', '24.5'],
      ['L (42)', '42', '42', '25.0'],
      ['XL (44)', '44', '44', '25.5'],
      ['XXL (46)', '46', '46', '26.0'],
    ],
    notes: 'Traditional regular fit. All measurements are provided in inches.'
  },
  pants: {
    name: "Pants & Trousers Size Guide",
    units: ['inch'],
    columns: ['Size', 'Waist (Inch)', 'Hip (Inch)', 'Length (Inch)'],
    rows: [
      ['28', '28', '36', '38'],
      ['30', '30', '38', '39'],
      ['32', '32', '40', '40'],
      ['34', '34', '42', '40'],
      ['36', '36', '44', '41'],
    ],
    notes: 'Standard waist fit. Measure your natural waistline for best accuracy.'
  },
  kurti: {
    name: "Women's Kurti & Ethnic Size Guide",
    units: ['inch'],
    columns: ['Size', 'Bust (Inch)', 'Waist (Inch)', 'Length (Inch)'],
    rows: [
      ['S (36)', '36', '32', '42'],
      ['M (38)', '38', '34', '44'],
      ['L (40)', '40', '36', '44'],
      ['XL (42)', '42', '38', '46'],
      ['2XL (44)', '44', '40', '46'],
    ],
    notes: 'Measurements reflect finished garment dimensions in inches.'
  }
};

export default function SizeGuideModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = ''
}: SizeGuideModalProps) {
  const queryClient = useQueryClient();

  const [guideName, setGuideName] = useState(initialName || FOUR_COLUMN_PRESETS.sweatshirt_shirt.name);
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['inch']);
  
  // 4 Column Headers
  const [columns, setColumns] = useState<string[]>([...FOUR_COLUMN_PRESETS.sweatshirt_shirt.columns]);
  
  // Multiple Rows: array of 4-element string arrays
  const [rows, setRows] = useState<string[][]>(
    FOUR_COLUMN_PRESETS.sweatshirt_shirt.rows.map(r => [...r])
  );
  
  const [notes, setNotes] = useState(FOUR_COLUMN_PRESETS.sweatshirt_shirt.notes);
  const [showPreview, setShowPreview] = useState(true);

  // Apply a 4-column preset
  const handleApplyPreset = (presetKey: keyof typeof FOUR_COLUMN_PRESETS) => {
    const p = FOUR_COLUMN_PRESETS[presetKey];
    setGuideName(p.name);
    setSelectedUnits([...p.units]);
    setColumns([...p.columns]);
    setRows(p.rows.map(r => [...r]));
    setNotes(p.notes);
    toast.success(`Loaded "${p.name}" (4 Columns)`);
  };

  // Add row
  const handleAddRow = () => {
    setRows(prev => [...prev, ['', '', '', '']]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      toast.error('Table must have at least one size row');
      return;
    }
    setRows(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update cell value
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setRows(prev => {
      const updated = prev.map((r, rIdx) => {
        if (rIdx === rowIndex) {
          const newRow = [...r];
          newRow[colIndex] = value;
          return newRow;
        }
        return r;
      });
      return updated;
    });
  };

  // Update column header
  const handleColumnChange = (colIndex: number, value: string) => {
    setColumns(prev => {
      const updated = [...prev];
      updated[colIndex] = value;
      return updated;
    });
  };

  // Compile visual table to clean HTML table
  const compileHtmlTable = (): string => {
    const ths = columns.map(c => `<th>${c || 'Spec'}</th>`).join('');
    const trs = rows.map(r => {
      const tds = r.map((cell, idx) => `<td class="${idx === 0 ? 'font-bold' : ''}">${cell || '-'}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    let html = `<div class="overflow-x-auto my-3"><table class="w-full text-center border-collapse"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
    if (notes.trim()) {
      html += `<p class="text-xs text-muted-foreground mt-3 font-medium">${notes.trim()}</p>`;
    }
    return html;
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        return await api.sizeGuides.create(payload);
      } catch (err) {
        // Fallback to public endpoint
        return await api.post('/size-guides', payload);
      }
    },
    onSuccess: (res: any) => {
      toast.success('Size Guide created successfully!');
      DataCache.invalidate('/size-guides');
      const newGuide = res?.data?.data || res?.data || res;
      const newId = newGuide?.id || res?.id;
      if (newId) {
        queryClient.setQueryData(['admin-size-guides-select'], (old: any) => {
          const list = Array.isArray(old) ? [...old] : [];
          if (!list.some(g => Number(g.id) === Number(newId))) {
            list.push({ id: Number(newId), name: guideName });
          }
          return list;
        });
        onSuccess(Number(newId), guideName);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides-select'] });
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to create size guide');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guideName.trim()) {
      toast.error('Please enter a guide name');
      return;
    }

    if (rows.length === 0 || rows.every(r => r.every(c => !c.trim()))) {
      toast.error('Please enter at least one row of measurements');
      return;
    }

    const compiledContent = compileHtmlTable();
    createMutation.mutate({
      name: guideName.trim(),
      units: selectedUnits,
      content: compiledContent
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-3xl bg-background border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary neu-inset">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <span>Create Size Guide</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  4 Columns & Multiple Rows
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Visual measurement table builder — no HTML tags or code required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          <form id="sizeGuideTableForm" onSubmit={handleSubmit} className="space-y-5">
            {/* Guide Name & Units */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                  Guide Name *
                </label>
                <input
                  type="text"
                  required
                  value={guideName}
                  onChange={e => setGuideName(e.target.value)}
                  placeholder="e.g. Levi's Mens Sweatshirt Size Guide"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                  Units
                </label>
                <div className="flex items-center gap-3 pt-2">
                  {['inch', 'cm'].map((unit) => (
                    <label key={unit} className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(unit)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUnits(prev => [...prev, unit]);
                          } else {
                            setSelectedUnits(prev => prev.filter(u => u !== unit));
                          }
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="capitalize">{unit}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick 1-Click 4-Column Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick 4-Column Templates:
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Click to fill 4 columns & rows</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('sweatshirt_shirt')}
                  className="px-3 py-2 text-xs font-bold rounded-xl neu-btn text-foreground hover:text-primary transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>👕</span>
                  <span className="truncate">Sweatshirt / Shirt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('panjabi')}
                  className="px-3 py-2 text-xs font-bold rounded-xl neu-btn text-foreground hover:text-primary transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🧥</span>
                  <span className="truncate">Panjabi / Kurta</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('pants')}
                  className="px-3 py-2 text-xs font-bold rounded-xl neu-btn text-foreground hover:text-primary transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>👖</span>
                  <span className="truncate">Pants / Trousers</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('kurti')}
                  className="px-3 py-2 text-xs font-bold rounded-xl neu-btn text-foreground hover:text-primary transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🥻</span>
                  <span className="truncate">Kurti / Ethnic</span>
                </button>
              </div>
            </div>

            {/* 4-Column Multiple-Row Table Builder */}
            <div className="space-y-3 p-4 rounded-2xl border border-border bg-muted/10 neu-flat">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-primary" />
                  <span>Size Table (4 Columns & Multiple Rows)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {rows.length} {rows.length === 1 ? 'Row' : 'Rows'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* The Grid Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-xs">
                <table className="w-full border-collapse text-xs">
                  {/* Table Header: 4 Column Names */}
                  <thead>
                    <tr className="bg-muted/60 border-b border-border">
                      <th className="p-2 text-left w-10 text-[10px] font-bold text-muted-foreground">#</th>
                      {columns.map((col, cIdx) => (
                        <th key={cIdx} className="p-2 text-center">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Col {cIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={col}
                              onChange={e => handleColumnChange(cIdx, e.target.value)}
                              placeholder={`Column ${cIdx + 1}`}
                              className="w-full text-center px-2 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground focus:ring-1 focus:ring-primary outline-none text-xs"
                            />
                          </div>
                        </th>
                      ))}
                      <th className="p-2 text-center w-12 text-[10px] font-bold text-muted-foreground">Del</th>
                    </tr>
                  </thead>

                  {/* Table Body: Multiple Rows */}
                  <tbody className="divide-y divide-border/60">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2 text-center text-[10px] font-mono text-muted-foreground">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2">
                            <input
                              type="text"
                              value={cell}
                              onChange={e => handleCellChange(rIdx, cIdx, e.target.value)}
                              placeholder={cIdx === 0 ? 'e.g. M' : 'e.g. 40'}
                              className={`w-full text-center px-2.5 py-1.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary text-xs ${
                                cIdx === 0 ? 'font-black text-primary' : 'font-medium text-foreground'
                              }`}
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(rIdx)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete this row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Table Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-primary hover:bg-primary/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add Another Size Row (e.g. 3XL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={13} />
                  <span>{showPreview ? 'Hide Storefront Preview' : 'Show Storefront Preview'}</span>
                </button>
              </div>
            </div>

            {/* Notes / Fit Advice */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                Fit & Measurement Advice (Optional Note)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Regular fit. All measurements in inches. If between sizes, choose one size up."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none text-xs sm:text-sm font-medium"
              />
            </div>

            {/* Live Storefront Table Preview */}
            {showPreview && (
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Storefront Customer Live Preview
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Units: {selectedUnits.join(' / ') || 'None'}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-xs">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/70 text-foreground font-black uppercase tracking-wider border-b border-border text-[11px]">
                        {columns.map((c, i) => (
                          <th key={i} className="py-2.5 px-3 first:text-left first:pl-4">
                            {c || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-muted/20 odd:bg-transparent even:bg-muted/10">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-2 px-3 first:text-left first:pl-4 ${
                                cIdx === 0 ? 'font-black text-primary' : 'font-medium text-foreground'
                              }`}
                            >
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {notes && (
                  <p className="text-[11px] text-muted-foreground font-medium pt-1">
                    📌 {notes}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="sizeGuideTableForm"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs shadow-md shadow-primary/20"
          >
            {createMutation.isPending ? 'Creating Guide...' : 'Create Guide'}
          </button>
        </div>
      </div>
    </div>
  );
}
