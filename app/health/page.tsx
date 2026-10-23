'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FixedBackButton from '@/components/FixedBackButton';
import {
  ChevronLeft,
  Wifi,
  Activity,
  Heart,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Pill,
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { sendNtfyNotification } from '@/lib/care/ntfy';
import { playAlertSound, playChimeSound, playClickSound, speakText } from '@/lib/audio/soundEffects';

export default function HealthMonitoringPage() {
  const [timeStr, setTimeStr] = useState('09:15');
  const [batteryPct, setBatteryPct] = useState(94);
  const [bpm, setBpm] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [tempF, setTempF] = useState(98.4);
  const [bpSys, setBpSys] = useState(118);
  const [bpDia, setBpDia] = useState(76);
  const [alertSent, setAlertSent] = useState(false);

  const { connected, mode, blink } = useIrisInput();
  const { interfaceSounds, volume, tts, speechRate, ntfyTopic } = useIrisSettings();

  // Clock
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

  // Battery detection
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

  // Subtle realistic vital fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(Math.floor(70 + Math.random() * 5));
      setSpo2(Math.floor(97 + Math.random() * 2.5));
      setTempF(parseFloat((98.2 + Math.random() * 0.4).toFixed(1)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Emergency medical alert dispatch
  const handleMedicalAlert = () => {
    if (interfaceSounds) playAlertSound((volume / 100) * 0.55);
    if (tts) speakText('Medical alert dispatched to nursing station!', speechRate);

    sendNtfyNotification({
      title: '🩺 IRIS HEALTH VITAL ALERT',
      message: `Vital Snapshot: HR ${bpm} BPM, SpO2 ${spo2}%, BP ${bpSys}/${bpDia}, Temp ${tempF}°F. Patient requested medical attention.`,
      priority: 'urgent',
      tags: ['stethoscope', 'heartbeat', 'warning'],
      topic: ntfyTopic,
    });

    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 5000);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#070b12',
        backgroundImage: 'radial-gradient(circle at 50% 15%, #0f182b 0%, #05080f 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(10px, 1.8vh, 18px) clamp(16px, 2.5vw, 36px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. TOP STATUS BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '2px 4px',
          zIndex: 20,
        }}
      >
        {/* Left: Clock and Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '16px',
              fontWeight: 700,
              color: '#e2e8f0',
              letterSpacing: '0.02em',
            }}
          >
            {timeStr}
          </span>
        </div>

        {/* Center Title */}
        <h1
          style={{
            fontSize: 'clamp(20px, 2.2vw, 26px)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#ffffff',
            textTransform: 'uppercase',
            margin: 0,
            background: 'linear-gradient(90deg, #ffffff, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          HEALTH MONITORING
        </h1>

        {/* Right Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#94a3b8' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '4px 10px',
              borderRadius: '20px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>
              TELEMETRY LIVE
            </span>
          </div>

          <Wifi size={18} strokeWidth={2.2} style={{ color: '#38bdf8' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              {batteryPct}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN VITALS & MEDICAL CARDS ARENA */}
      <div
        style={{
          width: '100%',
          maxWidth: '1360px',
          margin: 'auto',
          display: 'grid',
          gridTemplateColumns: '1.45fr 1fr',
          gap: 'clamp(16px, 2.2vw, 28px)',
          alignItems: 'stretch',
          flex: 1,
          padding: '8px 0',
        }}
      >
        {/* LEFT COLUMN: 4 VITAL METRIC CARDS + LIVE ECG WAVE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
          {/* 4 Vitals Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {/* Vital 1: Heart Rate */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '22px',
                padding: '18px 20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', letterSpacing: '0.06em' }}>
                  HEART RATE
                </span>
                <Heart size={20} style={{ color: '#ef4444', animation: 'pulse 1.2s infinite' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: 'clamp(32px, 3.6vw, 44px)', fontWeight: 900, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                  {bpm}
                </span>
                <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>BPM</span>
              </div>
              <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, marginTop: '4px' }}>
                ● Normal Sinus Rhythm
              </div>
            </div>

            {/* Vital 2: Blood Oxygen SpO2 */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '22px',
                padding: '18px 20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.06em' }}>
                  BLOOD OXYGEN (SpO2)
                </span>
                <Zap size={20} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: 'clamp(32px, 3.6vw, 44px)', fontWeight: 900, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                  {spo2}
                </span>
                <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>%</span>
              </div>
              <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, marginTop: '4px' }}>
                ● Optimal Saturation
              </div>
            </div>

            {/* Vital 3: Blood Pressure */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1.5px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '22px',
                padding: '18px 20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc', letterSpacing: '0.06em' }}>
                  BLOOD PRESSURE
                </span>
                <TrendingUp size={20} style={{ color: '#c084fc' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: 'clamp(28px, 3.2vw, 38px)', fontWeight: 900, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                  {bpSys}/{bpDia}
                </span>
                <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>mmHg</span>
              </div>
              <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, marginTop: '4px' }}>
                ● Normotensive Range
              </div>
            </div>

            {/* Vital 4: Body Temperature */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1.5px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '22px',
                padding: '18px 20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.06em' }}>
                  BODY TEMPERATURE
                </span>
                <Thermometer size={20} style={{ color: '#fbbf24' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: 'clamp(32px, 3.6vw, 44px)', fontWeight: 900, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                  {tempF}
                </span>
                <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>°F</span>
              </div>
              <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, marginTop: '4px' }}>
                ● 36.9°C · Afebrile / Normal
              </div>
            </div>
          </div>

          {/* Live ECG Rhythm Waveform Card */}
          <div
            style={{
              backgroundColor: '#0c1220',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '22px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em' }}>
                  CONTINUOUS LEAD-II ECG WAVEFORM
                </span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#34d399' }}>
                SYNCED 1000 Hz
              </span>
            </div>

            {/* SVG ECG Line */}
            <div style={{ width: '100%', height: '54px', position: 'relative' }}>
              <svg viewBox="0 0 700 54" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Background grid ticks */}
                <line x1="0" y1="27" x2="700" y2="27" stroke="rgba(56, 189, 248, 0.1)" strokeWidth="1" />
                <path
                  d="M 0 27 L 80 27 L 90 20 L 100 27 L 130 27 L 140 27 L 145 10 L 152 48 L 160 5 L 168 35 L 175 27 L 220 27 L 235 21 L 250 27 L 340 27 L 350 20 L 360 27 L 390 27 L 395 10 L 402 48 L 410 5 L 418 35 L 425 27 L 470 27 L 485 21 L 500 27 L 590 27 L 600 20 L 610 27 L 640 27 L 645 10 L 652 48 L 660 5 L 668 35 L 675 27 L 700 27"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: 'drop-shadow(0 0 6px #38bdf8)',
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MEDICATION SCHEDULE & MEDICAL ALERT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Medication Tracker */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '20px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Pill size={20} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  MEDICATION SCHEDULE
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>TODAY</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {/* Med 1 */}
              <div
                style={{
                  backgroundColor: '#141d2e',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Morning Multivitamin & Electrolyte</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>08:00 AM · Oral Suspension</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '12px', fontWeight: 700 }}>
                  <CheckCircle2 size={16} />
                  <span>TAKEN</span>
                </div>
              </div>

              {/* Med 2 */}
              <div
                style={{
                  backgroundColor: '#141d2e',
                  border: '1.5px solid #0284c7',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 0 16px rgba(2, 132, 199, 0.25)',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Scheduled Pain Relief & Muscle Relaxant</div>
                  <div style={{ fontSize: '11px', color: '#93c5fd' }}>02:00 PM · Due in Afternoon</div>
                </div>
                <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                  UPCOMING
                </div>
              </div>

              {/* Med 3 */}
              <div
                style={{
                  backgroundColor: '#141d2e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#cbd5e1' }}>Evening Neuro-Protective Formula</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>09:00 PM · Night routine</div>
                </div>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
                  SCHEDULED
                </div>
              </div>
            </div>
          </div>

          {/* Quick Alert Medical Team Button */}
          <button
            onClick={handleMedicalAlert}
            style={{
              backgroundColor: '#1e1622',
              border: '2px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '20px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={26} style={{ color: '#ef4444' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#fca5a5' }}>
                  DISPATCH MEDICAL ALERT
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Sends vital signs telemetry to nurse station
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              SEND
            </div>
          </button>

          {/* Alert Sent Toast */}
          {alertSent && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1.5px solid #10b981',
                borderRadius: '14px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#34d399',
                fontSize: '13px',
                fontWeight: 700,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Telemetry Snapshot Dispatched to Caregiver ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* STANDARDIZED UNIFIED FIXED BACK BUTTON */}
      <FixedBackButton href="/" label="BACK TO HOME" />
    </div>
  );
}
