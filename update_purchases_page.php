<?php
$file = 'src/app/admin/purchases/page.tsx';
$content = file_get_contents($file);

$imports = <<<JS
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Building2, ShoppingBag, Plus, ArrowRight, FileText, CheckCircle2, User, PackagePlus, Loader2
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';
import { Modal } from '@/components/admin/Modal';
import Link from 'next/link';

JS;

$content = preg_replace('/import \{ useState \}.*?toast from \'react-hot-toast\';/s', $imports, $content);

$modalState = <<<JS
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });

  const createSupplier = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/purchases/suppliers', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Supplier added!');
      setIsSupplierModalOpen(false);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create supplier');
    }
  });

JS;

$content = str_replace("const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');", $modalState, $content);

$addSupplierBtn = <<<JS
<button onClick={() => setIsSupplierModalOpen(true)} className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Supplier
            </button>
JS;

$content = preg_replace('/<button className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 opacity-50 cursor-not-allowed">\s*<Plus className="w-3 h-3" \/> Add Supplier \(WIP\)\s*<\/button>/', $addSupplierBtn, $content);

$newPoBtn = <<<JS
<Link href="/admin/purchases/create" className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" /> New PO
            </Link>
JS;

$content = preg_replace('/<button className="neu-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 opacity-50 cursor-not-allowed">\s*<Plus className="w-3 h-3" \/> New PO \(WIP\)\s*<\/button>/', $newPoBtn, $content);

$modalJSX = <<<JS
{/* Supplier Modal */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add New Supplier">
        <form onSubmit={(e) => { e.preventDefault(); createSupplier.mutate(supplierForm); }} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Supplier Name *</label>
            <input required type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Person</label>
            <input type="text" value={supplierForm.contact_person} onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</label>
              <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Address</label>
            <textarea value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[80px]" />
          </div>
          <button disabled={createSupplier.isPending} type="submit" className="w-full neu-btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            {createSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Supplier'}
          </button>
        </form>
      </Modal>
    </div>
JS;

$content = str_replace('</div>', $modalJSX, substr($content, 0, strrpos($content, '</div>')));
file_put_contents($file, $content . "\n</div>\n");
echo "Updated page.tsx\n";
