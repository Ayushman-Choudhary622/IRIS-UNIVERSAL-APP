'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sun, CloudSun, Cloud, CloudRain, Sparkles, MapPin } from 'lucide-react';

interface IrisCenterLogo3DProps {
  mouseTilt: { x: number; y: number };
}

interface WeatherData {
  city: string;
  tempC: number;
  condition: string;
  weatherCode: number;
}

export default function IrisCenterLogo3D({ mouseTilt }: IrisCenterLogo3DProps) {
  const [weather, setWeather] = useState<WeatherData>({
    city: 'Nagpur',
    tempC: 28,
    condition: 'Clear Sky',
    weatherCode: 0,
  });
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fetch real-time weather in Celsius according to user's exact place
  useEffect(() => {
    let isMounted = true;

    async function fetchUserPlaceWeather() {
      setLoadingWeather(true);
      try {
        // Step 1: Detect User's Place via IP
        const locRes = await fetch('https://ipwho.is/');
        const locData = await locRes.json();
        
        const city = locData?.city || 'Nagpur';
        const lat = locData?.latitude || 21.1463;
        const lon = locData?.longitude || 79.0849;

        // Step 2: Fetch Live Weather in Celsius for this exact coordinate
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        const weatherData = await weatherRes.json();

        if (isMounted && weatherData?.current) {
          const tempC = Math.round(weatherData.current.temperature_2m);
          const code = weatherData.current.weather_code || 0;

          // Translate WMO weather code to condition
          let condition = 'Clear Sky';
          if (code === 1 || code === 2) condition = 'Mainly Clear';
          else if (code === 3) condition = 'Partly Cloudy';
          else if (code >= 45 && code <= 48) condition = 'Foggy';
          else if (code >= 51 && code <= 67) condition = 'Light Rain';
          else if (code >= 80 && code <= 82) condition = 'Rain Showers';
          else if (code >= 95) condition = 'Thunderstorm';

          setWeather({
            city,
            tempC,
            condition,
            weatherCode: code,
          });
        }
      } catch (err) {
        console.warn('Live weather detection fallback to Nagpur:', err);
      } finally {
        if (isMounted) setLoadingWeather(false);
      }
    }

    fetchUserPlaceWeather();
    return () => {
      isMounted = false;
    };
  }, []);

  const getWeatherIcon = () => {
    const code = weather.weatherCode;
    if (code >= 51) return <CloudRain size={28} className="text-cyan-400" />;
    if (code === 3 || code >= 45) return <Cloud size={28} className="text-slate-300" />;
    if (code === 1 || code === 2) return <CloudSun size={28} className="text-amber-300" />;
    return <Sun size={28} className="text-amber-400" />;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: 'clamp(240px, min(32vw, 40vh), 390px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
        userSelect: 'none',
      }}
    >
      {/* 3D Dynamic Tilting Stage responding to mouse coordinates */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${mouseTilt.x}deg) rotateX(${mouseTilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* ========================================================================= */}
        {/* CONCENTRIC 3D STAGE: All rings, platter, and logo share exact (50%, 50%)  */}
        {/* ========================================================================= */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(210px, min(26vw, 32vh), 320px)',
            height: 'clamp(210px, min(26vw, 32vh), 320px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Outer Concentric 3D Gyro Orbit Ring 1 (Clockwise) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'clamp(230px, min(28vw, 35vh), 350px)',
              height: 'clamp(230px, min(28vw, 35vh), 350px)',
              borderRadius: '50%',
              border: '2px dashed rgba(6, 182, 212, 0.45)',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.35)',
              animation: 'cyberOrbit3D 16s linear infinite',
              pointerEvents: 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Orbital Cyan Beacon Sphere */}
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                left: '50%',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#67e8f9',
                boxShadow: '0 0 16px #67e8f9, 0 0 28px #06b6d4',
                transform: 'translateX(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 12px #38bdf8',
                transform: 'translateX(-50%)',
              }}
            />
          </div>

          {/* Counter-Rotating Concentric Gyro Orbit Ring 2 */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'clamp(190px, min(23vw, 29vh), 290px)',
              height: 'clamp(190px, min(23vw, 29vh), 290px)',
              borderRadius: '50%',
              border: '1.5px solid rgba(45, 212, 191, 0.45)',
              boxShadow: '0 0 20px rgba(45, 212, 191, 0.25)',
              animation: 'cyberOrbit3DRev 12s linear infinite',
              pointerEvents: 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-5px',
                top: '50%',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#2dd4bf',
                boxShadow: '0 0 14px #2dd4bf',
                transform: 'translateY(-50%)',
              }}
            />
          </div>

          {/* Concentric Pulsing Energy Wave */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '210px',
              height: '210px',
              borderRadius: '50%',
              border: '2px solid rgba(6, 182, 212, 0.45)',
              animation: 'cyberPulseWave 3.5s ease-out infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Concentric Bottom Plate with Tech Border & Synchronized Harmonic Breathe */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'clamp(155px, min(19vw, 24vh), 240px)',
              height: 'clamp(155px, min(19vw, 24vh), 240px)',
              borderRadius: '50%',
              backgroundColor: 'rgba(8, 16, 28, 0.95)',
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(14, 116, 144, 0.3) 0%, rgba(6, 16, 30, 0.98) 72%)',
              border: '2.5px solid rgba(56, 189, 248, 0.7)',
              boxShadow:
                '0 0 45px rgba(6, 182, 212, 0.55), inset 0 0 25px rgba(6, 182, 212, 0.35), 0 18px 40px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              animation: 'cyberHarmonicBreathe 4s ease-in-out infinite',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Concentric Tech Dial Ring on Bottom Plate */}
            <div
              style={{
                position: 'absolute',
                inset: '5px',
                borderRadius: '50%',
                border: '1px dashed rgba(56, 189, 248, 0.35)',
                pointerEvents: 'none',
              }}
            />

            {/* User's Authentic Logo Emblem, Centered in Full Lockstep Sync */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 0 18px rgba(6, 182, 212, 0.65))',
                animation: 'cyberPlateGlow 4s ease-in-out infinite',
              }}
            >
              <Image
                src="/images/iris-logo-original-clean.png"
                alt="IRIS Official Logo"
                width={220}
                height={220}
                priority
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />

              {/* Glowing cyan scanning laser line overlay sweeping across the eye */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background:
                    'linear-gradient(90deg, transparent, #38bdf8 25%, #67e8f9 50%, #38bdf8 75%, transparent)',
                  boxShadow: '0 0 14px #38bdf8, 0 0 24px #06b6d4',
                  animation: 'cyberLaserScan 3.5s ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Live Weather Widget according to User's Place in CELSIUS (°C) */}
        <div
          style={{
            marginTop: 'clamp(6px, 1.2vh, 16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(10, 18, 32, 0.85)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              padding: 'clamp(5px, 0.9vh, 8px) clamp(12px, 1.4vw, 18px)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.25), 0 4px 14px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Live Weather Icon */}
            <div style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' }}>
              {getWeatherIcon()}
            </div>

            {/* Live Celsius Temperature */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div
                style={{
                  fontSize: 'clamp(24px, 2.6vw, 32px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 15px rgba(56, 189, 248, 0.6)',
                }}
              >
                {weather.tempC}°C
              </div>

              {/* User's Place / City */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginTop: '2px',
                }}
              >
                <MapPin size={11} className="text-cyan-400" />
                <span>{weather.city}</span>
                <span className="text-cyan-500 font-normal">·</span>
                <span className="text-slate-400 font-normal">{weather.condition}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
