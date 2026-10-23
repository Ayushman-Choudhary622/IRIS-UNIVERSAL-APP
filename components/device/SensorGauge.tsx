'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface SensorGaugeProps {
  value: number; // -1 to 1
  label: string;
  color: string;
}

export default function SensorGauge({ value, label, color }: SensorGaugeProps) {
  const radius = 50;
  const strokeWidth = 8;
  const center = radius + strokeWidth;
  const size = center * 2;
  
  // Angle range: -135 to 135 degrees (270 degrees total)
  const startAngle = -135;
  const endAngle = 135;
  const range = endAngle - startAngle;
  
  const arcPath = useMemo(() => {
    const startX = center + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = center + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = center + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = center + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    // Since range is > 180, largeArcFlag is 1
    return `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;
  }, [center, radius]);

  const valueAngle = (value * range) / 2; // -1 to 1 maps to -135 to 135
  const indicatorX = center + radius * Math.cos((valueAngle - 90) * Math.PI / 180);
  const indicatorY = center + radius * Math.sin((valueAngle - 90) * Math.PI / 180);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Background arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="var(--iris-border-light, #334155)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Center text */}
          <text
            x={center}
            y={center + 5}
            textAnchor="middle"
            fill="var(--iris-text, #0F172A)"
            className="font-mono text-lg font-bold"
          >
            {value.toFixed(2)}
          </text>
        </svg>
        {/* Animated indicator */}
        <motion.div
          className="absolute top-0 left-0"
          style={{ width: size, height: size, originX: 0.5, originY: 0.5 }}
          initial={false}
          animate={{ rotate: valueAngle }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: strokeWidth + 4,
              height: strokeWidth + 4,
              backgroundColor: color,
              top: strokeWidth - 2,
              left: center - (strokeWidth + 4) / 2,
              boxShadow: `0 0 10px ${color}`
            }}
          />
        </motion.div>
      </div>
      <span className="mt-2 text-sm font-medium text-iris-text-secondary">{label}</span>
    </div>
  );
}
