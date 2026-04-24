'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  /** Pause the animation on hover */
  pauseOnHover?: boolean;
  /** Speed of the marquee in seconds for one full cycle */
  speed?: number;
  /** Direction of the scroll */
  direction?: 'left' | 'right';
  /** Number of times to duplicate children for seamless loop */
  repeat?: number;
  /** Gap between repeated items */
  gap?: number;
}

function Marquee({
  children,
  className,
  pauseOnHover = false,
  speed = 30,
  direction = 'left',
  repeat = 4,
  gap = 24,
}: MarqueeProps) {
  const [scrollerRef, setScrollerRef] = useState<HTMLDivElement | null>(null);
  const [startAnimation, setStartAnimation] = useState(false);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    setScrollerRef(node);
  }, []);

  useEffect(() => {
    if (scrollerRef) {
      // Small delay to ensure layout is computed
      const timer = setTimeout(() => {
        setStartAnimation(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scrollerRef]);

  const animationDirection = direction === 'right' ? 'reverse' : 'normal';

  return (
    <div
      className={cn(
        'group relative flex overflow-hidden',
        className
      )}
      role="marquee"
    >
      {/* Fade edges for smooth visual */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

      <div
        ref={setRef}
        className={cn(
          'flex w-max min-w-full shrink-0 flex-nowrap items-center',
          startAnimation && 'animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{
          gap: `${gap}px`,
          animationDuration: `${speed}s`,
          animationDirection,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationDelay: '0s',
        }}
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <div
            key={`marquee-item-${i}`}
            className="flex shrink-0 items-center justify-around"
            style={{ gap: `${gap}px` }}
          >
            {children}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% - ${gap}px));
          }
        }
        .animate-marquee {
          animation-name: marquee-scroll;
        }
      `}</style>
    </div>
  );
}

export { Marquee };
export default Marquee;
