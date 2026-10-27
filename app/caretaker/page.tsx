'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import IrisBackButton from '@/components/IrisBackButton';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Smartphone,
  X,
  ExternalLink,
  Copy,
  Sparkles
} from 'lucide-react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import {
  sendNtfyNotification,
  getNtfySubscribeUrl,
  requestBrowserNotificationPermission,
  isBrowserNotificationSupported
} from '@/lib/care/ntfy';
import { playAlertSound, playChimeSound, playClickSound, speakText } from '@/lib/audio/soundEffects';

interface CareLogItem {
  id: string;
  time: string;
  type: 'urgent' | 'high' | 'default';
  title: string;
  status: 'delivered' | 'acknowledged' | 'failed';
}

interface CareTile {
  id: string;
  title: string;
  speech: string;
  message: string;
  priority: 'urgent' | 'high' | 'default';
  tags: string[];
  iconType: 'water' | 'food' | 'rest' | 'bathroom' | 'call' | 'help' | 'medicine' | 'pain' | 'emergency';
  isEmergency?: boolean;
}

const CARE_TILES: CareTile[] = [
  {
    id: 'water',
    title: 'Water',
    speech: 'I need water please.',
    message: 'Patient is requesting fresh water / hydration.',
    priority: 'default',
    tags: ['droplet', 'water'],
    iconType: 'water',
  },
  {
    id: 'food',
    title: 'Food',
    speech: 'I need food please.',
    message: 'Patient is requesting a meal or snack.',
    priority: 'default',
    tags: ['plate_with_cutlery', 'food'],
    iconType: 'food',
  },
  {
    id: 'rest',
    title: 'Rest',
    speech: 'I would like to rest.',
    message: 'Patient would like to rest / sleep.',
    priority: 'default',
    tags: ['bed', 'sleeping'],
    iconType: 'rest',
  },
  {
    id: 'bathroom',
    title: 'Bathroom',
    speech: 'I need to use the bathroom.',
    message: 'Patient requires immediate bathroom assistance.',
    priority: 'high',
    tags: ['restroom', 'urgent'],
    iconType: 'bathroom',
  },
  {
    id: 'call',
    title: 'Call',
    speech: 'Please call my caregiver.',
    message: 'Patient is calling for their caregiver.',
    priority: 'high',
    tags: ['telephone_receiver', 'call'],
    iconType: 'call',
  },
  {
    id: 'help',
    title: 'Help',
    speech: 'I need help please.',
    message: 'Patient is requesting general assistance.',
    priority: 'high',
    tags: ['sos', 'help'],
    iconType: 'help',
  },
  {
    id: 'medicine',
    title: 'Medicine',
    speech: 'I need my medicine.',
    message: 'Patient is requesting scheduled or pain medication.',
    priority: 'high',
    tags: ['pill', 'medical'],
    iconType: 'medicine',
  },
  {
    id: 'pain',
    title: 'Pain',
    speech: 'I am experiencing pain.',
    message: 'Patient reports pain / physical discomfort.',
    priority: 'high',
    tags: ['warning', 'pain'],
    iconType: 'pain',
  },
  {
    id: 'emergency',
    title: 'Emergency',
    speech: 'Emergency! Immediate caregiver assistance required!',
    message: 'EMERGENCY: Immediate caregiver intervention needed!',
    priority: 'urgent',
    tags: ['rotating_light', 'warning', 'emergency'],
    iconType: 'emergency',
    isEmergency: true,
  },
];

export default function CaretakerAppPage() {
  const { interfaceSounds, volume, tts, speechRate, ntfyTopic, setSetting } = useIrisSettings();

  const [timeStr, setTimeStr] = useState('09:15 AM');
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [topicInput, setTopicInput] = useState(ntfyTopic || 'iris-care-alert');
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [isTestSending, setIsTestSending] = useState(false);
  const [hasTestedAlert, setHasTestedAlert] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Strictly keep track of only the last 3 care logs
  const [careLogs, setCareLogs] = useState<CareLogItem[]>([
    { id: '1', time: '09:02 AM', type: 'default', title: 'Water', status: 'delivered' },
    { id: '2', time: '08:45 AM', type: 'high', title: 'Medicine', status: 'delivered' },
    { id: '3', time: '08:30 AM', type: 'default', title: 'Rest', status: 'delivered' },
  ]);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check initial browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setBrowserPerm(Notification.permission);
      } else {
        setBrowserPerm('unsupported');
      }
    }
  }, []);

  // Update local topic input when settings change
  useEffect(() => {
    setTopicInput(ntfyTopic || 'iris-care-alert');
  }, [ntfyTopic]);

  const dispatchCareRequest = async (tile: CareTile) => {
    // 1. Audible chime or siren
    if (interfaceSounds) {
      if (tile.isEmergency) {
        playAlertSound((volume / 100) * 0.6);
      } else {
        playChimeSound((volume / 100) * 0.4);
      }
    }

    // 2. Speech synthesis (patient voice)
    if (tts) {
      speakText(tile.speech, speechRate);
    }

    // 3. Visual active confirmation on tile
    setActiveNotification(tile.id);
    setTimeout(() => {
      setActiveNotification((prev) => (prev === tile.id ? null : prev));
    }, 3000);

    // 4. Update the last 3 logs
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setCareLogs((prev) => [
      {
        id: Date.now().toString(),
        time: timeFormatted,
        type: tile.priority,
        title: tile.title,
        status: 'delivered',
      },
      ...prev.slice(0, 2), // strictly keep at most 3 items
    ]);

    setHasTestedAlert(true);

    // 5. Send push notification to Caregiver smartphone & browser
    await sendNtfyNotification({
      title: tile.isEmergency ? `🚨 IRIS EMERGENCY: ${tile.title}` : `🔔 IRIS Alert: ${tile.title}`,
      message: `${tile.message} (Time: ${timeFormatted})`,
      priority: tile.priority,
      tags: tile.tags,
      topic: ntfyTopic,
      clickUrl: typeof window !== 'undefined' ? `${window.location.origin}/caretaker` : undefined,
    });
  };

  const handleSaveTopic = () => {
    const cleaned = topicInput.trim() || 'iris-care-alert';
    setSetting('ntfyTopic', cleaned);
    setHasTestedAlert(true);
    if (interfaceSounds) playClickSound((volume / 100) * 0.3);
  };

  const handleRequestBrowserPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPerm(perm);
    if (perm === 'granted') {
      new Notification('IRIS Care Notifications Enabled', {
        body: 'You will receive immediate alerts whenever the patient taps any tile.',
        icon: '/favicon.ico',
      });
    }
  };

  const handleSendTestAlert = async () => {
    setIsTestSending(true);
    setTestFeedback(null);
    if (interfaceSounds) playChimeSound((volume / 100) * 0.4);
    if (tts) speakText('Sending test caregiver notification now.', speechRate);

    const timeFormatted = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const ok = await sendNtfyNotification({
      title: '🔔 IRIS Test Notification',
      message: `Test alert successfully received from IRIS Caregiver System at ${timeFormatted}.`,
      priority: 'high',
      tags: ['bell', 'tada'],
      topic: ntfyTopic,
    });

    setHasTestedAlert(ok);
    setIsTestSending(false);

    if (ok) {
      setTestFeedback(`✓ Delivered to ntfy topic: ${ntfyTopic}`);
    } else {
      setTestFeedback('⚠️ Delivery failed: Please check network or topic');
    }

    // Update log
    setCareLogs((prev) => [
      {
        id: Date.now().toString(),
        time: timeFormatted,
        type: 'default',
        title: 'System Test',
        status: ok ? 'delivered' : 'failed',
      },
      ...prev.slice(0, 2),
    ]);
  };

  const subscribeUrl = getNtfySubscribeUrl(ntfyTopic);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(subscribeUrl)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(subscribeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const renderIcon = (type: CareTile['iconType']) => {
    switch (type) {
      case 'water':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="#38bdf8"
            style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.45))' }}
          >
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'food':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            style={{ filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.45))' }}
          >
            <circle cx="12" cy="12" r="7.5" fill="none" stroke="#60a5fa" strokeWidth="5" />
          </svg>
        );
      case 'rest':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="#818cf8"
            style={{ filter: 'drop-shadow(0 0 10px rgba(129, 140, 248, 0.45))' }}
          >
            <circle cx="12" cy="5" r="2.5" />
            <path d="M10.5 10h3v9h-3z" />
            <path d="M8.5 14h2v5h-2z" />
          </svg>
        );
      case 'bathroom':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="#22d3ee"
            style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.45))' }}
          >
            <rect x="3" y="12" width="18" height="7" rx="3.5" />
            <circle cx="6.5" cy="7" r="2.2" />
          </svg>
        );
      case 'call':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="#22d3ee"
            style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.45))' }}
          >
            <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        );
      case 'help':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="#22d3ee"
            style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.45))' }}
          >
            <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
          </svg>
        );
      case 'medicine':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.45))' }}
          >
            <circle cx="15.5" cy="8.5" r="3.8" fill="#38bdf8" />
            <path
              d="M6 18l5-5-2.5-2.5-5 5c-1.4 1.4-1.4 3.6 0 5 1.4 1.4 3.6 1.4 5 0l-2.5-2.5z"
              fill="#60a5fa"
            />
          </svg>
        );
      case 'pain':
        return (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="#fbbf24"
            style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.5))' }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case 'emergency':
        return (
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="#f87171"
            style={{ filter: 'drop-shadow(0 0 14px rgba(248, 113, 113, 0.6))' }}
          >
            <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
          </svg>
        );
    }
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
        padding: 'clamp(12px, 2.2vh, 26px) clamp(16px, 3.5vw, 48px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: PROJECT IRIS, What do you need?, Notification Status, Setup*/}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '2px 4px',
          zIndex: 20,
        }}
      >
        {/* Left: Clock, Back Button & Title Stack */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <IrisBackButton href="/" label="BACK TO HOME" position="static" />
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

          <div>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                color: '#38bdf8',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              PROJECT IRIS
            </div>
            <h1
              style={{
                fontSize: 'clamp(22px, 2.4vw, 30px)',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                margin: '2px 0 0 0',
                lineHeight: 1.15,
                background: 'linear-gradient(90deg, #ffffff, #bae6fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              What do you need?
            </h1>
          </div>
        </div>

        {/* Right: Notifications Status Pill & Setup Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status Pill in Dark Cyber Aesthetic */}
          {hasTestedAlert || browserPerm === 'granted' ? (
            <div
              onClick={() => setShowSetupModal(true)}
              title={`Receiving alerts on topic: ${ntfyTopic}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#34d399',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)',
              }}
            >
              <CheckCircle2 size={15} style={{ color: '#34d399' }} />
              <span>Alerts Active: {ntfyTopic}</span>
            </div>
          ) : (
            <div
              onClick={() => setShowSetupModal(true)}
              title="Click Setup to pair your phone and test alerts"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
              }}
            >
              <AlertTriangle size={15} style={{ color: '#fbbf24' }} />
              <span>Notifications not set up</span>
            </div>
          )}

          {/* Setup Button matching Dark Theme */}
          <button
            onClick={() => {
              if (interfaceSounds) playClickSound((volume / 100) * 0.3);
              setShowSetupModal(true);
            }}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '20px',
              padding: '7px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            Setup
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 3x3 GRID (9 CARDS: Water, Food, Rest, Bathroom, Call, Help, ...)   */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 'clamp(10px, 1.6vh, 18px)',
          padding: 'clamp(4px, 0.8vh, 10px) 0',
          boxSizing: 'border-box',
        }}
      >
        {CARE_TILES.map((tile) => {
          const isHovered = hoveredTile === tile.id;
          const isFired = activeNotification === tile.id;

          return (
            <button
              key={tile.id}
              onClick={() => dispatchCareRequest(tile)}
              onMouseEnter={() => setHoveredTile(tile.id)}
              onMouseLeave={() => setHoveredTile(null)}
              style={{
                backgroundColor: tile.isEmergency
                  ? isFired
                    ? 'rgba(239, 68, 68, 0.28)'
                    : isHovered
                    ? 'rgba(239, 68, 68, 0.18)'
                    : 'rgba(239, 68, 68, 0.1)'
                  : isFired
                  ? 'rgba(14, 165, 233, 0.22)'
                  : isHovered
                  ? '#1c2536'
                  : '#141a24',
                border: tile.isEmergency
                  ? isHovered || isFired
                    ? '2px solid #ef4444'
                    : '1.5px solid rgba(239, 68, 68, 0.4)'
                  : isHovered || isFired
                  ? '1.5px solid rgba(56, 189, 248, 0.55)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: 'clamp(12px, 2vh, 22px) 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                position: 'relative',
                boxShadow: tile.isEmergency
                  ? isHovered
                    ? '0 12px 32px rgba(239, 68, 68, 0.35), 0 0 20px rgba(239, 68, 68, 0.2)'
                    : '0 8px 24px rgba(0, 0, 0, 0.5)'
                  : isHovered
                  ? '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 20px rgba(56, 189, 248, 0.12)'
                  : '0 8px 20px rgba(0, 0, 0, 0.4)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Active Delivery Badge overlay */}
              {isFired && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: tile.isEmergency ? '#ef4444' : '#0284c7',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <CheckCircle2 size={12} />
                  <span>SENT ✓</span>
                </div>
              )}

              {/* Centered Icon */}
              <div
                style={{
                  marginBottom: 'clamp(8px, 1.2vh, 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isHovered ? 'scale(1.08)' : 'none',
                  transition: 'transform 0.18s ease',
                }}
              >
                {renderIcon(tile.iconType)}
              </div>

              {/* Card Label */}
              <span
                style={{
                  fontSize: 'clamp(17px, 1.7vw, 22px)',
                  fontWeight: tile.isEmergency ? 700 : 600,
                  color: tile.isEmergency ? '#fca5a5' : '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                {tile.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. MINIMIZED LOGS STRIP (LAST 3 ACTIVITY ITEMS ONLY)                       */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          backgroundColor: '#0e1522',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxSizing: 'border-box',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Last 3 Care Requests:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'nowrap', overflow: 'hidden' }}>
          {careLogs.slice(0, 3).map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: item.type === 'urgent' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(30, 41, 59, 0.65)',
                border: item.type === 'urgent' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: '#94a3b8',
                }}
              >
                {item.time}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: item.type === 'urgent' ? '#fca5a5' : '#ffffff',
                }}
              >
                {item.title}
              </span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>✓</span>
            </div>
          ))}
        </div>

        {/* Quick ntfy link indicator */}
        <a
          href={subscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#38bdf8',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'opacity 0.15s ease',
          }}
        >
          <span>ntfy.sh/{ntfyTopic}</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* ========================================================================= */}
      {/* 4. SETUP MODAL: PHONE PAIRING & NOTIFICATION CONFIGURATION                */}
      {/* ========================================================================= */}
      {showSetupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowSetupModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <Smartphone size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Caregiver Alerts Setup
                </h2>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Get instant mobile phone and browser notifications when the patient presses any tile.
                </span>
              </div>
            </div>

            {/* Step 1: Smartphone Pairing */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    1. Subscribe on Smartphone (Free)
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 10px 0', lineHeight: 1.4 }}>
                    Scan this QR code with your phone camera, or open the link in any mobile browser to receive loud ringtones and push notifications.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={subscribeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                      }}
                    >
                      <span>Open on Phone</span>
                      <ExternalLink size={13} />
                    </a>

                    <button
                      onClick={handleCopyLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#e2e8f0',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} />
                      <span>{copiedLink ? 'Copied! ✓' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* QR Code image for effortless scanning */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={qrCodeUrl}
                    alt="Scan to pair phone"
                    width={100}
                    height={100}
                    style={{ borderRadius: '6px', display: 'block' }}
                  />
                  <span style={{ fontSize: '10px', color: '#0f172a', marginTop: '4px', fontWeight: 700 }}>
                    Scan with Phone
                  </span>
                </div>
              </div>

              {/* Custom Topic Name Editor */}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Caregiver Notification Topic:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. iris-care-ayushman"
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveTopic}
                    style={{
                      backgroundColor: '#38bdf8',
                      color: '#0f172a',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Browser Notification Permission */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  2. Desktop / Laptop Alerts
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Status:{' '}
                  <span style={{ fontWeight: 700, color: browserPerm === 'granted' ? '#34d399' : '#fbbf24' }}>
                    {browserPerm === 'granted' ? 'Enabled ✓' : 'Permission Required'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRequestBrowserPermission}
                disabled={browserPerm === 'granted'}
                style={{
                  backgroundColor: browserPerm === 'granted' ? 'rgba(255, 255, 255, 0.1)' : '#0284c7',
                  color: browserPerm === 'granted' ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: browserPerm === 'granted' ? 'default' : 'pointer',
                }}
              >
                {browserPerm === 'granted' ? 'Allowed ✓' : 'Enable in Browser'}
              </button>
            </div>

            {/* Step 3: Send Test Alert */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <button
                  onClick={handleSendTestAlert}
                  disabled={isTestSending}
                  style={{
                    flex: 1,
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isTestSending ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Bell size={16} />
                  <span>{isTestSending ? 'Sending Test Alert...' : '🔔 Send Test Alert Now'}</span>
                </button>

                <button
                  onClick={() => setShowSetupModal(false)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '11px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>

              {testFeedback && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: testFeedback.includes('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: testFeedback.includes('✓') ? '#34d399' : '#f87171',
                    border: `1px solid ${testFeedback.includes('✓') ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{testFeedback}</span>
                  {testFeedback.includes('✓') && (
                    <a
                      href={subscribeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#38bdf8', textDecoration: 'underline', fontSize: '11.5px', fontWeight: 700 }}
                    >
                      View Live Alerts &rarr;
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
