'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '@/components/admin/DataTable';
import { 
  Shield, ShieldAlert, ShieldCheck, Plus, Trash2, 
  Edit, Search, X, Sparkles, CheckCircle2, XCircle, 
  AlertTriangle, Phone, FileText, Ban, UserCheck, ShieldOff 
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminRiskProfilesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [editingProfile, setEditingProfile] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    phone: '',
    risk_score: 50,
    is_blacklisted: false,
    is_whitelisted: false,
    admin_notes: '',
  });

  // Fetch Risk Profiles
  const { data: profilesData = [], isLoading } = useQuery({
    queryKey: ['admin-risk-profiles', search],
    queryFn: async () => {
      try {
        const queryParams = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
        const res: any = await api.get(`/admin/risk-profiles${queryParams}`);
        if (res?.data) {
          return Array.isArray(res.data) 
            ? res.data 
            : (res.data.items || res.data.data || []);
        }
      } catch (err) {
        /* silenced */
      }
      return [];
    }
  });

  // Create Profile Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/admin/risk-profiles', payload);
    },
    onSuccess: () => {
      toast.success('Customer risk profile added!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-risk-profiles'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create profile';
      const validationDetails = err?.errors
        ? '\n' + Object.values(err.errors).flat().join(', ')
        : '';
      toast.error(msg + validationDetails);
    }
  });

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      return await api.put(`/admin/risk-profiles/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Risk profile updated successfully!');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-risk-profiles'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update profile');
    }
  });

  // Blacklist Mutation
  const blacklistMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await api.post(`/admin/risk-profiles/${id}/blacklist`, { admin_notes: notes });
    },
    onSuccess: () => {
      toast.success('Customer added to Blacklist (COD Blocked)');
      setIsBlacklistModalOpen(false);
      setBlacklistReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-risk-profiles'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to blacklist customer')
  });

  // Whitelist Mutation
  const whitelistMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.post(`/admin/risk-profiles/${id}/whitelist`, {});
    },
    onSuccess: () => {
      toast.success('Customer VIP Whitelisted');
      queryClient.invalidateQueries({ queryKey: ['admin-risk-profiles'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to whitelist customer')
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/admin/risk-profiles/${id}`);
    },
    onSuccess: () => {
      toast.success('Risk profile removed');
      queryClient.invalidateQueries({ queryKey: ['admin-risk-profiles'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete profile')
  });

  const openCreateModal = () => {
    setEditingProfile(null);
    setFormData({
      phone: '',
      risk_score: 50,
      is_blacklisted: false,
      is_whitelisted: false,
      admin_notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (profile: any) => {
    setEditingProfile(profile);
    setFormData({
      phone: profile.phone,
      risk_score: Number(profile.risk_score || 50),
      is_blacklisted: Boolean(profile.is_blacklisted),
      is_whitelisted: Boolean(profile.is_whitelisted),
      admin_notes: profile.admin_notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim()) {
      toast.error('Mobile phone number is required');
      return;
    }

    const payload = {
      phone: formData.phone.trim(),
      risk_score: Number(formData.risk_score),
      is_blacklisted: formData.is_blacklisted,
      is_whitelisted: formData.is_whitelisted,
      admin_notes: formData.admin_notes.trim(),
    };

    if (editingProfile) {
      updateMutation.mutate({ id: editingProfile.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, phone: string) => {
    if (window.confirm(`Remove risk profile for ${phone}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openBlacklistPrompt = (id: number) => {
    setSelectedProfileId(id);
    setBlacklistReason('');
    setIsBlacklistModalOpen(true);
  };

  const handleConfirmBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;
    blacklistMutation.mutate({
      id: selectedProfileId,
      notes: blacklistReason || 'Fake order attempts / repeated courier returns'
    });
  };

  const columns: Column<any>[] = [
    { 
      key: 'phone', 
      label: 'Customer Phone & Profile', 
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm text-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>{row.phone}</span>
            </span>
          </div>
          {row.admin_notes && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[220px]">
              {row.admin_notes}
            </p>
          )}
        </div>
      )
    },
    { 
      key: 'risk_score', 
      label: 'Risk Assessment Score', 
      render: (row) => {
        const score = Number(row.risk_score || 50);
        const isHighRisk = score >= 75 || row.is_blacklisted;
        const isLowRisk = score <= 30 || row.is_whitelisted;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-mono font-black text-sm ${
                isHighRisk ? 'text-red-500' : isLowRisk ? 'text-primary' : 'text-amber-500'
              }`}>
                {score} / 100
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isHighRisk ? 'bg-red-500/15 text-red-600' : isLowRisk ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-600'
              }`}>
                {isHighRisk ? 'High Risk' : isLowRisk ? 'Low Risk (Safe)' : 'Moderate'}
              </span>
            </div>
            <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  isHighRisk ? 'bg-red-500' : isLowRisk ? 'bg-primary' : 'bg-amber-500'
                }`} 
                style={{ width: `${score}%` }} 
              />
            </div>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Protection Status', 
      render: (row) => {
        if (row.is_blacklisted) {
          return (
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-red-500/15 text-red-600 border border-red-500/30 flex items-center gap-1.5 w-fit">
              <Ban className="w-3.5 h-3.5" />
              <span>COD BLOCKED</span>
            </span>
          );
        }
        if (row.is_whitelisted) {
          return (
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-primary/15 text-primary border border-primary/30 flex items-center gap-1.5 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VIP WHITELISTED</span>
            </span>
          );
        }
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-muted text-muted-foreground flex items-center gap-1.5 w-fit">
            <Shield className="w-3.5 h-3.5" />
            <span>STANDARD</span>
          </span>
        );
      }
    },
    { 
      key: 'actions', 
      label: 'Actions & Flagging', 
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {!row.is_blacklisted && (
            <button
              onClick={() => openBlacklistPrompt(row.id)}
              className="p-2 clay-btn rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
              title="Blacklist Customer (Block COD)"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}

          {!row.is_whitelisted && (
            <button
              onClick={() => whitelistMutation.mutate(row.id)}
              className="p-2 clay-btn rounded-xl text-primary hover:bg-primary/10 transition-all"
              title="Whitelist Customer (VIP Trusted)"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => openEditModal(row)}
            className="p-2 clay-btn rounded-xl text-primary hover:bg-primary/10 transition-all"
            title="Edit Risk Profile"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row.id, row.phone)}
            className="p-2 clay-btn rounded-xl text-muted-foreground hover:text-red-500 transition-all"
            title="Remove Profile"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const highRiskCount = profilesData.filter((p: any) => p.is_blacklisted || (p.risk_score >= 75)).length;
  const vipCount = profilesData.filter((p: any) => p.is_whitelisted).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-inset flex items-center justify-center text-red-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span>Risk Shield & Anti-Fraud Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Automated courier return prediction, fake COD blocking, and customer trust scoring
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="clay-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer Profile</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-red-500">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">High Risk / Blacklisted</span>
            <h3 className="text-xl font-black text-foreground">{highRiskCount} Blocked</h3>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">VIP Whitelisted</span>
            <h3 className="text-xl font-black text-foreground">{vipCount} Trusted</h3>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl clay-inset flex items-center justify-center text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Monitored</span>
            <h3 className="text-xl font-black text-foreground">{profilesData.length} Profiles</h3>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="clay-card rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search phone number (e.g. 017...)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 clay-input rounded-2xl text-xs font-medium"
          />
        </div>
        <span className="text-xs text-muted-foreground font-bold">
          Showing {profilesData.length} customer profiles
        </span>
      </div>

      {/* Data Table */}
      <div className="clay-card rounded-3xl p-6">
        <DataTable columns={columns} data={profilesData} isLoading={isLoading} />
      </div>

      {/* ========================================================================= */}
      {/* CREATE & EDIT RISK PROFILE MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl neu-card-inset flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground">
                    {editingProfile ? 'Edit Customer Risk Profile' : 'Add Customer Risk Profile'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Set risk score and courier delivery protection flags
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Customer Phone Number (১১ ডিজিট) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 neu-input text-xs font-mono font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground">
                    Risk Score (0 = Safe, 100 = Fraud Danger)
                  </label>
                  <span className="font-mono font-bold text-xs text-primary">
                    {formData.risk_score} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.risk_score}
                  onChange={(e) => setFormData({ ...formData, risk_score: parseInt(e.target.value) || 0 })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 neu-card-inset rounded-2xl">
                  <input
                    type="checkbox"
                    checked={formData.is_blacklisted}
                    onChange={(e) => setFormData({ ...formData, is_blacklisted: e.target.checked, is_whitelisted: e.target.checked ? false : formData.is_whitelisted })}
                    className="w-4 h-4 rounded text-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 block">Blacklist Customer (Block COD)</span>
                    <span className="text-[10px] text-muted-foreground block">Forces online advance payment for all checkouts</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 neu-card-inset rounded-2xl">
                  <input
                    type="checkbox"
                    checked={formData.is_whitelisted}
                    onChange={(e) => setFormData({ ...formData, is_whitelisted: e.target.checked, is_blacklisted: e.target.checked ? false : formData.is_blacklisted })}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-primary dark:text-primary block">VIP Whitelist (Fast-track Fulfillment)</span>
                    <span className="text-[10px] text-muted-foreground block">Bypasses automated fraud confirmation calls</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Admin Investigation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record courier return history, fake order incidents, or special handling notes..."
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                  className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                />
              </div>

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
                  className="neu-btn-primary px-7 py-2.5 text-xs font-black shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingProfile ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLACKLIST CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isBlacklistModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBlacklistModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center gap-3 neu-modal-header pb-3">
              <div className="w-12 h-12 rounded-2xl neu-card-inset flex items-center justify-center text-red-500">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-foreground">Block Customer COD Orders</h3>
                <p className="text-xs text-muted-foreground">Add to anti-fraud blacklist</p>
              </div>
            </div>

            <form onSubmit={handleConfirmBlacklist} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Reason for Blacklisting *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Courier parcel rejected 3 times; fake address provided..."
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="w-full px-4 py-2.5 neu-input text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsBlacklistModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={blacklistMutation.isPending}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-lg disabled:opacity-60 cursor-pointer transition-all"
                >
                  {blacklistMutation.isPending ? 'Blacklisting...' : 'Confirm Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
