'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Compass, Sparkles, ChevronLeft } from 'lucide-react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { playFlapSound, playCollectSound, playCrashSound, playClickSound } from '@/lib/audio/soundEffects';

export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAME_OVER'>('READY');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const { blink, pitch } = useIrisInput();
  const { interfaceSounds, volume } = useIrisSettings();

  const stateRef = useRef({
    state: 'READY',
    score: 0,
    player: { x: 130, y: 190, radius: 18, dy: 0 },
    targetY: 190,
    trail: [] as { x: number; y: number; alpha: number }[],
    obstacles: [] as { x: number; topHeight: number; bottomY: number; passed: boolean }[],
    frames: 0,
    speed: 2.2, // Smooth, enjoyable glide speed
    canvasWidth: 800,
    canvasHeight: 380,
    gap: 165, // Generous, enjoyable gate gap
  });

  useEffect(() => {
    const saved = localStorage.getItem('flappyHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Pitch steering from head tracking context
  useEffect(() => {
    if (pitch !== undefined && stateRef.current.state === 'PLAYING') {
      const clampedPitch = Math.max(-0.4, Math.min(0.4, pitch));
      const mappedY = 190 + clampedPitch * 280;
      stateRef.current.targetY = Math.max(35, Math.min(345, mappedY));
    }
  }, [pitch]);

  // Mouse / cursor vertical position directly guides glider altitude
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    stateRef.current.targetY = Math.max(25, Math.min(stateRef.current.canvasHeight - 25, relY));
  };

  const flap = useCallback(() => {
    const s = stateRef.current;
    const soundVol = (volume / 100) * 0.35;

    if (s.state === 'READY' || s.state === 'GAME_OVER') {
      s.state = 'PLAYING';
      s.score = 0;
      s.player.y = 190;
      s.targetY = 190;
      s.obstacles = [];
      s.trail = [];
      s.frames = 0;
      setGameState('PLAYING');
      setScore(0);
      if (interfaceSounds) playClickSound(soundVol);
      return;
    }

    if (s.state === 'PLAYING') {
      s.targetY = Math.max(35, s.targetY - 50); // Upward boost
      if (interfaceSounds) playFlapSound(soundVol);
    }
  }, [interfaceSounds, volume]);

  useEffect(() => {
    if (blink) flap();
  }, [blink, flap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = (time: number) => {
      animationId = requestAnimationFrame(render);
      const s = stateRef.current;
      ctx.clearRect(0, 0, s.canvasWidth, s.canvasHeight);

      // Deep atmospheric cyber sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, s.canvasHeight);
      skyGrad.addColorStop(0, '#060c1a');
      skyGrad.addColorStop(0.5, '#0b162c');
      skyGrad.addColorStop(1, '#081022');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

      // Distant celestial grid / stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 24; i++) {
        const sx = (i * 68 - time * 0.02) % s.canvasWidth;
        const finalX = sx < 0 ? sx + s.canvasWidth : sx;
        const sy = (i * 27) % (s.canvasHeight - 40);
        ctx.fillRect(finalX, sy, 1.8, 1.8);
      }

      // Floating luminous cyber clouds
      for (let i = 0; i < 3; i++) {
        const cx = ((time * 0.02 + i * 280) % (s.canvasWidth + 200)) - 100;
        const cy = 60 + i * 80;
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 80);
        grad.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      if (s.state === 'PLAYING') {
        s.frames++;

        // Smooth altitude glide towards cursor
        s.player.y += (s.targetY - s.player.y) * 0.1;

        // Boundaries
        if (s.player.y + s.player.radius >= s.canvasHeight - 15) {
          s.player.y = s.canvasHeight - 15 - s.player.radius;
        }
        if (s.player.y - s.player.radius <= 15) {
          s.player.y = 15 + s.player.radius;
        }

        // Add jet trail particle
        if (s.frames % 2 === 0) {
          s.trail.push({ x: s.player.x - 14, y: s.player.y, alpha: 1.0 });
        }

        // Spawn gates (every 160 frames)
        if (s.frames % 160 === 0) {
          const topHeight = 45 + Math.random() * (s.canvasHeight - 90 - s.gap);
          s.obstacles.push({
            x: s.canvasWidth,
            topHeight,
            bottomY: topHeight + s.gap,
            passed: false,
          });
        }

        // Update obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Glowing Cyber Top Pillar
          const pillarGrad = ctx.createLinearGradient(obs.x, 0, obs.x + 40, 0);
          pillarGrad.addColorStop(0, '#0284c7');
          pillarGrad.addColorStop(0.5, '#38bdf8');
          pillarGrad.addColorStop(1, '#0369a1');

          ctx.fillStyle = pillarGrad;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;

          // Top gate pillar
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(obs.x, 0, 40, obs.topHeight, [0, 0, 10, 10])
            : ctx.fillRect(obs.x, 0, 40, obs.topHeight);
          ctx.fill();

          // Bottom gate pillar
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(obs.x, obs.bottomY, 40, s.canvasHeight - obs.bottomY, [10, 10, 0, 0])
            : ctx.fillRect(obs.x, obs.bottomY, 40, s.canvasHeight - obs.bottomY);
          ctx.fill();

          ctx.shadowBlur = 0; // Reset blur

          // Golden energy portal ring in center
          const ringY = obs.topHeight + s.gap / 2;
          ctx.strokeStyle = obs.passed ? '#10b981' : '#fbbf24';
          ctx.lineWidth = 3;
          ctx.shadowColor = obs.passed ? '#34d399' : '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(obs.x + 20, ringY, 24, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = obs.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Collision detection with forgiving hitbox padding
          const pad = 9;
          if (
            s.player.x + s.player.radius - pad > obs.x &&
            s.player.x - s.player.radius + pad < obs.x + 40 &&
            (s.player.y - s.player.radius + pad < obs.topHeight || s.player.y + s.player.radius - pad > obs.bottomY)
          ) {
            s.state = 'GAME_OVER';
            setGameState('GAME_OVER');
            if (interfaceSounds) playCrashSound((volume / 100) * 0.4);
            setHighScore((prev) => {
              const newHigh = Math.max(prev, s.score);
              localStorage.setItem('flappyHighScore', newHigh.toString());
              return newHigh;
            });
          }

          // Score on gate pass
          if (obs.x + 40 < s.player.x && !obs.passed) {
            obs.passed = true;
            s.score++;
            setScore(s.score);
            if (interfaceSounds) playCollectSound((volume / 100) * 0.35);
          }

          if (obs.x + 50 < 0) {
            s.obstacles.splice(i, 1);
          }
        }
      } else {
        // Draw static preview
        ctx.fillStyle = '#0284c7';
        s.obstacles.forEach((obs) => {
          ctx.fillRect(obs.x, 0, 40, obs.topHeight);
          ctx.fillRect(obs.x, obs.bottomY, 40, s.canvasHeight - obs.bottomY);
        });
      }

      // Draw jet trail particles
      for (let i = s.trail.length - 1; i >= 0; i--) {
        const p = s.trail[i];
        p.x -= s.speed * 0.8;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          s.trail.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Player (Aerodynamic Cyber Glider Drone)
      const px = s.player.x;
      const py = s.player.y;

      // Glow aura
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;

      // Main delta hull
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(px + 22, py); // Nose
      ctx.lineTo(px - 14, py - 14); // Top wing tip
      ctx.lineTo(px - 8, py); // Tail notch
      ctx.lineTo(px - 14, py + 14); // Bottom wing tip
      ctx.closePath();
      ctx.fill();

      // Glowing Cockpit Canopy
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(px + 4, py, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing accent stripes
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(px + 10, py);
      ctx.lineTo(px - 6, py - 9);
      ctx.lineTo(px - 2, py);
      ctx.lineTo(px - 6, py + 9);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0; // Reset blur
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [interfaceSounds, volume]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#070b12',
        backgroundImage: 'radial-gradient(circle at 50% 20%, #0e172a 0%, #05080f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Upper-Left Standard BACK TO GAMING Button */}
      <Link
        href="/games?tab=GAMING"
        onClick={() => {
          if (interfaceSounds) playClickSound((volume / 100) * 0.4);
        }}
        title="Return to Gaming Menu"
        style={{
          position: 'fixed',
          top: 'clamp(12px, 2.2vh, 26px)',
          left: 'clamp(16px, 3.5vw, 48px)',
          zIndex: 9999,
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
          outline: 'none',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.3)';
          e.currentTarget.style.borderColor = '#e9d5ff';
          e.currentTarget.style.boxShadow = '0 0 32px rgba(192, 132, 252, 0.7), 0 6px 20px rgba(0, 0, 0, 0.7)';
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
          e.currentTarget.style.borderColor = '#c084fc';
          e.currentTarget.style.boxShadow = '0 0 24px rgba(192, 132, 252, 0.45), 0 4px 14px rgba(0, 0, 0, 0.6)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <ChevronLeft size={22} strokeWidth={2.6} style={{ color: '#c084fc' }} />
        <span>BACK TO GAMING</span>
      </Link>

      {/* Top Navigation */}
      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
            AERO GLIDE
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '9999px' }}>
            HANDS-FREE
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            padding: '6px 14px',
            borderRadius: '20px',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <Compass size={15} />
          <span>MOVE CURSOR UP / DOWN TO GLIDE</span>
        </div>
      </div>

      {/* Canvas Frame */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '840px',
          height: '400px',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '2px solid #0284c7',
          boxShadow: '0 0 35px rgba(2, 132, 199, 0.4)',
          backgroundColor: '#0a1020',
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          onClick={flap}
          onMouseMove={handleMouseMove}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
        />

        {/* HUD Score */}
        <div style={{ position: 'absolute', top: '16px', right: '20px', textAlign: 'right', pointerEvents: 'none' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
            GATES: {score}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
            BEST: {highScore}
          </div>
        </div>

        {/* Overlay */}
        {gameState !== 'PLAYING' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(7, 11, 20, 0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '36px 40px',
                backgroundColor: '#131e30',
                border: '2px solid #38bdf8',
                borderRadius: '24px',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.4)',
                maxWidth: '360px',
              }}
            >
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0' }}>
                {gameState === 'READY' ? 'SKY GLIDER' : 'GATE CLEARED'}
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 22px 0' }}>
                Guide altitude up and down with your cursor to pass through the energy rings.
              </p>
              <button
                onClick={flap}
                style={{
                  width: '100%',
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  border: '1.5px solid #38bdf8',
                  borderRadius: '14px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                }}
              >
                {gameState === 'READY' ? 'START FLIGHT' : 'PLAY AGAIN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
