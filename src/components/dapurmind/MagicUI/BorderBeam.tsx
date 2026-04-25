'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Size of the beam glow in pixels */
  size?: number;
  /** Beam color(s) */
  color?: string | string[];
  /** Border width offset from the edge */
  borderWidth?: number;
  /** Whether the beam is running */
  active?: boolean;
  /** Border radius to match the container */
  borderRadius?: number;
}

function splitColors(color: string | string[]): string[] {
  if (Array.isArray(color)) return color;
  return [color];
}

function BorderBeam({
  className,
  duration = 8,
  size = 200,
  color = ['#10b981', '#34d399'],
  borderWidth = 2,
  active = true,
  borderRadius = 12,
}: BorderBeamProps) {
  const colors = useMemo(() => splitColors(color), [color]);

  const gradientColors = colors.join(', ');

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
      style={{ borderRadius }}
      aria-hidden="true"
    >
      {/* Rotating conic gradient beam */}
      <motion.div
        className="absolute inset-[-50%]"
        style={{ borderRadius: 'inherit' }}
        animate={active ? { rotate: 360 } : {}}
        transition={
          active
            ? {
                duration,
                repeat: Infinity,
                ease: 'linear',
              }
            : undefined
        }
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `conic-gradient(from 0deg, transparent 0%, transparent 35%, ${gradientColors} 48%, ${colors[0]} 50%, ${colors[colors.length - 1]} 52%, transparent 65%, transparent 100%)`,
          }}
        />
      </motion.div>

      {/* Inner mask: only the border ring remains visible */}
      <div
        className="absolute inset-0 bg-background"
        style={{
          borderRadius: Math.max(0, borderRadius - borderWidth),
          margin: borderWidth,
        }}
      />

      {/* Glow effect for extra polish */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          borderRadius,
          boxShadow: `inset 0 0 ${size / 3}px ${colors[0]}30`,
        }}
      />
    </div>
  );
}

export { BorderBeam };
export default BorderBeam;
