'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Trash2, Edit, Check, X, ArrowUp, ArrowDown, 
  Sparkles, Sliders, ExternalLink, AlertCircle, RefreshCw,
  ShoppingBag, CheckCircle2, XCircle, Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface SliderItem {
  id: number;
  badge_en: string;
  badge_bn: string;
  title_en: string;
  title_bn: string;
  subtitle_en: string;
  subtitle_bn: string;
  button_text_en: string;
  button_text_bn: string;
  button_link: string;
  bg_image: string;
  theme_color: string;
  accent_gradient: string;
  position: number;
  is_active: boolean;
}

const PRESET_IMAGES = [
  { name: 'Traditional Handloom & Festive', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85' },
  { name: 'Electronics & Gadgets', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=85' },
  { name: 'Organic & Food Essentials', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1600&q=85' },
  { name: 'Fashion & Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=85' },
  { name: 'Home & Modern Lifestyle', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85' },
];

const PRESET_THEMES = [
  { label: 'Amber / Gold (Festive)', theme: 'text-amber-300 border-amber-500/30 bg-amber-500/20', gradient: 'from-amber-500 to-amber-600 shadow-amber-500/30' },
  { label: 'Royal Blue (Gadgets)', theme: 'text-blue-300 border-blue-500/30 bg-blue-500/20', gradient: 'from-blue-600 to-indigo-600 shadow-blue-500/30' },
  { label: 'Emerald Green (Organic)', theme: 'text-primary/40 border-primary/30 bg-primary/20', gradient: 'from-primary to-green-600 shadow-primary/30' },
  { label: 'Rose Pink (Offers / MFS)', theme: 'text-pink-300 border-pink-500/30 bg-pink-500/20', gradient: 'from-pink-600 to-rose-600 shadow-pink-500/30' },
  { label: 'Purple Violet (Flash)', theme: 'text-purple-300 border-purple-500/30 bg-purple-500/20', gradient: 'from-purple-600 to-violet-600 shadow-purple-500/30' },
];

export default function AdminSlidersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    badge_en: '',
    badge_bn: '',
    title_en: '',
    title_bn: '',
    subtitle_en: '',
    subtitle_bn: '',
    button_text_en: 'Explore Collection',
    button_text_bn: 'পণ্য দেখুন',
    button_link: '/products',
    bg_image: PRESET_IMAGES[0].url,
    theme_color: PRESET_THEMES[0].theme,
    accent_gradient: PRESET_THEMES[0].gradient,
    position: 0,
    is_active: true,
  });

  // Query: Fetch sliders
  const { data: sliders = [], isLoading, refetch } = useQuery<SliderItem[]>({
    queryKey: ['admin-sliders-list'],
    queryFn: async () => {
      const res: any = await api.get('/admin/sliders');
      return res?.data || res?.items || (Array.isArray(res) ? res : []);
    },
  });

  // Mutation: Create slider
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      return await api.post('/admin/sliders', payload);
    },
    onSuccess: () => {
      toast.success('Slider created successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-sliders-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create slider');
    },
  });

  // Mutation: Update slider
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: typeof formData }) => {
      return await api.put('/admin/sliders/' + id, payload);
    },
    onSuccess: () => {
      toast.success('Slider updated successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-sliders-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update slider');
    },
  });

  // Mutation: Delete slider
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete('/admin/sliders/' + id);
    },
    onSuccess: () => {
      toast.success('Slider deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-sliders-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete slider');
    },
  });

  // Mutation: Toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.put('/admin/sliders/' + id + '/toggle-status', {});
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Slider status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-sliders-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to toggle status');
    },
  });

  // Mutation: Reorder
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      return await api.post('/admin/sliders/reorder', { ids: orderedIds });
    },
    onSuccess: () => {
      toast.success('Sliders reordered successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-sliders-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reorder sliders');
    },
  });

  const openCreateModal = () => {
    setEditingSlider(null);
    setFormData({
      badge_en: '',
      badge_bn: '',
      title_en: '',
      title_bn: '',
      subtitle_en: '',
      subtitle_bn: '',
      button_text_en: 'Shop Now',
      button_text_bn: 'অর্ডার করুন',
      button_link: '/products',
      bg_image: PRESET_IMAGES[0].url,
      theme_color: PRESET_THEMES[0].theme,
      accent_gradient: PRESET_THEMES[0].gradient,
      position: sliders.length,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slider: SliderItem) => {
    setEditingSlider(slider);
    setFormData({
      badge_en: slider.badge_en || '',
      badge_bn: slider.badge_bn || '',
      title_en: slider.title_en || '',
      title_bn: slider.title_bn || '',
      subtitle_en: slider.subtitle_en || '',
      subtitle_bn: slider.subtitle_bn || '',
      button_text_en: slider.button_text_en || 'Shop Now',
      button_text_bn: slider.button_text_bn || 'অর্ডার করুন',
      button_link: slider.button_link || '/products',
      bg_image: slider.bg_image || PRESET_IMAGES[0].url,
      theme_color: slider.theme_color || PRESET_THEMES[0].theme,
      accent_gradient: slider.accent_gradient || PRESET_THEMES[0].gradient,
      position: slider.position,
      is_active: slider.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlider(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_en || !formData.title_bn) {
      toast.error('Both English and Bengali titles are required');
      return;
    }

    if (editingSlider) {
      updateMutation.mutate({ id: editingSlider.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const moveSlider = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sliders.length) return;

    const newSliders = [...sliders];
    const [moved] = newSliders.splice(index, 1);
    newSliders.splice(targetIndex, 0, moved);

    const orderedIds = newSliders.map((s) => s.id);
    reorderMutation.mutate(orderedIds);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#111622] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Hero Sliders Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control storefront homepage hero banners, promotional texts, buttons, and ordering.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Slider</span>
          </button>
        </div>
      </div>

      {/* Sliders List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading storefront sliders...</p>
        </div>
      ) : sliders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Sliders className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Sliders Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first promotional hero slider to showcase products and offers on the homepage.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Slider</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sliders.map((slider, idx) => (
            <div
              key={slider.id}
              className="bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
            >
              {/* Thumbnail and Details */}
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                {/* Position / Reorder controls */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveSlider(idx, 'up')}
                    disabled={idx === 0 || reorderMutation.isPending}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-black text-slate-400">
                    #{idx + 1}
                  </span>
                  <button
                    onClick={() => moveSlider(idx, 'down')}
                    disabled={idx === sliders.length - 1 || reorderMutation.isPending}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Banner Thumbnail */}
                <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <img
                    src={slider.bg_image}
                    alt={slider.title_en}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className={`absolute bottom-1.5 left-1.5 text-[9px] font-black px-2 py-0.5 rounded-md ${slider.is_active ? 'bg-primary text-white' : 'bg-rose-500 text-white'}`}>
                    {slider.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                {/* Content Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {slider.badge_en && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {slider.badge_en}
                      </span>
                    )}
                    {slider.badge_bn && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/10/40 text-primary dark:text-primary border border-primary/30/50">
                        {slider.badge_bn}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {slider.title_en}
                  </h3>
                  <p className="text-xs text-primary dark:text-primary font-semibold truncate">
                    {slider.title_bn}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {slider.subtitle_en}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="font-medium">Link: <code className="text-primary font-mono">{slider.button_link}</code></span>
                    <span>•</span>
                    <span className="font-medium">Btn: <b>{slider.button_text_en}</b></span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end lg:self-center">
                <button
                  onClick={() => toggleStatusMutation.mutate(slider.id)}
                  disabled={toggleStatusMutation.isPending}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    slider.is_active 
                      ? 'bg-primary/10 dark:bg-primary/10/40 text-primary border-primary/30 hover:bg-primary/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {slider.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{slider.is_active ? 'Active' : 'Inactive'}</span>
                </button>

                <button
                  onClick={() => openEditModal(slider)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Edit Slider"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete slider "' + slider.title_en + '"?')) {
                      deleteMutation.mutate(slider.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 transition-colors cursor-pointer"
                  title="Delete Slider"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          className="fixed inset-0 z-50 neu-backdrop flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in fade-in zoom-in-95 cursor-default"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 neu-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-card-inset text-primary flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {editingSlider ? 'Edit Slider' : 'Create New Hero Slider'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Storefront slider will render dynamically on the homepage.
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="neu-close-btn"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Live Hero Slide Preview</span>
              </label>
              <div 
                className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-950 p-6 flex flex-col justify-end text-white border border-slate-300 dark:border-slate-700 shadow-inner"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all opacity-70"
                  style={{ backgroundImage: 'url(' + formData.bg_image + ')' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/40" />

                <div className="relative z-10 space-y-2">
                  <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border ${formData.theme_color}`}>
                    {formData.badge_en || 'PROMOTIONAL BADGE'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                    {formData.title_en || 'Enter Headline Title in English'}
                  </h2>
                  <p className="text-xs text-slate-200 line-clamp-1 max-w-lg">
                    {formData.subtitle_en || 'Enter descriptive promotional subtitle for customers.'}
                  </p>
                  <div className="pt-1">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-gradient-to-r ${formData.accent_gradient} text-white shadow-md`}>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{formData.button_text_en || 'Shop Now'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Badge Pill (English)
                  </label>
                  <input
                    type="text"
                    value={formData.badge_en}
                    onChange={(e) => setFormData({ ...formData, badge_en: e.target.value })}
                    placeholder="e.g. Grand Eid Mega Shopping Festival"
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Badge Pill (Bengali)
                  </label>
                  <input
                    type="text"
                    value={formData.badge_bn}
                    onChange={(e) => setFormData({ ...formData, badge_bn: e.target.value })}
                    placeholder="যেমন: গ্র্যান্ড ঈদ মেগা শপিং ফেস্টিভ্যাল"
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-medium"
                  />
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Main Headline Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="e.g. Authentic Bangladeshi Handlooms & Festive Wear"
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Main Headline Title (Bengali) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_bn}
                    onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                    placeholder="যেমন: ঐতিহ্যবাহী ঢাকাই জামদানি ও প্রিমিয়াম পাঞ্জাবি"
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-bold"
                  />
                </div>
              </div>

              {/* Subtitles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Subtitle (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.subtitle_en}
                    onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                    placeholder="e.g. Tangail Handloom Jamdani Sarees at up to 50% off with Doorstep COD."
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-medium resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Subtitle (Bengali)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.subtitle_bn}
                    onChange={(e) => setFormData({ ...formData, subtitle_bn: e.target.value })}
                    placeholder="যেমন: খাঁটি হাতে বোনা জামদানি শাড়ি ৫০% পর্যন্ত ছাড়ে সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে।"
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-medium resize-none"
                  />
                </div>
              </div>

              {/* Button Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Button Text (English)
                  </label>
                  <input
                    type="text"
                    value={formData.button_text_en}
                    onChange={(e) => setFormData({ ...formData, button_text_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Button Text (Bengali)
                  </label>
                  <input
                    type="text"
                    value={formData.button_text_bn}
                    onChange={(e) => setFormData({ ...formData, button_text_bn: e.target.value })}
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Target URL / Route Link
                  </label>
                  <input
                    type="text"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    className="w-full px-3.5 py-2.5 neu-input text-xs font-medium font-mono"
                  />
                </div>
              </div>

              {/* Background Image URL & Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Background Banner Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.bg_image}
                  onChange={(e) => setFormData({ ...formData, bg_image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 neu-input text-xs font-mono"
                />
                
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1.5">Or Choose Quick Preset:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setFormData({ ...formData, bg_image: preset.url })}
                        className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                          formData.bg_image === preset.url
                            ? 'neu-tile-active'
                            : 'neu-tile-inactive'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Theme Color & Accent Preset */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Theme Palette & Button Gradient
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PRESET_THEMES.map((theme) => {
                    const isSelected = formData.theme_color === theme.theme;
                    return (
                      <button
                        type="button"
                        key={theme.label}
                        onClick={() => setFormData({ ...formData, theme_color: theme.theme, accent_gradient: theme.gradient })}
                        className={`p-2.5 rounded-2xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'neu-card-inset ring-2 ring-primary/40' 
                            : 'neu-btn hover:border-primary/40'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${theme.gradient} flex-shrink-0 shadow-sm`} />
                        <span className="text-xs font-bold text-foreground truncate">
                          {theme.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status and Position */}
              <div className="neu-card-inset p-3 rounded-2xl flex items-center gap-2 cursor-pointer">
                <input
                  id="slider_active_checkbox"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="slider_active_checkbox" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  Publish immediately (Active)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 neu-modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-black shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{editingSlider ? 'Update Slider' : 'Create Slider'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
