'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Shine color(s) */
  color?: string | string[];
  /** Border radius in pixels */
  borderRadius?: number;
}

function splitColors(color: string | string[]): string[] {
  if (Array.isArray(color)) return color;
  return [color];
}

function ShineBorder({
  children,
  className,
  borderWidth = 1.5,
  duration = 8,
  color = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  borderRadius = 12,
}: ShineBorderProps) {
  const colors = useMemo(() => splitColors(color), [color]);

  return (
    <div
      className={cn('relative overflow-hidden p-0', className)}
      style={{ borderRadius }}
    >
      {/* Spinning gradient */}
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius }}
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `conic-gradient(from 0deg, transparent 0%, transparent 30%, ${colors[0]} 45%, ${colors[1]} 50%, ${colors[2]} 55%, transparent 70%, transparent 100%)`,
          }}
        />
      </motion.div>

      {/* Inner content with mask to cut out the inside */}
      <div
        className="relative z-10 bg-background"
        style={{
          borderRadius: Math.max(0, borderRadius - borderWidth),
          margin: borderWidth,
          height: 'calc(100% - 2px)', // slight offset for clean edges
        }}
      >
        {children}
      </div>
    </div>
  );
}

export { ShineBorder };
export default ShineBorder;
