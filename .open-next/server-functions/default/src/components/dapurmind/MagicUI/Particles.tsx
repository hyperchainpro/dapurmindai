'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

interface ParticlesProps {
  className?: string;
  /** Number of particles to render */
  count?: number;
  /** Colors for the particles */
  colors?: string[];
  /** Whether particles should respawn */
  continuous?: boolean;
  /** Size range for particles [min, max] in px */
  sizeRange?: [number, number];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function Particles({
  className,
  count = 30,
  colors = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24', '#a7f3d0'],
  continuous = true,
  sizeRange = [3, 8],
}: ParticlesProps) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: randomBetween(sizeRange[0], sizeRange[1]),
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: randomBetween(8, 20),
      delay: randomBetween(0, 5),
      drift: randomBetween(-30, 30),
      opacity: randomBetween(0.2, 0.7),
    }));
  }, [count, colors, sizeRange]);

  const getAnimation = useCallback(
    (particle: Particle) => {
      if (continuous) {
        return {
          y: [0, -200, -400],
          x: [0, particle.drift * 0.5, particle.drift],
          opacity: [0, particle.opacity, 0],
          scale: [0, 1, 0.5],
          transition: {
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeOut',
          },
        };
      }
      return {
        y: [0, -200],
        x: [0, particle.drift],
        opacity: [0, particle.opacity, 0],
        scale: [0, 1, 0.5],
        transition: {
          duration: particle.duration,
          delay: particle.delay,
          ease: 'easeOut',
        },
      };
    },
    [continuous]
  );

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            bottom: `${-particle.size}px`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}40`,
          }}
          animate={getAnimation(particle)}
          initial={{ opacity: 0, scale: 0 }}
        />
      ))}
    </div>
  );
}

export { Particles };
export default Particles;
