'use client';
import React, { useState, Component } from 'react';
import dynamic from 'next/dynamic';
import { ExplorationHUD } from '@/components/simulations/exploration/ExplorationHUD';

const ExplorationCanvas = dynamic(
  () => import('@/components/simulations/exploration/ExplorationCanvas').then((mod) => mod.default),
  { ssr: false }
);

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SimErrorBoundary extends Component<
  { children: React.ReactNode; onReset: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--iris-bg)',
          color: 'var(--iris-text)',
        }}>
          <div className="glass-card" style={{ maxWidth: '420px', padding: '24px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '12px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--iris-danger)' }}>
              3D ENGINE UNAVAILABLE
            </h2>
            <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--iris-text-secondary)' }}>
              {this.state.error?.message || 'The simulation encountered an error.'}
            </p>
            <button
              className="iris-btn iris-btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
            >
              Restart Simulation
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export type ZoneType = 'ORBITAL' | 'TERRAIN' | 'RESEARCH' | 'OBSERVATORY';

export interface POI {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
}

export default function ExplorationSimulation() {
  const [activeZone, setActiveZone] = useState<ZoneType>('ORBITAL');
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);

  return (
    <main style={{
      position: 'relative',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: '#000',
      color: 'var(--iris-text)',
    }}>
      <SimErrorBoundary onReset={() => setActiveZone('ORBITAL')}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <ExplorationCanvas
            activeZone={activeZone}
            onSelectPOI={setSelectedPOI}
          />
        </div>
      </SimErrorBoundary>

      <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 10 }}>
        <ExplorationHUD
          activeZone={activeZone}
          setActiveZone={setActiveZone}
          selectedPOI={selectedPOI}
          setSelectedPOI={setSelectedPOI}
        />
      </div>
    </main>
  );
}
