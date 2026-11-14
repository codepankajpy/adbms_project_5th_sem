import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div className={`bg-white border border-[#E5E5E5] rounded-md shadow-none ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#737373] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

