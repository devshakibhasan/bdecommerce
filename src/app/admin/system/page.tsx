'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Server, Cpu, Activity, RefreshCw, 
  Trash2, RotateCcw, CheckCircle2, AlertTriangle, 
  Database, Zap, KeyRound, Play
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSystemPage() {
  const queryClient = useQueryClient();

  const { data: stats = {}, isLoading, refetch } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/system/jobs');
        return res?.data?.data || res?.data || {};
      } catch {
        return {};
      }
    }
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => api.post('/admin/system/cache-clear'),
    onSuccess: () => {
      toast.success('System cache and configuration cleared successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
    },
    onError: () => toast.error('Failed to clear cache')
  });

  const dispatchTestJobMutation = useMutation({
    mutationFn: async () => api.post('/admin/system/dispatch-test-job'),
    onSuccess: () => {
      toast.success('Background job dispatched to queue worker!');
      queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
    },
    onError: () => toast.error('Failed to dispatch job')
  });

  const retryJobMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/admin/system/retry-job/${id}`),
    onSuccess: () => {
      toast.success('Job queued for retry!');
      queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
    },
    onError: () => toast.error('Failed to retry job')
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/system/failed-jobs/${id}`),
    onSuccess: () => {
      toast.success('Failed job record deleted!');
      queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
    },
    onError: () => toast.error('Failed to delete job')
  });

  const flushJobsMutation = useMutation({
    mutationFn: async () => api.post('/admin/system/flush-failed-jobs'),
    onSuccess: () => {
      toast.success('All failed jobs cleared!');
      queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
    },
    onError: () => toast.error('Failed to flush jobs')
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Server className="w-6 h-6 text-primary" />
            <span>System Health & Background Queues</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor asynchronous queue workers, Redis/Database cache, active customer sessions, and server vitals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dispatchTestJobMutation.mutate()}
            disabled={dispatchTestJobMutation.isPending}
            className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Dispatch Test Job</span>
          </button>

          <button
            type="button"
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isPending}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{clearCacheMutation.isPending ? 'Clearing...' : 'Clear All Cache'}</span>
          </button>
        </div>
      </div>

      {/* Vitals KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111622] p-5 rounded-3xl border shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500">Pending Queue Jobs</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.pending_jobs || 0}</div>
          <span className="text-[10px] text-primary font-bold">Queue running normal</span>
        </div>

        <div className="bg-white dark:bg-[#111622] p-5 rounded-3xl border shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500">Active User Sessions</span>
          <div className="text-2xl font-black text-primary">{stats.active_sessions || 0}</div>
          <span className="text-[10px] text-slate-400">Live store sessions</span>
        </div>

        <div className="bg-white dark:bg-[#111622] p-5 rounded-3xl border shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500">API Bearer Tokens</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.api_tokens || 0}</div>
          <span className="text-[10px] text-slate-400">Active Sanctum tokens</span>
        </div>

        <div className="bg-white dark:bg-[#111622] p-5 rounded-3xl border shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500">Framework Runtime</span>
          <div className="text-base font-black text-slate-900 dark:text-white truncate">PHP {stats.php_version || '8.2'}</div>
          <span className="text-[10px] text-primary font-bold">Laravel {stats.laravel_version || '12.0'}</span>
        </div>
      </div>

      {/* Failed Jobs Table */}
      <div className="bg-white dark:bg-[#111622] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Failed Jobs Inspector ({stats.failed_jobs_count || 0})</span>
          </h3>

          {(stats.failed_jobs?.length || 0) > 0 && (
            <button
              type="button"
              onClick={() => flushJobsMutation.mutate()}
              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100"
            >
              Flush All Failed Jobs
            </button>
          )}
        </div>

        {stats.failed_jobs && stats.failed_jobs.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {stats.failed_jobs.map((job: any) => (
              <div key={job.id} className="py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">Job #{job.id} ({job.queue || 'default'})</div>
                  <div className="text-slate-400 font-mono text-[11px] truncate max-w-lg">{job.exception?.slice(0, 100)}...</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => retryJobMutation.mutate(job.id)}
                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl"
                    title="Retry Job"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteJobMutation.mutate(job.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 font-semibold text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>No failed background jobs in queue. System operating normally.</span>
          </div>
        )}
      </div>

    </div>
  );
}
