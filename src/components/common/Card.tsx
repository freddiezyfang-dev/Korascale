import React from 'react';
import { cn } from '@/design-system/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'light' | 'medium' | 'dark';
  background?: 'primary' | 'secondary' | 'accent';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const shadowClasses = {
  none: 'shadow-none',
  light: 'shadow-light',
  medium: 'shadow-medium',
  dark: 'shadow-dark',
};

const backgroundClasses = {
  primary: 'bg-white',
  secondary: 'bg-[#f5f1e6]',
  accent: 'bg-[#fff6da]',
};

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

export function Card({ 
  children, 
  className,
  padding = 'md',
  shadow = 'light',
  background = 'primary',
  rounded = 'lg',
  ...props
}: CardProps) {
  return (
    <div 
      className={cn(
        paddingClasses[padding],
        shadowClasses[shadow],
        backgroundClasses[background],
        roundedClasses[rounded],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}









