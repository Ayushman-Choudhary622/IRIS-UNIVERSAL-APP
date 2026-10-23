'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Gamepad2, Plane, Headphones, BookOpen, Wifi } from 'lucide-react';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { playClickSound } from '@/lib/audio/soundEffects';

export default function EntertainmentHub() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState('09:15');
  const [batteryPct, setBatteryPct] = useState(94);
  const { interfaceSounds, volume } = useIrisSettings();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryPct(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryPct(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  const handleClick = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
  };

  const CARDS = [
    {
      id: 'gaming',
      title: 'GAMING',
      subtitle: 'Dino, Aero & Neon Runner',
      href: '/games',
      icon: Gamepad2,
      color: '#38bdf8',
      accent: 'rgba(56, 189, 248, 0.45)',
    },
    {
      id: 'flight-simulation',
      title: 'FLIGHT SIMULATION',
      subtitle: '3D Cockpit & Aerodynamic Flight',
      href: '/simulations/flight',
      icon: Plane,
      color: '#06b6d4',
      accent: 'rgba(6, 182, 212, 0.45)',
    },
    {
      id: 'music',
      title: 'MUSIC PLAYER',
      subtitle: '4 Curated Masterpieces',
      href: '/music',
      icon: Headphones,
      color: '#a855f7',
      accent: 'rgba(168, 85, 247, 0.45)',
    },
    {
      id: 'audiobooks',
      title: 'AUDIOBOOKS',
      subtitle: 'हिंदी कहानियां & Classics',
      href: '/audiobooks',
      icon: BookOpen,
      color: '#f59e0b',
      accent: 'rgba(245, 158, 11, 0.45)',
    },
  ];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#070b12',
        backgroundImage: 'radial-gradient(circle at 50% 35%, #0f182b 0%, #05080f 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(12px, 2.2vh, 26px) clamp(16px, 3.5vw, 48px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. TOP STATUS BAR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          padding: '2px 4px',
        }}
      >
        {/* Left: BACK TO HOME */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifySelf: 'start' }}>
          <Link
            href="/"
            onClick={handleClick}
            title="Return to IRIS Home Dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '2px solid #38bdf8',
              borderRadius: '16px',
              padding: '10px 24px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.45), 0 4px 14px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            <Home size={22} strokeWidth={2.4} style={{ color: '#38bdf8' }} />
            <span>BACK TO HOME</span>
          </Link>

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '18px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textShadow: '0 0 12px rgba(56, 189, 248, 0.5)',
            }}
          >
            {timeStr}
          </span>
        </div>

        {/* Center: ENTERTAINMENT Header */}
        <h1
          style={{
            fontSize: 'clamp(24px, 2.8vw, 36px)',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
            textAlign: 'center',
            justifySelf: 'center',
            background: 'linear-gradient(90deg, #ffffff 15%, #e0e7ff 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 24px rgba(192, 132, 252, 0.5))',
          }}
        >
          ENTERTAINMENT
        </h1>

        {/* Right: Signal, Wi-Fi, and Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#94a3b8', justifySelf: 'end' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2.5px', height: '14px' }}>
            <div style={{ width: '3px', height: '4px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '7px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '10px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '14px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
          </div>
          <Wifi size={18} strokeWidth={2.2} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#cbd5e1', fontWeight: 600 }}>
            {batteryPct}%
          </span>
        </div>
      </div>

      {/* 2. CENTER CONTENT: 4 MINIMAL, CLEAN CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'clamp(16px, 2.2vw, 32px)',
          width: '100%',
          maxWidth: '1300px',
          margin: 'auto',
          alignItems: 'center',
        }}
      >
        {CARDS.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.id;

          return (
            <Link
              key={card.id}
              href={card.href}
              onClick={handleClick}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: isHovered ? 'rgba(18, 30, 52, 0.95)' : 'rgba(10, 18, 34, 0.88)',
                border: isHovered ? `3px solid ${card.color}` : '2px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '28px',
                aspectRatio: '1 / 1',
                padding: 'clamp(20px, 3vh, 36px) 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: isHovered
                  ? `0 0 45px ${card.accent}, inset 0 0 20px ${card.color}22`
                  : '0 0 20px rgba(0, 0, 0, 0.4)',
                transform: isHovered ? 'scale(1.04) translateY(-4px)' : 'none',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon
                  size={68}
                  strokeWidth={2.4}
                  style={{
                    color: isHovered ? card.color : '#ffffff',
                    filter: `drop-shadow(0 0 16px ${card.color}66)`,
                    transform: isHovered ? 'scale(1.08)' : 'none',
                    transition: 'transform 0.2s ease, color 0.2s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    fontSize: 'clamp(20px, 2vw, 25px)',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  {card.title}
                </span>
                <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 600 }}>
                  {card.subtitle}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. BOTTOM FOOTER HINT */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
        Hands-Free Assisted Living & Entertainment · IRIS Universal
      </div>
    </div>
  );
}
