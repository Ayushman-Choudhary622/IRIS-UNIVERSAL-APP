'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import IrisBackButton from '@/components/IrisBackButton';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import {
  ChevronLeft,
  RefreshCw,
  Volume2,
  VolumeX,
  Plane,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CameraPreset, FlightTelemetry } from './FlightCanvas';

interface FlightHUDProps {
  preset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
  onRecenter: () => void;
  onExit?: () => void;
  telemetry?: FlightTelemetry;
}

export default function FlightHUD({
  preset,
  onSelectPreset,
  onRecenter,
  onExit,
  telemetry = {
    airspeed: 270,
    altitude: 15400,
    verticalSpeed: 0,
    heading: 90,
    pitchDeg: 0,
    rollDeg: 0,
    gForce: 1.0,
  },
}: FlightHUDProps) {
  const { recenter } = useIrisInput();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<any[]>([]);

  // Track Fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Cockpit Ambient Turbofan & Wind Audio
  const stopCockpitAudio = () => {
    try {
      audioNodesRef.current.forEach((n) => {
        try {
          if (n.stop) n.stop();
          if (n.disconnect) n.disconnect();
        } catch (_) {}
      });
      audioNodesRef.current = [];
    } catch (e) {
      console.warn('Error stopping cockpit audio', e);
    }
    setIsPlayingAudio(false);
  };

  const startCockpitAudio = () => {
    stopCockpitAudio();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.14, ctx.currentTime);
      masterGain.connect(ctx.destination);
      audioNodesRef.current.push(masterGain);

      // Low frequency engine airframe drone (55 Hz)
      const rumbleOsc = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.setValueAtTime(55, ctx.currentTime);
      rumbleGain.gain.setValueAtTime(0.35, ctx.currentTime);
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      rumbleOsc.start();

      // Atmospheric Wind rush noise through windshield
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.06;
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(450, ctx.currentTime);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(masterGain);
      noiseNode.start();

      audioNodesRef.current.push(rumbleOsc, rumbleGain, noiseNode, noiseFilter);
      setIsPlayingAudio(true);
    } catch (err) {
      console.warn('Could not start ambient audio:', err);
    }
  };

  const toggleCockpitAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio) {
      stopCockpitAudio();
    } else {
      startCockpitAudio();
    }
  };

  useEffect(() => {
    return () => {
      stopCockpitAudio();
    };
  }, []);

  const handleRecenterAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    recenter();
    onRecenter();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(12px, 2.2vh, 26px) clamp(16px, 3.5vw, 48px)',
        boxSizing: 'border-box',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ===================================================================== */}
      {/* 1. UPPER-LEFT STANDARD BACK TO ENTERTAINMENT BUTTON                  */}
      {/* ===================================================================== */}
      <IrisBackButton
        href="/entertainment"
        label="EXIT SIMULATION"
        subtitle="Return to Previous Screen"
        accentColor="#06b6d4"
        showHomeShortcut={true}
        position="fixed"
        onClick={onExit}
      />

      {/* ===================================================================== */}
      {/* 2. TOP BAR: FLIGHT TELEMETRY TAPE & FULLSCREEN TOGGLE                 */}
      {/* ===================================================================== */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          pointerEvents: 'auto',
          gap: '16px',
          paddingLeft: 'clamp(280px, 26vw, 360px)', // Leave room for back button
        }}
      >
        {/* Sound Toggle */}
        <button
          onClick={toggleCockpitAudio}
          title="Toggle Cockpit Engine Sound"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isPlayingAudio ? 'rgba(6, 78, 59, 0.9)' : 'rgba(15, 23, 42, 0.92)',
            border: isPlayingAudio ? '1.5px solid #10b981' : '1.5px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '14px',
            padding: '9px 16px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: isPlayingAudio ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
            backdropFilter: 'blur(12px)',
          }}
        >
          {isPlayingAudio ? (
            <>
              <Volume2 size={16} color="#34d399" />
              <span>ENGINE: ON</span>
            </>
          ) : (
            <>
              <VolumeX size={16} color="#94a3b8" />
              <span>SOUND: OFF</span>
            </>
          )}
        </button>

        {/* Center: Live Flight Telemetry HUD Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(12px, 1.8vw, 24px)',
            backgroundColor: 'rgba(10, 18, 32, 0.92)',
            border: '1.5px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '16px',
            padding: '8px 20px',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>AIRSPEED</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 900, color: '#38bdf8' }}>
              {telemetry.airspeed} <span style={{ fontSize: '10px' }}>KTS</span>
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>ALTITUDE</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 900, color: '#34d399' }}>
              {telemetry.altitude.toLocaleString()} <span style={{ fontSize: '10px' }}>FT</span>
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>VSI</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 900, color: telemetry.verticalSpeed >= 0 ? '#34d399' : '#f87171' }}>
              {telemetry.verticalSpeed >= 0 ? '+' : ''}{telemetry.verticalSpeed} <span style={{ fontSize: '10px' }}>FPM</span>
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>HEADING</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 900, color: '#facc15' }}>
              {String(telemetry.heading).padStart(3, '0')}°
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>G-FORCE</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 900, color: '#c084fc' }}>
              {telemetry.gForce}G
            </span>
          </div>
        </div>

        {/* Right: Simulation Title & FULLSCREEN Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifySelf: 'end' }}>
          <div
            style={{
              backgroundColor: 'rgba(10, 18, 32, 0.92)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 16px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Plane size={18} color="#06b6d4" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.06em' }}>
                FLIGHT SIMULATION
              </span>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
                3D Cockpit & Aerodynamics
              </span>
            </div>
          </div>

          {/* Prominent FULLSCREEN Toggle Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Fullscreen Mode'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isFullscreen ? 'rgba(6, 78, 59, 0.9)' : 'rgba(15, 23, 42, 0.92)',
              border: isFullscreen ? '2px solid #34d399' : '2px solid #38bdf8',
              borderRadius: '14px',
              padding: '9px 18px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: isFullscreen ? '0 0 20px rgba(52, 211, 153, 0.45)' : '0 0 20px rgba(56, 189, 248, 0.45)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.15s ease',
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. CENTER WINDSHIELD HUD: ARTIFICIAL HORIZON & FLIGHT GUIDANCE        */}
      {/* ===================================================================== */}
      {preset === 'windshield' && (
        <div
          style={{
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'none',
          }}
        >
          {/* Tactical Pitch & Bank Horizon Crosshair */}
          <div
            style={{
              width: '180px',
              height: '100px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotate(${-telemetry.rollDeg}deg) translateY(${telemetry.pitchDeg * 2.2}px)`,
              transition: 'transform 0.08s linear',
            }}
          >
            {/* Horizon bar */}
            <div style={{ position: 'absolute', width: '140px', height: '2px', backgroundColor: 'rgba(56, 189, 248, 0.65)', boxShadow: '0 0 10px #38bdf8' }} />
            {/* Pitch +10 bar */}
            <div style={{ position: 'absolute', top: '18px', width: '60px', height: '2px', backgroundColor: 'rgba(56, 189, 248, 0.45)' }} />
            {/* Pitch -10 bar */}
            <div style={{ position: 'absolute', bottom: '18px', width: '60px', height: '2px', backgroundColor: 'rgba(56, 189, 248, 0.45)' }} />
            {/* Aircraft Symbol Center Ring */}
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #38bdf8', boxShadow: '0 0 12px #38bdf8' }} />
          </div>

          {/* Interactive Guidance Badge */}
          <div
            style={{
              backgroundColor: 'rgba(10, 18, 32, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              padding: '6px 18px',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              boxShadow: '0 0 16px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              textTransform: 'uppercase',
            }}
          >
            ✈️ MOVE CURSOR TO STEER & FLY · AIRFLOW SPEED PARTICLES ACTIVE
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. BOTTOM BAR: CAMERA PRESETS, RECENTER VIEW & CONTROLS               */}
      {/* ===================================================================== */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'auto',
          gap: '16px',
        }}
      >
        {/* Left: View Presets */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(10, 18, 32, 0.92)',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '6px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPreset('windshield');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: preset === 'windshield' ? '#06b6d4' : 'transparent',
              color: preset === 'windshield' ? '#05070e' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              boxShadow: preset === 'windshield' ? '0 0 16px rgba(6, 182, 212, 0.6)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🪟 WINDSHIELD
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPreset('captain');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: preset === 'captain' ? '#06b6d4' : 'transparent',
              color: preset === 'captain' ? '#05070e' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              boxShadow: preset === 'captain' ? '0 0 16px rgba(6, 182, 212, 0.6)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            👨‍✈️ CAPTAIN SEAT
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPreset('pedestal');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: preset === 'pedestal' ? '#06b6d4' : 'transparent',
              color: preset === 'pedestal' ? '#05070e' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              boxShadow: preset === 'pedestal' ? '0 0 16px rgba(6, 182, 212, 0.6)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🎛️ THROTTLES & PEDESTAL
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPreset('overhead');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: preset === 'overhead' ? '#06b6d4' : 'transparent',
              color: preset === 'overhead' ? '#05070e' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              boxShadow: preset === 'overhead' ? '0 0 16px rgba(6, 182, 212, 0.6)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            💡 OVERHEAD PANEL
          </button>
        </div>

        {/* Right: Drag Instruction & Recenter Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: 'rgba(10, 18, 32, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '8px 16px',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}
          >
            🖱️ Drag cursor for 360° inspection · Scroll wheel to zoom
          </div>

          <button
            onClick={handleRecenterAll}
            title="Recenter Aircraft Orientation & Horizon"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              border: '1.5px solid #06b6d4',
              borderRadius: '14px',
              padding: '9px 18px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.3)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <RefreshCw size={15} color="#06b6d4" />
            <span>RECENTER FLIGHT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
