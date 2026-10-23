'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';

export type CameraPreset = 'windshield' | 'captain' | 'pedestal' | 'overhead';

export interface FlightTelemetry {
  airspeed: number;
  altitude: number;
  verticalSpeed: number;
  heading: number;
  pitchDeg: number;
  rollDeg: number;
  gForce: number;
}

interface FlightCanvasProps {
  preset?: CameraPreset;
  onRecenterRef?: (fn: () => void) => void;
  onExit?: () => void;
  onTelemetry?: (t: FlightTelemetry) => void;
  showAirEffects?: boolean;
}

export default function FlightCanvas({
  preset = 'windshield',
  onRecenterRef,
  onExit,
  onTelemetry,
  showAirEffects = true,
}: FlightCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showAirEffectsRef = useRef(showAirEffects);
  useEffect(() => {
    showAirEffectsRef.current = showAirEffects;
  }, [showAirEffects]);

  const { pitch = 0, yaw = 0, roll = 0 } = useIrisInput();
  const { invertX = false, invertY = false } = useIrisSettings();

  // Head tracking input ref
  const inputRef = useRef({ pitch: 0, yaw: 0, roll: 0, invertX: false, invertY: false });
  useEffect(() => {
    inputRef.current = {
      pitch: typeof pitch === 'number' && !isNaN(pitch) ? pitch : 0,
      yaw: typeof yaw === 'number' && !isNaN(yaw) ? yaw : 0,
      roll: typeof roll === 'number' && !isNaN(roll) ? roll : 0,
      invertX: !!invertX,
      invertY: !!invertY,
    };
  }, [pitch, yaw, roll, invertX, invertY]);

  // Camera orientation state (radians)
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(0);
  const currentYawRef = useRef(0);
  const currentPitchRef = useRef(0);

  // Dynamic Cursor-Driven Aerodynamic Flight Physics
  const cursorFlightRef = useRef({ x: 0, y: 0 });
  const flightRollRef = useRef(0);
  const flightPitchRef = useRef(0);
  const flightHeadingRef = useRef(0);
  const flightSpeedRef = useRef(270); // knots
  const flightAltRef = useRef(15400); // feet
  const flightVsRef = useRef(0); // ft/min

  // Drag tracking for 360 inspection
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Camera ref for FOV zoom
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Handle Preset selection
  useEffect(() => {
    switch (preset) {
      case 'windshield':
        targetYawRef.current = 0;
        targetPitchRef.current = 0;
        break;
      case 'captain':
        targetYawRef.current = 0.52;
        targetPitchRef.current = -0.14;
        break;
      case 'pedestal':
        targetYawRef.current = 0;
        targetPitchRef.current = -0.62;
        break;
      case 'overhead':
        targetYawRef.current = 0;
        targetPitchRef.current = 0.74;
        break;
    }
  }, [preset]);

  const handleRecenter = useCallback(() => {
    targetYawRef.current = 0;
    targetPitchRef.current = 0;
    flightHeadingRef.current = 0;
    flightRollRef.current = 0;
    flightPitchRef.current = 0;
    cursorFlightRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    if (onRecenterRef) {
      onRecenterRef(handleRecenter);
    }
  }, [onRecenterRef, handleRecenter]);

  // Main Three.js setup & render loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let sphere: THREE.Mesh | null = null;
    let texture: THREE.Texture | null = null;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
      camera.rotation.order = 'YXZ';
      camera.position.set(0, 0, 0);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x05070e, 1);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 1. 360 Panorama Cockpit Sphere
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/images/boeing-737-cockpit-360.jpg';

      img.onload = () => {
        try {
          texture = new THREE.Texture(img);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.needsUpdate = true;

          const geometry = new THREE.SphereGeometry(500, 64, 48);
          geometry.scale(-1, 1, 1);

          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });

          sphere = new THREE.Mesh(geometry, material);
          sphere.rotation.y = -Math.PI / 2;
          scene?.add(sphere);

          setLoading(false);
        } catch (e) {
          console.error('Error creating 3D cockpit sphere:', e);
          setErrorMsg('Error rendering cockpit geometry.');
          setLoading(false);
        }
      };

      img.onerror = () => {
        console.error('Failed to load cockpit panorama asset');
        setErrorMsg('Could not load cockpit panorama asset.');
        setLoading(false);
      };

      // 2. Airflow & Speed Lines Particle System (Moving Air Effect)
      const STREAK_COUNT = 240;
      const streakPositions = new Float32Array(STREAK_COUNT * 2 * 3);
      const streakData: { x: number; y: number; z: number; len: number; speed: number }[] = [];

      for (let i = 0; i < STREAK_COUNT; i++) {
        const x = (Math.random() - 0.5) * 110;
        const y = (Math.random() - 0.25) * 75;
        const z = -Math.random() * 320 - 15;
        const len = 7 + Math.random() * 14;
        const speed = 190 + Math.random() * 160;
        streakData.push({ x, y, z, len, speed });

        const idx = i * 6;
        streakPositions[idx] = x;
        streakPositions[idx + 1] = y;
        streakPositions[idx + 2] = z;

        streakPositions[idx + 3] = x;
        streakPositions[idx + 4] = y;
        streakPositions[idx + 5] = z + len;
      }

      const streakGeo = new THREE.BufferGeometry();
      streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));

      const streakMat = new THREE.LineBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const streakLines = new THREE.LineSegments(streakGeo, streakMat);
      streakLines.visible = showAirEffectsRef.current;
      scene.add(streakLines);

      // 3. Floating Cloud Wisps (Soft Atmospheric Puffs)
      const PUFF_COUNT = 35;
      const puffPos = new Float32Array(PUFF_COUNT * 3);
      const puffData: { x: number; y: number; z: number; speed: number }[] = [];

      for (let i = 0; i < PUFF_COUNT; i++) {
        const x = (Math.random() - 0.5) * 180;
        const y = (Math.random() - 0.35) * 110;
        const z = -Math.random() * 380 - 25;
        const speed = 130 + Math.random() * 90;
        puffData.push({ x, y, z, speed });

        puffPos[i * 3] = x;
        puffPos[i * 3 + 1] = y;
        puffPos[i * 3 + 2] = z;
      }

      const puffGeo = new THREE.BufferGeometry();
      puffGeo.setAttribute('position', new THREE.BufferAttribute(puffPos, 3));

      const puffMat = new THREE.PointsMaterial({
        color: 0xbae6fd,
        size: 14,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });

      const puffPoints = new THREE.Points(puffGeo, puffMat);
      puffPoints.visible = showAirEffectsRef.current;
      scene.add(puffPoints);

      // Window Resize
      const onResize = () => {
        if (!camera || !renderer) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      // Track cursor displacement from screen center to fly the plane
      const handleWindowMouseMove = (e: MouseEvent) => {
        // -1 (left) to +1 (right), -1 (top) to +1 (bottom)
        const cx = (e.clientX / window.innerWidth) * 2 - 1;
        const cy = (e.clientY / window.innerHeight) * 2 - 1;
        cursorFlightRef.current = { x: cx, y: cy };
      };
      window.addEventListener('mousemove', handleWindowMouseMove);

      // Smooth 60fps Render Loop
      let lastTime = performance.now();
      let frameCount = 0;

      const render = (time: number) => {
        animId = requestAnimationFrame(render);
        const delta = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;
        frameCount++;

        // Smooth camera preset lerping
        const smoothFactor = Math.min(1, delta * 10);
        currentYawRef.current = THREE.MathUtils.lerp(
          currentYawRef.current,
          targetYawRef.current,
          smoothFactor
        );
        currentPitchRef.current = THREE.MathUtils.lerp(
          currentPitchRef.current,
          targetPitchRef.current,
          smoothFactor
        );

        // =====================================================================
        // CURSOR-DRIVEN AERODYNAMIC FLIGHT PHYSICS
        // =====================================================================
        const cFlight = cursorFlightRef.current;

        // 1. Aerodynamic Bank (Roll): moving cursor right banks right, left banks left
        const targetFlightRoll = cFlight.x * 0.44; // Up to ~25° bank
        flightRollRef.current = THREE.MathUtils.lerp(flightRollRef.current, targetFlightRoll, delta * 4.5);

        // 2. Turning (Yaw): banked aircraft naturally turns into the bank
        flightHeadingRef.current += (cFlight.x * 0.4) * delta;

        // 3. Pitching (Climb / Dive):
        // Moving cursor UP (cy < 0) pushes yoke forward into dive
        // Moving cursor DOWN (cy > 0) pulls yoke back into climb
        const targetFlightPitch = -cFlight.y * 0.35; // Up to ~20° pitch
        flightPitchRef.current = THREE.MathUtils.lerp(flightPitchRef.current, targetFlightPitch, delta * 5);

        // 4. Airspeed & Altitude Dynamics
        const targetAirspeed = Math.max(190, Math.min(350, 270 - flightPitchRef.current * 170));
        flightSpeedRef.current = THREE.MathUtils.lerp(flightSpeedRef.current, targetAirspeed, delta * 2.5);

        const currentSpeedMultiplier = flightSpeedRef.current / 260;

        // Vertical speed (ft/min)
        const vs = flightPitchRef.current * 4200;
        flightVsRef.current = vs;
        flightAltRef.current = Math.max(900, flightAltRef.current + (vs / 60) * delta);

        // 5. Cockpit Airframe Micro-Vibration & Particle Visibility
        const isAirActive = showAirEffectsRef.current;
        streakLines.visible = isAirActive;
        puffPoints.visible = isAirActive;

        const vibIntensity = isAirActive ? (flightSpeedRef.current / 270) * 0.08 : 0;
        const vibX = isAirActive ? Math.sin(time * 0.024) * vibIntensity : 0;
        const vibY = isAirActive ? Math.cos(time * 0.02) * (vibIntensity * 0.7) : 0;

        // =====================================================================
        // ANIMATE AIRFLOW STREAKS & MOVING WIND (If Air Effects Enabled)
        // =====================================================================
        if (isAirActive) {
          const posAttr = streakGeo.attributes.position as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < STREAK_COUNT; i++) {
            const s = streakData[i];
            s.z += s.speed * currentSpeedMultiplier * delta;

            // When wind streak passes windshield, loop back in front
            if (s.z > 12) {
              s.z = -320 - Math.random() * 40;
              s.x = (Math.random() - 0.5) * 110;
              s.y = (Math.random() - 0.25) * 75;
            }

            const idx = i * 6;
            posArr[idx] = s.x;
            posArr[idx + 1] = s.y;
            posArr[idx + 2] = s.z;

            posArr[idx + 3] = s.x;
            posArr[idx + 4] = s.y;
            posArr[idx + 5] = s.z + s.len * Math.max(1, currentSpeedMultiplier * 1.35);
          }
          posAttr.needsUpdate = true;

          // Animate Cloud Wisps
          const puffAttr = puffGeo.attributes.position as THREE.BufferAttribute;
          const puffArr = puffAttr.array as Float32Array;
          for (let i = 0; i < PUFF_COUNT; i++) {
            const p = puffData[i];
            p.z += p.speed * currentSpeedMultiplier * delta;
            if (p.z > 20) {
              p.z = -380;
              p.x = (Math.random() - 0.5) * 180;
              p.y = (Math.random() - 0.35) * 110;
            }
            puffArr[i * 3] = p.x;
            puffArr[i * 3 + 1] = p.y;
            puffArr[i * 3 + 2] = p.z;
          }
          puffAttr.needsUpdate = true;
        }

        // Head tracking input
        const inp = inputRef.current;
        const effYaw = inp.invertX ? -inp.yaw : inp.yaw;
        const effPitch = inp.invertY ? -inp.pitch : inp.pitch;

        const headYaw = -effYaw * (Math.PI / 2);
        const headPitch = -effPitch * (Math.PI / 3.5);
        const headRoll = -inp.roll * (Math.PI / 6);

        // Combine all flight angles
        const totalYaw = currentYawRef.current + headYaw + flightHeadingRef.current;
        const totalPitch = currentPitchRef.current + headPitch + flightPitchRef.current;
        const clampedPitch = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, totalPitch));
        const totalRoll = flightRollRef.current + headRoll;

        if (camera) {
          camera.rotation.order = 'YXZ';
          camera.rotation.y = totalYaw;
          camera.rotation.x = clampedPitch;
          camera.rotation.z = totalRoll;
          camera.position.set(vibX, vibY, 0);
        }

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }

        // Emit Telemetry update ~8 times per sec for smooth HUD display
        if (onTelemetry && frameCount % 8 === 0) {
          onTelemetry({
            airspeed: Math.round(flightSpeedRef.current),
            altitude: Math.round(flightAltRef.current),
            verticalSpeed: Math.round(flightVsRef.current),
            heading: Math.round(((flightHeadingRef.current * (180 / Math.PI)) % 360 + 360) % 360),
            pitchDeg: Math.round(flightPitchRef.current * (180 / Math.PI)),
            rollDeg: Math.round(flightRollRef.current * (180 / Math.PI)),
            gForce: Number((1.0 + Math.abs(cFlight.x) * 0.35 + (cFlight.y > 0 ? cFlight.y * 0.45 : cFlight.y * 0.2)).toFixed(2)),
          });
        }
      };

      animId = requestAnimationFrame(render);

      return () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', handleWindowMouseMove);
        cancelAnimationFrame(animId);
        if (renderer) renderer.dispose();
        if (sphere) {
          sphere.geometry.dispose();
          if (Array.isArray(sphere.material)) {
            sphere.material.forEach((m) => m.dispose());
          } else {
            sphere.material.dispose();
          }
        }
        if (texture) texture.dispose();
        if (streakGeo) streakGeo.dispose();
        if (streakMat) streakMat.dispose();
        if (puffGeo) puffGeo.dispose();
        if (puffMat) puffMat.dispose();
        if (container) container.innerHTML = '';
      };
    } catch (err: any) {
      console.error('WebGL initialization error:', err);
      setErrorMsg('WebGL not supported or failed to initialize.');
      setLoading(false);
    }
  }, [onTelemetry]);

  // Pointer Drag for 360 look around
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    if (mountRef.current) {
      mountRef.current.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.0035;
    targetYawRef.current += dx * sensitivity;
    targetPitchRef.current += dy * sensitivity;

    targetPitchRef.current = Math.max(
      -Math.PI / 2.15,
      Math.min(Math.PI / 2.15, targetPitchRef.current)
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    if (mountRef.current) {
      mountRef.current.style.cursor = 'crosshair';
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const currentFov = cameraRef.current.fov;
    const newFov = Math.max(45, Math.min(90, currentFov + e.deltaY * 0.04));
    cameraRef.current.fov = newFov;
    cameraRef.current.updateProjectionMatrix();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#05070e',
      }}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      />

      {/* Loading Spinner */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#05070e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            color: '#38bdf8',
            fontFamily: "'JetBrains Mono', monospace",
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '4px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em' }}>
            PREPARING FLIGHT SIMULATION DECK...
          </span>
        </div>
      )}

      {/* Error Fallback */}
      {errorMsg && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 14, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            color: '#f87171',
            padding: '24px',
            textAlign: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 800 }}>{errorMsg}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Retry Loading
          </button>
        </div>
      )}
    </div>
  );
}
