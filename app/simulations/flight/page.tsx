'use client';

import React, { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import FlightHUD from '@/components/simulations/flight/FlightHUD';
import { CameraPreset, FlightTelemetry } from '@/components/simulations/flight/FlightCanvas';

const FlightCanvas = dynamic(
  () => import('@/components/simulations/flight/FlightCanvas'),
  { ssr: false }
);

export default function FlightSimulationPage() {
  const router = useRouter();
  const [preset, setPreset] = useState<CameraPreset>('windshield');
  const [telemetry, setTelemetry] = useState<FlightTelemetry>({
    airspeed: 270,
    altitude: 15400,
    verticalSpeed: 0,
    heading: 90,
    pitchDeg: 0,
    rollDeg: 0,
    gForce: 1.0,
  });
  const [showAirEffects, setShowAirEffects] = useState(true);
  const recenterRef = useRef<() => void>(() => {});

  const handleToggleAirEffects = useCallback(() => {
    setShowAirEffects((prev) => !prev);
  }, []);

  const handleRecenterRegistration = useCallback((fn: () => void) => {
    recenterRef.current = fn;
  }, []);

  const handleRecenter = () => {
    if (recenterRef.current) {
      recenterRef.current();
    }
  };

  const handleExit = useCallback(() => {
    router.push('/entertainment');
  }, [router]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#05070e',
        userSelect: 'none',
      }}
    >
      <FlightCanvas
        preset={preset}
        onRecenterRef={handleRecenterRegistration}
        onExit={handleExit}
        onTelemetry={setTelemetry}
        showAirEffects={showAirEffects}
      />

      <FlightHUD
        preset={preset}
        onSelectPreset={setPreset}
        onRecenter={handleRecenter}
        onExit={handleExit}
        telemetry={telemetry}
        showAirEffects={showAirEffects}
        onToggleAirEffects={handleToggleAirEffects}
      />
    </div>
  );
}
