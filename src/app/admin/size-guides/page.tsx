'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Search, Loader2, Sparkles, Table as TableIcon, AlignLeft, CheckCircle2, Ruler } from 'lucide-react';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Sizing presets for clothing (Standard 4 Columns & Multiple Rows)
const PRESETS = {
  shirt: {
    name: "Shirt / Sweatshirt Size Guide",
    units: ['inch'],
    columns: ['Size', 'Chest', 'Length', 'Sleeve'],
    rows: [
      ['S', '38', '27.5', '24.0'],
      ['M', '40', '28.5', '24.5'],
      ['L', '42', '29.5', '25.0'],
      ['XL', '44', '30.5', '25.5'],
      ['2XL', '46', '31.5', '26.0']
    ],
    notes: 'Regular comfortable fit. If you prefer a relaxed fit, choose one size up.'
  },
  panjabi: {
    name: "Men's Panjabi & Kurta Size Guide",
    units: ['inch'],
    columns: ['Size', 'Chest', 'Length', 'Sleeve'],
    rows: [
      ['S (38)', '38', '38', '24.0'],
      ['M (40)', '40', '40', '24.5'],
      ['L (42)', '42', '42', '25.0'],
      ['XL (44)', '44', '44', '25.5'],
      ['XXL (46)', '46', '46', '26.0']
    ],
    notes: 'All measurements are provided in inches. Regular traditional fit.'
  },
  women_kurti: {
    name: "Women's Ethnic & Kurti Size Guide",
    units: ['inch'],
    columns: ['Size', 'Bust', 'Waist', 'Length'],
    rows: [
      ['36 (S)', '36', '32', '42'],
      ['38 (M)', '38', '34', '44'],
      ['40 (L)', '40', '36', '44'],
      ['42 (XL)', '42', '38', '46'],
      ['44 (2XL)', '44', '40', '46']
    ],
    notes: 'Measurements reflect finished garment dimensions in inches.'
  },
  pants: {
    name: "Pants & Trousers Size Guide",
    units: ['inch'],
    columns: ['Size', 'Waist', 'Hip', 'Length'],
    rows: [
      ['28', '28', '36', '38'],
      ['30', '30', '38', '39'],
      ['32', '32', '40', '40'],
      ['34', '34', '42', '40'],
      ['36', '36', '44', '41']
    ],
    notes: 'Standard waist fit. Measure your natural waistline for best accuracy.'
  }
};

export default function AdminSizeGuidesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<any>(null);

  // Form Basic Info
  const [guideName, setGuideName] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['inch']);
  const [inputMode, setInputMode] = useState<'visual' | 'direct'>('visual');

  // Visual Table Builder State (Standard 4 Columns & Multiple Rows)
  const [tableColumns, setTableColumns] = useState<string[]>(['Size', 'Chest', 'Length', 'Sleeve']);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['S', '38', '27.5', '24.0'],
    ['M', '40', '28.5', '24.5'],
    ['L', '42', '29.5', '25.0'],
    ['XL', '44', '30.5', '25.5'],
    ['2XL', '46', '31.5', '26.0']
  ]);
  const [tableNotes, setTableNotes] = useState('All measurements are in inches. Regular fit.');

  // Direct Text Mode State (Zero HTML required)
  const [directText, setDirectText] = useState('');

  // Fetch Size Guides
  const { data: sizeGuides = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-size-guides'],
    queryFn: async () => {
      try {
        const res: any = await api.sizeGuides.list();
        return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch (err) {
        return [];
      }
    }
  });

  const filteredGuides = sizeGuides.filter(g => 
    (g.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => await api.sizeGuides.create(payload),
    onSuccess: () => {
      toast.success('Size Guide created successfully!');
      closeModal();
      DataCache.invalidate('/size-guides');
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides-select'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to create size guide')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => await api.sizeGuides.update(id, payload),
    onSuccess: () => {
      toast.success('Size Guide updated successfully!');
      closeModal();
      DataCache.invalidate('/size-guides');
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides-select'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to update size guide')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.sizeGuides.delete(id),
    onSuccess: () => {
      toast.success('Size Guide deleted successfully');
      DataCache.invalidate('/size-guides');
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-size-guides-select'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to delete size guide')
  });

  // Table manipulation helpers
  const handleLoadPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    setGuideName(p.name);
    setSelectedUnits(p.units);
    setTableColumns([...p.columns]);
    setTableRows(p.rows.map(r => [...r]));
    setTableNotes(p.notes);
    setInputMode('visual');
    toast.success(`Loaded ${p.name} template!`);
  };

  const handleAddRow = () => {
    setTableRows([...tableRows, new Array(tableColumns.length).fill('')]);
  };

  const handleRemoveRow = (index: number) => {
    if (tableRows.length <= 1) {
      toast.error('Table must have at least one size row');
      return;
    }
    setTableRows(tableRows.filter((_, i) => i !== index));
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const updated = [...tableRows];
    updated[rowIndex] = [...updated[rowIndex]];
    updated[rowIndex][colIndex] = value;
    setTableRows(updated);
  };

  const handleAddColumn = () => {
    const colName = prompt('Enter new column name (e.g. Waist, Inseam, Hip):');
    if (!colName || !colName.trim()) return;
    setTableColumns([...tableColumns, colName.trim()]);
    setTableRows(tableRows.map(row => [...row, '']));
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (tableColumns.length <= 2) {
      toast.error('Table must have at least 2 columns');
      return;
    }
    setTableColumns(tableColumns.filter((_, i) => i !== colIndex));
    setTableRows(tableRows.map(row => row.filter((_, i) => i !== colIndex)));
  };

  // Compile final content from visual builder
  const compileFinalContent = (): string => {
    if (inputMode === 'direct') {
      return directText.trim();
    }

    // Visual builder -> clean, responsive HTML table
    const tableHeader = tableColumns.map(c => `<th>${c}</th>`).join('');
    const tableBody = tableRows.map(row => {
      const cells = row.map((cell, idx) => `<td class="${idx === 0 ? 'font-bold' : ''}">${cell || '-'}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    let html = `<div class="overflow-x-auto my-3"><table class="w-full text-center border-collapse"><thead><tr>${tableHeader}</tr></thead><tbody>${tableBody}</tbody></table></div>`;
    if (tableNotes.trim()) {
      html += `<p class="text-xs text-muted-foreground mt-3 font-medium">${tableNotes.trim()}</p>`;
    }
    return html;
  };

  // Modal Open/Close Handlers
  const openCreateModal = () => {
    setEditingGuide(null);
    setGuideName('');
    setSelectedUnits(['inch']);
    setInputMode('visual');
    handleLoadPreset('shirt');
    setIsModalOpen(true);
  };

  const openEditModal = (guide: any) => {
    setEditingGuide(guide);
    setGuideName(guide.name || '');
    setSelectedUnits(guide.units || ['inch']);
    
    const content = guide.content || '';
    setDirectText(content);

    if (content.includes('<table') || content.includes('<tr')) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const ths = Array.from(doc.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        const trs = Array.from(doc.querySelectorAll('tbody tr'));
        const rows = trs.map(tr => 
          Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
        );

        const notesP = doc.querySelector('p');
        const notes = notesP ? (notesP.textContent?.trim() || '') : '';

        if (ths.length > 0 && rows.length > 0) {
          setTableColumns(ths);
          setTableRows(rows);
          if (notes) setTableNotes(notes);
          setInputMode('visual');
        } else {
          setInputMode('direct');
        }
      } catch (e) {
        setInputMode('direct');
      }
    } else {
      setInputMode('direct');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = compileFinalContent();

    if (!guideName.trim()) {
      toast.error('Guide name is required');
      return;
    }

    if (!finalContent.trim()) {
      toast.error('Please enter size guide measurements or content');
      return;
    }

    const payload = {
      name: guideName.trim(),
      units: selectedUnits,
      content: finalContent
    };

    if (editingGuide) {
      updateMutation.mutate({ id: editingGuide.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete size guide "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Ruler className="w-7 h-7 text-primary" />
            <span>Size Guides</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage reusable clothing size charts and measurement guidelines</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20 text-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>Create Size Guide</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111622] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search size guides by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a2133] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-semibold"
          />
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {filteredGuides.length} Guides Available
        </span>
      </div>

      {/* Table List */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1a2133] border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Guide Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Units</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading Size Guides...
                  </td>
                </tr>
              ) : filteredGuides.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <p className="font-bold text-base text-slate-700 dark:text-slate-300">No size guides found</p>
                    <p className="text-xs mt-1">Click "Create Size Guide" to add your first clothing chart.</p>
                  </td>
                </tr>
              ) : (
                filteredGuides.map((guide: any) => (
                  <tr key={guide.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-[#161d2a] transition-colors">
                    <td className="py-4 px-6 text-sm font-mono text-slate-500">#{guide.id}</td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-900 dark:text-white">{guide.name}</td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400">
                      {Array.isArray(guide.units) && guide.units.length > 0 ? (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 uppercase">
                          {guide.units.join(' / ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">Standard</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(guide)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(guide.id, guide.name)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative bg-white dark:bg-[#111622] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {editingGuide ? 'Edit Size Guide' : 'Create Size Guide'}
                    </h3>
                    <p className="text-xs text-muted-foreground">Direct content & interactive measurement builder (No HTML code needed)</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                <form id="sizeGuideForm" onSubmit={handleSubmit} className="space-y-6">
                  {/* Guide Name */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Guide Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={guideName}
                      onChange={e => setGuideName(e.target.value)}
                      placeholder="e.g. Men's Panjabi Size Guide"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a2133] focus:ring-2 focus:ring-primary/50 outline-none text-sm font-semibold"
                    />
                  </div>

                  {/* Available Units */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Available Units
                    </label>
                    <div className="flex items-center gap-6">
                      {['inch', 'cm', 'foot'].map((unit) => (
                        <label key={unit} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={selectedUnits.includes(unit)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUnits([...selectedUnits, unit]);
                              } else {
                                setSelectedUnits(selectedUnits.filter(u => u !== unit));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="capitalize">{unit}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Input Mode Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Measurements & Guide Content *
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setInputMode('visual')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            inputMode === 'visual'
                              ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          <TableIcon className="w-3.5 h-3.5" />
                          <span>Visual Table Builder</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputMode('direct')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            inputMode === 'direct'
                              ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                          <span>Direct Text Notes</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode 1: Visual Table Builder */}
                    {inputMode === 'visual' ? (
                      <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                        {/* Quick Presets */}
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-2">
                            Quick Clothing Presets:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadPreset('panjabi')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" /> Panjabi / Kurta
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadPreset('shirt')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-blue-500" /> Shirt / T-Shirt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadPreset('women_kurti')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-rose-500" /> Women's Kurti
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadPreset('pants')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-500" /> Pants / Bottoms
                            </button>
                          </div>
                        </div>

                        {/* Interactive Table Matrix */}
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111622]">
                          <table className="w-full text-center border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                                {tableColumns.map((col, colIdx) => (
                                  <th key={colIdx} className="py-2.5 px-3 text-xs font-black text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center justify-center gap-1">
                                      <span>{col}</span>
                                      {colIdx > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveColumn(colIdx)}
                                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                                          title="Remove column"
                                        >
                                          <X size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </th>
                                ))}
                                <th className="py-2.5 px-3 text-xs font-bold text-slate-400 w-12">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableRows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50">
                                  {row.map((cell, colIdx) => (
                                    <td key={colIdx} className="p-2">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                                        placeholder={colIdx === 0 ? 'Size' : '0.0'}
                                        className={`w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-xs outline-none focus:ring-1 focus:ring-primary ${
                                          colIdx === 0 ? 'font-black bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-[#111622]'
                                        }`}
                                      />
                                    </td>
                                  ))}
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveRow(rowIdx)}
                                      className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                      title="Remove row"
                                    >
                                      <X size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Table Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={14} /> Add Size Row
                          </button>
                          <button
                            type="button"
                            onClick={handleAddColumn}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={14} /> Add Measurement Column
                          </button>
                        </div>

                        {/* Fitting Notes Box */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Fitting Advice / Notes for Customers (Optional)
                          </label>
                          <input
                            type="text"
                            value={tableNotes}
                            onChange={(e) => setTableNotes(e.target.value)}
                            placeholder="e.g. Regular fit. For a looser feel, order one size up."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Mode 2: Direct Text Mode (No HTML required) */
                      <div className="space-y-2">
                        <textarea
                          required
                          rows={8}
                          value={directText}
                          onChange={e => setDirectText(e.target.value)}
                          placeholder={"Size S: Chest 38 inch, Length 28 inch\nSize M: Chest 40 inch, Length 29 inch\nSize L: Chest 42 inch, Length 30 inch\nSize XL: Chest 44 inch, Length 31 inch\n\nNotes: Regular tailored fit. Measure across the fullest part of the chest."}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a2133] focus:ring-2 focus:ring-primary/50 outline-none text-xs font-medium leading-relaxed"
                        ></textarea>
                        <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Direct plain text mode. Line breaks and measurements are automatically preserved on the storefront.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#161d2a] rounded-b-3xl flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="sizeGuideForm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 rounded-xl font-black bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={16} className="animate-spin" />}
                  {editingGuide ? 'Save Changes' : 'Create Guide'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
