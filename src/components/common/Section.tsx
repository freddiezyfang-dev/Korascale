import React from 'react';
import { cn } from '@/design-system/utils/cn';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
}

const backgroundClasses = {
  primary: 'bg-white',
  secondary: 'bg-[#f5f1e6]',
  tertiary: 'bg-[#1e3b32]',
  accent: 'bg-[#fff6da]',
};

const paddingClasses = {
  none: 'py-0',
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
  xl: 'py-20',
};

export function Section({ 
  children, 
  className, 
  background = 'primary',
  padding = 'lg',
  id
}: SectionProps) {
  return (
    <section 
      id={id}
      className={cn(
        backgroundClasses[background],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </section>
  );
}

































