'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';

export default function AssistiveCursor() {
  const { yaw, pitch, blink, mode } = useIrisInput();
  const { showVirtualCursor, invertX, invertY } = useIrisSettings();
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isBlinking, setIsBlinking] = useState(false);
  const posRef = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Initial center
    posRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
    };
  }, []);

  useEffect(() => {
    if (!showVirtualCursor || typeof window === 'undefined') return;

    // Calculate target position based on yaw and pitch
    const effectiveYaw = invertX ? -yaw : yaw;
    const effectivePitch = invertY ? -pitch : pitch;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Map -1..1 to 0..window size with a comfortable margin
    const targetX = (effectiveYaw * 0.5 + 0.5) * w;
    const targetY = (effectivePitch * 0.5 + 0.5) * h;

    posRef.current.targetX = targetX;
    posRef.current.targetY = targetY;
  }, [yaw, pitch, invertX, invertY, showVirtualCursor]);

  // Smooth cursor motion loop
  useEffect(() => {
    if (!showVirtualCursor) return;
    let animId: number;

    const update = () => {
      const p = posRef.current;
      p.x += (p.targetX - p.x) * 0.2;
      p.y += (p.targetY - p.y) * 0.2;
      setPos({ x: p.x, y: p.y });
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [showVirtualCursor]);

  // Visual blink feedback
  useEffect(() => {
    if (blink) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 240);
      return () => clearTimeout(timer);
    }
  }, [blink]);

  if (!showVirtualCursor) return null;

  return (
    <div
      className="pointer-events-none fixed z-[9999] transition-opacity duration-300"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Outer tracking ring */}
      <div
        className={`w-8 h-8 rounded-full border border-[var(--iris-cyan)] flex items-center justify-center transition-transform duration-100 ${
          isBlinking ? 'scale-150 bg-[var(--iris-cyan)]/30' : 'scale-100'
        }`}
        style={{
          boxShadow: isBlinking
            ? '0 0 25px var(--iris-cyan), inset 0 0 10px var(--iris-cyan)'
            : '0 0 12px rgba(103, 232, 249, 0.4)',
        }}
      >
        {/* Reticle cross marks */}
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--iris-cyan)] shadow-[0_0_8px_var(--iris-cyan)]" />
      </div>

      {/* Mode Tag */}
      <div className="absolute top-9 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-[var(--iris-border)] text-[9px] font-mono tracking-widest text-[var(--iris-cyan)] whitespace-nowrap opacity-75">
        {mode.toUpperCase()}
      </div>
    </div>
  );
}
