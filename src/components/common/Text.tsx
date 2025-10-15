import React from 'react';
import { cn } from '@/design-system/utils/cn';

interface TextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent';
  align?: 'left' | 'center' | 'right';
  as?: 'p' | 'span' | 'div';
  style?: React.CSSProperties;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const weightClasses = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorClasses = {
  primary: 'text-black',
  secondary: 'text-neutral-600',
  tertiary: 'text-neutral-500',
  inverse: 'text-white',
  accent: 'text-[#1e3b32]',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Text({ 
  children, 
  className,
  size = 'base',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  as: Component = 'p',
  style
}: TextProps) {
  return (
    <Component 
      className={cn(
        'font-body leading-relaxed',
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        className
      )}
      style={style}
    >
      {children}
    </Component>
  );
}



















