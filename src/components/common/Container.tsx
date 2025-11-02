import React from 'react';
import { cn } from '@/design-system/utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: 'px-0',
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-6',
};

export function Container({ 
  children, 
  className, 
  size = 'lg', 
  padding = 'md' 
}: ContainerProps) {
  return (
    <div 
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}































