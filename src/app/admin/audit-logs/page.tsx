'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  ShieldAlert, Activity, User, FileText, Database, ArrowRight, ArrowDown, Settings, Search
} from 'lucide-react';
import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';

export default function AuditLogsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', debouncedSearch],
    queryFn: async () => {
      const res: any = await api.get(`/admin/audit-logs?search=${encodeURIComponent(debouncedSearch)}`);
      return res?.data?.data || res?.data || [];
    },
    refetchInterval: 3000, // Refresh every 3 seconds
    refetchOnWindowFocus: true // Instant refresh when switching tabs
  });

  const logs = Array.isArray(data) ? data : [];

  const getActionColor = (event: string) => {
    switch (event) {
      case 'created': return 'bg-primary/20 text-primary dark:bg-primary/20/30 dark:text-primary border-primary/30';
      case 'updated': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      case 'deleted': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200';
    }
  };

  const generateEmpId = (createdAt: string) => {
    const d = new Date(createdAt);
    return `EMP-${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}-${d.getHours().toString().padStart(2,'0')}${d.getMinutes().toString().padStart(2,'0')}${d.getSeconds().toString().padStart(2,'0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="clay-card p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-inset rounded-2xl flex items-center justify-center text-primary font-black">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">System Audit Logs</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Immutable tracker of all staff CRUD operations
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by staff, action, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="clay-card rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Loading audit trail...</div>
        ) : logs?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Activity className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-black text-foreground">No Audit Logs Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Changes made by staff will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Staff Member (Causer)</th>
                  <th className="px-6 py-4 font-bold">Action</th>
                  <th className="px-6 py-4 font-bold">Target (Subject)</th>
                  <th className="px-6 py-4 font-bold text-center">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs?.map((log: any) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-foreground text-xs">{generateEmpId(log.created_at)}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(log.created_at).toLocaleString('en-US', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.causer ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {log.causer.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{log.causer.name}</div>
                              <div className="text-[10px] text-muted-foreground uppercase font-black">
                                ID: {log.causer.id_card_number || 'SYSTEM'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-semibold italic">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getActionColor(log.event)}`}>
                          {log.event}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-muted-foreground" />
                          {log.subject_type || 'Unknown'} #{log.subject_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-lg transition-colors"
                        >
                          {expandedId === log.id ? 'Hide Details' : 'View Payload'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            {log.properties?.old && (
                              <div className="p-4 bg-white dark:bg-[#111622] rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                <h4 className="text-xs font-black uppercase text-rose-500 mb-2">Old Values</h4>
                                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.properties.old, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.properties?.attributes && (
                              <div className="p-4 bg-white dark:bg-[#111622] rounded-2xl border border-primary/20 dark:border-primary/20/30">
                                <h4 className="text-xs font-black uppercase text-primary mb-2">New Values</h4>
                                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.properties.attributes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {!log.properties?.old && !log.properties?.attributes && (
                              <div className="col-span-2 p-4 text-center text-muted-foreground text-sm font-medium">
                                No specific attribute changes recorded in payload.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
