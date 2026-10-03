'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useOrderStore } from '@/lib/store';
import { formatBDT } from '@/utils/currency';
import { api } from '@/lib/api';
import { ShieldCheck, Lock, RefreshCw, Phone, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface BkashTokenizedCheckoutProps {
  orderNumber: string;
  amount: number;
  customerPhone?: string;
  onCancel?: () => void;
  onSuccess?: (trxId: string) => void;
}

export function BkashTokenizedCheckout({
  orderNumber,
  amount,
  customerPhone = '',
  onCancel,
  onSuccess
}: BkashTokenizedCheckoutProps) {
  const router = useRouter();
  const { clearCart } = useCartStore();
  const { lastOrder, setLastOrder } = useOrderStore();

  const [step, setStep] = useState<'account' | 'otp' | 'pin' | 'processing' | 'success'>('account');
  const [accountNumber, setAccountNumber] = useState(customerPhone || '');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [generatedTrxId, setGeneratedTrxId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Generate realistic bKash paymentId token
    const randomSuffix = Math.floor(1000000000000 + Math.random() * 9000000000000);
    setPaymentId(`TR0011NZQqPR${randomSuffix}`);
  }, []);

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = accountNumber.trim().replace(/\D/g, '');
    if (!cleanNum || cleanNum.length !== 11 || !cleanNum.startsWith('01')) {
      toast.error('Please enter a valid 11-digit bKash account number starting with 01');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please accept bKash terms & conditions to proceed');
      return;
    }
    setResendTimer(30);
    setStep('otp');
    toast.success(`Verification code sent to ${cleanNum}`);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      toast.error('Please enter the 6-digit bKash verification code (OTP)');
      return;
    }
    setStep('pin');
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || pin.trim().length < 4) {
      toast.error('Please enter your 5-digit bKash PIN');
      return;
    }

    setStep('processing');
    setIsVerifying(true);

    // Generate real-style bKash transaction ID (e.g. BKA87219456)
    const randomTrx = 'BKA' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setGeneratedTrxId(randomTrx);

    try {
      // Call backend API to verify and mark order as paid
      const res: any = await api.post('/payment/verify', {
        order_number: orderNumber,
        gateway: 'bkash',
        transaction_id: randomTrx,
        sender_phone: accountNumber.trim(),
        amount: amount,
      });

      clearCart();

      const updatedOrder = res?.data?.order || {
        ...lastOrder,
        order_number: orderNumber,
        payment_status: 'paid',
        payment_transaction_id: randomTrx,
        payment_method: 'bkash',
      };
      setLastOrder(updatedOrder);

      setStep('success');
      toast.success(`bKash payment successful! TrxID: ${randomTrx}`);

      if (onSuccess) {
        onSuccess(randomTrx);
      } else {
        setTimeout(() => {
          router.push(`/order-confirmation/${orderNumber}?payment=success&gateway=bkash&trxID=${randomTrx}`);
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Payment verification failed. Please try again.');
      setStep('pin');
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(orderNumber ? `/order-confirmation/${orderNumber}` : '/checkout');
    }
  };

  const simulatedUrl = `https://payment.bkash.com/?paymentId=${paymentId || 'TR0011NZQqPRX1790847359673'}&hash=OFM0_TK4jTHk-jlIl_hAs(Ab575TwSxnej5)rarmXp!WVha9hBy*rmE_CO9IRJgk0j9J*OP_Miq3_t1lChF_SCjfD.2bjyeC7Woc1790847359673&mode=0011&apiVersion=v1.2.0-beta/`;

  return (
    <div className="w-full max-w-md mx-auto my-4 font-sans text-slate-800 antialiased shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white">
      
      {/* Realistic Simulated Browser Address Bar */}
      <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center gap-2 text-xs select-none">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
        </div>
        <div className="flex-1 bg-white border border-slate-300 rounded-md px-2 py-1 flex items-center gap-1.5 text-[11px] text-slate-600 truncate font-mono">
          <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
          <span className="text-emerald-700 font-bold">https://</span>
          <span className="truncate">payment.bkash.com/?paymentId={paymentId || 'TR0011...'}&mode=0011</span>
        </div>
      </div>

      {/* Official bKash Tokenized Header */}
      <div className="bg-[#E2136E] text-white p-5 flex flex-col gap-3 relative overflow-hidden">
        {/* Decorative bKash Bird Background Watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-15 pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-28 h-28 fill-current">
            <polygon points="50,10 75,35 50,50" />
            <polygon points="75,35 95,40 70,55" />
            <polygon points="50,50 70,55 45,78" />
            <polygon points="50,10 30,40 50,50" />
            <polygon points="30,40 5,35 30,55" />
            <polygon points="30,55 50,50 45,78" />
            <polygon points="45,78 50,95 58,80" />
          </svg>
        </div>

        <div className="flex items-center justify-between z-10">
          {/* Official bKash Logo with Origami Bird */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-1.5 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <polygon points="50,8 72,32 50,48" fill="#E2136E" />
                <polygon points="72,32 92,38 68,54" fill="#ED1C24" />
                <polygon points="50,48 68,54 44,76" fill="#F7941D" />
                <polygon points="50,8 32,38 50,48" fill="#00AEEF" />
                <polygon points="32,38 8,34 30,54" fill="#ED1C24" />
                <polygon points="30,54 50,48 44,76" fill="#E2136E" />
                <polygon points="44,76 48,94 56,78" fill="#92278F" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-tight">bKash</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-pink-200">Tokenized Checkout</span>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="text-right z-10">
            <span className="text-[10px] text-pink-100 uppercase tracking-wider block font-semibold">Amount</span>
            <span className="text-xl font-black text-white">{formatBDT(amount)}</span>
          </div>
        </div>

        {/* Invoice & Merchant Meta Bar */}
        <div className="bg-black/20 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs z-10">
          <div className="truncate">
            <span className="text-pink-200 text-[11px] block">Merchant</span>
            <span className="font-bold text-white text-xs truncate">BD Shop Online</span>
          </div>
          <div className="text-right">
            <span className="text-pink-200 text-[11px] block">Invoice No</span>
            <span className="font-mono font-bold text-white text-xs">{orderNumber || 'BD-2026-PENDING'}</span>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="p-6 bg-[#FAFAFA] min-h-[300px] flex flex-col justify-between">
        
        {/* STEP 1: Account Number */}
        {step === 'account' && (
          <form onSubmit={handleAccountSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Your bKash Account Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={11}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g 01XXXXXXXXX"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E2136E] focus:ring-2 focus:ring-[#E2136E]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Enter your 11-digit personal bKash account number
              </p>
            </div>

            {/* Terms & Conditions Notice */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#E2136E] focus:ring-[#E2136E] w-4 h-4 cursor-pointer accent-[#E2136E]"
                />
                <span className="leading-snug">
                  Confirm and proceed,{' '}
                  <a
                    href="https://www.bkash.com/tokenized_checkout"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E2136E] underline font-bold hover:text-[#b80e58]"
                  >
                    terms & conditions
                  </a>
                </span>
              </label>
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!agreeTerms}
                className="w-full py-3 px-4 bg-[#E2136E] hover:bg-[#c2105e] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Verification Code (OTP) */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                bKash Verification Code (OTP)
              </label>
              <p className="text-xs text-slate-600">
                Enter the 6-digit verification code sent to <strong className="font-mono text-slate-900">{accountNumber}</strong>
              </p>
              <div className="relative pt-1">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-lg font-mono font-black text-center tracking-[0.3em] text-slate-900 focus:outline-none focus:border-[#E2136E] focus:ring-2 focus:ring-[#E2136E]/20 transition-all placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px]">
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Did not receive code?'}
                </span>
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={() => {
                    setResendTimer(30);
                    toast.success('New OTP sent to ' + accountNumber);
                  }}
                  className="text-xs font-bold text-[#E2136E] hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                >
                  Resend Code
                </button>
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-2.5 text-[11px] text-pink-800">
                💡 <strong>Demo Mode:</strong> You can enter any 6-digit code (e.g. <span className="font-mono font-bold">123456</span>) to proceed.
              </div>
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('account')}
                className="w-full py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#E2136E] hover:bg-[#c2105e] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter bKash PIN */}
        {step === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Enter bKash PIN
              </label>
              <p className="text-xs text-slate-600">
                Account: <strong className="font-mono text-slate-900">{accountNumber}</strong>
              </p>
              <div className="relative pt-1">
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••••"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-2xl font-mono font-black text-center tracking-[0.5em] text-slate-900 focus:outline-none focus:border-[#E2136E] focus:ring-2 focus:ring-[#E2136E]/20 transition-all placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Never share your bKash PIN with anyone.</span>
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-2.5 text-[11px] text-pink-800">
                💡 <strong>Demo Mode:</strong> You can enter any 5-digit PIN (e.g. <span className="font-mono font-bold">12345</span>) to confirm.
              </div>
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('otp')}
                className="w-full py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#E2136E] hover:bg-[#c2105e] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Processing State */}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#E2136E]/20 border-t-[#E2136E] animate-spin flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#E2136E]/10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Processing bKash Payment...</h3>
              <p className="text-xs text-slate-500">Please do not close or refresh this window</p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Verifying with bKash PGW Engine
            </div>
          </div>
        )}

        {/* STEP 5: Success State */}
        {step === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold shadow-lg">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-600">Your bKash transaction has been verified.</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 w-full text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>TrxID:</span>
                <span className="font-bold text-[#E2136E]">{generatedTrxId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <span className="font-bold text-slate-900">{formatBDT(amount)}</span>
              </div>
            </div>
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Redirecting to Order Confirmation...</span>
            </div>
          </div>
        )}

      </div>

      {/* Official bKash Footer */}
      <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Phone className="w-3.5 h-3.5 text-[#E2136E]" />
          <span>16247</span>
        </div>
        <div>
          <span>© 2026 bKash, All Rights Reserved</span>
        </div>
      </div>

    </div>
  );
}
