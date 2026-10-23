import type { Metadata } from 'next';
import './globals.css';
import { IrisInputProvider } from '@/lib/input/IrisInputContext';
import { IrisSettingsProvider } from '@/lib/settings/IrisSettingsContext';
import AssistiveCursor from '@/components/AssistiveCursor';

export const metadata: Metadata = {
  title: 'IRIS — Intelligent Responsive Interface System',
  description: 'Alternative interaction. Expanded independence. An assistive computing ecosystem combining head movement, blink detection, and adaptive interfaces.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ width: '100%', height: '100%', backgroundColor: '#070b12', margin: 0, padding: 0 }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="w-full h-full overflow-hidden m-0 p-0 select-none"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          backgroundColor: '#070b12',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <IrisSettingsProvider>
          <IrisInputProvider>
            <AssistiveCursor />
            <main
              id="main-content"
              className="w-full h-full overflow-hidden relative flex flex-col"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '100%',
                backgroundColor: '#070b12',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </main>
          </IrisInputProvider>
        </IrisSettingsProvider>
      </body>
    </html>
  );
}
