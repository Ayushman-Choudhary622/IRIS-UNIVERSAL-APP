'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wifi,
  Sun,
  Settings,
  CheckCircle2,
  Activity,
  HeartHandshake,
  Info
} from 'lucide-react';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { sendNtfyNotification } from '@/lib/care/ntfy';
import { playAlertSound, playChimeSound, speakText, playClickSound } from '@/lib/audio/soundEffects';
import IrisCenterLogo3D from '@/components/home/IrisCenterLogo3D';

export default function HomeScreen() {
  const [timeStr, setTimeStr] = useState('09:15 AM');
  const [dateStr, setDateStr] = useState('');
  const [is24Hour, setIs24Hour] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [batteryPct, setBatteryPct] = useState(94);
  const [isCharging, setIsCharging] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const {
    tts,
    speechRate,
    interfaceSounds,
    volume,
    ntfyTopic,
    pinnedHomeTiles = [],
  } = useIrisSettings();

  // Real-time live clock (format hh:mm AM/PM or HH:mm)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      if (is24Hour) {
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setTimeStr(`${hours}:${minutes}`);
      } else {
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const hoursStr = hours.toString().padStart(2, '0');
        const minutesStr = now.getMinutes().toString().padStart(2, '0');
        setTimeStr(`${hoursStr}:${minutesStr} ${ampm}`);
      }

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
      setDateStr(now.toLocaleDateString('en-US', options));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [is24Hour]);

  // Battery status API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryPct(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        setBatteryPct(94);
      });
    }
  }, []);

  // Emergency SOS trigger
  const handleEmergencySOS = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmergencySent(true);

    const soundVol = (volume / 100) * 0.55;
    if (interfaceSounds) {
      playAlertSound(soundVol);
    }

    if (tts) {
      speakText('Emergency SOS! Assistance requested immediately!', speechRate);
    }

    // Push notification to caregiver's mobile phone via ntfy.sh
    sendNtfyNotification({
      title: '🚨 IRIS EMERGENCY SOS',
      message: 'Urgent assistance requested from IRIS Dashboard!',
      priority: 'urgent',
      tags: ['sos', 'warning', 'rotating_light'],
      topic: ntfyTopic,
    });

    // Quiet auto-dismiss of badge after 4s (zero fatigue)
    setTimeout(() => {
      setEmergencySent(false);
    }, 4500);
  };

  const toggleClockFormat = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.2);
    setIs24Hour(!is24Hour);
  };

  return (
    <div
      className="iris-home-viewport"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setMouseTilt({ x: x * 16, y: -y * 16 });
      }}
      onMouseLeave={() => setMouseTilt({ x: 0, y: 0 })}
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        backgroundColor: '#070b12',
        backgroundImage: 'radial-gradient(circle at 50% 48%, #0d1524 0%, #05080e 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(8px, 1.5vh, 18px) clamp(12px, 2.2vw, 36px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* Top Status Bar: IRIS Branding, Mode indicator, and System Glyphs          */}
      {/* ========================================================================= */}
      <div
        className="kiosk-status-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
          margin: '0',
          padding: '2px 8px',
          zIndex: 10,
        }}
      >
        {/* Left: IRIS Developed by Ayushman Choudhary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#e2e8f0',
                letterSpacing: '0.02em',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                textShadow: '0 0 14px rgba(56, 189, 248, 0.35)',
              }}
            >
              Developed by Ayushman Choudhary
            </span>
          </div>
        </div>

        {/* Right: Signal Bars, WiFi, and Battery */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: '#94a3b8',
          }}
        >
          {/* Signal 4-Bars */}
          <div
            title="Mesh Network: Strong"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2.5px',
              height: '14px',
              cursor: 'help',
            }}
          >
            <div style={{ width: '3px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '0.8px' }} />
            <div style={{ width: '3px', height: '7px', backgroundColor: '#cbd5e1', borderRadius: '0.8px' }} />
            <div style={{ width: '3px', height: '10px', backgroundColor: '#cbd5e1', borderRadius: '0.8px' }} />
            <div style={{ width: '3px', height: '14px', backgroundColor: '#cbd5e1', borderRadius: '0.8px' }} />
          </div>

          {/* Wi-Fi Icon */}
          <div title="Wi-Fi 5 GHz: Connected" style={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
            <Wifi size={18} strokeWidth={2.2} style={{ color: '#cbd5e1' }} />
          </div>

          {/* Battery Glyph with Live Percentage Indicator */}
          <div
            title={`${batteryPct}% ${isCharging ? '(Charging)' : 'Battery'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'help',
            }}
          >
            <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>
              {batteryPct}%
            </span>
            <div
              style={{
                width: '24px',
                height: '12px',
                border: '1.5px solid #94a3b8',
                borderRadius: '3.5px',
                display: 'flex',
                alignItems: 'center',
                padding: '1.5px',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* Internal Charge Bar */}
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(15, batteryPct))}%`,
                  backgroundColor: batteryPct > 20 ? '#cbd5e1' : '#f43f5e',
                  borderRadius: '1px',
                  transition: 'width 0.3s ease',
                }}
              />
              {/* Positive Terminal Nub */}
              <div
                style={{
                  position: 'absolute',
                  right: '-3.5px',
                  top: '2.5px',
                  width: '2px',
                  height: '4px',
                  backgroundColor: '#94a3b8',
                  borderRadius: '0 1px 1px 0',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Main Screen Content: 3-Column Arena (Left Cards | Center Eye | Right Cards)*/}
      {/* ========================================================================= */}
      <div
        className="iris-home-arena"
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr) minmax(0, 1fr)',
          gap: 'clamp(14px, 2.2vw, 36px)',
          alignItems: 'stretch',
          flex: 1,
          height: 'calc(100% - 50px)',
          minHeight: 0,
          boxSizing: 'border-box',
          padding: 'clamp(4px, 1vh, 12px) 0',
        }}
      >
        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 1 (LEFT): 2 Core Tiles (Communication, Caretaker App) + Optional */}
        {/* ----------------------------------------------------------------------- */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(10px, 1.6vh, 20px)',
            justifyContent: 'space-between',
            height: '100%',
            minHeight: 0,
          }}
        >
          {/* Core Tile 1: Communication */}
          <Link
            href="/communication"
            onClick={() => {
              if (interfaceSounds) playClickSound((volume / 100) * 0.3);
            }}
            onMouseEnter={() => setHoveredCard('comm')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              flex: 1,
              minHeight: 0,
              backgroundColor: hoveredCard === 'comm' ? 'rgba(14, 28, 48, 0.95)' : 'rgba(10, 18, 32, 0.85)',
              border: hoveredCard === 'comm' ? '1.5px solid #38bdf8' : '1.5px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '24px',
              padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: hoveredCard === 'comm'
                ? '0 0 35px rgba(56, 189, 248, 0.65), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(56, 189, 248, 0.22)'
                : '0 0 22px rgba(2, 132, 199, 0.35), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(2, 132, 199, 0.12)',
              transform: hoveredCard === 'comm' ? 'translateY(-3px) scale(1.02)' : 'none',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                marginBottom: 'clamp(6px, 1vh, 12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: hoveredCard === 'comm' ? 'scale(1.1)' : 'none',
                transition: 'transform 0.2s ease',
                filter: hoveredCard === 'comm' ? 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.8))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
              }}
            >
              <svg width="38" height="38" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 'clamp(16px, 1.55vw, 22px)',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              Communication
            </span>
          </Link>

          {/* Core Tile 2: Caretaker App */}
          <Link
            href="/caretaker"
            onClick={() => {
              if (interfaceSounds) playClickSound((volume / 100) * 0.3);
            }}
            onMouseEnter={() => setHoveredCard('caretaker')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              flex: 1,
              minHeight: 0,
              backgroundColor: hoveredCard === 'caretaker' ? 'rgba(10, 32, 36, 0.95)' : 'rgba(8, 20, 26, 0.85)',
              border: hoveredCard === 'caretaker' ? '1.5px solid #2dd4bf' : '1.5px solid rgba(45, 212, 191, 0.3)',
              borderRadius: '24px',
              padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: hoveredCard === 'caretaker'
                ? '0 0 35px rgba(45, 212, 191, 0.65), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(45, 212, 191, 0.22)'
                : '0 0 22px rgba(13, 148, 136, 0.35), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(13, 148, 136, 0.12)',
              transform: hoveredCard === 'caretaker' ? 'translateY(-3px) scale(1.02)' : 'none',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                marginBottom: 'clamp(6px, 1vh, 12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: hoveredCard === 'caretaker' ? 'scale(1.1)' : 'none',
                transition: 'transform 0.2s ease',
                filter: hoveredCard === 'caretaker' ? 'drop-shadow(0 0 12px rgba(45, 212, 191, 0.8))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
              }}
            >
              <HeartHandshake size={38} strokeWidth={2.4} style={{ color: '#ffffff' }} />
            </div>
            <span
              style={{
                fontSize: 'clamp(16px, 1.55vw, 22px)',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              Caretaker App
            </span>
          </Link>

          {/* Optional Tile on Left: Entertainment (if selected in Settings) */}
          {pinnedHomeTiles.includes('entertainment') && (
            <Link
              href="/entertainment"
              onClick={() => {
                if (interfaceSounds) playClickSound((volume / 100) * 0.3);
              }}
              onMouseEnter={() => setHoveredCard('opt-entertainment')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                flex: 1,
                minHeight: 0,
                backgroundColor: hoveredCard === 'opt-entertainment' ? 'rgba(26, 18, 52, 0.95)' : 'rgba(14, 12, 30, 0.85)',
                border: hoveredCard === 'opt-entertainment' ? '1.5px solid #c084fc' : '1.5px solid rgba(192, 132, 252, 0.3)',
                borderRadius: '24px',
                padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: hoveredCard === 'opt-entertainment'
                  ? '0 0 35px rgba(192, 132, 252, 0.65), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(192, 132, 252, 0.22)'
                  : '0 0 22px rgba(147, 51, 234, 0.35), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(147, 51, 234, 0.12)',
                transform: hoveredCard === 'opt-entertainment' ? 'translateY(-3px) scale(1.02)' : 'none',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  marginBottom: 'clamp(6px, 1vh, 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: hoveredCard === 'opt-entertainment' ? 'scale(1.1)' : 'none',
                  transition: 'transform 0.2s ease',
                  filter: hoveredCard === 'opt-entertainment' ? 'drop-shadow(0 0 12px rgba(192, 132, 252, 0.8))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
                }}
              >
                <svg width="38" height="38" viewBox="0 0 24 24" fill="white">
                  <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 'clamp(16px, 1.55vw, 22px)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                Entertainment
              </span>
            </Link>
          )}

          {/* Optional Tile on Left: Smart Room IoT (if selected and Left has fewer optional tiles) */}
          {pinnedHomeTiles.includes('iot') && (!pinnedHomeTiles.includes('entertainment') || pinnedHomeTiles.includes('health')) && (
            <Link
              href="/settings"
              onClick={() => {
                if (interfaceSounds) playClickSound((volume / 100) * 0.3);
              }}
              onMouseEnter={() => setHoveredCard('opt-iot')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                flex: 1,
                minHeight: 0,
                backgroundColor: hoveredCard === 'opt-iot' ? 'rgba(12, 28, 48, 0.95)' : 'rgba(8, 18, 34, 0.85)',
                border: hoveredCard === 'opt-iot' ? '1.5px solid #38bdf8' : '1.5px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '24px',
                padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: hoveredCard === 'opt-iot'
                  ? '0 0 35px rgba(56, 189, 248, 0.65), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(56, 189, 248, 0.22)'
                  : '0 0 22px rgba(56, 189, 248, 0.35), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(56, 189, 248, 0.12)',
                transform: hoveredCard === 'opt-iot' ? 'translateY(-3px) scale(1.02)' : 'none',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  marginBottom: 'clamp(6px, 1vh, 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: hoveredCard === 'opt-iot' ? 'scale(1.1)' : 'none',
                  transition: 'transform 0.2s ease',
                  filter: hoveredCard === 'opt-iot' ? 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.8))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
                }}
              >
                <Sun size={38} strokeWidth={2.4} style={{ color: '#ffffff' }} />
              </div>
              <span
                style={{
                  fontSize: 'clamp(16px, 1.55vw, 22px)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                Smart Room IoT
              </span>
            </Link>
          )}
        </div>
        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 2 (CENTER): Giant Clock & User's 3D Dynamic Cybernetic IRIS Logo */}
        {/* ----------------------------------------------------------------------- */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 0,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Main Brand Title: IRIS UNIVERSAL */}
          <h1
            style={{
              fontSize: 'clamp(28px, 3.4vw, 54px)',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 clamp(2px, 0.4vh, 6px) 0',
              padding: 0,
              lineHeight: 1.1,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              background: 'linear-gradient(180deg, #ffffff 20%, #e0f2fe 60%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 25px rgba(56, 189, 248, 0.55)) drop-shadow(0 0 50px rgba(6, 182, 212, 0.35))',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            IRIS UNIVERSAL
          </h1>

          {/* Top of Center: Giant Digital Clock */}
          <button
            onClick={toggleClockFormat}
            title={`Click to switch format (${is24Hour ? '12-hour' : '24-hour'}) • Today is ${dateStr}`}
            style={{
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              margin: '0 0 clamp(4px, 1vh, 12px) 0',
              outline: 'none',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(46px, 5.5vw, 84px)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                textShadow: '0 0 25px rgba(255, 255, 255, 0.4), 0 0 45px rgba(56, 189, 248, 0.3)',
                transition: 'opacity 0.2s ease',
              }}
            >
              {timeStr}
            </div>
          </button>

          {/* User's Authentic IRIS Logo in 3D with Live Celsius Weather */}
          <IrisCenterLogo3D mouseTilt={mouseTilt} />
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 3 (RIGHT): 2 Core Tiles (Emergency SOS, Settings) + Optional     */}
        {/* ----------------------------------------------------------------------- */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(10px, 1.6vh, 20px)',
            justifyContent: 'space-between',
            height: '100%',
            minHeight: 0,
          }}
        >
          {/* Core Tile 3: Emergency / SOS */}
          <button
            onClick={handleEmergencySOS}
            onMouseEnter={() => setHoveredCard('emergency')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              position: 'relative',
              backgroundColor: hoveredCard === 'emergency' ? 'rgba(38, 12, 18, 0.95)' : 'rgba(24, 8, 12, 0.85)',
              border: hoveredCard === 'emergency' ? '2px solid #f43f5e' : '1.5px solid rgba(244, 63, 94, 0.45)',
              borderRadius: '24px',
              padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: hoveredCard === 'emergency'
                ? '0 0 42px rgba(244, 63, 94, 0.75), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(244, 63, 94, 0.3)'
                : '0 0 24px rgba(225, 29, 72, 0.45), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(225, 29, 72, 0.18)',
              transform: hoveredCard === 'emergency' ? 'translateY(-3px) scale(1.02)' : 'none',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* SOS Badge Trigger Feedback */}
            {emergencySent && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '14px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: '8px',
                  boxShadow: '0 0 12px #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={12} />
                <span>SENT</span>
              </div>
            )}

            {/* Giant SOS Text Icon */}
            <div
              style={{
                fontSize: 'clamp(32px, 3.8vw, 52px)',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '0.04em',
                marginBottom: 'clamp(4px, 0.8vh, 8px)',
                textShadow: '0 0 20px rgba(255, 77, 109, 0.75)',
                transform: hoveredCard === 'emergency' ? 'scale(1.08)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            >
              SOS
            </div>

            <span
              style={{
                fontSize: 'clamp(16px, 1.55vw, 22px)',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              Emergency
            </span>
          </button>

          {/* Optional Tile on Right: Health Monitoring (if selected in Settings) */}
          {pinnedHomeTiles.includes('health') && (
            <Link
              href="/health"
              onClick={() => {
                if (interfaceSounds) playClickSound((volume / 100) * 0.3);
              }}
              onMouseEnter={() => setHoveredCard('opt-health')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                flex: 1,
                minHeight: 0,
                backgroundColor: hoveredCard === 'opt-health' ? 'rgba(10, 32, 24, 0.95)' : 'rgba(6, 20, 16, 0.85)',
                border: hoveredCard === 'opt-health' ? '1.5px solid #34d399' : '1.5px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '24px',
                padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: hoveredCard === 'opt-health'
                  ? '0 0 35px rgba(52, 211, 153, 0.65), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(52, 211, 153, 0.22)'
                  : '0 0 22px rgba(16, 185, 129, 0.35), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(16, 185, 129, 0.12)',
                transform: hoveredCard === 'opt-health' ? 'translateY(-3px) scale(1.02)' : 'none',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  marginBottom: 'clamp(6px, 1vh, 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: hoveredCard === 'opt-health' ? 'scale(1.1)' : 'none',
                  transition: 'transform 0.2s ease',
                  filter: hoveredCard === 'opt-health' ? 'drop-shadow(0 0 12px rgba(52, 211, 153, 0.8))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
                }}
              >
                <Activity size={38} strokeWidth={2.4} style={{ color: '#ffffff' }} />
              </div>
              <span
                style={{
                  fontSize: 'clamp(16px, 1.55vw, 22px)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                Health Monitoring
              </span>
            </Link>
          )}

          {/* Optional Tile on Right: Smart Room IoT (if selected and Right has fewer optional tiles) */}
          {pinnedHomeTiles.includes('iot') && pinnedHomeTiles.includes('entertainment') && !pinnedHomeTiles.includes('health') && (
            <Link
              href="/settings"
              onClick={() => {
                if (interfaceSounds) playClickSound((volume / 100) * 0.3);
              }}
              onMouseEnter={() => setHoveredCard('opt-r-iot')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                flex: 1,
                minHeight: 0,
                backgroundColor: hoveredCard === 'opt-r-iot' ? 'rgba(12, 28, 48, 0.95)' : 'rgba(8, 18, 34, 0.85)',
                border: hoveredCard === 'opt-r-iot' ? '1.5px solid #38bdf8' : '1.5px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '24px',
                padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: hoveredCard === 'opt-r-iot'
                  ? '0 0 35px rgba(56, 189, 248, 0.65), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(56, 189, 248, 0.22)'
                  : '0 0 22px rgba(56, 189, 248, 0.35), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(56, 189, 248, 0.12)',
                transform: hoveredCard === 'opt-r-iot' ? 'translateY(-3px) scale(1.02)' : 'none',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  marginBottom: 'clamp(6px, 1vh, 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: hoveredCard === 'opt-r-iot' ? 'scale(1.1)' : 'none',
                  transition: 'transform 0.2s ease',
                  filter: hoveredCard === 'opt-r-iot' ? 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.8))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
                }}
              >
                <Sun size={38} strokeWidth={2.4} style={{ color: '#ffffff' }} />
              </div>
              <span
                style={{
                  fontSize: 'clamp(16px, 1.55vw, 22px)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                Smart Room IoT
              </span>
            </Link>
          )}

          {/* Core Tile 4: Settings */}
          <Link
            href="/settings"
            onClick={() => {
              if (interfaceSounds) playClickSound((volume / 100) * 0.3);
            }}
            onMouseEnter={() => setHoveredCard('settings')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              flex: 1,
              minHeight: 0,
              backgroundColor: hoveredCard === 'settings' ? 'rgba(12, 26, 48, 0.95)' : 'rgba(8, 16, 32, 0.85)',
              border: hoveredCard === 'settings' ? '1.5px solid #60a5fa' : '1.5px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '24px',
              padding: 'clamp(10px, 1.8vh, 26px) clamp(12px, 1.6vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: hoveredCard === 'settings'
                ? '0 0 35px rgba(96, 165, 250, 0.65), 0 14px 32px rgba(0, 0, 0, 0.65), inset 0 0 18px rgba(96, 165, 250, 0.22)'
                : '0 0 22px rgba(37, 99, 235, 0.35), 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 10px rgba(37, 99, 235, 0.12)',
              transform: hoveredCard === 'settings' ? 'translateY(-3px) scale(1.02)' : 'none',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                marginBottom: 'clamp(6px, 1vh, 12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: hoveredCard === 'settings' ? 'scale(1.1)' : 'none',
                transition: 'transform 0.2s ease',
                filter: hoveredCard === 'settings' ? 'drop-shadow(0 0 12px rgba(96, 165, 250, 0.8))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))',
              }}
            >
              <Settings size={38} strokeWidth={2.4} style={{ color: '#ffffff' }} />
            </div>
            <span
              style={{
                fontSize: 'clamp(16px, 1.55vw, 22px)',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              Settings
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
