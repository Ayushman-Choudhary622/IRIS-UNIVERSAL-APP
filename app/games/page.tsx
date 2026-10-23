'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Feather, Compass, Navigation, Plane, ArrowRight, Wifi } from 'lucide-react';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { playClickSound } from '@/lib/audio/soundEffects';

export default function GamingHub() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
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

  const GAMES = [
    {
      id: 'dino',
      title: 'DINO GLIDE',
      tag: 'FLOAT JUMP',
      desc: 'Blink or move cursor up to leap over desert obstacles with smooth physics.',
      href: '/games/dino',
      icon: Feather,
      color: '#38bdf8',
      accent: 'rgba(56, 189, 248, 0.45)',
    },
    {
      id: 'flappy',
      title: 'AERO GLIDE',
      tag: 'ALTITUDE CRUISE',
      desc: 'Guide your aerodynamic glider through glowing energy rings with gentle cursor drift.',
      href: '/games/flappy',
      icon: Compass,
      color: '#06b6d4',
      accent: 'rgba(6, 182, 212, 0.45)',
    },
    {
      id: 'runner',
      title: 'NEON RUNNER',
      tag: 'LANE SWITCH',
      desc: 'Steer between 3 high-speed cybernetic lanes, collecting gems and dodging lasers.',
      href: '/games/runner',
      icon: Navigation,
      color: '#c084fc',
      accent: 'rgba(192, 132, 252, 0.45)',
    },
    {
      id: 'flight-sim',
      title: 'FLIGHT SIMULATION',
      tag: '3D COCKPIT',
      desc: 'Pilot a 3D aircraft with live cursor flight controls, rushing airflows, and aerodynamic banking.',
      href: '/simulations/flight',
      icon: Plane,
      color: '#10b981',
      accent: 'rgba(16, 185, 129, 0.45)',
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
        {/* Left: BACK TO ENTERTAINMENT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifySelf: 'start' }}>
          <Link
            href="/entertainment"
            onClick={handleClick}
            title="Return to Entertainment Menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '2px solid #c084fc',
              borderRadius: '16px',
              padding: '10px 24px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 0 24px rgba(192, 132, 252, 0.45), 0 4px 14px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            <ChevronLeft size={22} strokeWidth={2.6} style={{ color: '#c084fc' }} />
            <span>BACK TO ENTERTAINMENT</span>
          </Link>

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '18px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textShadow: '0 0 12px rgba(192, 132, 252, 0.5)',
            }}
          >
            {timeStr}
          </span>
        </div>

        {/* Center: GAMING Header */}
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
          GAMING
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

      {/* 2. CENTER CONTENT: 4 CLEAN, EXPANSIVE GAME & SIMULATION CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'clamp(14px, 1.8vw, 28px)',
          width: '100%',
          maxWidth: '1360px',
          margin: 'auto',
          alignItems: 'center',
        }}
      >
        {GAMES.map((game) => {
          const Icon = game.icon;
          const isHovered = hoveredGame === game.id;

          return (
            <Link
              key={game.id}
              href={game.href}
              onClick={handleClick}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              style={{
                backgroundColor: isHovered ? 'rgba(18, 30, 52, 0.95)' : 'rgba(10, 18, 34, 0.88)',
                border: isHovered ? `3px solid ${game.color}` : '2px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '28px',
                padding: 'clamp(28px, 3.5vh, 44px) 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: isHovered
                  ? `0 0 45px ${game.accent}, inset 0 0 20px ${game.color}22`
                  : '0 0 24px rgba(0, 0, 0, 0.4)',
                transform: isHovered ? 'scale(1.04) translateY(-4px)' : 'none',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(16px)',
                position: 'relative',
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '24px',
                  backgroundColor: `${game.color}15`,
                  border: `2px solid ${game.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: `0 0 24px ${game.color}33`,
                  transform: isHovered ? 'scale(1.1)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              >
                <Icon size={44} style={{ color: game.color }} />
              </div>

              {/* Title & Tag */}
              <h2
                style={{
                  fontSize: 'clamp(20px, 2.2vw, 26px)',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: '0 0 8px 0',
                  letterSpacing: '0.04em',
                }}
              >
                {game.title}
              </h2>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: game.color,
                  backgroundColor: `${game.color}18`,
                  border: `1px solid ${game.color}55`,
                  padding: '3px 12px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {game.tag}
              </span>

              {/* Description */}
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                  margin: '0 0 28px 0',
                  minHeight: '40px',
                }}
              >
                {game.desc}
              </p>

              {/* Play Button */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: game.color,
                  color: '#070b12',
                  padding: '12px 24px',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 0 20px ${game.color}66`,
                  transition: 'transform 0.15s ease',
                  transform: isHovered ? 'scale(1.02)' : 'none',
                }}
              >
                <span>PLAY NOW</span>
                <ArrowRight size={18} strokeWidth={2.6} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. BOTTOM FOOTER */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
        Hands-Free Head Cursor & Blink Control · Zero Fatigue Gaming
      </div>
    </div>
  );
}
