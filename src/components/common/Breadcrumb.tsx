import Link from 'next/link';
import React from 'react';

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  color?: string; // css color string
  className?: string;
  fontFamily?: string; // css font-family string
  sizeClassName?: string; // tailwind text size classes
}

export function Breadcrumb({
  items,
  color = '#FFFFFF',
  className = '',
  fontFamily = 'Monda, sans-serif',
  sizeClassName = 'text-lg md:text-2xl'
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <div className={`flex items-center gap-2 ${sizeClassName}`} style={{ color, fontFamily }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:underline hover:opacity-80" style={{ color }}>
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'opacity-90' : ''}>{item.label}</span>
              )}
              {!isLast && (
                <span className="opacity-70">/</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}

