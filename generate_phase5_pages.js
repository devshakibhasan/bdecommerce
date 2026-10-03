const fs = require('fs');
const path = require('path');

function createPage(route, title, apiEndpoint, columns, fields, formFields) {
    const dir = path.join('src/app/admin', route);
    fs.mkdirSync(dir, { recursive: true });
    
    let ths = columns.map(c => `<th className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">${c}</th>`).join('\n                  ');
    let tds = fields.map(f => {
        if (f.type === 'date') return `<td className="px-6 py-4 whitespace-nowrap">{new Date(item.${f.key}).toLocaleDateString()}</td>`;
        if (f.type === 'status') return `<td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">{item.${f.key}}</span></td>`;
        if (f.type === 'currency') return `<td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">৳ {Number(item.${f.key}).toFixed(2)}</td>`;
        
        const props = f.key.split('.');
        if (props.length > 1) {
            return `<td className="px-6 py-4 whitespace-nowrap text-foreground">{item.${props[0]} ? item.${props.join('.')} : 'N/A'}</td>`;
        }
        return `<td className="px-6 py-4 whitespace-nowrap text-foreground">{item.${f.key} || 'N/A'}</td>`;
    }).join('\n                  ');

    // Basic form builder
    let formInputs = formFields.map(f => {
        return `
        <div>
            <label className="block text-sm font-medium mb-1">${f.label}</label>
            <input 
                type="${f.type === 'number' ? 'number' : (f.type === 'date' ? 'date' : 'text')}" 
                className="w-full p-2 border rounded-md bg-background" 
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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

// 1. Employees
createPage(
    'hr/employees', 
    'Employees', 
    'hr/employees', 
    ['EMP ID', 'User Name', 'Department', 'Designation', 'Status'],
    [{key: 'employee_id_number', type: 'text'}, {key: 'user.name', type: 'text'}, {key: 'department', type: 'text'}, {key: 'designation', type: 'text'}, {key: 'status', type: 'status'}],
    [
        {key: 'user_id', label: 'User ID (System Account)', type: 'text', required: true}, 
        {key: 'department', label: 'Department', type: 'text', required: false},
        {key: 'designation', label: 'Designation', type: 'text', required: false},
        {key: 'basic_salary', label: 'Basic Salary', type: 'number', required: false}
    ]
);

// 2. Attendance
createPage(
    'hr/attendance', 
    'Attendance', 
    'hr/attendance', 
    ['User', 'Date', 'Check In', 'Check Out', 'Status'],
    [{key: 'user.name', type: 'text'}, {key: 'date', type: 'text'}, {key: 'check_in', type: 'text'}, {key: 'check_out', type: 'text'}, {key: 'status', type: 'status'}],
    [
        {key: 'user_id', label: 'User ID', type: 'text', required: true}, 
        {key: 'date', label: 'Date', type: 'date', required: true},
        {key: 'check_in', label: 'Check In (HH:MM)', type: 'text', required: false},
        {key: 'check_out', label: 'Check Out (HH:MM)', type: 'text', required: false},
        {key: 'status', label: 'Status (present/absent/late)', type: 'text', required: false}
    ]
);

// 3. Payroll
createPage(
    'hr/payroll', 
    'Payroll', 
    'hr/payroll', 
    ['User', 'Month', 'Year', 'Basic Salary', 'Net Payable', 'Status'],
    [{key: 'user.name', type: 'text'}, {key: 'month', type: 'text'}, {key: 'year', type: 'text'}, {key: 'basic_salary', type: 'currency'}, {key: 'net_payable', type: 'currency'}, {key: 'status', type: 'status'}],
    [
        {key: 'user_id', label: 'User ID', type: 'text', required: true}, 
        {key: 'month', label: 'Month (1-12)', type: 'number', required: true},
        {key: 'year', label: 'Year', type: 'number', required: true},
        {key: 'basic_salary', label: 'Basic Salary', type: 'number', required: true},
        {key: 'allowances', label: 'Allowances', type: 'number', required: false},
        {key: 'deductions', label: 'Deductions', type: 'number', required: false}
    ]
);

console.log('Phase 5 Pages scaffolded successfully.');
