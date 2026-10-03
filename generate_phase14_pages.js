const fs = require('fs');
const path = require('path');

function createPage(route, title, apiEndpoint, columns, fields, formFields) {
    const dir = path.join('src/app/admin', route);
    fs.mkdirSync(dir, { recursive: true });
    
    let ths = columns.map(c => `<th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">${c}</th>`).join('\n                  ');
    let tds = fields.map(f => {
        if (f.type === 'bool') return `<td className="px-6 py-4 whitespace-nowrap"><span className={\`px-2 py-1 rounded text-xs \${item.${f.key} ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{item.${f.key} ? 'Active' : 'Inactive'}</span></td>`;
        if (f.type === 'badge') return `<td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">{item.${f.key}}</span></td>`;
        return `<td className="px-6 py-4 whitespace-nowrap text-foreground max-w-[200px] truncate">{item.${f.key} || '-'}</td>`;
    }).join('\n                  ');

    // Basic form builder
    let formInputs = formFields.map(f => {
        if (f.type === 'bool') {
            return `
        <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                checked={formData.${f.key} || false} 
                onChange={e => setFormData({...formData, ${f.key}: e.target.checked})}
            />
            <label className="text-sm font-medium">${f.label}</label>
        </div>`;
        }
        if (f.type === 'select') {
             return `
        <div>
            <label className="block text-sm font-medium mb-1">${f.label}</label>
            <select 
                className="w-full p-2 border rounded-md" 
                value={formData.${f.key} || ''} 
                onChange={e => setFormData({...formData, ${f.key}: e.target.value})}
                required={${f.required}}
            >
                <option value="">Select ${f.label}</option>
                ${f.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('\n')}
            </select>
        </div>`;
        }
        return `
        <div>
            <label className="block text-sm font-medium mb-1">${f.label}</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={formData.${f.key} || ''} 
                onChange={e => setFormData({...formData, ${f.key}: e.target.value})}
                required={${f.required}}
            />
        </div>`;
    }).join('\n');

    let content = `'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ${title.replace(/[\s\&\/]/g, '')}Page() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-${route.replace(/\//g, '-')}'],
    queryFn: async () => {
      const res: any = await api.get('/admin/${apiEndpoint}');
      return res.data?.data || res.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post('/admin/${apiEndpoint}', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('${title} created!');
      queryClient.invalidateQueries({ queryKey: ['admin-${route.replace(/\//g, '-')}'] });
      setShowModal(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(\`/admin/${apiEndpoint}/\${id}\`);
    },
    onSuccess: () => {
      toast.success('Deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-${route.replace(/\//g, '-')}'] });
    }
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">${title}</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="neu-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50 border-b">
            <tr>
              ${ths}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  ${tds}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => { if(confirm('Are you sure?')) deleteMutation.mutate(item.id) }} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b"><h2 className="font-semibold">Add New ${title}</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              ${formInputs}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="neu-btn-primary">{createMutation.isPending ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf-8');
}

// 1. Cart Rules
createPage(
    'marketing/cart-rules', 'Cart Rules & BOGO', 'marketing/cart-rules', 
    ['Rule Title', 'Type', 'Conditions (JSON)', 'Status'],
    [{key: 'title', type: 'text'}, {key: 'rule_type', type: 'badge'}, {key: 'conditions_json', type: 'text'}, {key: 'is_active', type: 'bool'}],
    [
        {key: 'title', label: 'Rule Title (e.g. Buy 2 Get 1)', type: 'text', required: true},
        {key: 'rule_type', label: 'Rule Type', type: 'select', required: true, options: [{value: 'bogo', label: 'BOGO (Buy X Get Y)'}, {value: 'bulk_discount', label: 'Bulk Discount'}, {value: 'category_discount', label: 'Category Discount'}]},
        {key: 'conditions_json', label: 'Conditions JSON (e.g. {"buy":2,"get":1})', type: 'text', required: false},
        {key: 'discount_amount', label: 'Discount Value', type: 'text', required: false},
        {key: 'discount_type', label: 'Discount Type', type: 'select', required: false, options: [{value: 'percentage', label: 'Percentage (%)'}, {value: 'free_item', label: 'Free Item'}]},
        {key: 'is_active', label: 'Enable Rule', type: 'bool', required: false}
    ]
);

// 2. OAuth
createPage(
    'settings/oauth', 'Social Login (OAuth)', 'settings/oauth', 
    ['Provider', 'Client ID', 'Redirect URL', 'Status'],
    [{key: 'provider', type: 'badge'}, {key: 'client_id', type: 'text'}, {key: 'redirect_url', type: 'text'}, {key: 'is_active', type: 'bool'}],
    [
        {key: 'provider', label: 'Provider', type: 'select', required: true, options: [{value: 'google', label: 'Google'}, {value: 'facebook', label: 'Facebook'}, {value: 'apple', label: 'Apple'}]},
        {key: 'client_id', label: 'Client ID', type: 'text', required: false},
        {key: 'client_secret', label: 'Client Secret', type: 'text', required: false},
        {key: 'redirect_url', label: 'Redirect/Callback URL', type: 'text', required: false},
        {key: 'is_active', label: 'Enable Login Method', type: 'bool', required: false}
    ]
);

console.log('Phase 14 Pages scaffolded successfully.');
