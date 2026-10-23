'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Navigation, ChevronLeft } from 'lucide-react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { playCollectSound, playCrashSound, playClickSound } from '@/lib/audio/soundEffects';

export default function RunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAME_OVER'>('READY');
  const [score, setScore] = useState(0);
  const [collectibles, setCollectibles] = useState(0);

  const { yaw, connected, blink, mode } = useIrisInput();
  const { interfaceSounds, volume, invertX } = useIrisSettings();

  const stateRef = useRef({
    state: 'READY',
    score: 0,
    colCount: 0,
    lane: 1, // 0: top, 1: middle, 2: bottom
    lanes: [65, 190, 315],
    player: { x: 100, y: 190, width: 44, height: 34 },
    obstacles: [] as { x: number; lane: number; width: number; height: number }[],
    items: [] as { x: number; lane: number; size: number; collected: boolean }[],
    frames: 0,
    speed: 3.2,
    canvasWidth: 800,
    canvasHeight: 380,
  });

  // Track the lane wherever the cursor is (both on canvas and globally across window)
  useEffect(() => {
    const updateLaneFromY = (clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const s = stateRef.current;

      // Calculate relative Y percentage inside the canvas bounds
      const clampedY = Math.max(0, Math.min(rect.height - 1, clientY - rect.top));
      const normalizedY = (clampedY / rect.height) * s.canvasHeight;
      const laneHeight = s.canvasHeight / 3;
      const newLane = Math.max(0, Math.min(2, Math.floor(normalizedY / laneHeight)));

      s.lane = newLane;
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (stateRef.current.state === 'PLAYING') {
        updateLaneFromY(e.clientY);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, []);

  // Direct mouse move handler on the canvas element
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.state !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const normalizedY = (relY / rect.height) * stateRef.current.canvasHeight;
    const laneHeight = stateRef.current.canvasHeight / 3;
    const newLane = Math.max(0, Math.min(2, Math.floor(normalizedY / laneHeight)));
    stateRef.current.lane = newLane;
  };

  const startGame = useCallback(() => {
    const s = stateRef.current;
    const soundVol = (volume / 100) * 0.35;

    if (s.state === 'READY' || s.state === 'GAME_OVER') {
      s.state = 'PLAYING';
      s.score = 0;
      s.colCount = 0;
      s.lane = 1;
      s.speed = 3.2;
      s.obstacles = [];
      s.items = [];
      s.frames = 0;
      s.player.y = s.lanes[1] - s.player.height / 2;
      setGameState('PLAYING');
      setScore(0);
      setCollectibles(0);
      if (interfaceSounds) playClickSound(soundVol);
    }
  }, [interfaceSounds, volume]);

  useEffect(() => {
    if (blink && stateRef.current.state !== 'PLAYING') {
      startGame();
    }
  }, [blink, startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (s.state !== 'PLAYING') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        s.lane = Math.max(0, s.lane - 1);
        if (interfaceSounds) playClickSound((volume / 100) * 0.2);
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        s.lane = Math.min(2, s.lane + 1);
        if (interfaceSounds) playClickSound((volume / 100) * 0.2);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startGame, interfaceSounds, volume]);

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

      // Cyber highway dark asphalt
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

      const laneHeight = s.canvasHeight / 3;

      // Draw 3 lanes with glowing neon divider lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 15]);

      for (let i = 1; i <= 2; i++) {
        const lineY = i * laneHeight;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(s.canvasWidth, lineY);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset dash

      // Vivid Glowing Beam on Active Cursor Lane
      const activeLaneTop = s.lane * laneHeight;
      const activeGrad = ctx.createLinearGradient(0, activeLaneTop, 0, activeLaneTop + laneHeight);
      activeGrad.addColorStop(0, 'rgba(56, 189, 248, 0.04)');
      activeGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.16)');
      activeGrad.addColorStop(1, 'rgba(56, 189, 248, 0.04)');

      ctx.fillStyle = activeGrad;
      ctx.fillRect(0, activeLaneTop, s.canvasWidth, laneHeight);

      // Active lane side indicator
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, activeLaneTop + 4, 8, laneHeight - 8);
      ctx.shadowBlur = 0;

      if (s.state === 'PLAYING') {
        s.frames++;
        s.score += 0.08;
        if (s.frames % 6 === 0) setScore(Math.floor(s.score));

        // Smooth speed adjustment
        if (s.speed < 4.8) {
          s.speed += 0.0003;
        }

        // Snap and smoothly glide ship to the cursor's target lane
        const targetY = s.lanes[s.lane] - s.player.height / 2;
        s.player.y += (targetY - s.player.y) * 0.3;

        // Spawn red laser barrier obstacles (every 110 frames)
        if (s.frames % 110 === 0) {
          const obsLane = Math.floor(Math.random() * 3);
          s.obstacles.push({
            x: s.canvasWidth,
            lane: obsLane,
            width: 30,
            height: 50,
          });
        }

        // Spawn golden energy gems (every 80 frames)
        if (s.frames % 80 === 0) {
          const gemLane = Math.floor(Math.random() * 3);
          s.items.push({
            x: s.canvasWidth,
            lane: gemLane,
            size: 16,
            collected: false,
          });
        }

        // Update gems
        for (let i = s.items.length - 1; i >= 0; i--) {
          const item = s.items[i];
          if (!item.collected) {
            item.x -= s.speed;
            const itemCenterY = s.lanes[item.lane];

            // Draw glowing diamond gem
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(item.x, itemCenterY - item.size);
            ctx.lineTo(item.x + item.size, itemCenterY);
            ctx.lineTo(item.x, itemCenterY + item.size);
            ctx.lineTo(item.x - item.size, itemCenterY);
            ctx.closePath();
            ctx.fill();

            // Center sparkle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(item.x, itemCenterY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Pick up hitbox
            if (
              s.lane === item.lane &&
              s.player.x < item.x + item.size + 18 &&
              s.player.x + s.player.width > item.x - item.size - 18
            ) {
              item.collected = true;
              s.score += 20;
              s.colCount++;
              setCollectibles(s.colCount);
              if (interfaceSounds) playCollectSound((volume / 100) * 0.35);
            }
          }
          if (item.x < -20 || item.collected) {
            s.items.splice(i, 1);
          }
        }

        // Update obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;
          const obsY = s.lanes[obs.lane] - obs.height / 2;

          // Glowing red laser gate
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(obs.x, obsY, obs.width, obs.height, 6)
            : ctx.fillRect(obs.x, obsY, obs.width, obs.height);
          ctx.fill();

          // Laser warning core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obs.x + 8, obsY + 8, obs.width - 16, obs.height - 16);
          ctx.shadowBlur = 0;

          // Collision check
          const pad = 8;
          if (
            s.lane === obs.lane &&
            s.player.x + pad < obs.x + obs.width &&
            s.player.x + s.player.width - pad > obs.x
          ) {
            s.state = 'GAME_OVER';
            setGameState('GAME_OVER');
            if (interfaceSounds) playCrashSound((volume / 100) * 0.4);
          }

          if (obs.x + obs.width < 0) {
            s.obstacles.splice(i, 1);
          }
        }
      } else {
        // Draw static preview
        ctx.fillStyle = '#ef4444';
        s.obstacles.forEach((obs) => {
          const obsY = s.lanes[obs.lane] - obs.height / 2;
          ctx.fillRect(obs.x, obsY, obs.width, obs.height);
        });
      }

      // Draw Player (Sleek Cyber Hovercraft)
      const px = s.player.x;
      const py = s.player.y;

      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#0284c7';

      // Hull
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(px, py, s.player.width, s.player.height, 10)
        : ctx.fillRect(px, py, s.player.width, s.player.height);
      ctx.fill();

      // Top canopy
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(px + 10, py + 6, s.player.width - 18, s.player.height - 12, 6)
        : ctx.fillRect(px + 10, py + 6, s.player.width - 18, s.player.height - 12);
      ctx.fill();

      // Thruster Flame
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(px + s.player.width, py + s.player.height / 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
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

      {/* Top Bar */}
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
            NEON RUNNER
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
          <Navigation size={15} />
          <span>CURSOR LANE TRACKING (TOP / MID / BOTTOM)</span>
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
          onClick={startGame}
          onMouseMove={handleCanvasMouseMove}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
        />

        {/* HUD Score */}
        <div style={{ position: 'absolute', top: '16px', right: '20px', textAlign: 'right', pointerEvents: 'none' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
            SCORE: {score}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>
            GEMS: {collectibles}
          </div>
        </div>

        {/* Start / Game Over Overlay */}
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
                {gameState === 'READY' ? 'NEON RUNNER' : 'RUN COMPLETE'}
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 22px 0' }}>
                Move cursor to top, middle, or bottom to steer into that lane. Collect gems and dodge lasers!
              </p>
              <button
                onClick={startGame}
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
                {gameState === 'READY' ? 'START RUNNER' : 'PLAY AGAIN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
