'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  ChevronLeft,
  Wifi,
  Sparkles,
  Volume2,
  Trash2,
  Delete,
  CheckCircle2,
  Sun,
  Sunrise,
  Moon,
  AlarmClock,
  RotateCcw,
  Activity
} from 'lucide-react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { sendNtfyNotification } from '@/lib/care/ntfy';
import { playChimeSound, speakText, playClickSound } from '@/lib/audio/soundEffects';

interface WordTile {
  id: number;
  word: string;
  icon?: 'sunrise' | 'sun' | 'moon' | 'alarm';
}

const WORD_TILES: WordTile[] = [
  // Row 1
  { id: 1, word: 'Hello' },
  { id: 2, word: 'Goodbye' },
  { id: 3, word: 'Yes' },
  { id: 4, word: 'No' },
  { id: 5, word: 'Please' },
  { id: 6, word: 'Thanks' },
  { id: 7, word: 'Morning', icon: 'sunrise' },
  { id: 8, word: 'Day', icon: 'sun' },

  // Row 2
  { id: 9, word: 'Day', icon: 'moon' },
  { id: 10, word: 'Wake up', icon: 'alarm' },
  { id: 11, word: 'Night', icon: 'moon' },
  { id: 12, word: 'Sleep' },
  { id: 13, word: 'Eat' },
  { id: 14, word: 'Drink' },
  { id: 15, word: 'Water' },
  { id: 16, word: 'Food' },

  // Row 3
  { id: 17, word: 'Medicine' },
  { id: 18, word: 'Bathroom' },
  { id: 19, word: 'Wash' },
  { id: 20, word: 'Dress' },
  { id: 21, word: 'Play' },
  { id: 22, word: 'Read' },
  { id: 23, word: 'Listen' },
  { id: 24, word: 'Look' },

  // Row 4
  { id: 25, word: 'Walk' },
  { id: 26, word: 'Sit' },
  { id: 27, word: 'Stand' },
  { id: 28, word: 'Talk' },
  { id: 29, word: 'Call' },
  { id: 30, word: 'Text' },
  { id: 31, word: 'Happy' },
  { id: 32, word: 'Sad' },
];

export default function CommunicationPage() {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const [timeStr, setTimeStr] = useState('09:15');
  const [batteryPct, setBatteryPct] = useState(94);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiExpandedSentence, setAiExpandedSentence] = useState<string | null>(null);
  const [notificationDispatched, setNotificationDispatched] = useState(false);

  const { connected, mode } = useIrisInput();
  const {
    tts,
    speechRate,
    interfaceSounds,
    volume,
    ntfyTopic
  } = useIrisSettings();

  // Real-time clock for status bar
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

  // Battery detection
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

  // Handle clicking on a word tile
  const handleTileClick = (tile: WordTile) => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.4);

    // Visual highlight toggle
    setHighlightedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tile.id)) {
        next.delete(tile.id);
      } else {
        next.add(tile.id);
      }
      return next;
    });

    // Add word to sentence builder
    setSelectedWords((prev) => [...prev, tile.word]);

    // Optional quick keyword pronunciation
    if (tts) {
      speakText(tile.word, Math.min(1.4, speechRate * 1.2));
    }
  };

  // Delete the last selected word
  const handleDeleteLast = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    if (selectedWords.length === 0) return;

    const lastWord = selectedWords[selectedWords.length - 1];
    const newWords = selectedWords.slice(0, -1);
    setSelectedWords(newWords);

    // If word no longer appears in selection, un-highlight
    const stillExists = newWords.some((w) => w === lastWord);
    if (!stillExists) {
      const matchingTile = WORD_TILES.find((t) => t.word === lastWord);
      if (matchingTile) {
        setHighlightedIds((prev) => {
          const next = new Set(prev);
          next.delete(matchingTile.id);
          return next;
        });
      }
    }
  };

  // Clear all words
  const handleClear = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    setSelectedWords([]);
    setHighlightedIds(new Set());
    setAiExpandedSentence(null);
  };

  // AI Understanding and Full Sentence Speaking
  const handleAiSpeakSentence = async () => {
    if (selectedWords.length === 0) return;

    const keywords = selectedWords.join(' ');
    setIsAiGenerating(true);

    if (interfaceSounds) playChimeSound((volume / 100) * 0.4);

    try {
      const res = await fetch('/api/ai/expand-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });

      let fullSentence = '';
      if (res.ok) {
        const data = await res.json();
        fullSentence = data.sentence || keywords;
      } else {
        fullSentence = `Hello, please help me with ${keywords}, thanks.`;
      }

      // Print the full understood sentence immediately
      setAiExpandedSentence(fullSentence);

      // Speak the full sentence aloud
      if (tts) {
        speakText(fullSentence, speechRate);
      }

      // Dispatch push notification to caregiver via ntfy
      sendNtfyNotification({
        title: '💬 IRIS Patient Speech',
        message: fullSentence,
        priority: 'high',
        tags: ['speech_balloon', 'iris', 'care'],
        topic: ntfyTopic,
      });

      setNotificationDispatched(true);
      setTimeout(() => setNotificationDispatched(false), 5000);
    } catch (err) {
      console.error('Error generating AI sentence:', err);
      const fallback = `Hello, please assist me with ${keywords}, thanks.`;
      setAiExpandedSentence(fallback);
      if (tts) speakText(fallback, speechRate);
      sendNtfyNotification({
        title: '💬 IRIS Patient Speech',
        message: fallback,
        priority: 'high',
        tags: ['speech_balloon', 'iris', 'care'],
        topic: ntfyTopic,
      });
      setNotificationDispatched(true);
      setTimeout(() => setNotificationDispatched(false), 5000);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleReSpeak = () => {
    if (aiExpandedSentence && tts) {
      if (interfaceSounds) playClickSound((volume / 100) * 0.3);
      speakText(aiExpandedSentence, speechRate);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        backgroundColor: '#070b12',
        backgroundImage: 'radial-gradient(circle at 50% 15%, #0f172a 0%, #060911 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(8px, 1.2vh, 14px)',
        padding: 'clamp(8px, 1.2vh, 16px) clamp(12px, 2vw, 32px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP STATUS BAR: Back Button, Title, Signal & Battery                  */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          margin: '0',
          padding: '2px 4px',
          flexShrink: 0,
        }}
      >
        {/* Left: Bigger Back to Home Button with Home Logo & Time Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifySelf: 'start' }}>
          <Link
            href="/"
            onClick={() => {
              if (interfaceSounds) playClickSound((volume / 100) * 0.4);
            }}
            title="Return to IRIS Home Dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '2px solid #38bdf8',
              borderRadius: '16px',
              padding: '10px 24px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.45), 0 4px 14px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.3)';
              e.currentTarget.style.borderColor = '#7dd3fc';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(56, 189, 248, 0.7), 0 6px 20px rgba(0, 0, 0, 0.7)';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(56, 189, 248, 0.45), 0 4px 14px rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <Home size={22} strokeWidth={2.4} style={{ color: '#38bdf8' }} />
            <span>BACK TO HOME</span>
          </Link>

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '16px',
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '0.02em',
            }}
          >
            {timeStr}
          </span>
        </div>

        {/* Center: Title COMMUNICATION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifySelf: 'center' }}>
          <h1
            style={{
              fontSize: 'clamp(20px, 2.2vw, 26px)',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#ffffff',
              textTransform: 'uppercase',
              margin: 0,
              background: 'linear-gradient(90deg, #ffffff, #93c5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            COMMUNICATION
          </h1>
        </div>

        {/* Right: Mode status, Signal, Wi-Fi, and Battery */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: '#94a3b8',
            justifySelf: 'end',
          }}
        >
          {/* Tracking mode badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '4px 10px',
              borderRadius: '20px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: connected ? '#10b981' : '#f59e0b',
                boxShadow: connected ? '0 0 6px #10b981' : 'none',
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
                color: '#cbd5e1',
                textTransform: 'uppercase',
              }}
            >
              {mode === 'hardware' ? 'CAMERA CV' : 'HEAD SIM'}
            </span>
          </div>

          {/* Signal 4-bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
            <div style={{ width: '3px', height: '4px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '7px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '10px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
            <div style={{ width: '3px', height: '14px', backgroundColor: '#38bdf8', borderRadius: '1px' }} />
          </div>

          <Wifi size={18} strokeWidth={2.2} style={{ color: '#38bdf8' }} />

          {/* Battery glyph */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '26px',
                height: '13px',
                border: '1.5px solid #94a3b8',
                borderRadius: '3.5px',
                display: 'flex',
                alignItems: 'center',
                padding: '1.5px',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(15, batteryPct))}%`,
                  backgroundColor: batteryPct > 20 ? '#10b981' : '#ef4444',
                  borderRadius: '1px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '-3.5px',
                  top: '2.5px',
                  width: '2px',
                  height: '4.5px',
                  backgroundColor: '#94a3b8',
                  borderRadius: '0 1px 1px 0',
                }}
              />
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
              {batteryPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SENTENCE BUILDER & ACTION BUTTONS                                      */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(6px, 1vh, 10px)',
        }}
      >
        {/* Sentence Builder Display Box */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#0f172a',
            border: selectedWords.length > 0 ? '1.5px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '12px 20px',
            boxSizing: 'border-box',
            minHeight: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: selectedWords.length > 0
              ? '0 0 20px rgba(2, 132, 199, 0.25), inset 0 2px 6px rgba(0, 0, 0, 0.5)'
              : 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            {selectedWords.length > 0 ? (
              selectedWords.map((word, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#e0f2fe',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: 'clamp(15px, 1.5vw, 19px)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {word}
                </span>
              ))
            ) : (
              <span style={{ fontStyle: 'italic', color: '#64748b', fontSize: '15px' }}>
                Select word tiles below to compose keywords (e.g. Hello + Please + Bathroom)...
              </span>
            )}
          </div>

          {/* Caregiver sent alert badge */}
          {notificationDispatched && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                padding: '5px 14px',
                borderRadius: '20px',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <CheckCircle2 size={15} />
              <span>Spoken & Sent to Caregiver ✓</span>
            </div>
          )}
        </div>

        {/* Buttons Row: BIG Clear, BIG Delete Last, and Hero AI Speak Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          {/* Left Buttons: Clear & Delete Last (Made BIGGER and high contrast as requested!) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Clear Button */}
            <button
              onClick={handleClear}
              title="Clear all selected words"
              style={{
                backgroundColor: '#1e1b24',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '14px',
                padding: '12px 28px', // Extra large hit area for head cursor
                minHeight: '48px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#fca5a5',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Trash2 size={18} style={{ color: '#f87171' }} />
              <span>Clear</span>
            </button>

            {/* Delete Last Button */}
            <button
              onClick={handleDeleteLast}
              title="Delete last added word"
              style={{
                backgroundColor: '#242018',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '14px',
                padding: '12px 28px', // Extra large hit area for head cursor
                minHeight: '48px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#fde68a',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Delete size={18} style={{ color: '#fbbf24' }} />
              <span>Delete Last</span>
            </button>
          </div>

          {/* Right Button: Gemini AI Understand & Speak Full Sentence */}
          <button
            onClick={handleAiSpeakSentence}
            disabled={selectedWords.length === 0 || isAiGenerating}
            title="Convert keywords to natural full sentence using Gemini AI and speak aloud"
            style={{
              background: selectedWords.length > 0
                ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)'
                : '#1e293b',
              border: selectedWords.length > 0 ? '1.5px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 32px',
              minHeight: '48px',
              fontSize: '15.5px',
              fontWeight: 800,
              color: selectedWords.length > 0 ? '#ffffff' : '#64748b',
              cursor: selectedWords.length > 0 ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: selectedWords.length > 0
                ? '0 0 24px rgba(6, 182, 212, 0.5), 0 4px 14px rgba(0, 0, 0, 0.4)'
                : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={19} style={{ color: selectedWords.length > 0 ? '#ffffff' : '#64748b' }} />
            <span>{isAiGenerating ? 'Synthesizing Full Sentence...' : 'AI Speak Full Sentence'}</span>
            <Volume2 size={19} style={{ color: selectedWords.length > 0 ? '#ffffff' : '#64748b' }} />
          </button>
        </div>

        {/* AI Understood Full Sentence Spoken Display Panel */}
        {aiExpandedSentence && (
          <div
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              border: '1.5px solid #2dd4bf',
              borderRadius: '14px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 0 24px rgba(45, 212, 191, 0.25)',
              animation: 'fadeIn 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(45, 212, 191, 0.2)',
                  border: '1px solid #2dd4bf',
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                <Activity size={13} style={{ color: '#2dd4bf' }} />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800,
                    color: '#2dd4bf',
                    letterSpacing: '0.08em',
                  }}
                >
                  AI VOICE
                </span>
              </div>

              <span
                style={{
                  fontSize: 'clamp(16px, 1.6vw, 21px)',
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                &ldquo;{aiExpandedSentence}&rdquo;
              </span>
            </div>

            {/* Re-speak button */}
            <button
              onClick={handleReSpeak}
              title="Repeat spoken sentence aloud"
              style={{
                backgroundColor: 'rgba(45, 212, 191, 0.15)',
                border: '1px solid rgba(45, 212, 191, 0.4)',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#2dd4bf',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <RotateCcw size={14} />
              <span>Repeat Speech</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. WORD TILES GRID (8 Columns × 4 Rows = 32 Word Tiles)                   */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
          gap: 'clamp(8px, 1vw, 14px)',
          flex: 1,
          minHeight: 0,
          height: '100%',
        }}
      >
        {WORD_TILES.map((tile) => {
          const isHighlighted = highlightedIds.has(tile.id);

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              style={{
                height: '100%',
                backgroundColor: isHighlighted ? '#132838' : '#0f172a',
                border: isHighlighted
                  ? '2.5px solid #2dd4bf'
                  : '1.5px solid rgba(255, 255, 255, 0.09)',
                boxShadow: isHighlighted
                  ? '0 0 22px rgba(45, 212, 191, 0.65), inset 0 0 10px rgba(45, 212, 191, 0.25)'
                  : '0 4px 12px rgba(0, 0, 0, 0.35)',
                borderRadius: '16px',
                padding: 'clamp(6px, 1.1vh, 12px) clamp(4px, 0.6vw, 8px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                outline: 'none',
                transform: isHighlighted ? 'scale(1.02)' : 'none',
              }}
            >
              {/* Top Row: Tile Index Number (top-left) & Glyph (top-right) */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 6px',
                  pointerEvents: 'none',
                }}
              >
                {/* Number Badge */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isHighlighted ? '#2dd4bf' : '#64748b',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {tile.id}
                </span>

                {/* Optional Top-Right Glyph */}
                <div>
                  {tile.icon === 'sunrise' && <Sunrise size={14} style={{ color: '#38bdf8' }} />}
                  {tile.icon === 'sun' && <Sun size={14} style={{ color: '#fbbf24' }} />}
                  {tile.icon === 'moon' && <Moon size={14} style={{ color: '#94a3b8' }} />}
                  {tile.icon === 'alarm' && <AlarmClock size={14} style={{ color: '#f43f5e' }} />}
                </div>
              </div>

              {/* Main Word Text */}
              <div
                style={{
                  fontSize: 'clamp(15px, 1.55vw, 19px)',
                  fontWeight: 700,
                  color: isHighlighted ? '#ffffff' : '#f1f5f9',
                  letterSpacing: '-0.01em',
                  margin: 'auto 0',
                  pointerEvents: 'none',
                }}
              >
                {tile.word}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
