'use client';

import React, { useEffect, useState } from 'react';
import { useIrisInput } from '@/lib/input/IrisInputContext';

export default function EngineStatus() {
  const [webGLAvailable, setWebGLAvailable] = useState<boolean>(false);
  const { mode, connected } = useIrisInput();

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setWebGLAvailable(!!gl);
    } catch (e) {
      setWebGLAvailable(false);
    }
  }, []);

  return (
    <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[var(--iris-border-light)] rounded-[var(--iris-radius)] font-mono text-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--iris-green)] animate-pulse" style={{ boxShadow: '0 0 8px var(--iris-green)' }}></div>
          <span className="text-[var(--iris-text-secondary)]">3D ENGINE:</span>
          <span className="text-[var(--iris-green)]">ONLINE</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${webGLAvailable ? 'bg-[var(--iris-green)]' : 'bg-[var(--iris-danger)]'}`}></div>
          <span className="text-[var(--iris-text-secondary)]">WEBGL:</span>
          <span className={webGLAvailable ? 'text-[var(--iris-green)]' : 'text-[var(--iris-danger)]'}>
            {webGLAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--iris-blue)]" style={{ boxShadow: '0 0 8px var(--iris-blue)' }}></div>
          <span className="text-[var(--iris-text-secondary)]">IRIS INPUT:</span>
          <span className="text-[var(--iris-blue)] uppercase">
            {connected ? `${mode} MODE` : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}
