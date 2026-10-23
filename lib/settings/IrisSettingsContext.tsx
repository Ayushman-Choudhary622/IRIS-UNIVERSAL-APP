'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { playClickSound } from '@/lib/audio/soundEffects';

export interface IrisSettings {
  // Accessibility
  uiScale: number;
  reducedMotion: boolean;
  highContrast: boolean;
  largeControls: boolean;
  focusMode: boolean;
  showVirtualCursor: boolean;

  // Input
  invertX: boolean;
  invertY: boolean;

  // Caregiver Notification
  ntfyTopic: string;

  // Display
  theme: 'White' | 'Dark' | 'OLED Dark' | 'Midnight';
  hudDensity: 'Full' | 'Compact' | 'Minimal';
  showFps: boolean;

  // Audio
  interfaceSounds: boolean;
  volume: number;
  tts: boolean;
  speechRate: number;

  // Simulation
  graphicsQuality: 'Low' | 'Medium' | 'High';
  targetFps: string;
  showTelemetry: boolean;

  // Homescreen Customization (0, 1, or 2 extra tiles)
  pinnedHomeTiles: string[];

  // Futuristic IoT States
  iotBedroomLight: boolean;
  iotCeilingFan: boolean;
  iotBedsideLamp: boolean;
  iotRoomAc: boolean;

  // Profiles & Calibration
  userProfile: string;
  blinkGateMin: number;
  blinkGateMax: number;
}

export const DEFAULT_SETTINGS: IrisSettings = {
  uiScale: 110,
  reducedMotion: false,
  highContrast: false,
  largeControls: true,
  focusMode: false,
  showVirtualCursor: true,
  invertX: false,
  invertY: false,
  ntfyTopic: 'iris-care-alert',
  theme: 'Dark',
  hudDensity: 'Minimal',
  showFps: false,
  interfaceSounds: true,
  volume: 75,
  tts: true,
  speechRate: 1.0,
  graphicsQuality: 'Medium',
  targetFps: '60',
  showTelemetry: false,
  pinnedHomeTiles: [],
  iotBedroomLight: false,
  iotCeilingFan: true,
  iotBedsideLamp: false,
  iotRoomAc: true,
  userProfile: 'Default',
  blinkGateMin: 200,
  blinkGateMax: 500,
};

interface IrisSettingsContextValue extends IrisSettings {
  setSetting: <K extends keyof IrisSettings>(key: K, value: IrisSettings[K]) => void;
  resetSettings: () => void;
  exportSettings: () => void;
  importSettings: (jsonStr: string) => boolean;
}

const IrisSettingsContext = createContext<IrisSettingsContextValue | null>(null);

const STORAGE_KEY = 'iris_settings_v2';

export function useIrisSettings(): IrisSettingsContextValue {
  const context = useContext(IrisSettingsContext);
  if (!context) {
    throw new Error('useIrisSettings must be used within an IrisSettingsProvider');
  }
  return context;
}

export function IrisSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<IrisSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // If stored theme was legacy 'White', default to 'Dark' for unified cyber dark mode
          if (parsed.theme === 'White' && !localStorage.getItem('iris_user_chose_white')) {
            parsed.theme = 'Dark';
          }
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  // Apply settings to DOM
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Theme
    if (settings.theme === 'Dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (settings.theme === 'OLED Dark') {
      root.setAttribute('data-theme', 'oled');
    } else if (settings.theme === 'Midnight') {
      root.setAttribute('data-theme', 'midnight');
    } else if (settings.theme === 'White') {
      root.setAttribute('data-theme', 'white');
    } else {
      root.setAttribute('data-theme', 'dark');
    }

    // UI Scale
    root.style.fontSize = `${(settings.uiScale / 100) * 16}px`;

    // Classes
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('large-controls', settings.largeControls);
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('focus-mode', settings.focusMode);

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  const setSetting = useCallback(<K extends keyof IrisSettings>(key: K, value: IrisSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (next.interfaceSounds && key !== 'volume') {
        playClickSound((next.volume / 100) * 0.3);
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    if (DEFAULT_SETTINGS.interfaceSounds) {
      playClickSound(0.3);
    }
  }, []);

  const exportSettings = useCallback(() => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `iris_settings_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {}
  }, [settings]);

  const importSettings = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      setSettings(prev => ({ ...prev, ...parsed }));
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const value: IrisSettingsContextValue = {
    ...settings,
    setSetting,
    resetSettings,
    exportSettings,
    importSettings,
  };

  return (
    <IrisSettingsContext.Provider value={value}>
      {children}
    </IrisSettingsContext.Provider>
  );
}
