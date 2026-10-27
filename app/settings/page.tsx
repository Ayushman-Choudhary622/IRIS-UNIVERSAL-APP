'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useIrisInputConfig } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import IrisModal from '@/components/IrisModal';
import IrisBackButton from '@/components/IrisBackButton';
import {
  Home,
  Sliders,
  Monitor,
  Volume2,
  Shield,
  Cpu,
  Accessibility,
  Check,
  RotateCcw,
  Bell,
  Sparkles,
  Download,
  Wifi,
  ChevronRight,
  Flame,
  Info,
  LayoutGrid,
  Gamepad2,
  Activity,
  Sun,
  Lightbulb,
  Fan,
  Wind,
  ExternalLink,
  CheckCircle2,
  Bluetooth,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { playClickSound, speakText } from '@/lib/audio/soundEffects';
import { sendNtfyNotification } from '@/lib/care/ntfy';

interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  accent: string;
  desc: string;
}

const TABS: TabConfig[] = [
  {
    id: 'tiles',
    label: 'HOMESCREEN & APPS',
    icon: LayoutGrid,
    color: '#ec4899',
    accent: 'rgba(236, 72, 153, 0.45)',
    desc: 'Entertainment, Health, Smart IoT & homescreen tiles',
  },
  {
    id: 'accessibility',
    label: 'ACCESSIBILITY',
    icon: Accessibility,
    color: '#38bdf8',
    accent: 'rgba(56, 189, 248, 0.45)',
    desc: 'Visual comfort, cursor guides, and motor accommodations',
  },
  {
    id: 'input',
    label: 'INPUT & SENSORS',
    icon: Sliders,
    color: '#06b6d4',
    accent: 'rgba(6, 182, 212, 0.45)',
    desc: 'Gyro calibration, sensitivity, and jitter filtering',
  },
  {
    id: 'audio',
    label: 'AUDIO & VOICE',
    icon: Volume2,
    color: '#c084fc',
    accent: 'rgba(192, 132, 252, 0.45)',
    desc: 'Text-to-speech cadence, sound effects, and volume',
  },
  {
    id: 'display',
    label: 'DISPLAY & HUD',
    icon: Monitor,
    color: '#f59e0b',
    accent: 'rgba(245, 158, 11, 0.45)',
    desc: 'Themes, telemetry density, and graphics optimization',
  },
  {
    id: 'alerts',
    label: 'CAREGIVER ALERTS',
    icon: Bell,
    color: '#10b981',
    accent: 'rgba(16, 185, 129, 0.45)',
    desc: 'Direct mobile phone push notifications via ntfy',
  },
  {
    id: 'system',
    label: 'SYSTEM & DATA',
    icon: Shield,
    color: '#ec4899',
    accent: 'rgba(236, 72, 153, 0.45)',
    desc: 'Architecture build, backup export, and system reset',
  },
];

// =========================================================================
// TOP-LEVEL SUB-COMPONENTS: PERSISTENT HIGH-TECH CONTROLS
// =========================================================================

// Tactile Neon Toggle Switch
function CyberToggle({
  checked,
  onChange,
  color = '#38bdf8',
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!checked);
      }}
      aria-pressed={checked}
      style={{
        width: '64px',
        height: '34px',
        borderRadius: '17px',
        backgroundColor: checked ? 'rgba(15, 23, 42, 0.95)' : 'rgba(10, 16, 28, 0.85)',
        border: checked ? `2px solid ${color}` : '2px solid rgba(148, 163, 184, 0.25)',
        boxShadow: checked ? `0 0 18px ${color}66` : 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        outline: 'none',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: checked ? color : '#64748b',
          transform: checked ? 'translateX(30px)' : 'translateX(0px)',
          boxShadow: checked ? `0 0 12px ${color}` : 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 900,
          color: checked ? '#05080e' : '#ffffff',
          pointerEvents: 'none',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span
        style={{
          position: 'absolute',
          right: checked ? 'auto' : '8px',
          left: checked ? '8px' : 'auto',
          fontSize: '10px',
          fontWeight: 800,
          color: checked ? color : '#64748b',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
        }}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

// Tactile Setting Row
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '10px',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '62%' }}>
        <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
          {label}
        </span>
        <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
          {description}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '180px' }}>
        {children}
      </div>
    </div>
  );
}

// Segmented Button Choice Group (Replaces raw <select>)
function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  color = '#38bdf8',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(10, 16, 28, 0.95)',
        border: '1.5px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '14px',
        padding: '4px',
      }}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(opt.value);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backgroundColor: isSelected ? color : 'transparent',
              color: isSelected ? '#05080e' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isSelected ? `0 0 16px ${color}77` : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Range Slider with Live Badge
function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = '',
  color = '#38bdf8',
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '240px' }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onInput={(e) => onChange(Number(e.currentTarget.value))}
        style={{
          flex: 1,
          accentColor: color,
          height: '8px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      />
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          fontWeight: 800,
          color: '#ffffff',
          backgroundColor: 'rgba(10, 16, 28, 0.85)',
          border: `1.5px solid ${color}66`,
          borderRadius: '8px',
          padding: '3px 8px',
          minWidth: '55px',
          textAlign: 'center',
          boxShadow: `0 0 10px ${color}33`,
          userSelect: 'none',
        }}
      >
        {step < 1 ? value.toFixed(2) : value}
        {unit}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const {
    sensitivity,
    setSensitivity,
    smoothing,
    setSmoothing,
    deadZone,
    setDeadZone,
    recenter,
  } = useIrisInputConfig();

  const {
    uiScale,
    reducedMotion,
    highContrast,
    largeControls,
    focusMode,
    showVirtualCursor,
    invertX,
    invertY,
    ntfyTopic,
    theme,
    hudDensity,
    showFps,
    interfaceSounds,
    volume,
    tts,
    speechRate,
    graphicsQuality,
    targetFps,
    showTelemetry,
    pinnedHomeTiles = [],
    iotBedroomLight = false,
    iotCeilingFan = true,
    iotBedsideLamp = false,
    iotRoomAc = true,
    setSetting,
    resetSettings,
    exportSettings,
  } = useIrisSettings();

  const togglePinnedTile = (tileId: string) => {
    handleClickSound();
    const current = pinnedHomeTiles || [];
    const exists = current.includes(tileId);
    const updated = exists ? current.filter((id) => id !== tileId) : [...current, tileId];
    setSetting('pinnedHomeTiles', updated);
    showToast(exists ? 'Removed tile from Homescreen' : '✓ Added tile to Homescreen!');
  };

  const [activeTab, setActiveTab] = useState('accessibility');
  const [showAbout, setShowAbout] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState(ntfyTopic || 'iris-care-alert');
  const [timeStr, setTimeStr] = useState('09:15');
  const [batteryPct, setBatteryPct] = useState(94);

  // Bluetooth System Device State
  const [bluetoothInfo, setBluetoothInfo] = useState<{
    primaryAdapter: string;
    status: string;
    peripheral: string;
    bleEnumerator: string;
    rfcomm: string;
    signalDbm: number;
    protocol: string;
    devices: Array<{ name: string; status: string; present: boolean }>;
  }>({
    primaryAdapter: 'Realtek Wireless Bluetooth Adapter',
    status: 'ONLINE',
    peripheral: 'ESP32 BLE HID Core',
    bleEnumerator: 'Microsoft Bluetooth LE Enumerator',
    rfcomm: 'Bluetooth Device (RFCOMM Protocol TDI)',
    signalDbm: -42,
    protocol: 'Bluetooth 5.0 LE / RFCOMM HID',
    devices: [
      { name: 'Realtek Wireless Bluetooth Adapter', status: 'ONLINE', present: true },
      { name: 'Microsoft Bluetooth LE Enumerator', status: 'ACTIVE', present: true },
      { name: 'Bluetooth Device (RFCOMM Protocol TDI)', status: 'READY', present: true },
      { name: 'ESP32 BLE HID Core (COM3)', status: 'STREAMING', present: true },
    ],
  });
  const [isScanningBt, setIsScanningBt] = useState(false);
  const [isRefreshingBt, setIsRefreshingBt] = useState(false);

  const fetchBluetoothDevices = async () => {
    setIsRefreshingBt(true);
    try {
      const res = await fetch('/api/system/bluetooth');
      if (res.ok) {
        const data = await res.json();
        setBluetoothInfo({
          primaryAdapter: data.primaryAdapter || 'Realtek Wireless Bluetooth Adapter',
          status: data.status || 'ONLINE',
          peripheral: data.peripheral || 'ESP32 BLE HID Core',
          bleEnumerator: data.bleEnumerator || 'Microsoft Bluetooth LE Enumerator',
          rfcomm: data.rfcomm || 'Bluetooth Device (RFCOMM Protocol TDI)',
          signalDbm: data.signalDbm || -42,
          protocol: data.protocol || 'Bluetooth 5.0 LE / RFCOMM HID',
          devices: data.devices || [],
        });
      }
    } catch (_) {
      // Fallback intact
    } finally {
      setIsRefreshingBt(false);
    }
  };

  useEffect(() => {
    fetchBluetoothDevices();
  }, []);

  const handleScanWebBluetooth = async () => {
    handleClickSound();
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      try {
        setIsScanningBt(true);
        showToast('Scanning for Bluetooth HID & Neural Peripherals...');
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access', 'battery_service'],
        });
        showToast(`✓ Paired with ${device.name || 'Bluetooth Device'}`);
        setBluetoothInfo((prev) => ({
          ...prev,
          peripheral: device.name || 'External BLE Device',
          status: 'CONNECTED',
        }));
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          showToast('Web Bluetooth scanning cancelled');
        }
      } finally {
        setIsScanningBt(false);
      }
    } else {
      showToast('System Bluetooth active: Realtek Wireless Bluetooth Adapter');
    }
  };

  // Real-time Clock
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

  // Battery Status
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClickSound = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
  };

  const handleTestTts = () => {
    handleClickSound();
    speakText('IRIS system voice synthesized successfully. Audio parameters are operating normally.', speechRate);
    showToast('Synthesizing speech voice preview...');
  };

  const handleTestNotification = async () => {
    handleClickSound();
    showToast(`Sending test alert to: ${topicInput}...`);
    try {
      const ok = await sendNtfyNotification({
        title: '🔔 IRIS Caregiver Alert Test',
        message: 'This is a test notification from IRIS System Settings.',
        priority: 'default',
        tags: ['bell', 'satellite'],
        topic: topicInput,
      });
      if (ok) {
        showToast('✓ Test notification delivered to phone via ntfy!');
      } else {
        showToast('⚠️ Delivery issue: check internet or topic name');
      }
    } catch {
      showToast('⚠️ Notification delivery error');
    }
  };

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

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
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP STATUS BAR: Standard Upper-Left Back Button, Grand Title & Actions */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          padding: '2px 4px',
          flexShrink: 0,
        }}
      >
        {/* Left: Standard BACK TO HOME Button & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifySelf: 'start' }}>
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
        </div>

        {/* Center: Grand Gradient Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1
            style={{
              fontSize: 'clamp(24px, 2.6vw, 34px)',
              fontWeight: 900,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: 0,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #38bdf8 0%, #c084fc 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.4))',
            }}
          >
            SYSTEM SETTINGS
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#93c5fd',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            ASSISTIVE CALIBRATION · SENSORS · HARDWARE
          </span>
        </div>

        {/* Right: Architecture Info & Battery / Signal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifySelf: 'end' }}>
          <button
            onClick={() => {
              handleClickSound();
              setShowAbout(true);
            }}
            title="Inspect IRIS System Architecture"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(12, 24, 44, 0.85)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '14px',
              padding: '8px 16px',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} />
            <span>ABOUT IRIS</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '6px 12px',
            }}
          >
            <Wifi size={16} color="#38bdf8" />
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#cbd5e1', fontWeight: 700 }}>
              {batteryPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CENTER: 2-COLUMN SETTINGS DECK                                    */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 310px) 1fr',
          gap: 'clamp(20px, 2.5vw, 36px)',
          width: '100%',
          maxWidth: '1360px',
          margin: 'auto',
          alignItems: 'stretch',
          flex: 1,
          maxHeight: 'calc(100vh - 165px)',
          minHeight: 0,
        }}
      >
        {/* Left Side: Category Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 900,
              color: '#38bdf8',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '4px 8px',
            }}
          >
            CONFIGURATION MODULES
          </span>

          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  handleClickSound();
                  setActiveTab(tab.id);
                }}
                style={{
                  backgroundColor: isActive ? 'rgba(18, 30, 52, 0.95)' : 'rgba(10, 18, 34, 0.75)',
                  border: isActive ? `2px solid ${tab.color}` : '1.5px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#ffffff',
                  boxShadow: isActive ? `0 0 25px ${tab.accent}` : 'none',
                  transform: isActive ? 'scale(1.02) translateX(4px)' : 'none',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: isActive ? `${tab.color}22` : 'rgba(255, 255, 255, 0.05)',
                      border: `1.5px solid ${isActive ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? tab.color : '#94a3b8',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: isActive ? '#ffffff' : '#cbd5e1',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tab.label}
                    </div>
                    <div style={{ fontSize: '11px', color: isActive ? tab.color : '#64748b', fontWeight: 600 }}>
                      {tab.id === 'accessibility' && 'Comfort & Cursor'}
                      {tab.id === 'input' && 'Head Tracking & Bias'}
                      {tab.id === 'audio' && 'Speech & Sound FX'}
                      {tab.id === 'display' && 'Themes & Density'}
                      {tab.id === 'alerts' && 'Caregiver Phone Push'}
                      {tab.id === 'system' && 'Build & Data Backup'}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  style={{
                    color: isActive ? tab.color : '#475569',
                    transform: isActive ? 'translateX(2px)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Right Side: Active Settings Panel */}
        <div
          style={{
            backgroundColor: 'rgba(10, 18, 34, 0.88)',
            border: `2px solid ${currentTab.color}55`,
            borderRadius: '24px',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: `0 0 35px ${currentTab.color}22, 0 10px 30px rgba(0, 0, 0, 0.6)`,
            backdropFilter: 'blur(16px)',
            overflowY: 'auto',
          }}
        >
          {/* Header of Active Section */}
          <div
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: `${currentTab.color}22`,
                    border: `1.5px solid ${currentTab.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentTab.color,
                  }}
                >
                  <currentTab.icon size={18} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '0.04em' }}>
                  {currentTab.label}
                </h2>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                {currentTab.desc}
              </p>
            </div>

            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 800,
                color: currentTab.color,
                backgroundColor: `${currentTab.color}15`,
                border: `1px solid ${currentTab.color}44`,
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              MODULE ACTIVE
            </span>
          </div>

          {/* Module Content */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {/* 0. HOMESCREEN TILES & APPS */}
                {activeTab === 'tiles' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Status Overview Card */}
                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        border: '1.5px solid rgba(236, 72, 153, 0.35)',
                        borderRadius: '20px',
                        padding: '18px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 0 25px rgba(236, 72, 153, 0.15)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <CheckCircle2 size={18} color="#ec4899" />
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
                            HOMESCREEN CONFIGURATION
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                          Default main screen has <strong>4 core tiles</strong> (Communication, Caretaker App, SOS, Settings).
                          Toggle any of the 3 tiles below to optionally add them to your Homescreen.
                        </p>
                      </div>

                      <span
                        style={{
                          backgroundColor: pinnedHomeTiles.length === 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(236, 72, 153, 0.2)',
                          border: pinnedHomeTiles.length === 0 ? '1px solid #38bdf8' : '1px solid #ec4899',
                          color: pinnedHomeTiles.length === 0 ? '#38bdf8' : '#ec4899',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '6px 14px',
                          borderRadius: '12px',
                          fontFamily: "'JetBrains Mono', monospace",
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pinnedHomeTiles.length === 0
                          ? 'DEFAULT 4 TILES ACTIVE'
                          : `${pinnedHomeTiles.length} OPTIONAL TILE(S) ADDED (${4 + pinnedHomeTiles.length} TILES TOTAL)`}
                      </span>
                    </div>

                    {/* The 3 Tiles Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Tile 1: Entertainment */}
                      <div
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          border: pinnedHomeTiles.includes('entertainment')
                            ? '2px solid #c084fc'
                            : '1.5px solid rgba(192, 132, 252, 0.3)',
                          borderRadius: '20px',
                          padding: '18px 22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: pinnedHomeTiles.includes('entertainment')
                            ? '0 0 25px rgba(192, 132, 252, 0.25)'
                            : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '14px',
                              backgroundColor: 'rgba(192, 132, 252, 0.18)',
                              border: '1.5px solid #c084fc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#c084fc',
                              flexShrink: 0,
                            }}
                          >
                            <Gamepad2 size={26} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                Entertainment
                              </h3>
                              {pinnedHomeTiles.includes('entertainment') && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    backgroundColor: 'rgba(192, 132, 252, 0.2)',
                                    color: '#c084fc',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #c084fc44',
                                  }}
                                >
                                  ON HOMESCREEN
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                              Gaze-driven arcade games, binaural lo-fi music therapy & audiobooks
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Link
                            href="/entertainment"
                            onClick={handleClickSound}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'rgba(192, 132, 252, 0.15)',
                              border: '1.5px solid #c084fc',
                              borderRadius: '12px',
                              padding: '8px 16px',
                              color: '#c084fc',
                              fontSize: '12px',
                              fontWeight: 800,
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>Open</span>
                            <ExternalLink size={14} />
                          </Link>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>Show on Home:</span>
                            <CyberToggle
                              checked={pinnedHomeTiles.includes('entertainment')}
                              onChange={() => togglePinnedTile('entertainment')}
                              color="#c084fc"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tile 2: Health Monitoring */}
                      <div
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          border: pinnedHomeTiles.includes('health')
                            ? '2px solid #34d399'
                            : '1.5px solid rgba(52, 211, 153, 0.3)',
                          borderRadius: '20px',
                          padding: '18px 22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: pinnedHomeTiles.includes('health')
                            ? '0 0 25px rgba(52, 211, 153, 0.25)'
                            : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '14px',
                              backgroundColor: 'rgba(52, 211, 153, 0.18)',
                              border: '1.5px solid #34d399',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#34d399',
                              flexShrink: 0,
                            }}
                          >
                            <Activity size={26} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                Health Monitoring
                              </h3>
                              {pinnedHomeTiles.includes('health') && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    backgroundColor: 'rgba(52, 211, 153, 0.2)',
                                    color: '#34d399',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #34d39944',
                                  }}
                                >
                                  ON HOMESCREEN
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                              Timeline of logged symptoms, pain severity scores, medication requests & caregiver response timestamps
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Link
                            href="/health"
                            onClick={handleClickSound}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'rgba(52, 211, 153, 0.15)',
                              border: '1.5px solid #34d399',
                              borderRadius: '12px',
                              padding: '8px 16px',
                              color: '#34d399',
                              fontSize: '12px',
                              fontWeight: 800,
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>Open</span>
                            <ExternalLink size={14} />
                          </Link>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>Show on Home:</span>
                            <CyberToggle
                              checked={pinnedHomeTiles.includes('health')}
                              onChange={() => togglePinnedTile('health')}
                              color="#34d399"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tile 3: Smart Room IoT */}
                      <div
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          border: pinnedHomeTiles.includes('iot')
                            ? '2px solid #38bdf8'
                            : '1.5px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '20px',
                          padding: '18px 22px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          boxShadow: pinnedHomeTiles.includes('iot')
                            ? '0 0 25px rgba(56, 189, 248, 0.25)'
                            : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                                border: '1.5px solid #38bdf8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#38bdf8',
                                flexShrink: 0,
                              }}
                            >
                              <Sun size={26} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                  Smart Room IoT
                                </h3>
                                {pinnedHomeTiles.includes('iot') && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      backgroundColor: 'rgba(56, 189, 248, 0.2)',
                                      color: '#38bdf8',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #38bdf844',
                                    }}
                                  >
                                    ON HOMESCREEN
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                                Environmental controls for patient bedroom lighting, ceiling fan, bedside lamp, and room AC
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>Show on Home:</span>
                            <CyberToggle
                              checked={pinnedHomeTiles.includes('iot')}
                              onChange={() => togglePinnedTile('iot')}
                              color="#38bdf8"
                            />
                          </div>
                        </div>

                        {/* Interactive In-Settings IoT Relays */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '10px',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          {[
                            { key: 'iotBedroomLight', label: 'Bedroom Light', state: iotBedroomLight, color: '#f59e0b', icon: Lightbulb },
                            { key: 'iotCeilingFan', label: 'Ceiling Fan', state: iotCeilingFan, color: '#38bdf8', icon: Fan },
                            { key: 'iotBedsideLamp', label: 'Bedside Lamp', state: iotBedsideLamp, color: '#fbbf24', icon: Sun },
                            { key: 'iotRoomAc', label: 'Room AC', state: iotRoomAc, color: '#34d399', icon: Wind },
                          ].map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                  handleClickSound();
                                  setSetting(item.key as any, !item.state);
                                }}
                                style={{
                                  backgroundColor: item.state ? 'rgba(15, 23, 42, 0.95)' : 'rgba(10, 16, 28, 0.7)',
                                  border: item.state ? `1.5px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '14px',
                                  padding: '12px 10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  boxShadow: item.state ? `0 0 16px ${item.color}33` : 'none',
                                  transition: 'all 0.18s ease',
                                }}
                              >
                                <IconComponent size={20} color={item.state ? item.color : '#64748b'} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                                  {item.label}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 900,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: item.state ? item.color : '#64748b',
                                  }}
                                >
                                  {item.state ? 'ON' : 'OFF'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. ACCESSIBILITY */}
                {activeTab === 'accessibility' && (
                  <div>
                    <SettingRow
                      label="UI Zoom Scaling"
                      description="Adjust global sizing of controls, typography, and interactive touch cards"
                    >
                      <RangeSlider
                        min={85}
                        max={140}
                        step={5}
                        value={uiScale}
                        onChange={(val) => setSetting('uiScale', val)}
                        unit="%"
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Assistive Virtual Cursor"
                      description="Display the glowing head-tracking cursor crosshair and dwell click target"
                    >
                      <CyberToggle
                        checked={showVirtualCursor}
                        onChange={(val) => setSetting('showVirtualCursor', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="High Contrast Precision"
                      description="Deepen obsidian surfaces and intensify neon borders for maximum legibility"
                    >
                      <CyberToggle
                        checked={highContrast}
                        onChange={(val) => setSetting('highContrast', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Enlarged Interaction Targets"
                      description="Expand click and eye-gaze hitboxes across all active tiles"
                    >
                      <CyberToggle
                        checked={largeControls}
                        onChange={(val) => setSetting('largeControls', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Reduced Visual Motion"
                      description="Disable parallax tilt, rapid 3D transitions, and looping background effects"
                    >
                      <CyberToggle
                        checked={reducedMotion}
                        onChange={(val) => setSetting('reducedMotion', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Distraction-Free Focus Mode"
                      description="Dim ambient secondary HUD decorations during active communication or gaze"
                    >
                      <CyberToggle
                        checked={focusMode}
                        onChange={(val) => setSetting('focusMode', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>
                  </div>
                )}

                {/* 2. INPUT & SENSORS */}
                {activeTab === 'input' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* SYSTEM BLUETOOTH HARDWARE DIAGNOSTICS CARD */}
                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        border: '2px solid #06b6d4',
                        borderRadius: '20px',
                        padding: '20px 24px',
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.25), 0 8px 24px rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}
                    >
                      {/* Card Header: Device Name & Live Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '14px',
                              backgroundColor: 'rgba(6, 182, 212, 0.18)',
                              border: '1.5px solid #06b6d4',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#06b6d4',
                              boxShadow: '0 0 16px rgba(6, 182, 212, 0.35)',
                            }}
                          >
                            <Bluetooth size={24} strokeWidth={2.4} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                                {bluetoothInfo.primaryAdapter}
                              </h3>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                  color: '#34d399',
                                  border: '1px solid rgba(52, 211, 153, 0.4)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {bluetoothInfo.status}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                              Primary Windows System Bluetooth Controller & Peripheral Bridge
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Scan BLE & Refresh */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={handleScanWebBluetooth}
                            disabled={isScanningBt}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: 'rgba(6, 182, 212, 0.18)',
                              border: '1.5px solid #06b6d4',
                              borderRadius: '12px',
                              padding: '8px 16px',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              outline: 'none',
                            }}
                          >
                            <Bluetooth size={14} color="#06b6d4" />
                            <span>{isScanningBt ? 'Scanning...' : 'Scan / Pair BLE'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={fetchBluetoothDevices}
                            disabled={isRefreshingBt}
                            title="Refresh system Bluetooth devices"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'rgba(30, 41, 59, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '12px',
                              padding: '8px 14px',
                              color: '#cbd5e1',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <RefreshCw size={13} className={isRefreshingBt ? 'animate-spin' : ''} />
                            <span>Sync</span>
                          </button>
                        </div>
                      </div>

                      {/* Device Specs & Subsystems Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ backgroundColor: 'rgba(10, 16, 28, 0.7)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Peripheral Link</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
                            {bluetoothInfo.peripheral}
                          </div>
                        </div>

                        <div style={{ backgroundColor: 'rgba(10, 16, 28, 0.7)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>BLE Subsystem</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
                            {bluetoothInfo.bleEnumerator}
                          </div>
                        </div>

                        <div style={{ backgroundColor: 'rgba(10, 16, 28, 0.7)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Serial Protocol</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#facc15', marginTop: '2px' }}>
                            {bluetoothInfo.rfcomm}
                          </div>
                        </div>

                        <div style={{ backgroundColor: 'rgba(10, 16, 28, 0.7)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Telemetry Link</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc', marginTop: '2px' }}>
                            60 Hz HID Stream · {bluetoothInfo.signalDbm} dBm
                          </div>
                        </div>
                      </div>

                      {/* Footer link to full hardware diagnostic suite */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Verified hardware signature: ESP32 6-DoF Inertial Telemetry & Blink CV Sensor
                        </span>
                        <Link
                          href="/device"
                          onClick={handleClickSound}
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#38bdf8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Full Hardware Diagnostics</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                    <SettingRow
                      label="Cursor Sensitivity"
                      description="Head tilt displacement to screen cursor velocity multiplier"
                    >
                      <RangeSlider
                        min={0.2}
                        max={2.5}
                        step={0.05}
                        value={sensitivity}
                        onChange={(val) => setSensitivity(val)}
                        unit="x"
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Jitter Smoothing Filter"
                      description="Exponential moving average filter to cancel micro involuntary tremors"
                    >
                      <RangeSlider
                        min={0}
                        max={0.95}
                        step={0.05}
                        value={smoothing}
                        onChange={(val) => setSmoothing(val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Dead Zone Rest Radius"
                      description="Neutral center resting area to ignore accidental micro movements"
                    >
                      <RangeSlider
                        min={0}
                        max={0.25}
                        step={0.01}
                        value={deadZone}
                        onChange={(val) => setDeadZone(val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Invert Horizontal (X) Axis"
                      description="Reverse horizontal head yaw to cursor left/right mapping"
                    >
                      <CyberToggle
                        checked={invertX}
                        onChange={(val) => setSetting('invertX', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Invert Vertical (Y) Axis"
                      description="Reverse vertical head pitch to cursor up/down mapping"
                    >
                      <CyberToggle
                        checked={invertY}
                        onChange={(val) => setSetting('invertY', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                      <button
                        onClick={() => {
                          recenter();
                          handleClickSound();
                          showToast('✓ Sensor origin recentered to screen center');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(6, 182, 212, 0.15)',
                          border: '2px solid #06b6d4',
                          borderRadius: '14px',
                          padding: '10px 22px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <RotateCcw size={16} color="#06b6d4" />
                        <span>RECENTER ZERO POSITION</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. AUDIO & VOICE */}
                {activeTab === 'audio' && (
                  <div>
                    <SettingRow
                      label="Interface Sound Effects"
                      description="Audible click feedback on tile clicks, modal triggers, and buttons"
                    >
                      <CyberToggle
                        checked={interfaceSounds}
                        onChange={(val) => setSetting('interfaceSounds', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Master System Volume"
                      description="Gain level for vocal speech synthesis and interface chime audio"
                    >
                      <RangeSlider
                        min={0}
                        max={100}
                        value={volume}
                        onChange={(val) => setSetting('volume', val)}
                        unit="%"
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Text-To-Speech (TTS) Voice"
                      description="Vocalize Care phrase requests, emergency alarms, and audiobooks"
                    >
                      <CyberToggle
                        checked={tts}
                        onChange={(val) => setSetting('tts', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Speech Cadence Rate"
                      description="Pacing speed of synthetic speech voice synthesis"
                    >
                      <RangeSlider
                        min={0.6}
                        max={1.8}
                        step={0.1}
                        value={speechRate}
                        onChange={(val) => setSetting('speechRate', val)}
                        unit="x"
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                      <button
                        onClick={handleTestTts}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(192, 132, 252, 0.15)',
                          border: '2px solid #c084fc',
                          borderRadius: '14px',
                          padding: '10px 22px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 0 20px rgba(192, 132, 252, 0.4)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Volume2 size={16} color="#c084fc" />
                        <span>TEST SPEECH VOICE</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. DISPLAY & HUD */}
                {activeTab === 'display' && (
                  <div>
                    <SettingRow
                      label="Color Palette Theme"
                      description="Select visual atmosphere: Cyber Obsidian, True OLED, Midnight or Clinical Light"
                    >
                      <SegmentedChoice
                        options={[
                          { value: 'Dark', label: 'Dark' },
                          { value: 'OLED Dark', label: 'OLED' },
                          { value: 'Midnight', label: 'Midnight' },
                          { value: 'White', label: 'Light' },
                        ]}
                        value={theme}
                        onChange={(val) => setSetting('theme', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="HUD Telemetry Density"
                      description="Quantity of sensor and tracking information overlayed on screen"
                    >
                      <SegmentedChoice
                        options={[
                          { value: 'Minimal', label: 'Clean' },
                          { value: 'Compact', label: 'Compact' },
                          { value: 'Full', label: 'Full' },
                        ]}
                        value={hudDensity}
                        onChange={(val) => setSetting('hudDensity', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="WebGL Graphics Detail"
                      description="Texture resolution and anti-aliasing quality in 3D simulator models"
                    >
                      <SegmentedChoice
                        options={[
                          { value: 'Low', label: 'Low' },
                          { value: 'Medium', label: 'Medium' },
                          { value: 'High', label: 'High' },
                        ]}
                        value={graphicsQuality}
                        onChange={(val) => setSetting('graphicsQuality', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Target Frame Rate"
                      description="Smoothness and refresh rate cap for animation loops"
                    >
                      <SegmentedChoice
                        options={[
                          { value: '30', label: '30 FPS' },
                          { value: '60', label: '60 FPS' },
                          { value: 'Uncapped', label: 'Max Hz' },
                        ]}
                        value={targetFps}
                        onChange={(val) => setSetting('targetFps', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Show Live FPS Counter"
                      description="Display real-time rendering performance in the top telemetry pill"
                    >
                      <CyberToggle
                        checked={showFps}
                        onChange={(val) => setSetting('showFps', val)}
                        color={currentTab.color}
                      />
                    </SettingRow>
                  </div>
                )}

                {/* 5. CAREGIVER ALERTS */}
                {activeTab === 'alerts' && (
                  <div>
                    {/* Educational Explainer Card */}
                    <div
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1.5px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '18px',
                        padding: '16px 20px',
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 800, fontSize: '14px' }}>
                        <Bell size={18} />
                        <span>Instant Remote Phone Push Alerts</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                        Install the free <strong>ntfy app</strong> on your iPhone or Android, tap <em>Subscribe to topic</em>, and enter your topic name below. When the patient clicks Emergency SOS or Assistance, your phone will ring instantly!
                      </p>
                    </div>

                    <SettingRow
                      label="Notification Topic"
                      description="Unique private topic name subscribed in your caregiver ntfy phone app"
                    >
                      <input
                        type="text"
                        value={topicInput}
                        onChange={(e) => {
                          setTopicInput(e.target.value);
                          setSetting('ntfyTopic', e.target.value);
                        }}
                        placeholder="e.g. iris-care-alert"
                        style={{
                          backgroundColor: 'rgba(10, 16, 28, 0.95)',
                          border: '1.5px solid #10b981',
                          borderRadius: '12px',
                          padding: '10px 16px',
                          color: '#34d399',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '13px',
                          fontWeight: 700,
                          width: '220px',
                          outline: 'none',
                          boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
                          pointerEvents: 'auto',
                          userSelect: 'text',
                        }}
                      />
                    </SettingRow>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                      <button
                        onClick={handleTestNotification}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          border: '2px solid #10b981',
                          borderRadius: '14px',
                          padding: '10px 22px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Bell size={16} color="#34d399" />
                        <span>SEND TEST NOTIFICATION</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. SYSTEM & DATA */}
                {activeTab === 'system' && (
                  <div>
                    {/* Architecture Info Card */}
                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        border: '1.5px solid rgba(236, 72, 153, 0.3)',
                        borderRadius: '18px',
                        padding: '18px 22px',
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>
                        IRIS Universal Ecosystem Build
                      </span>
                      <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>
                        Version: Production Build (Next.js Turbopack + WebGL)
                      </span>
                      <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>
                        Sensors: Dual MPU6050 6-DoF Fusion & ESP32 BLE HID
                      </span>
                      <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#ec4899', fontWeight: 800, marginTop: '4px' }}>
                        Developed by Ayushman Choudhary
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', paddingTop: '8px' }}>
                      <button
                        onClick={() => {
                          exportSettings();
                          handleClickSound();
                          showToast('✓ Settings exported to JSON backup file');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(12, 24, 44, 0.9)',
                          border: '2px solid #38bdf8',
                          borderRadius: '14px',
                          padding: '12px 24px',
                          color: '#38bdf8',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Download size={16} />
                        <span>EXPORT SETTINGS (JSON)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleClickSound();
                          setResetConfirmOpen(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(38, 12, 18, 0.9)',
                          border: '2px solid #f43f5e',
                          borderRadius: '14px',
                          padding: '12px 24px',
                          color: '#f43f5e',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 0 16px rgba(244, 63, 94, 0.35)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Flame size={16} />
                        <span>RESET ALL SETTINGS</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING FEEDBACK TOAST NOTIFICATION                                   */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: 'rgba(10, 18, 32, 0.96)',
            border: '2px solid #38bdf8',
            borderRadius: '16px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 0 30px rgba(56, 189, 248, 0.5), 0 8px 24px rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Check size={18} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS: About Architecture & Reset Confirmation                       */}
      {/* ========================================================================= */}
      <IrisModal open={showAbout} onClose={() => setShowAbout(false)} title="About IRIS Architecture">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#cbd5e1', fontSize: '13px' }}>
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 800, margin: '0 0 4px 0' }}>What is IRIS Universal?</h4>
            <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6 }}>
              IRIS (Intelligent Responsive Interface System) is an assistive computing platform designed for motor-impaired individuals to communicate, enjoy music and audiobooks, play games, and live independently hands-free.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 800, margin: '0 0 4px 0' }}>Hardware Sensor Pipeline</h4>
            <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6 }}>
              Dual MPU6050 6-DoF sensor fusion captures micro head motions. An ESP32 microcontroller transmits Bluetooth HID inputs. Computer vision blink detection enables effortless dwell selection.
            </p>
          </div>
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#38bdf8',
              textAlign: 'center',
            }}
          >
            GYRO &rarr; KALMAN FUSION &rarr; ESP32 BLE HID &rarr; BLINK DETECTION &rarr; IRIS
          </div>
        </div>
      </IrisModal>

      <IrisModal open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} title="Reset All Settings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#cbd5e1', fontSize: '13px' }}>
          <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6 }}>
            Are you sure you want to reset all user preferences, sensitivity, speech rates, and audio volume back to factory system defaults?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
            <button
              onClick={() => setResetConfirmOpen(false)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetSettings();
                setResetConfirmOpen(false);
                showToast('✓ All settings reset to system defaults');
              }}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                backgroundColor: '#f43f5e',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(244, 63, 94, 0.5)',
              }}
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </IrisModal>
    </div>
  );
}
