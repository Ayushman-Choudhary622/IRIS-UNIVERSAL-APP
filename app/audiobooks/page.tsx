'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, RotateCcw, SkipBack, SkipForward, Volume2, Wifi, BookOpen } from 'lucide-react';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { playClickSound } from '@/lib/audio/soundEffects';

interface Book {
  id: string;
  title: string;
  author: string;
  language: 'hi' | 'en';
  badge: string;
  excerpt: string[];
}

const BOOKS: Book[] = [
  {
    id: 'eidgah',
    title: 'ईदगाह (Eidgah)',
    author: 'मुंशी प्रेमचंद',
    language: 'hi',
    badge: 'हिंदी कहानी',
    excerpt: [
      'रमजान के पूरे तीस रोजों के बाद आज ईद आई है। कितना मनोहर, कितना सुहावना प्रभात है!',
      'गांव में चारों तरफ कितनी हलचल है, मेले जाने की तैयारियां जोरों पर हो रही हैं।',
      'चार-पांच साल का नन्हा हामिद अपनी बूढ़ी दादी अमीना की गोद में सोता है और बहुत खुश रहता है।',
      'मेले में सब बच्चों ने रंग-बिरंगे खिलौने और मिठाइयां खरीदीं, पर हामिद ने किसी व्यर्थ चीज पर ध्यान नहीं दिया।',
      'उसने तीन पैसों में लोहे का चिमटा खरीदा, ताकि रोटी पकाते वक्त उसकी प्यारी दादी की उंगलियां आग से न जलें।',
      'जब दादी अमीना ने चिमटा देखा, तो उनकी आंखें भर आईं और उनका दिल हामिद के त्याग और प्यार पर खुशी से गद्गद हो गया।'
    ]
  },
  {
    id: 'clever-rabbit',
    title: 'चालाक खरगोश और शेर',
    author: 'विष्णु शर्मा (पंचतंत्र)',
    language: 'hi',
    badge: 'पंचतंत्र नीति कथा',
    excerpt: [
      'एक विशाल वन में भासुरक नाम का एक अत्यंत पराक्रमी और अहंकारी शेर राज करता था।',
      'वह प्रतिदिन वन के निर्दोष जानवरों को बिना कारण मार डालता था, जिससे सब त्रस्त थे।',
      'एक दिन एक छोटे और चतुर खरगोश की बारी आई, जिसने शेर को खत्म करने की योजना बनाई।',
      'खरगोश जानबूझकर देर से पहुंचा और बोला कि रास्ते में एक दूसरे शेर ने उसे रोक लिया था।',
      'शेर गुस्से में उस गहरे कुएं के पास पहुंचा, और पानी में अपनी ही परछाई देखकर उस पर झपट पड़ा।',
      'इस प्रकार चतुर खरगोश ने अपनी बुद्धि से पूरे जंगल को उस अत्याचारी शेर से सदा के लिए मुक्त कर दिया।'
    ]
  },
  {
    id: 'birbal-khichdi',
    title: 'बीरबल की खिचड़ी',
    author: 'अकबर और बीरबल',
    language: 'hi',
    badge: 'हाजिरजवाबी',
    excerpt: [
      'कड़कड़ाती ठंड की एक सर्द रात में, एक निर्धन व्यक्ति ने इनाम पाने के लिए यमुना के बर्फीले पानी में रात बिताई।',
      'परंतु अगले दिन राजदरबार में बादशाह अकबर ने यह कहकर पुरस्कार देने से मना कर दिया कि वह महल के चिराग की रोशनी देखकर बचा रहा।',
      'बीरबल को उस निर्धन व्यक्ति के साथ हुआ यह अन्याय तनिक भी उचित नहीं लगा।',
      'अगले दिन बीरबल ने ऊंचे बांस के सिरे पर एक हांडी टांग दी और जमीन पर हल्की सी आग जलाकर खिचड़ी पकाने लगे।',
      'अकबर ने देखकर पूछा कि भला इतनी दूर जमीन की आग से आकाश में टंगी खिचड़ी कैसे पकेगी?',
      'बीरबल ने नम्रता से कहा कि जहां दूर महल के चिराग से नदी में गर्मी आ सकती है, वहां मेरी खिचड़ी भी पक जाएगी। अकबर ने अपनी भूल स्वीकार कर उस व्यक्ति को पुरस्कृत किया।'
    ]
  },
  {
    id: 'secret-garden',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    language: 'en',
    badge: 'Classic Novel',
    excerpt: [
      'When Mary Lennox was sent to Misselthwaite Manor, everyone said she was the most disagreeable-looking child ever seen.',
      'She had a little thin face and a little thin body, thin light hair and a sour expression.',
      'One morning, when she wandered out into the gardens, the fresh Yorkshire breeze touched her face and everything began to change.',
      'She found a deep-set wooden door covered in ivy, and when she pushed it open, a forgotten world of roses lay before her.',
      'The sweet morning air was filled with the promise of spring, and Mary felt her heart awaken for the first time in her life.'
    ]
  },
  {
    id: 'time-machine',
    title: 'The Time Machine',
    author: 'H.G. Wells',
    language: 'en',
    badge: 'Science Fiction',
    excerpt: [
      'The Time Traveller was expounding a recondite matter to us. His grey eyes shone and his usually pale face was flushed and animated.',
      'He held in his hand a glittering metallic framework, scarcely larger than a small clock, delicately made with ivory and crystal.',
      'With a sudden breath, he pressed a tiny lever forward, and the mechanism blurred and vanished like a ghost into the future.',
      'We stared in utter astonishment at the empty table, realizing the boundaries of human knowledge had been shattered forever.'
    ]
  }
];

export default function AudiobooksPage() {
  const [selectedBookIdx, setSelectedBookIdx] = useState(0);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [timeStr, setTimeStr] = useState('09:15');
  const [batteryPct, setBatteryPct] = useState(94);

  const { interfaceSounds, volume } = useIrisSettings();
  const book = BOOKS[selectedBookIdx];

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

  const playSentence = (bIdx: number, sIdx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const targetBook = BOOKS[bIdx];
    const text = targetBook.excerpt[sIdx];
    if (!text) {
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const isHindi = targetBook.language === 'hi' || /[\u0900-\u097F]/.test(text);
    const voices = window.speechSynthesis.getVoices();

    if (isHindi) {
      utterance.lang = 'hi-IN';
      const v = voices.find((vox) => vox.lang.startsWith('hi') || vox.name.toLowerCase().includes('hindi'));
      if (v) utterance.voice = v;
    } else {
      utterance.lang = 'en-US';
      const v = voices.find((vox) => vox.lang.startsWith('en'));
      if (v) utterance.voice = v;
    }

    utterance.onend = () => {
      if (sIdx + 1 < targetBook.excerpt.length) {
        setSentenceIdx(sIdx + 1);
        playSentence(bIdx, sIdx + 1);
      } else {
        setIsPlaying(false);
        setSentenceIdx(0);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);

    if (isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      playSentence(selectedBookIdx, sentenceIdx);
    }
  };

  const restartStory = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    setSentenceIdx(0);
    playSentence(selectedBookIdx, 0);
  };

  const nextSentence = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    const nextIdx = Math.min(book.excerpt.length - 1, sentenceIdx + 1);
    setSentenceIdx(nextIdx);
    if (isPlaying) playSentence(selectedBookIdx, nextIdx);
  };

  const prevSentence = () => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    const prevIdx = Math.max(0, sentenceIdx - 1);
    setSentenceIdx(prevIdx);
    if (isPlaying) playSentence(selectedBookIdx, prevIdx);
  };

  const selectBook = (idx: number) => {
    if (interfaceSounds) playClickSound((volume / 100) * 0.35);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setSelectedBookIdx(idx);
    setSentenceIdx(0);
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
          <Link
            href="/entertainment"
            onClick={() => {
              if (interfaceSounds) playClickSound((volume / 100) * 0.35);
            }}
            title="Return to Entertainment Menu"
            style={{
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
              transition: 'all 0.18s ease',
            }}
          >
            <ChevronLeft size={22} strokeWidth={2.6} style={{ color: '#c084fc' }} />
            <span>BACK TO ENTERTAINMENT</span>
          </Link>

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

        {/* Center: AUDIOBOOKS Header */}
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
          AUDIOBOOKS
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

      {/* 2. MAIN CENTER: CLEAN, SIMPLE 2-COLUMN READER (FULL SPACE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) 1fr',
          gap: 'clamp(20px, 2.5vw, 36px)',
          width: '100%',
          maxWidth: '1240px',
          margin: 'auto',
          alignItems: 'stretch',
          flex: 1,
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        {/* Left Column: Story Selection */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            paddingRight: '6px',
          }}
        >
          {BOOKS.map((b, idx) => {
            const isSelected = selectedBookIdx === idx;

            return (
              <button
                key={b.id}
                onClick={() => selectBook(idx)}
                style={{
                  backgroundColor: isSelected ? 'rgba(18, 30, 52, 0.95)' : 'rgba(10, 18, 34, 0.75)',
                  border: isSelected ? '2px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  textAlign: 'left',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.35)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📖</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                      {b.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: isSelected ? '#070b12' : '#38bdf8',
                      backgroundColor: isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.15)',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isSelected ? '🎧 LISTENING' : b.badge}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', paddingLeft: '24px' }}>
                  {b.author}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Clean Large Text Reader */}
        <div
          style={{
            backgroundColor: 'rgba(10, 18, 34, 0.88)',
            border: '2px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '24px',
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header of Story */}
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={22} style={{ color: '#38bdf8' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                {book.title}
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {book.author} · Passage {sentenceIdx + 1} of {book.excerpt.length}
            </div>
          </div>

          {/* Big Readable Text */}
          <div
            style={{
              padding: '24px 0',
              fontSize: 'clamp(20px, 2.2vw, 26px)',
              lineHeight: 1.6,
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            "{book.excerpt[sentenceIdx]}"
          </div>

          {/* Passage Progress Dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {book.excerpt.map((_, i) => (
              <div
                key={i}
                onClick={() => {
                  setSentenceIdx(i);
                  if (isPlaying) playSentence(selectedBookIdx, i);
                }}
                style={{
                  height: '6px',
                  flex: 1,
                  borderRadius: '3px',
                  backgroundColor: i === sentenceIdx ? '#38bdf8' : i < sentenceIdx ? '#0284c7' : 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CONTROL BAR: AUDIOBOOK NARRATION CONTROLS */}
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          backgroundColor: 'rgba(12, 18, 32, 0.95)',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Restart */}
        <button
          onClick={restartStory}
          title="Restart story from beginning"
          style={{
            padding: '11px 20px',
            borderRadius: '14px',
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>🔄</span>
          <span>RESTART</span>
        </button>

        {/* Center: Prev Passage, Master Play/Pause, Next Passage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Previous Passage Button */}
          <button
            onClick={prevSentence}
            disabled={sentenceIdx === 0}
            title="Previous passage"
            style={{
              padding: '11px 20px',
              borderRadius: '14px',
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: sentenceIdx === 0 ? 'not-allowed' : 'pointer',
              opacity: sentenceIdx === 0 ? 0.35 : 1,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>⏮</span>
            <span>PREV</span>
          </button>

          {/* Master Visible Play/Pause Button */}
          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause Narration' : 'Play Narration'}
            style={{
              padding: '12px 28px',
              borderRadius: '16px',
              backgroundColor: '#38bdf8',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#070b12',
              fontSize: '15px',
              fontWeight: 900,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              boxShadow: '0 0 28px rgba(56, 189, 248, 0.75), 0 4px 14px rgba(0, 0, 0, 0.5)',
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
                <span>LISTEN</span>
              </>
            )}
          </button>

          {/* Next Passage Button */}
          <button
            onClick={nextSentence}
            disabled={sentenceIdx >= book.excerpt.length - 1}
            title="Next passage"
            style={{
              padding: '11px 20px',
              borderRadius: '14px',
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: sentenceIdx >= book.excerpt.length - 1 ? 'not-allowed' : 'pointer',
              opacity: sentenceIdx >= book.excerpt.length - 1 ? 0.35 : 1,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>NEXT</span>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>⏭</span>
          </button>
        </div>

        {/* Right: Narration Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '12px', fontWeight: 800 }}>
          <span>⚡ SPEED:</span>
          {[0.85, 1.0, 1.15].map((s) => (
            <button
              key={s}
              onClick={() => setRate(s)}
              style={{
                backgroundColor: rate === s ? '#38bdf8' : 'rgba(30, 41, 59, 0.9)',
                color: rate === s ? '#070b12' : '#ffffff',
                border: rate === s ? '1.5px solid #ffffff' : '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: rate === s ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
