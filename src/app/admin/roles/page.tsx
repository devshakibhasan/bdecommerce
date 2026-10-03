'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  ShieldCheck, Users, Lock, KeyRound, 
  CheckCircle2, Plus, Trash2, Edit, X,
  DollarSign, Briefcase, Phone, Mail, Sparkles, AlertCircle
} from 'lucide-react';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const [roleForm, setRoleForm] = useState({
    name: '',
    permissions: [] as string[]
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Store Manager',
    salary: '',
    designation: '',
    is_active: true,
  });

  const { data: roleData = { roles: [], permissions: [], staff: [], payroll_summary: null }, isLoading } = useQuery({
    queryKey: ['admin-roles-permissions'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/roles');
        return res?.data?.data || res?.data || { roles: [], permissions: [], staff: [], payroll_summary: null };
      } catch {
        return { roles: [], permissions: [], staff: [], payroll_summary: null };
      }
    }
  });

  const { roles = [], permissions = [], staff = [], payroll_summary } = roleData;

  const payroll = payroll_summary || {
    total_monthly_payroll: staff.reduce((acc: number, s: any) => acc + (Number(s.salary) || 0), 0),
    total_staff: staff.length,
    active_staff: staff.filter((s: any) => s.is_active !== false).length,
    average_salary: staff.length > 0 ? Math.round(staff.reduce((acc: number, s: any) => acc + (Number(s.salary) || 0), 0) / staff.length) : 0,
  };

  const saveRoleMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingRole) {
        return await api.put(`/admin/roles/${editingRole.id}`, payload);
      }
      return await api.post('/admin/roles', payload);
    },
    onSuccess: () => {
      toast.success(editingRole ? 'Role updated!' : 'Role created successfully!');
      setIsRoleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-roles-permissions'] });
    },
    onError: () => toast.error('Failed to save role')
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      toast.success('Role deleted!');
      queryClient.invalidateQueries({ queryKey: ['admin-roles-permissions'] });
    },
    onError: (err: any) => toast.error(err?.message || err?.response?.data?.message || 'Failed to delete role')
  });

  // Create Staff Mutation
  const addStaffMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/admin/roles/staff', payload),
    onSuccess: () => {
      toast.success('Staff account created and monthly salary recorded!');
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ['admin-roles-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create staff account')
  });

  // Update Staff Mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number, payload: any }) => api.put(`/admin/roles/staff/${id}`, payload),
    onSuccess: () => {
      toast.success('Staff account details & salary updated successfully!');
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ['admin-roles-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update staff account')
  });

  // Delete Staff Mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/roles/staff/${id}`),
    onSuccess: () => {
      toast.success('Staff member removed!');
      queryClient.invalidateQueries({ queryKey: ['admin-roles-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: () => toast.error('Failed to remove staff')
  });

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleForm({ name: '', permissions: [] });
    setIsRoleModalOpen(true);
  };

  const openEditRoleModal = (role: any) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      permissions: (role.permissions || []).map((p: any) => p.name)
    });
    setIsRoleModalOpen(true);
  };

  const openCreateStaffModal = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: roles[0]?.name || 'Store Manager',
      salary: '',
      designation: '',
      is_active: true,
    });
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (s: any) => {
    setEditingStaff(s);
    setStaffForm({
      name: s.name,
      email: s.email,
      phone: s.phone || '',
      password: '',
      role: s.role || 'Store Manager',
      salary: String(s.salary ?? 0),
      designation: s.designation || '',
      is_active: s.is_active !== false,
    });
    setIsStaffModalOpen(true);
  };

  const togglePermission = (permName: string) => {
    setRoleForm(prev => {
      const perms = prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName];
      return { ...prev, permissions: perms };
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>Staff & Role-Based Access Control (RBAC)</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/20 dark:bg-primary/10 text-primary dark:text-primary border border-primary/40 dark:border-primary/80">
              Salary & Payroll Active
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Manage administrative staff, permissions, job designations, and monthly salary payroll deducted in Reports & Revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateRoleModal}
            className="px-4 py-2.5 rounded-xl bg-card border hover:bg-muted text-foreground font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>

          <button
            type="button"
            onClick={openCreateStaffModal}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Add Staff & Salary</span>
          </button>
        </div>
      </div>

      {/* Staff Payroll & Salaries KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase">
            <span>Monthly Staff Payroll</span>
            <div className="p-2 bg-primary/10 text-primary dark:text-primary rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-primary dark:text-primary">
              ৳{formatBDT(payroll.total_monthly_payroll)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Deducted as Employee Salary in Net Profit
            </p>
          </div>
          <div className="text-[11px] font-semibold text-primary dark:text-primary/40 pt-2 border-t">
            {payroll.active_staff} active salaried staff
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase">
            <span>Total Staff Accounts</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-foreground">
              {payroll.total_staff} Members
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {payroll.active_staff} Active • {payroll.total_staff - payroll.active_staff} Suspended
            </p>
          </div>
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 pt-2 border-t">
            Role-based authorization active
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase">
            <span>Average Staff Salary</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-foreground">
              ৳{formatBDT(payroll.average_salary)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Per salaried team member / month
            </p>
          </div>
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 pt-2 border-t">
            Standard compensation rate
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase">
            <span>Active Roles</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-foreground">
              {roles.length} Tiers
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {permissions.length} granular capabilities
            </p>
          </div>
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 pt-2 border-t">
            RBAC Access Guard Active
          </div>
        </div>
      </div>

      {/* Staff Accounts Full CRUD Table */}
      <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
        <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/20">
          <div>
            <h3 className="font-black text-base text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Administrative Staff & Monthly Salaries ({staff.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Admin team members with role assignments, contact details, and monthly compensation.
            </p>
          </div>

          <button
            onClick={openCreateStaffModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b">
              <tr>
                <th className="px-5 py-3.5 font-bold">Staff Member</th>
                <th className="px-4 py-3.5 font-bold">Contact Info</th>
                <th className="px-4 py-3.5 font-bold">Designation / Title</th>
                <th className="px-4 py-3.5 font-bold">Role Tier</th>
                <th className="px-4 py-3.5 font-bold text-right text-primary dark:text-primary">Monthly Salary</th>
                <th className="px-3 py-3.5 font-bold text-center">Status</th>
                <th className="px-4 py-3.5 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {staff.length > 0 ? (
                staff.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                          {(s.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm">{s.name}</div>
                          <div className="text-[10px] text-muted-foreground">User ID #{s.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground" /> {s.email}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground font-mono">
                          <Phone className="w-3 h-3 text-muted-foreground" /> {s.phone || 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {s.designation ? (
                        <span className="font-semibold text-foreground">
                          {s.designation}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-primary/20 dark:bg-primary/10 text-primary dark:text-primary/40 border border-primary/40 dark:border-primary/80 text-[10px] font-black uppercase tracking-wider">
                        {s.role || 'Administrator'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="text-sm font-black text-primary dark:text-primary">
                        ৳{formatBDT(s.salary ?? 0)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">per month</div>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.is_active !== false 
                          ? 'bg-primary/15 text-primary dark:text-primary' 
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}>
                        {s.is_active !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditStaffModal(s)}
                          className="p-1.5 text-blue-600 hover:bg-muted rounded-xl transition-colors cursor-pointer"
                          title="Edit Staff & Salary"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {s.id !== 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove staff member ${s.name}?`)) {
                                deleteStaffMutation.mutate(s.id);
                              }
                            }}
                            className="p-1.5 text-destructive hover:bg-muted rounded-xl transition-colors cursor-pointer"
                            title="Remove Staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    No staff accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>System Role Permissions ({roles.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Define custom access privileges and capabilities for each administrative tier.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateRoleModal}
            className="px-3 py-1.5 rounded-xl bg-card border hover:bg-muted text-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Role</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role: any) => (
            <div key={role.id} className="bg-card rounded-2xl p-5 border shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary dark:text-primary flex items-center justify-center font-black text-xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-foreground">{role.name}</h3>
                      <span className="text-[10px] text-muted-foreground font-mono">Guard: {role.guard_name || 'web'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditRoleModal(role)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-xl transition-colors cursor-pointer"
                      title="Edit Role Permissions"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {role.name !== 'Super Admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete role "${role.name}"?`)) {
                            deleteRoleMutation.mutate(role.id);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-xl transition-colors cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Permissions Pills */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-black uppercase text-muted-foreground">Granted Capabilities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((p: any) => (
                        <span key={p.id || p.name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-foreground">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          <span>{p.name.replace(/_/g, ' ')}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">All Permissions (Root Access)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{role.permissions?.length || 0} permissions</span>
                <span className="text-primary font-bold">Active System Role</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Create/Edit Modal (Neumorphic Design) */}
      {isRoleModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRoleModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary dark:text-primary border border-primary/20 shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight text-foreground">
                    {editingRole ? 'Edit Role Permissions' : 'Create Custom Role'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Configure access control rules and system permission grants
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsRoleModalOpen(false)} 
                className="neu-close-btn"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!roleForm.name.trim()) {
                  toast.error('Role name is required');
                  return;
                }
                saveRoleMutation.mutate(roleForm);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing Lead / Warehouse Dispatcher"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(p => ({ ...p, name: e.target.value }))}
                  className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    Granted Capabilities ({roleForm.permissions.length} selected)
                  </label>
                  <span className="text-[10px] text-primary dark:text-primary font-bold">
                    Click tiles to toggle
                  </span>
                </div>
                
                <div className="neu-card-inset p-2.5">
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {permissions.map((p: any) => {
                      const isChecked = roleForm.permissions.includes(p.name);
                      return (
                        <button
                          type="button"
                          key={p.id || p.name}
                          onClick={() => togglePermission(p.name)}
                          className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isChecked 
                              ? 'neu-tile-active' 
                              : 'neu-tile-inactive'
                          }`}
                        >
                          <span className="truncate">{p.name.replace(/_/g, ' ')}</span>
                          {isChecked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary dark:text-primary shrink-0 ml-1" />
                          ) : (
                            <span className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveRoleMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{saveRoleMutation.isPending ? 'Saving...' : editingRole ? 'Update Role' : 'Save Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Create / Edit Modal (Neumorphic Design with Salary & Designation) */}
      {isStaffModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsStaffModalOpen(false);
          }}
          className="fixed inset-0 neu-backdrop z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal max-w-xl w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative cursor-default"
          >
            <div className="flex items-center justify-between neu-modal-header pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary dark:text-primary border border-primary/20 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight text-foreground">
                    {editingStaff ? 'Edit Staff Account & Salary' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Set credentials, assigned role, job title, and monthly payroll
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsStaffModalOpen(false)} 
                className="neu-close-btn"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const payload: any = {
                  name: staffForm.name,
                  email: staffForm.email,
                  phone: staffForm.phone,
                  role: staffForm.role,
                  salary: parseFloat(staffForm.salary) || 0,
                  designation: staffForm.designation,
                  is_active: staffForm.is_active,
                };
                if (staffForm.password) {
                  payload.password = staffForm.password;
                }

                if (editingStaff) {
                  updateStaffMutation.mutate({ id: editingStaff.id, payload });
                } else {
                  if (!staffForm.password) {
                    toast.error('Password is required for new staff account');
                    return;
                  }
                  addStaffMutation.mutate(payload);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Staff Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahbub Alam"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm(p => ({ ...p, name: e.target.value }))}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Designation / Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Operations Lead"
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm(p => ({ ...p, designation: e.target.value }))}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@bdecommerce.com"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm(p => ({ ...p, email: e.target.value }))}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01712345678"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm(p => ({ ...p, phone: e.target.value }))}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Monthly Salary & Role Row in Sculpted Neumorphic Inset Panel */}
              <div className="neu-card-inset p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary dark:text-primary flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Monthly Salary (৳) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 35000"
                        value={staffForm.salary}
                        onChange={(e) => setStaffForm(p => ({ ...p, salary: e.target.value }))}
                        className="neu-input w-full px-3.5 py-2.5 text-xs font-black text-primary dark:text-primary focus:outline-hidden"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      Automatically deducted in Reports True Net Profit
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Assign Role Tier</label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm(p => ({ ...p, role: e.target.value }))}
                      className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                    >
                      {roles.map((r: any) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      Defines system security & dashboard access
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Password {editingStaff ? '(Leave blank to keep)' : '*'}
                  </label>
                  <input
                    type="password"
                    placeholder="******"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm(p => ({ ...p, password: e.target.value }))}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Account Status</label>
                  <select
                    value={staffForm.is_active ? 'true' : 'false'}
                    onChange={(e) => setStaffForm(p => ({ ...p, is_active: e.target.value === 'true' }))}
                    className="neu-input w-full px-3.5 py-2.5 text-xs font-bold focus:outline-hidden"
                  >
                    <option value="true">Active (Access Enabled)</option>
                    <option value="false">Suspended (Access Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 neu-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="neu-btn-secondary px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStaffMutation.isPending || updateStaffMutation.isPending}
                  className="neu-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {addStaffMutation.isPending || updateStaffMutation.isPending 
                      ? 'Saving...' 
                      : editingStaff 
                        ? 'Update Staff & Salary' 
                        : 'Create Staff Account'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
