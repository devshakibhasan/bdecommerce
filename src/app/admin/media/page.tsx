'use client';
import { Image as ImageIcon, UploadCloud, Search, Loader2, Trash2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatImageUrl } from '@/utils/image';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['admin-media-library'],
    queryFn: async () => {
      const res: any = await api.get('/admin/media');
      return res.data || [];
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory', 'uploads');
      return api.post('/admin/media/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media-library'] });
      toast.success('File uploaded successfully!');
    },
    onError: () => toast.error('Failed to upload file')
  });

  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      return api.post('/admin/media/delete', { path });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media-library'] });
      setSelectedMedia(null);
      toast.success('File deleted successfully!');
    },
    onError: () => toast.error('Failed to delete file')
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = mediaFiles.filter((m: any) => 
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.product || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-primary" /> Media Library
        </h1>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="neu-btn-primary flex items-center gap-2 px-4 py-2">
            {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Upload Files
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search media files..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary" 
            />
          </div>
          <div className="text-xs font-bold text-slate-500 py-2">{filtered.length} files found</div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
               <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
               <p className="text-sm font-bold text-slate-500">Loading media library...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
               <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
               <p className="text-sm font-bold">No media files found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filtered.map((item: any, i: number) => (
                 <div key={item.id || i} className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer" onClick={() => setSelectedMedia(item)}>
                   <img src={formatImageUrl(item.url || item.path)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-white text-[9px] font-black truncate">{item.name}</p>
                      {item.product && <p className="text-white/70 text-[8px] truncate">{item.product}</p>}
                   </div>
                   {item.type === 'product_image' && item.is_primary && (
                     <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary text-white text-[8px] font-bold rounded">Primary</div>
                   )}
                 </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
          <div className="bg-white dark:bg-[#111622] rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-black">Media Details</h3>
              <button onClick={() => setSelectedMedia(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <img src={formatImageUrl(selectedMedia.url || selectedMedia.path)} className="w-full aspect-video object-contain bg-slate-50 dark:bg-slate-900 rounded-xl" />
            <div className="space-y-2 text-sm">
              <p><span className="font-bold">Name:</span> {selectedMedia.name}</p>
              {selectedMedia.product && <p><span className="font-bold">Product:</span> {selectedMedia.product}</p>}
              {selectedMedia.size && <p><span className="font-bold">Size:</span> {(selectedMedia.size / 1024).toFixed(1)} KB</p>}
              <p><span className="font-bold">Type:</span> {selectedMedia.type === 'product_image' ? 'Product Image' : 'Upload'}</p>
            </div>
            {selectedMedia.path && (
              <button 
                onClick={() => deleteMutation.mutate(selectedMedia.path)}
                disabled={deleteMutation.isPending}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> {deleteMutation.isPending ? 'Deleting...' : 'Delete File'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}