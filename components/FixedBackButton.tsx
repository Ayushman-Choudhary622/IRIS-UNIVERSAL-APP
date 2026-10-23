'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { playClickSound } from '@/lib/audio/soundEffects';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';

interface FixedBackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export default function FixedBackButton({
  href = '/',
  label = 'BACK TO HOME',
  onClick,
}: FixedBackButtonProps) {
  const { interfaceSounds, volume } = useIrisSettings();

  const handleClick = (e: React.MouseEvent) => {
    if (interfaceSounds) {
      playClickSound((volume / 100) * 0.3);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="fixed flex items-center gap-2 px-5 py-3 rounded-full font-extrabold text-xs text-cyan-300 transition-all duration-200 hover:scale-105 select-none"
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '28px',
        zIndex: 99999,
        backgroundColor: 'rgba(8, 16, 28, 0.96)',
        border: '1.5px solid rgba(56, 189, 248, 0.6)',
        boxShadow: '0 0 25px rgba(56, 189, 248, 0.45), 0 8px 24px rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(16px)',
        textDecoration: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      title={label}
    >
      <ChevronLeft size={18} strokeWidth={2.8} className="text-cyan-400" />
      <span className="tracking-wider uppercase">{label}</span>
    </Link>
  );
}
