'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import IrisBackButton from '@/components/IrisBackButton';
import { ChevronLeft, Volume2, VolumeX, SkipBack, SkipForward, Music, Wifi } from 'lucide-react';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { playClickSound } from '@/lib/audio/soundEffects';

interface Track {
  id: string;
  name: string;
  artist: string;
  duration: string;
  src: string;
  color: string;
  mood: string;
}

const TRACKS: Track[] = [
  {
    id: 'moonlight-sonata',
    name: 'Moonlight Sonata',
    artist: 'Ludwig van Beethoven',
    duration: '5:15',
    src: '/audio/music/moonlight-sonata.mp3',
    color: '#38bdf8',
    mood: 'Contemplative, celestial nocturnal piano',
  },
  {
    id: 'gymnopedie',
    name: 'Gymnopédie No. 1',
    artist: 'Erik Satie',
    duration: '3:30',
    src: '/audio/music/gymnopedie.mp3',
    color: '#c084fc',
    mood: 'Weightless impressionist piano harmony',
  },
  {
    id: 'quiet-life',
    name: 'Quiet Life',
    artist: 'Álvaro S (Lo-Fi)',
    duration: '2:45',
    src: '/audio/music/quiet-life-lofi.mp3',
    color: '#f43f5e',
    mood: 'Cozy rain beats, warm Rhodes chords',
  },
  {
    id: 'chill-acoustic',
    name: 'Golden Horizon',
    artist: 'Jamendo Acoustic Ensemble',
    duration: '3:50',
    src: '/audio/music/chill-acoustic.mp3',
    color: '#10b981',
    mood: 'Uplifting sunlit fingerstyle acoustic guitar',
  },
];

export default function MusicPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [timeStr, setTimeStr] = useState('09:15');
  const [batteryPct, setBatteryPct] = useState(94);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { interfaceSounds, volume } = useIrisSettings();

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

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const playTrack = (idx: number) => {
    setCurrentIdx(idx);
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    const track = TRACKS[idx];
    audio.src = track.src;
    audio.volume = isMuted ? 0 : volumeLevel;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.onended = () => {
      const nextIdx = (idx + 1) % TRACKS.length;
      playTrack(nextIdx);
    };

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
    });
  };

  const togglePlay = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);

    if (!audioRef.current) {
      playTrack(currentIdx);
      return;
    }

    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (audio.src && audio.src.includes(TRACKS[currentIdx].id)) {
        audio.play().then(() => setIsPlaying(true)).catch(() => playTrack(currentIdx));
      } else {
        playTrack(currentIdx);
      }
    }
  };

  const skipTrack = (forward: boolean) => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    const nextIdx = forward
      ? (currentIdx + 1) % TRACKS.length
      : (currentIdx - 1 + TRACKS.length) % TRACKS.length;
    playTrack(nextIdx);
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolume = (newVol: number) => {
    setVolumeLevel(newVol);
    if (isMuted && newVol > 0) setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volumeLevel;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  // Keyboard shortcut: Spacebar to play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, currentIdx]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const current = TRACKS[currentIdx];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#070b12',
        backgroundImage: 'radial-gradient(circle at 50% 35%, #0f182b 0%, #05080f 100%)',
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
      {/* 1. TOP STATUS BAR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          padding: '2px 4px',
        }}
      >
        {/* Left: BACK TO ENTERTAINMENT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifySelf: 'start' }}>
          <IrisBackButton href="/entertainment" label="BACK TO ENTERTAINMENT" accentColor="#c084fc" showHomeShortcut={true} position="static" />

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '18px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textShadow: '0 0 12px rgba(192, 132, 252, 0.5)',
            }}
          >
            {timeStr}
          </span>
        </div>

        {/* Center: MUSIC Header */}
        <h1
          style={{
            fontSize: 'clamp(24px, 2.8vw, 36px)',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
            textAlign: 'center',
            justifySelf: 'center',
            background: 'linear-gradient(90deg, #ffffff 15%, #e0e7ff 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 24px rgba(192, 132, 252, 0.5))',
          }}
        >
          MUSIC
        </h1>

        {/* Right: Signal, Wi-Fi, and Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#94a3b8', justifySelf: 'end' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2.5px', height: '14px' }}>
            <div style={{ width: '3px', height: '4px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '7px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '10px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '14px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
          </div>
          <Wifi size={18} strokeWidth={2.2} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#cbd5e1', fontWeight: 600 }}>
            {batteryPct}%
          </span>
        </div>
      </div>

      {/* 2. MAIN CENTER: CLEAN, MINIMAL 2-COLUMN PLAYER (FULL SPACE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 420px) 1fr',
          gap: 'clamp(20px, 3vw, 40px)',
          width: '100%',
          maxWidth: '1240px',
          margin: 'auto',
          alignItems: 'center',
          flex: 1,
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        {/* Left: Spinning Vinyl Disc & Now-Playing Hero */}
        <div
          style={{
            backgroundColor: 'rgba(10, 18, 34, 0.85)',
            border: `2px solid ${current.color}55`,
            borderRadius: '26px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: `0 0 35px ${current.color}22`,
            height: '100%',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          {/* Vinyl Record */}
          <div
            style={{
              width: 'clamp(160px, 22vh, 210px)',
              height: 'clamp(160px, 22vh, 210px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1e293b 0%, #0f172a 35%, #020617 70%, #0a0f1d 100%)',
              border: '4px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isPlaying ? `0 0 35px ${current.color}77` : '0 0 15px rgba(0,0,0,0.6)',
              animation: isPlaying ? 'spin 6s linear infinite' : 'none',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: current.color,
                border: '3px solid #0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Music size={22} color="#ffffff" strokeWidth={2.4} />
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0' }}>
              {current.name}
            </h2>
            <div style={{ fontSize: '15px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
              {current.artist}
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
              {current.mood}
            </p>
          </div>
        </div>

        {/* Right: The 4 Songs in Clean Rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            height: '100%',
            justifyContent: 'center',
          }}
        >
          {TRACKS.map((track, idx) => {
            const isSelected = currentIdx === idx;
            const isThisPlaying = isSelected && isPlaying;

            return (
              <button
                key={track.id}
                onClick={() => {
                  if (isSelected) {
                    togglePlay();
                  } else {
                    playTrack(idx);
                  }
                }}
                style={{
                  backgroundColor: isSelected ? 'rgba(18, 30, 52, 0.95)' : 'rgba(12, 18, 32, 0.75)',
                  border: isSelected ? `2px solid ${track.color}` : '1.5px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#ffffff',
                  boxShadow: isSelected ? `0 0 24px ${track.color}44` : 'none',
                  transition: 'all 0.18s ease',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Track Number Badge */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isSelected ? track.color : '#94a3b8',
                      flexShrink: 0,
                    }}
                  >
                    0{idx + 1}
                  </div>

                  {/* Play / Pause Action Button with Symbol & Text */}
                  <div
                    style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      backgroundColor: isThisPlaying ? track.color : 'rgba(255, 255, 255, 0.1)',
                      border: `1.5px solid ${track.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#ffffff',
                      flexShrink: 0,
                      boxShadow: isThisPlaying ? `0 0 16px ${track.color}88` : 'none',
                    }}
                  >
                    <span style={{ fontSize: '15px', lineHeight: 1 }}>{isThisPlaying ? '⏸' : '▶'}</span>
                    <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.05em' }}>
                      {isThisPlaying ? 'PLAYING' : 'PLAY'}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                      {track.name}
                    </div>
                    <div style={{ fontSize: '13px', color: isSelected ? track.color : '#94a3b8', fontWeight: 600 }}>
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}>
                  {track.duration}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. BOTTOM CONTROL BAR: SCRUBBER & PLAYBACK CONTROLS */}
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          backgroundColor: 'rgba(12, 18, 32, 0.95)',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '14px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxSizing: 'border-box',
        }}
      >
        {/* Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', width: '40px' }}>
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            aria-label="Seek track position"
            style={{
              flex: 1,
              accentColor: current.color,
              cursor: 'pointer',
              height: '6px',
            }}
          />

          <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#64748b', width: '40px', textAlign: 'right' }}>
            {formatTime(duration || 0)}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mini Info */}
          <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 700, minWidth: '180px' }}>
            {current.name} · <span style={{ color: current.color }}>{current.artist}</span>
          </div>

          {/* Controls: Prev, Master Play/Pause, Next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Previous Track Button */}
            <button
              onClick={() => skipTrack(false)}
              title="Previous song"
              style={{
                padding: '10px 18px',
                borderRadius: '14px',
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>⏮</span>
              <span>PREV</span>
            </button>

            {/* Master Big Play/Pause Button */}
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause song' : 'Play song'}
              style={{
                padding: '12px 28px',
                borderRadius: '16px',
                backgroundColor: current.color,
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                boxShadow: `0 0 28px ${current.color}aa, 0 4px 14px rgba(0, 0, 0, 0.5)`,
                transition: 'all 0.15s ease',
              }}
            >
              {isPlaying ? (
                <>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>⏸</span>
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>▶</span>
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* Next Track Button */}
            <button
              onClick={() => skipTrack(true)}
              title="Next song"
              style={{
                padding: '10px 18px',
                borderRadius: '14px',
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>NEXT</span>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>⏭</span>
            </button>
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px', justifyContent: 'flex-end' }}>
            <button
              onClick={toggleMute}
              title={isMuted || volumeLevel === 0 ? 'Unmute audio' : 'Mute audio'}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                backgroundColor: isMuted || volumeLevel === 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(30, 41, 59, 0.9)',
                border: isMuted || volumeLevel === 0 ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isMuted ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none',
              }}
            >
              <span style={{ fontSize: '15px' }}>{isMuted || volumeLevel === 0 ? '🔇' : '🔊'}</span>
              <span>{isMuted || volumeLevel === 0 ? 'MUTED' : 'MUTE'}</span>
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volumeLevel}
              onChange={(e) => handleVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              style={{
                width: '90px',
                accentColor: current.color,
                cursor: 'pointer',
                height: '6px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
