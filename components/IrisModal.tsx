'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface IrisModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function IrisModal({ open, onClose, title, children, maxWidth = '560px' }: IrisModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (!open && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Content */}
      <div
        ref={dialogRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth,
          maxHeight: '80vh',
          overflow: 'auto',
          background: 'var(--iris-bg-surface)',
          border: '1px solid var(--iris-border)',
          borderRadius: 'var(--iris-radius-xl)',
          padding: '24px',
        }}
      >
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h2>
            <button
              onClick={onClose}
              className="iris-btn iris-btn-icon"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
