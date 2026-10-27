'use client';

import React from 'react';
import IrisBackButton from './IrisBackButton';

interface FixedBackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
  accentColor?: string;
  showHomeShortcut?: boolean;
}

export default function FixedBackButton({
  href = '/',
  label = 'BACK TO HOME',
  onClick,
  accentColor = '#38bdf8',
  showHomeShortcut = false,
}: FixedBackButtonProps) {
  return (
    <IrisBackButton
      href={href}
      label={label}
      onClick={onClick}
      accentColor={accentColor}
      showHomeShortcut={showHomeShortcut}
      position="fixed"
    />
  );
}
