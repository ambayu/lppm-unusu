import React from 'react';
import { Link } from 'react-router-dom';

interface RowActionButtonProps {
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function RowActionButton({ to, onClick, variant = 'default', label, disabled = false, children }: RowActionButtonProps) {
  const className = `inline-flex shrink-0 items-center justify-center min-w-[44px] min-h-[44px] rounded-[8px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variant === 'danger'
    ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-800 focus-visible:ring-rose-600'
    : 'border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-800 focus-visible:ring-violet-700'}`;

  if (to && !disabled) {
    return <Link to={to} title={label} aria-label={label} className={className}>{children}</Link>;
  }
  return <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label} className={className}>{children}</button>;
}
