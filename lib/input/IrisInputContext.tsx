'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  IrisContextValue,
  IrisInputState,
  CalibrationState,
  InputMode,
  DEFAULT_INPUT_STATE,
  DEFAULT_CALIBRATION,
} from './types';

export interface IrisInputConfigValue {
  sensitivity: number;
  smoothing: number;
  deadZone: number;
  mode: InputMode;
  connected: boolean;
  setSensitivity: (val: number) => void;
  setSmoothing: (val: number) => void;
  setDeadZone: (val: number) => void;
  setInputMode: (mode: InputMode) => void;
  recenter: () => void;
  toggleDemo: () => void;
}

const IrisInputConfigContext = createContext<IrisInputConfigValue | null>(null);

export function useIrisInputConfig(): IrisInputConfigValue {
  const context = useContext(IrisInputConfigContext);
  if (!context) {
    throw new Error('useIrisInputConfig must be used within IrisInputProvider');
  }
  return context;
}

const IrisInputContext = createContext<IrisContextValue | null>(null);

export function useIrisInput(): IrisContextValue {
  const context = useContext(IrisInputContext);
  if (!context) {
    throw new Error('useIrisInput must be used within IrisInputProvider');
  }
  return context;
}

export function IrisInputProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<{
    pitch: number;
    yaw: number;
    roll: number;
    blink: boolean;
    fps: number;
    battery: number;
  }>({
    pitch: DEFAULT_INPUT_STATE.pitch,
    yaw: DEFAULT_INPUT_STATE.yaw,
    roll: DEFAULT_INPUT_STATE.roll,
    blink: DEFAULT_INPUT_STATE.blink,
    fps: DEFAULT_INPUT_STATE.fps,
    battery: DEFAULT_INPUT_STATE.battery,
  });

  const [sensitivity, setSensitivityState] = useState(DEFAULT_INPUT_STATE.sensitivity);
  const [smoothing, setSmoothingState] = useState(DEFAULT_INPUT_STATE.smoothing);
  const [deadZone, setDeadZoneState] = useState(DEFAULT_INPUT_STATE.deadZone);
  const [mode, setModeState] = useState<InputMode>(DEFAULT_INPUT_STATE.mode);
  const [connected, setConnectedState] = useState(true);

  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;
  const smoothingRef = useRef(smoothing);
  smoothingRef.current = smoothing;
  const deadZoneRef = useRef(deadZone);
  deadZoneRef.current = deadZone;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [calibration, setCalibration] = useState<CalibrationState>(DEFAULT_CALIBRATION);
  const loopRef = useRef<number | null>(null);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 60 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef({ yaw: 0, pitch: 0 });

  // Manual blink trigger helper
  const triggerBlink = useCallback(() => {
    setTelemetry(prev => ({ ...prev, blink: true }));
    setTimeout(() => {
      setTelemetry(prev => ({ ...prev, blink: false }));
    }, 180);
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (modeRef.current === 'keyboard' && (e.code === 'Space' || e.code === 'KeyB')) {
        triggerBlink();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerBlink]);

  // Mouse and Head-tracking cursor event listeners
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current = {
        yaw: Math.max(-1, Math.min(1, normX)),
        pitch: Math.max(-1, Math.min(1, normY)),
      };
    };

    const onMouseDown = () => {
      triggerBlink();
    };

    // Custom window event hooks for external Python CV scripts
    const onIrisBlink = () => {
      triggerBlink();
    };

    const onIrisInput = (e: Event) => {
      const customEvent = e as CustomEvent<{ yaw?: number; pitch?: number; roll?: number; blink?: boolean }>;
      if (customEvent.detail) {
        if (customEvent.detail.yaw !== undefined) mouseRef.current.yaw = customEvent.detail.yaw;
        if (customEvent.detail.pitch !== undefined) mouseRef.current.pitch = customEvent.detail.pitch;
        if (customEvent.detail.blink) triggerBlink();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('iris:blink', onIrisBlink);
    window.addEventListener('iris:input', onIrisInput);

    // Optional local Python CV WebSocket bridge (connects if Python program runs local WS server)
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://127.0.0.1:8765');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.yaw !== undefined) mouseRef.current.yaw = data.yaw;
          if (data.pitch !== undefined) mouseRef.current.pitch = data.pitch;
          if (data.blink) triggerBlink();
        } catch (_) {}
      };
      ws.onerror = () => { /* quiet fallback if no Python WS server is active */ };
    } catch (_) {}

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('iris:blink', onIrisBlink);
      window.removeEventListener('iris:input', onIrisInput);
      if (ws) ws.close();
    };
  }, [triggerBlink]);

  // Main input update loop
  useEffect(() => {
    let time = 0;
    let lastBlink = 0;
    let currentPitch = 0;
    let currentYaw = 0;
    let currentRoll = 0;

    const animate = () => {
      time += 0.016;

      // FPS calculation
      fpsRef.current.frames++;
      const now = performance.now();
      if (now - fpsRef.current.lastTime >= 1000) {
        fpsRef.current.fps = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }

      let newPitch = currentPitch;
      let newYaw = currentYaw;
      let newRoll = currentRoll;
      let isBlink = false;
      let isConnected = true;

      const currentMode = modeRef.current;
      const currentSensitivity = sensitivityRef.current;
      const currentSmoothing = smoothingRef.current;
      const currentDeadZone = deadZoneRef.current;

      if (currentMode === 'demo') {
        // Smooth sinusoidal sensor simulation
        newPitch = Math.sin(time * 0.7) * 0.3 + Math.sin(time * 1.3) * 0.1;
        newYaw = Math.sin(time * 0.5) * 0.4 + Math.cos(time * 0.9) * 0.15;
        newRoll = Math.sin(time * 0.3) * 0.1 + Math.cos(time * 0.7) * 0.05;

        // Random blink events
        const shouldBlink = time - lastBlink > 3.5 + Math.random() * 4;
        isBlink = shouldBlink && Math.random() > 0.96;
        if (isBlink) lastBlink = time;
      } else if (currentMode === 'keyboard') {
        // Active keyboard steering
        const keys = keysRef.current;
        let targetPitch = 0;
        let targetYaw = 0;
        let targetRoll = 0;

        if (keys['ArrowUp'] || keys['KeyW']) targetPitch -= 0.6 * currentSensitivity;
        if (keys['ArrowDown'] || keys['KeyS']) targetPitch += 0.6 * currentSensitivity;
        if (keys['ArrowLeft'] || keys['KeyA']) targetYaw -= 0.6 * currentSensitivity;
        if (keys['ArrowRight'] || keys['KeyD']) targetYaw += 0.6 * currentSensitivity;
        if (keys['KeyQ']) targetRoll -= 0.4 * currentSensitivity;
        if (keys['KeyE']) targetRoll += 0.4 * currentSensitivity;

        // Smooth interpolation
        newPitch += (targetPitch - newPitch) * (0.15 + currentSmoothing * 0.15);
        newYaw += (targetYaw - newYaw) * (0.15 + currentSmoothing * 0.15);
        newRoll += (targetRoll - newRoll) * (0.15 + currentSmoothing * 0.15);
      } else if (currentMode === 'mouse') {
        // Smooth interpolation towards mouse position
        const targetYaw = mouseRef.current.yaw * currentSensitivity;
        const targetPitch = mouseRef.current.pitch * currentSensitivity;
        newYaw += (targetYaw - newYaw) * 0.2;
        newPitch += (targetPitch - newPitch) * 0.2;
        newRoll = -newYaw * 0.15; // Natural roll banking
      } else if (currentMode === 'hardware') {
        // Camera CV / Hardware Head-Tracking: directly tracks cursor position from head tracker
        const targetYaw = mouseRef.current.yaw * currentSensitivity;
        const targetPitch = mouseRef.current.pitch * currentSensitivity;
        newYaw += (targetYaw - newYaw) * 0.25;
        newPitch += (targetPitch - newPitch) * 0.25;
        newRoll = -newYaw * 0.15;
        isConnected = true;
      }

      currentPitch = newPitch;
      currentYaw = newYaw;
      currentRoll = newRoll;

      // Apply dead zone
      const applyDeadZone = (val: number) => (Math.abs(val) < currentDeadZone ? 0 : val);

      setTelemetry(prev => ({
        pitch: Math.max(-1, Math.min(1, applyDeadZone(newPitch))),
        yaw: Math.max(-1, Math.min(1, applyDeadZone(newYaw))),
        roll: Math.max(-1, Math.min(1, applyDeadZone(newRoll))),
        blink: isBlink || prev.blink,
        battery: Math.max(10, Math.round(85 - (time * 0.005) % 75)),
        fps: fpsRef.current.fps,
      }));

      loopRef.current = requestAnimationFrame(animate);
    };

    loopRef.current = requestAnimationFrame(animate);

    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, []);

  const recenter = useCallback(() => {
    setTelemetry(prev => ({
      ...prev,
      pitch: 0,
      yaw: 0,
      roll: 0,
    }));
    mouseRef.current = { yaw: 0, pitch: 0 };
    setCalibration(prev => ({
      ...prev,
      baselinePitch: 0,
      baselineYaw: 0,
      baselineRoll: 0,
    }));
  }, []);

  const toggleDemo = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'demo' ? 'keyboard' : 'demo';
      modeRef.current = next;
      return next;
    });
    setConnectedState(true);
  }, []);

  const setSensitivity = useCallback((value: number) => {
    setSensitivityState(value);
    sensitivityRef.current = value;
  }, []);

  const setSmoothing = useCallback((value: number) => {
    setSmoothingState(value);
    smoothingRef.current = value;
  }, []);

  const setDeadZone = useCallback((value: number) => {
    setDeadZoneState(value);
    deadZoneRef.current = value;
  }, []);

  const setInputMode = useCallback((newMode: InputMode) => {
    setModeState(newMode);
    modeRef.current = newMode;
    setConnectedState(true);
  }, []);

  const startCalibration = useCallback(() => {
    setCalibration({
      step: 1,
      totalSteps: 6,
      isCalibrating: true,
      isComplete: false,
      baselinePitch: 0,
      baselineYaw: 0,
      baselineRoll: 0,
      progress: 0,
    });

    const steps = [1, 2, 3, 4, 5, 6];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setCalibration(prev => ({
          ...prev,
          step,
          progress: (step / 6) * 100,
          isComplete: step === 6,
          isCalibrating: step < 6,
          ...(step === 4
            ? {
                baselinePitch: telemetry.pitch,
                baselineYaw: telemetry.yaw,
                baselineRoll: telemetry.roll,
              }
            : {}),
        }));
      }, (i + 1) * 1200);
    });
  }, [telemetry.pitch, telemetry.yaw, telemetry.roll]);

  const configValue = useMemo<IrisInputConfigValue>(() => ({
    sensitivity,
    smoothing,
    deadZone,
    mode,
    connected,
    setSensitivity,
    setSmoothing,
    setDeadZone,
    setInputMode,
    recenter,
    toggleDemo,
  }), [sensitivity, smoothing, deadZone, mode, connected, setSensitivity, setSmoothing, setDeadZone, setInputMode, recenter, toggleDemo]);

  const contextValue: IrisContextValue = {
    ...telemetry,
    ...configValue,
    calibration,
    startCalibration,
    triggerBlink,
  };

  return (
    <IrisInputConfigContext.Provider value={configValue}>
      <IrisInputContext.Provider value={contextValue}>
        {children}
      </IrisInputContext.Provider>
    </IrisInputConfigContext.Provider>
  );
}
