import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border';
  
  const variants = {
    default: 'bg-[#F5F5F3] text-[#171717] border-[#E5E5E5]',
    success: 'bg-[#F2F7F4] text-[#2E6B47] border-[#D1E7DD]',
    warning: 'bg-[#FDF9F2] text-[#9A6700] border-[#FCEEC7]',
    danger: 'bg-[#FDF3F2] text-[#B83232] border-[#FADBD8]',
    accent: 'bg-[#FDF6F0] text-[#D97736] border-[#F5DAC7]',
    outline: 'bg-transparent text-[#737373] border-[#E5E5E5]',
  };

  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
}

