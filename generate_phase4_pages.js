const fs = require('fs');
const path = require('path');

function createPage(route, title, apiEndpoint, columns, fields, formFields) {
    const dir = path.join('src/app/admin', route);
    fs.mkdirSync(dir, { recursive: true });
    
    let ths = columns.map(c => `<th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">${c}</th>`).join('\n                  ');
    let tds = fields.map(f => {
        if (f.type === 'date') return `<td className="px-6 py-4 whitespace-nowrap">{new Date(item.${f.key}).toLocaleDateString()}</td>`;
        if (f.type === 'status') return `<td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">{item.${f.key}}</span></td>`;
        if (f.type === 'bool') return `<td className="px-6 py-4 whitespace-nowrap">{item.${f.key} ? 'Active' : 'Inactive'}</td>`;
        if (f.type === 'currency') return `<td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">৳ {Number(item.${f.key}).toFixed(2)}</td>`;
        if (f.type === 'badge') return `<td className="px-6 py-4 whitespace-nowrap"><span className={\`px-2 py-1 rounded text-xs uppercase \${item.${f.key} === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{item.${f.key}}</span></td>`;
        
        // dot notation for nested
        const props = f.key.split('.');
        if (props.length > 1) {
            return `<td className="px-6 py-4 whitespace-nowrap text-foreground">{item.${props[0]} ? item.${props.join('.')} : 'N/A'}</td>`;
        }
        return `<td className="px-6 py-4 whitespace-nowrap text-foreground">{item.${f.key}}</td>`;
    }).join('\n                  ');

    // Basic form builder
    let formInputs = formFields.map(f => {
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
        if (f.type === 'date') {
            return `
        <div>
            <label className="block text-sm font-medium mb-1">${f.label}</label>
            <input 
                type="date" 
                className="w-full p-2 border rounded-md" 
                value={formData.${f.key} || ''} 
                onChange={e => setFormData({...formData, ${f.key}: e.target.value})}
                required={${f.required}}
            />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">${title}</h1>
          <p className="text-muted-foreground">Manage your ${title.toLowerCase()}</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="neu-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
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
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    ${tds}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Add New ${title}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              ${formInputs}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="neu-btn-primary">
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </button>
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

// 1. Categories
createPage(
    'finance/categories', 
    'Chart of Accounts', 
    'finance/categories', 
    ['Category Name', 'Type', 'Status'],
    [{key: 'name', type: 'text'}, {key: 'type', type: 'badge'}, {key: 'is_active', type: 'bool'}],
    [
        {key: 'name', label: 'Account/Category Name', type: 'text', required: true}, 
        {key: 'type', label: 'Type', type: 'select', required: true, options: [{value: 'income', label: 'Income'}, {value: 'expense', label: 'Expense'}]}
    ]
);

// 2. Entries
createPage(
    'finance/entries', 
    'Income & Expenses', 
    'finance/entries', 
    ['Entry #', 'Date', 'Type', 'Category', 'Description', 'Amount'],
    [
        {key: 'entry_number', type: 'text'}, 
        {key: 'date', type: 'text'}, 
        {key: 'type', type: 'badge'}, 
        {key: 'category.name', type: 'text'}, 
        {key: 'description', type: 'text'}, 
        {key: 'amount', type: 'currency'}
    ],
    [
        {key: 'category_id', label: 'Category ID', type: 'text', required: true}, 
        {key: 'date', label: 'Date', type: 'date', required: true},
        {key: 'amount', label: 'Amount', type: 'text', required: true},
        {key: 'description', label: 'Description', type: 'text', required: false}
    ]
);

console.log('Phase 4 Pages scaffolded successfully.');
