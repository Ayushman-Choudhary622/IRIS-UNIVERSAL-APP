'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import IrisBackButton from '@/components/IrisBackButton';
import { Feather, ChevronLeft } from 'lucide-react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { playJumpSound, playCrashSound, playClickSound } from '@/lib/audio/soundEffects';

export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAME_OVER'>('READY');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const { blink } = useIrisInput();
  const { interfaceSounds, volume } = useIrisSettings();

  const stateRef = useRef({
    state: 'READY',
    score: 0,
    speed: 3.6, // Faster, snappy, exciting pacing
    player: { x: 75, y: 0, width: 34, height: 34, dy: 0, jumpForce: -10.8, gravity: 0.5, grounded: true },
    obstacles: [] as { x: number; y: number; width: number; height: number }[],
    frames: 0,
    canvasWidth: 800,
    canvasHeight: 380,
    mouseY: 200,
  });

  useEffect(() => {
    const saved = localStorage.getItem('dinoHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    const soundVol = (volume / 100) * 0.35;

    if (s.state === 'READY' || s.state === 'GAME_OVER') {
      s.state = 'PLAYING';
      s.score = 0;
      s.speed = 3.6;
      s.obstacles = [];
      s.player.y = s.canvasHeight - 50 - s.player.height;
      s.player.dy = 0;
      s.player.grounded = true;
      setGameState('PLAYING');
      setScore(0);
      if (interfaceSounds) playClickSound(soundVol);
      return;
    }

    if (s.state === 'PLAYING' && s.player.grounded) {
      s.player.dy = s.player.jumpForce;
      s.player.grounded = false;
      if (interfaceSounds) playJumpSound(soundVol);
    }
  }, [interfaceSounds, volume]);

  useEffect(() => {
    if (blink) jump();
  }, [blink, jump]);

  // Head tracking / Cursor pitch control: Lifting head triggers a jump
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    stateRef.current.mouseY = relY;
    if (relY < 140 && stateRef.current.player.grounded && stateRef.current.state === 'PLAYING') {
      jump();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

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

      // Cyber twilight sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, s.canvasHeight);
      grad.addColorStop(0, '#0a1020');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

      // Distant cyber stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 15; i++) {
        const sx = (i * 55 + (time * 0.01)) % s.canvasWidth;
        const sy = (i * 22) % (s.canvasHeight - 120);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Neon horizon grid line
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, s.canvasHeight - 50, s.canvasWidth, 50);

      ctx.fillStyle = '#0ea5e9';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillRect(0, s.canvasHeight - 50, s.canvasWidth, 2.5);
      ctx.shadowBlur = 0; // Reset shadow

      if (s.state === 'PLAYING') {
        s.frames++;
        s.score += 0.1;
        if (s.frames % 5 === 0) setScore(Math.floor(s.score));

        // Gradual speed increase up to 5.4 max
        if (s.speed < 5.4) {
          s.speed += 0.0004;
        }

        // Player jump gravity physics
        s.player.dy += s.player.gravity;
        s.player.y += s.player.dy;

        // Floor collision
        if (s.player.y + s.player.height >= s.canvasHeight - 50) {
          s.player.y = s.canvasHeight - 50 - s.player.height;
          s.player.dy = 0;
          s.player.grounded = true;
        }

        // Faster obstacle spawn pacing (every 95 frames at 3.6 speed)
        if (s.frames % 95 === 0) {
          const height = 30 + Math.random() * 22;
          s.obstacles.push({
            x: s.canvasWidth,
            y: s.canvasHeight - 50 - height,
            width: 22,
            height: height,
          });
        }

        // Update and draw obstacles (Glowing neon hurdles)
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Glowing obstacle
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4)
            : ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Collision detection with forgiving hitbox padding
          const hitPad = 6;
          if (
            s.player.x + hitPad < obs.x + obs.width &&
            s.player.x + s.player.width - hitPad > obs.x &&
            s.player.y + hitPad < obs.y + obs.height &&
            s.player.y + s.player.height - hitPad > obs.y
          ) {
            s.state = 'GAME_OVER';
            setGameState('GAME_OVER');
            if (interfaceSounds) playCrashSound((volume / 100) * 0.4);
            setHighScore((prev) => {
              const newHigh = Math.max(prev, Math.floor(s.score));
              localStorage.setItem('dinoHighScore', newHigh.toString());
              return newHigh;
            });
          }

          if (obs.x + obs.width < 0) {
            s.obstacles.splice(i, 1);
          }
        }
      } else {
        // Draw static preview
        ctx.fillStyle = '#10b981';
        s.obstacles.forEach((obs) => {
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });
      }

      // Draw player (Glowing Cyber Glider with Eye)
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(s.player.x, s.player.y, s.player.width, s.player.height, 8)
        : ctx.fillRect(s.player.x, s.player.y, s.player.width, s.player.height);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Player Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.player.x + s.player.width - 9, s.player.y + 10, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070b12';
      ctx.beginPath();
      ctx.arc(s.player.x + s.player.width - 8, s.player.y + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, []);

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
      {/* Upper-Left Standard BACK TO GAMES Button */}
      <IrisBackButton
        href="/games"
        label="BACK TO GAMES"
        subtitle="Return to Games Menu"
        accentColor="#38bdf8"
        showHomeShortcut={true}
        position="fixed"
      />

      {/* Top Header */}
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
            DINO GLIDE
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
          <Feather size={15} />
          <span>SNAPPY PACE · CURSOR / BLINK JUMP</span>
        </div>
      </div>

      {/* Canvas Container */}
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
          onClick={jump}
          onMouseMove={handleMouseMove}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
        />

        {/* HUD Score */}
        <div style={{ position: 'absolute', top: '16px', right: '20px', textAlign: 'right', pointerEvents: 'none' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
            SCORE: {score}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
            BEST: {highScore}
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
                {gameState === 'READY' ? 'DINO GLIDE' : 'GAME OVER'}
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 22px 0' }}>
                Blink or move cursor up to float jump over barriers.
              </p>
              <button
                onClick={jump}
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
                {gameState === 'READY' ? 'START RUN' : 'PLAY AGAIN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
