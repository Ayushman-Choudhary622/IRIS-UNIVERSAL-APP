'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import FixedBackButton from '@/components/FixedBackButton';
import PageHeader from '@/components/PageHeader';
import IrisStatus from '@/components/IrisStatus';
import GlassCard from '@/components/GlassCard';
import IrisModal from '@/components/IrisModal';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import SensorGauge from '@/components/device/SensorGauge';
import TelemetryChart from '@/components/device/TelemetryChart';
import { Battery, Bluetooth, Cpu, RefreshCw, Crosshair, Play, Target, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { playCollectSound, playClickSound, playChimeSound } from '@/lib/audio/soundEffects';

const CALIBRATION_STEPS = [
  'PREPARE — Get ready for calibration',
  'LOOK AHEAD — Look straight ahead',
  'HOLD POSITION — Hold neutral position',
  'CAPTURE — Capturing baseline',
  'CALIBRATE — Processing calibration',
  'COMPLETE — Calibration complete'
];

export default function DevicePage() {
  const { connected, battery, mode, pitch, yaw, roll, toggleDemo, recenter, setInputMode, blink, triggerBlink } = useIrisInput();
  const { interfaceSounds, volume, invertX, invertY } = useIrisSettings();
  
  const [calibrating, setCalibrating] = useState(false);
  const [calibStep, setCalibStep] = useState(0);

  // Test Input Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 }); // percentage
  const [feedback, setFeedback] = useState<string | null>(null);

  const startCalibration = () => {
    if (calibrating) return;
    if (interfaceSounds) playClickSound((volume / 100) * 0.3);
    setCalibrating(true);
    setCalibStep(0);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= CALIBRATION_STEPS.length) {
        clearInterval(interval);
        setCalibrating(false);
        setCalibStep(0);
        if (interfaceSounds) playChimeSound((volume / 100) * 0.4);
      } else {
        setCalibStep(step);
      }
    }, 1200);
  };

  const getStatusColor = (isOnline: boolean) => isOnline ? 'bg-[var(--iris-green)]' : 'bg-[var(--iris-text-tertiary)]';
  const displayConnected = connected || mode === 'demo';

  // Target relocation in test modal
  const spawnNewTarget = () => {
    setTargetPos({
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
    });
  };

  // Check if cursor hits target during test
  useEffect(() => {
    if (!testModalOpen) return;

    const effectiveYaw = invertX ? -yaw : yaw;
    const effectivePitch = invertY ? -pitch : pitch;

    const cursorX = (effectiveYaw * 0.5 + 0.5) * 100;
    const cursorY = (effectivePitch * 0.5 + 0.5) * 100;

    const dist = Math.hypot(cursorX - targetPos.x, cursorY - targetPos.y);

    // If within radius and blink occurs -> Target Hit!
    if (dist < 12 && blink) {
      setTestScore(s => s + 1);
      setFeedback('TARGET HIT!');
      if (interfaceSounds) playCollectSound((volume / 100) * 0.4);
      spawnNewTarget();
      setTimeout(() => setFeedback(null), 700);
    }
  }, [yaw, pitch, blink, testModalOpen, targetPos, invertX, invertY, interfaceSounds, volume]);

  return (
    <div className="page-container flex flex-col gap-5 p-6 pt-24 overflow-y-auto">
      <PageHeader
        title="DEVICE"
        subtitle="Hardware Diagnostics, Calibration & Real-Time Telemetry"
        status={<IrisStatus type={connected ? 'ready' : (mode === 'demo' ? 'demo' : 'offline')} />}
      />

      {!connected && mode !== 'demo' && (
        <div className="w-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-center font-mono text-xs font-bold">
          HARDWARE NOT DETECTED. SELECT DEMO, KEYBOARD, OR MOUSE MODE BELOW.
        </div>
      )}

      {/* Top Row: Module status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'ESP32 BLE CORE', online: displayConnected, desc: 'Seeed Studio XIAO / COM3' },
          { name: 'MPU6050 SENSOR A', online: displayConnected, desc: 'Pitch & Yaw Fusion' },
          { name: 'MPU6050 SENSOR B', online: displayConnected, desc: 'Roll & Gyro Banking' },
          { name: 'BLINK CV SENSOR', online: displayConnected, desc: '60 FPS Eye Tracker' }
        ].map(module => (
          <GlassCard key={module.name} className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[var(--iris-text)]">{module.name}</span>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(module.online)} shadow-[0_0_6px_currentColor]`} />
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-[var(--iris-text-secondary)]">
              <span>{module.desc}</span>
              <span className={module.online ? 'text-[var(--iris-green)]' : 'text-[var(--iris-danger)]'}>
                {module.online ? 'SYNCED' : 'OFFLINE'}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Second Row: Detailed Status & Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Info & Mode Controls */}
        <GlassCard className="p-6 flex flex-col gap-6">
          <h2 className="text-lg font-bold border-b border-[var(--iris-border)] pb-2 flex justify-between items-center">
            <span>Hardware & Connection</span>
            <span className="text-xs font-mono text-[var(--iris-cyan)]">PORT: BLE HID · 60 HZ</span>
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[var(--iris-text-secondary)]"><Cpu size={18}/> System Link</div>
              <span className={displayConnected ? 'text-[var(--iris-green)] font-bold font-mono' : 'text-[var(--iris-danger)] font-bold font-mono'}>
                {displayConnected ? 'ONLINE (ACTIVE)' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[var(--iris-text-secondary)]"><Bluetooth size={18} className="text-cyan-400" /> System Bluetooth</div>
              <span className="text-[var(--iris-blue)] font-bold font-mono text-xs">
                Realtek Wireless Bluetooth Adapter
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[var(--iris-text-secondary)]"><Bluetooth size={18} className="text-emerald-400" /> BLE Peripheral Core</div>
              <span className="text-[var(--iris-green)] font-bold font-mono text-xs">
                ESP32 BLE HID (COM3 · STREAMING)
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[var(--iris-text-secondary)]"><Battery size={18}/> Battery Level</div>
                <span className="font-mono">{battery}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--iris-bg-surface-light)] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${battery > 20 ? 'bg-[var(--iris-green)]' : 'bg-[var(--iris-danger)]'}`} 
                  style={{ width: `${battery}%` }}
                />
              </div>
            </div>

            {/* Input Mode Selector */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--iris-border)]">
              <span className="text-xs text-[var(--iris-text-secondary)] font-mono">ACTIVE INPUT MODE</span>
              <div className="grid grid-cols-4 gap-2">
                {(['demo', 'keyboard', 'mouse', 'hardware'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setInputMode(m);
                      if (interfaceSounds) playClickSound((volume / 100) * 0.3);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      mode === m
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Live Telemetry Gauges */}
        <GlassCard className="p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-[var(--iris-border)] pb-2">
            <h2 className="text-lg font-bold">Real-Time Sensor Gauges</h2>
            <span className="status-badge status-ready px-2 py-0.5 text-xs font-mono">
              {mode.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-around items-center flex-1 py-4">
            <SensorGauge value={pitch} label="PITCH" color="var(--iris-cyan)" />
            <SensorGauge value={yaw} label="YAW" color="var(--iris-blue)" />
            <SensorGauge value={roll} label="ROLL" color="var(--iris-violet)" />
          </div>
          <div className="text-center text-xs font-mono text-[var(--iris-text-tertiary)]">
            Active Fusion Matrix: 3-Axis Gyroscope + 3-Axis Accelerometer
          </div>
        </GlassCard>
      </div>

      {/* Third Row: Calibration Wizard & Actions */}
      <GlassCard className="p-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold border-b border-[var(--iris-border)] pb-2">Calibration & Input Verification</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--iris-text-secondary)]">Wizard Sequence:</span>
              <span className={calibrating ? 'text-[var(--iris-cyan)] font-mono animate-pulse' : 'text-[var(--iris-text)] font-mono'}>
                {calibrating ? CALIBRATION_STEPS[calibStep] : 'READY FOR CALIBRATION'}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--iris-bg-surface-light)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--iris-cyan)]"
                initial={{ width: '0%' }}
                animate={{ width: calibrating ? `${((calibStep + 1) / CALIBRATION_STEPS.length) * 100}%` : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            <button 
              className="iris-btn iris-btn-primary flex-1 min-w-[160px] justify-center gap-2"
              onClick={startCalibration}
              disabled={calibrating}
            >
              <RefreshCw size={18} className={calibrating ? 'animate-spin' : ''} />
              {calibrating ? 'CALIBRATING...' : 'START CALIBRATION'}
            </button>
            <button 
              className="iris-btn flex-1 min-w-[140px] justify-center gap-2"
              onClick={() => {
                recenter();
                if (interfaceSounds) playClickSound((volume / 100) * 0.3);
              }}
            >
              <Crosshair size={18} />
              RECENTER
            </button>
            <button 
              className="iris-btn flex-1 min-w-[140px] justify-center gap-2 bg-[rgba(103,232,249,0.15)] text-[var(--iris-cyan)] hover:bg-[rgba(103,232,249,0.3)] border border-[var(--iris-cyan)]"
              onClick={() => {
                setTestModalOpen(true);
                setTestScore(0);
                spawnNewTarget();
                if (interfaceSounds) playClickSound((volume / 100) * 0.3);
              }}
            >
              <Play size={18} />
              TEST INPUT
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Bottom Row: Telemetry History */}
      <GlassCard className="p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold border-b border-[var(--iris-border)] pb-2">Continuous Telemetry Buffer (300 Samples)</h2>
        <TelemetryChart />
      </GlassCard>

      {/* Test Input Modal */}
      <IrisModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="INTERACTIVE INPUT TARGET TEST"
        maxWidth="720px"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--iris-text-secondary)]">
            Aim the reticle at the target sphere using your head or active input mode, then <strong>Blink</strong> (or press Space/Click) to hit it.
          </p>

          <div className="flex justify-between items-center text-xs font-mono bg-[var(--iris-bg-surface-light)] p-3 rounded-lg border border-[var(--iris-border)]">
            <div>MODE: <span className="text-[var(--iris-cyan)] font-bold uppercase">{mode}</span></div>
            <div>TARGETS HIT: <span className="text-[var(--iris-green)] font-bold text-base">{testScore}</span></div>
            {feedback && <div className="text-[var(--iris-cyan)] animate-bounce font-bold">{feedback}</div>}
          </div>

          {/* Testing Arena Canvas Area */}
          <div className="relative w-full h-[340px] bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
            {/* Grid background */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none" 
              style={{
                backgroundImage: 'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            {/* Target Sphere */}
            <div
              className="absolute w-12 h-12 rounded-full border-2 border-[var(--iris-cyan)] bg-[var(--iris-cyan)]/20 flex items-center justify-center transition-all duration-300 shadow-[var(--iris-glow-cyan)]"
              style={{
                left: `${targetPos.x}%`,
                top: `${targetPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Target size={24} className="text-[var(--iris-cyan)] animate-spin-slow" />
            </div>

            {/* Player Aiming Reticle */}
            <div
              className={`absolute w-10 h-10 rounded-full border border-[var(--iris-violet)] flex items-center justify-center pointer-events-none transition-transform duration-75 ${
                blink ? 'scale-150 bg-[var(--iris-cyan)]/50 border-[var(--iris-cyan)]' : 'scale-100'
              }`}
              style={{
                left: `${(invertX ? -yaw : yaw) * 45 + 50}%`,
                top: `${(invertY ? -pitch : pitch) * 45 + 50}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 15px var(--iris-violet)',
              }}
            >
              <Crosshair size={20} className="text-white" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={triggerBlink}
              className="iris-btn border border-[var(--iris-border)] hover:bg-[var(--iris-bg-surface-light)] text-xs font-mono"
            >
              Simulate Blink Action
            </button>
            <button
              onClick={() => setTestModalOpen(false)}
              className="iris-btn iris-btn-primary px-6"
            >
              Finish Test
            </button>
          </div>
        </div>
      </IrisModal>

      {/* STANDARDIZED UNIFIED FIXED BACK BUTTON */}
      <FixedBackButton href="/" label="BACK TO HOME" />
    </div>
  );
}
