import React from 'react';
import { cn } from '@/design-system/utils/cn';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  align?: 'left' | 'center' | 'right';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent';
  style?: React.CSSProperties;
}

const levelClasses = {
  1: 'text-6xl lg:text-6xl md:text-4xl text-3xl',
  2: 'text-4xl lg:text-4xl md:text-3xl text-2xl',
  3: 'text-2xl lg:text-2xl md:text-xl text-lg',
  4: 'text-xl lg:text-xl md:text-lg text-base',
  5: 'text-lg lg:text-lg md:text-base text-sm',
  6: 'text-base lg:text-base md:text-sm text-xs',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const colorClasses = {
  primary: 'text-black',
  secondary: 'text-neutral-600',
  tertiary: 'text-neutral-500',
  inverse: 'text-white',
  accent: 'text-[#1e3b32]',
};

export function Heading({ 
  children, 
  level = 2, 
  className, 
  align = 'left',
  color = 'primary',
  style
}: HeadingProps) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  
  return (
    <Tag 
      className={cn(
        'font-heading font-bold leading-tight',
        levelClasses[level],
        alignClasses[align],
        colorClasses[color],
        className
      )}
      style={style}
    >
      {children}
    </Tag>
  );
}



















