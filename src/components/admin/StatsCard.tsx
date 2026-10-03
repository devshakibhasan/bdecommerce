'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, prefix = '', suffix = '', className = '' }: StatsCardProps) {
  const [count, setCount] = useState(0);
  const isNumeric = typeof value === 'number';
  
  useEffect(() => {
    if (!isNumeric) return;
    
    let start = 0;
    const end = value as number;
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value, isNumeric]);

  const displayValue = isNumeric ? count.toLocaleString() : value;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card p-6 rounded-xl border shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-foreground">
            {prefix}{displayValue}{suffix}
          </h3>
        </div>
        <div className="p-3 bg-primary/10 text-primary rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className={`flex items-center gap-1 font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground text-xs">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
