'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';
import { playClickSound } from '@/lib/audio/soundEffects';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';

export interface IrisBackButtonProps {
  /** Target fallback URL for previous screen */
  href?: string;
  /** Primary label displayed on button (e.g. "BACK TO GAMES", "BACK TO ENTERTAINMENT", "BACK TO HOME") */
  label?: string;
  /** Optional secondary subtitle */
  subtitle?: string;
  /** When true, renders a quick direct HOME icon button beside the back button */
  showHomeShortcut?: boolean;
  /** Optional custom click handler */
  onClick?: () => void;
  /** Border & accent highlight color */
  accentColor?: string;
  /** Positioning mode */
  position?: 'fixed' | 'static';
  /** Extra CSS class names */
  className?: string;
}

export default function IrisBackButton({
  href = '/',
  label = 'PREVIOUS PAGE',
  subtitle,
  showHomeShortcut = false,
  onClick,
  accentColor = '#38bdf8',
  position = 'fixed',
  className = '',
}: IrisBackButtonProps) {
  const router = useRouter();
  const { interfaceSounds, volume } = useIrisSettings();

  const handleSound = () => {
    if (interfaceSounds) {
      playClickSound((volume / 100) * 0.4);
    }
  };

  const handleBackClick = (e: React.MouseEvent) => {
    handleSound();
    if (onClick) {
      onClick();
    }
    // Navigate explicitly to href if specified
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    handleSound();
    router.push('/');
  };

  const containerStyle: React.CSSProperties = position === 'fixed'
    ? {
        position: 'fixed',
        top: 'calc(clamp(12px, 2.2vh, 26px) + 2px)',
        left: 'calc(clamp(16px, 3.5vw, 48px) + 4px)',
        zIndex: 99999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'auto',
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
      };

  return (
    <div style={containerStyle} className={`iris-back-button-group ${className}`}>
      {/* Primary HUGE Previous Page Back Button */}
      <button
        type="button"
        onClick={handleBackClick}
        title={label}
        aria-label={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: '54px',
          padding: '12px 28px',
          backgroundColor: 'rgba(10, 18, 34, 0.96)',
          border: `2px solid ${accentColor}`,
          borderRadius: '18px',
          color: '#ffffff',
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow: `0 0 24px ${accentColor}55, 0 8px 24px rgba(0, 0, 0, 0.8)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          cursor: 'pointer',
          outline: 'none',
          userSelect: 'none',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${accentColor}25`;
          e.currentTarget.style.borderColor = '#ffffff';
          e.currentTarget.style.boxShadow = `0 0 35px ${accentColor}99, 0 10px 28px rgba(0, 0, 0, 0.9)`;
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(10, 18, 34, 0.96)';
          e.currentTarget.style.borderColor = accentColor;
          e.currentTarget.style.boxShadow = `0 0 24px ${accentColor}55, 0 8px 24px rgba(0, 0, 0, 0.8)`;
          e.currentTarget.style.transform = 'none';
        }}
      >
        <ChevronLeft size={24} strokeWidth={3} style={{ color: accentColor, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <span style={{ lineHeight: 1.15 }}>{label}</span>
          {subtitle && (
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.02em', marginTop: '2px' }}>
              {subtitle}
            </span>
          )}
        </div>
      </button>

      {/* Optional Companion Direct HOME Shortcut */}
      {showHomeShortcut && href !== '/' && (
        <button
          type="button"
          onClick={handleHomeClick}
          title="Jump directly to Home Dashboard"
          aria-label="Jump to Home Dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '54px',
            width: '54px',
            backgroundColor: 'rgba(10, 18, 34, 0.96)',
            border: '2px solid rgba(56, 189, 248, 0.5)',
            borderRadius: '18px',
            color: '#38bdf8',
            boxShadow: '0 0 18px rgba(56, 189, 248, 0.35), 0 8px 24px rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            cursor: 'pointer',
            outline: 'none',
            userSelect: 'none',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.25)';
            e.currentTarget.style.borderColor = '#ffffff';
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(10, 18, 34, 0.96)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <Home size={22} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
