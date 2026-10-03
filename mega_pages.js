const fs = require('fs');
const path = require('path');

function createPage(route, title, apiEndpoint, columns, fields, formFields) {
    const dir = path.join('src/app/admin', route);
    fs.mkdirSync(dir, { recursive: true });
    
    let ths = columns.map(c => `<th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">${c}</th>`).join('\n                  ');
    let tds = fields.map(f => {
        if (f.type === 'bool') return `<td className="px-6 py-4 whitespace-nowrap"><span className={\`px-2 py-1 rounded text-xs \${item.${f.key} ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{item.${f.key} ? 'Active' : 'Inactive'}</span></td>`;
        if (f.type === 'date') return `<td className="px-6 py-4 whitespace-nowrap">{new Date(item.${f.key}).toLocaleString()}</td>`;
        if (f.type === 'badge') return `<td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">{item.${f.key}}</span></td>`;
        const props = f.key.split('.');
        if (props.length > 1) {
            return `<td className="px-6 py-4 whitespace-nowrap text-foreground">{item.${props[0]} ? item.${props.join('.')} : 'N/A'}</td>`;
        }
        return `<td className="px-6 py-4 whitespace-nowrap text-foreground">{item.${f.key} || '-'}</td>`;
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
                type="${f.type === 'datetime-local' ? 'datetime-local' : 'text'}" 
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
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Add New ${title}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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

// 1. Flash Sales
createPage(
    'marketing/flash-sales', 
    'Flash Sales Engine', 
    'marketing/flash-sales', 
    ['Campaign Title', 'Starts', 'Ends', 'Status'],
    [{key: 'title', type: 'text'}, {key: 'start_time', type: 'date'}, {key: 'end_time', type: 'date'}, {key: 'is_active', type: 'bool'}],
    [
        {key: 'title', label: 'Campaign Title', type: 'text', required: true}, 
        {key: 'slug', label: 'Slug', type: 'text', required: true}, 
        {key: 'start_time', label: 'Start Time', type: 'datetime-local', required: true},
        {key: 'end_time', label: 'End Time', type: 'datetime-local', required: true},
        {key: 'is_active', label: 'Publish Campaign', type: 'bool', required: false}
    ]
);

// 2. SMS Gateways
createPage(
    'settings/sms-gateways', 
    'SMS Gateways', 
    'settings/sms-gateways', 
    ['Provider', 'Sender ID', 'Status'],
    [{key: 'provider', type: 'badge'}, {key: 'sender_id', type: 'text'}, {key: 'is_active', type: 'bool'}],
    [
        {key: 'provider', label: 'Gateway Provider', type: 'select', required: true, options: [{value: 'sslwireless', label: 'SSL Wireless'}, {value: 'twilio', label: 'Twilio'}, {value: 'btrac', label: 'B-Trac SMS'}]}, 
        {key: 'api_key', label: 'API / Auth Key', type: 'text', required: false},
        {key: 'sender_id', label: 'Sender ID (Masking)', type: 'text', required: false},
        {key: 'base_url', label: 'Endpoint URL', type: 'text', required: false},
        {key: 'is_active', label: 'Enable this Gateway', type: 'bool', required: false}
    ]
);

// 3. Marketplace Vendors
createPage(
    'marketplace/vendors', 
    'Multi-Vendor Marketplace', 
    'marketplace/vendors', 
    ['Shop Name', 'Owner', 'Commission %', 'Balance', 'Status'],
    [{key: 'shop_name', type: 'text'}, {key: 'user.name', type: 'text'}, {key: 'commission_rate', type: 'text'}, {key: 'balance', type: 'text'}, {key: 'status', type: 'badge'}],
    [
        {key: 'user_id', label: 'User ID (Owner)', type: 'text', required: true}, 
        {key: 'shop_name', label: 'Shop/Brand Name', type: 'text', required: true}, 
        {key: 'slug', label: 'Shop Slug', type: 'text', required: true},
        {key: 'commission_rate', label: 'Commission Rate (%)', type: 'text', required: true},
        {key: 'status', label: 'Account Status', type: 'select', required: true, options: [{value: 'pending', label: 'Pending'}, {value: 'active', label: 'Active'}, {value: 'suspended', label: 'Suspended'}]}
    ]
);

console.log('Mega Pages scaffolded successfully.');
