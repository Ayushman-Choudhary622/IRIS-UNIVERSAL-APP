'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useIrisInput } from '@/lib/input/IrisInputContext';

interface Point {
  pitch: number;
  yaw: number;
  roll: number;
}

export default function TelemetryChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pitch, yaw, roll } = useIrisInput();
  const [dataPoints, setDataPoints] = useState<Point[]>(Array(300).fill({ pitch: 0, yaw: 0, roll: 0 }));

  useEffect(() => {
    setDataPoints(prev => {
      const next = [...prev, { pitch, yaw, roll }];
      if (next.length > 300) next.shift();
      return next;
    });
  }, [pitch, yaw, roll]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      
      // Center line (0)
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Quarter lines
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height / 4);
      ctx.lineTo(width, height / 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, height * 3 / 4);
      ctx.lineTo(width, height * 3 / 4);
      ctx.stroke();
      ctx.setLineDash([]);

      const drawLine = (key: keyof Point, color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';

        dataPoints.forEach((point, i) => {
          const x = (i / 300) * width;
          // value is -1 to 1. map to height to 0
          const y = height / 2 - (point[key] * (height / 2 - 10)); // 10px padding
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };

      drawLine('pitch', '#0284C7'); // cyan/sky
      drawLine('yaw', '#2563EB');   // blue
      drawLine('roll', '#7C3AED');  // violet

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dataPoints]);

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-end gap-4 mb-2 text-xs font-mono">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[var(--iris-cyan)]"></div>Pitch</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[var(--iris-blue)]"></div>Yaw</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[var(--iris-violet)]"></div>Roll</div>
      </div>
      <div className="w-full h-48 relative border border-iris-border rounded-lg overflow-hidden bg-iris-bg-secondary">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-full object-fill block"
        />
        {/* Axis Labels */}
        <div className="absolute left-2 top-2 text-[10px] text-iris-text-tertiary">+1.0</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-iris-text-tertiary">0.0</div>
        <div className="absolute left-2 bottom-2 text-[10px] text-iris-text-tertiary">-1.0</div>
      </div>
    </div>
  );
}
