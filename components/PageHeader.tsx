import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  status?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumb, status, actions }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '24px',
    }}>
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" style={{ marginBottom: '8px' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }}>
              {breadcrumb.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {i > 0 && <span style={{ color: 'var(--iris-text-tertiary)', fontSize: '0.75rem' }}>/</span>}
                  {item.href ? (
                    <a
                      href={item.href}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--iris-text-tertiary)',
                        textDecoration: 'none',
                        fontFamily: 'var(--iris-font-mono)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--iris-text-secondary)',
                      fontFamily: 'var(--iris-font-mono)',
                      letterSpacing: '0.04em',
                    }}>
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {status}
        </div>
        {subtitle && (
          <p style={{ marginTop: '4px', fontSize: '0.875rem', color: 'var(--iris-text-secondary)', maxWidth: '600px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
