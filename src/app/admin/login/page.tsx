'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, Lock, Mail, ArrowRight, Zap, KeyRound, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    
    try {
      const res: any = await api.auth.login({ email: loginEmail, password: loginPass });
      
      const token = res?.data?.token || res?.token;
      const user: User = res?.data?.user || res?.user;

      if (!token || !user) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_admin) {
        throw new Error('Access denied. Administrator privileges required.');
      }

      login(token, user);
      toast.success('Welcome to Admin Portal, ' + user.name + '!');
      router.push('/admin');
    } catch (error: any) {
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md neu-flat rounded-3xl p-8 space-y-7 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mx-auto text-primary shadow-inner">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              BD Shop Admin Portal
            </h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Enterprise E-Commerce Management System
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-foreground tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 neu-input rounded-2xl text-xs font-medium"
                  placeholder="admin@bdecommerce.com"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-foreground tracking-wider">
                Master Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 neu-input rounded-2xl text-xs font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 neu-btn-primary font-black rounded-2xl text-xs shadow-lg disabled:opacity-70 flex justify-center items-center gap-2 cursor-pointer mt-3"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-bold">
              ← Return to Public Storefront
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}