import React from 'react';
import { cn } from '@/design-system/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
}

const variantClasses = {
  primary: 'bg-[#1e3b32] text-white hover:bg-[#1a342c] focus:ring-[#1e3b32]',
  secondary: 'bg-[#f5f1e6] text-[#1e3b32] hover:bg-[#e8e0d0] focus:ring-[#1e3b32]',
  outline: 'border-2 border-[#1e3b32] text-[#1e3b32] hover:bg-[#1e3b32] hover:text-white focus:ring-[#1e3b32]',
  ghost: 'text-[#1e3b32] hover:bg-[#f5f1e6] focus:ring-[#1e3b32]',
  link: 'text-[#1e3b32] underline hover:text-[#1a342c] focus:ring-[#1e3b32]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  href,
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-body font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href) {
    return (
      <a 
        href={href}
        className={classes}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = href;
          }
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <button 
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}






























