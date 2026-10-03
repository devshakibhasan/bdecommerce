'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useLocaleStore } from '@/lib/store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Lock, Mail, Phone, User as UserIcon, ArrowRight, ShieldCheck, 
  Sparkles, CheckCircle2, KeyRound, Zap, Smartphone, 
  Eye, EyeOff 
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

function AuthContent({ defaultMode }: { defaultMode?: 'login' | 'register' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = defaultMode || (searchParams.get('mode') === 'register' ? 'register' : 'login');

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'otp'>('email');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('customer@example.com');
  const [phone, setPhone] = useState('01712345678');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, hasHydrated } = useAuthStore();
  const { locale } = useLocaleStore();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [hasHydrated, isAuthenticated, router, searchParams]);

  // Handle Email/Password Login & Register
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res: any = await api.post('/auth/login', { email, password });
        const token = res?.data?.token || res?.token;
        const user: User = res?.data?.user || res?.user;

        if (!token || !user) {
          throw new Error('Invalid email or password');
        }

        login(token, user);
        toast.success(locale === 'bn' ? 'স্বাগতম! সফলভাবে লগইন হয়েছে।' : 'Welcome back, ' + user.name + '!');
        
        if (user.is_admin) {
          router.push('/admin');
        } else {
          const redirect = searchParams.get('redirect') || '/';
          router.push(redirect);
        }
      } else {
        const res: any = await api.post('/auth/register', {
          name,
          email,
          phone,
          password,
        });

        const token = res?.data?.token || res?.token;
        const user: User = res?.data?.user || res?.user;

        if (!token || !user) {
          throw new Error('Registration failed. Please check details and try again.');
        }

        login(token, user);
        toast.success(locale === 'bn' ? 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!' : 'Account registered successfully!');
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Flow
  const handleSendOtp = async () => {
    if (!phone || phone.length !== 11 || !phone.startsWith('01')) {
      toast.error('Please enter a valid 11-digit Bangladesh phone number.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/otp/send', { phone });
      setOtpSent(true);
      toast.success(locale === 'bn' ? '৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে!' : 'OTP code sent to your mobile phone!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res: any = await api.post('/auth/otp/verify', { phone, otp });
      const token = res?.data?.token || res?.token;
      const user: User = res?.data?.user || res?.user;

      if (!token || !user) {
        throw new Error('Invalid OTP code. Please check and try again.');
      }

      login(token, user);
      toast.success(locale === 'bn' ? 'মোবাইল নম্বর সফলভাবে যাচাই হয়েছে!' : 'Phone verified successfully!');
      router.push('/');
    } catch (err: any) {
      toast.error(err?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <div className="neu-flat rounded-3xl p-6 sm:p-10 space-y-7 shadow-xl">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mx-auto text-primary text-2xl font-black shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {mode === 'login' 
              ? (locale === 'bn' ? 'অ্যাকাউন্টে সাইন ইন করুন' : 'Welcome Back') 
              : (locale === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create an Account')}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Fastest Doorstep Delivery across Bangladesh with Cash on Delivery & bKash
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl neu-inset gap-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'login' ? 'neu-chip-active text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'bn' ? 'সাইন ইন' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'register' ? 'neu-chip-active text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'bn' ? 'রেজিস্টার' : 'Create Account'}
          </button>
        </div>

        {/* Auth Method Selector: Email vs Phone OTP */}
        {mode === 'login' && (
          <div className="flex justify-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                authMethod === 'email' ? 'neu-btn-primary' : 'neu-btn text-muted-foreground'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('otp')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                authMethod === 'otp' ? 'neu-btn-primary' : 'neu-btn text-muted-foreground'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
          </div>
        )}


        {/* Email & Password Form */}
        {authMethod === 'email' || mode === 'register' ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {/* Full Name for Registration */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 neu-input rounded-2xl text-xs font-medium"
                    placeholder="e.g. Tanvir Hossain"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 neu-input rounded-2xl text-xs font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Phone Number for Registration */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Mobile Number (11 Digits) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    required
                    pattern="01[0-9]{9}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 neu-input rounded-2xl text-xs font-mono font-bold"
                    placeholder="017XXXXXXXX"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Password *
                </label>
                {mode === 'login' && (
                  <span className="text-[11px] font-semibold text-primary cursor-pointer hover:underline">
                    Forgot?
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 neu-btn-primary rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 cursor-pointer pt-3"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Phone OTP Login Form */
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Mobile Number (11 Digits) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                <input
                  type="tel"
                  required
                  pattern="01[0-9]{9}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 neu-input rounded-2xl text-xs font-mono font-bold"
                  placeholder="017XXXXXXXX"
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full py-3.5 neu-btn-primary rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send SMS Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    Enter 6-Digit OTP Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 neu-input rounded-2xl text-center text-lg font-mono font-black tracking-widest text-primary"
                    placeholder="••••••"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                  <span className="text-muted-foreground text-[11px]">Expires in 5:00 min</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 neu-btn-primary rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Login</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>256-Bit SSL Encrypted Session</span>
          </div>
          <Link href="/" className="font-bold text-primary hover:underline">
            Return Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground">Loading Authentication...</div>}>
      <AuthContent />
    </Suspense>
  );
}
