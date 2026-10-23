import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  interactive?: boolean;
  highlight?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  tabIndex?: number;
  role?: string;
  'aria-label'?: string;
}

export default function GlassCard({
  children,
  interactive = false,
  highlight = false,
  style,
  className = '',
  onClick,
  tabIndex,
  role,
  'aria-label': ariaLabel,
}: GlassCardProps) {
  const baseClass = highlight
    ? 'glass-card-highlight'
    : interactive
      ? 'glass-card-interactive'
      : 'glass-card';

  const Component = interactive || onClick ? 'button' : 'div';

  return (
    <Component
      className={`${baseClass} ${className}`}
      style={{ textAlign: 'left', width: '100%', ...style }}
      onClick={onClick}
      tabIndex={tabIndex}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
}
