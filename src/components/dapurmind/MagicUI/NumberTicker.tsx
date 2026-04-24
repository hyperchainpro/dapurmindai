'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMotionValue, useSpring, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  /** Target number to count to */
  value: number;
  className?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Prefix string (e.g., "$") */
  prefix?: string;
  /** Suffix string (e.g., "+", "K") */
  suffix?: string;
  /** Whether to format with thousand separators */
  formatNumber?: boolean;
  /** Start animating immediately */
  startOnMount?: boolean;
  /** Number of decimal places */
  decimals?: number;
}

function formatWithSeparators(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function NumberTicker({
  value,
  className,
  duration = 2,
  prefix = '',
  suffix = '',
  formatNumber = true,
  startOnMount = true,
  decimals = 0,
}: NumberTickerProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [displayValue, setDisplayValue] = useState(
    formatNumber ? formatWithSeparators(0, decimals) : '0'
  );
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!startOnMount) return;
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
    });

    const unsubscribe = springValue.on('change', (latest) => {
      const formatted = formatNumber
        ? formatWithSeparators(parseFloat(latest.toFixed(decimals)), decimals)
        : latest.toFixed(decimals);
      setDisplayValue(formatted);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, motionValue, springValue, startOnMount, formatNumber, decimals]);

  return (
    <span
      className={cn(
        'inline-block tabular-nums tracking-tight',
        className
      )}
      aria-label={`${prefix}${value}${suffix}`}
    >
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

export { NumberTicker };
export default NumberTicker;
