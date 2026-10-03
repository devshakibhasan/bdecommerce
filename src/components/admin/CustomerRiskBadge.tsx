'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShieldCheck, ShieldAlert, AlertTriangle, UserCheck, HelpCircle, Truck, RotateCcw, Clock } from 'lucide-react';
import { formatBDT } from '@/utils/currency';

interface CustomerRiskBadgeProps {
  phone: string;
  size?: 'sm' | 'md';
  showDetailsTooltip?: boolean;
}

export function CustomerRiskBadge({ phone, size = 'sm', showDetailsTooltip = true }: CustomerRiskBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['customer-courier-rating', cleanPhone],
    queryFn: async () => {
      if (!cleanPhone || cleanPhone.length < 9) return null;
      try {
        const res: any = await api.get(`/admin/customer-courier-rating/${cleanPhone}`);
        return res?.data || null;
      } catch (err) {
        return null;
      }
    },
    enabled: !!cleanPhone && cleanPhone.length >= 9,
    staleTime: 60000,
  });

  if (!cleanPhone || cleanPhone.length < 9 || isLoading || !data) {
    return null;
  }

  const rate = data.delivery_success_rate;
  const isHighRisk = data.risk_badge === 'High Return Risk' || data.is_blacklisted || (rate !== null && rate < 65);
  const isVip = data.risk_badge === 'VIP Verified Buyer' || (rate !== null && rate >= 85 && data.total_orders >= 2);

  const getBadgeStyle = () => {
    if (data.is_blacklisted) {
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
    }
    if (isHighRisk) {
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    }
    if (isVip) {
      return 'bg-primary/10 text-primary dark:text-primary border-primary/30';
    }
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
  };

  const getIcon = () => {
    if (data.is_blacklisted) return <ShieldAlert className="w-3 h-3 text-rose-600" />;
    if (isHighRisk) return <AlertTriangle className="w-3 h-3 text-amber-600" />;
    if (isVip) return <ShieldCheck className="w-3 h-3 text-primary" />;
    return <UserCheck className="w-3 h-3 text-blue-600" />;
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-all cursor-pointer ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        } ${getBadgeStyle()}`}
        title="Click to view courier delivery rating & history"
      >
        {getIcon()}
        <span>
          {rate !== null ? `${rate}% Delivery` : data.risk_badge}
        </span>
      </button>

      {/* Popover Details */}
      {isOpen && showDetailsTooltip && (
        <div 
          className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3.5 bg-card text-card-foreground rounded-2xl shadow-xl border border-border text-xs animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="font-bold flex items-center gap-1">
              {getIcon()}
              <span>{data.risk_badge}</span>
            </span>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground font-bold"
            >
              ✕
            </button>
          </div>

          <div className="py-2.5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Delivery Success Rate:</span>
              <span className="font-black text-foreground">{rate !== null ? `${rate}%` : 'No past orders'}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground">Delivered / Total:</span>
              <span className="font-bold text-primary dark:text-primary">
                {data.delivered_orders} delivered of {data.total_orders} orders
              </span>
            </div>
            {data.returned_orders > 0 && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Returned Orders:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{data.returned_orders} returns</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground">Total Lifetime Spent:</span>
              <span className="font-bold text-foreground">৳{formatBDT(data.total_spent)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="text-[10px] font-bold uppercase text-muted-foreground">Recommendation:</div>
            <div className="text-[11px] font-semibold text-primary mt-0.5">
              {data.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
