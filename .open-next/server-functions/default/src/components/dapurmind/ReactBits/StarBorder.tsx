"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StarBorderColor =
  | "amber"
  | "emerald"
  | "rose"
  | "violet"
  | "cyan"
  | "orange"
  | "lime"
  | "pink";

const starBorderColors: Record<
  StarBorderColor,
  { star: string; trail: string }
> = {
  amber: { star: "#fbbf24", trail: "#f59e0b" },
  emerald: { star: "#34d399", trail: "#10b981" },
  rose: { star: "#fb7185", trail: "#f43f5e" },
  violet: { star: "#a78bfa", trail: "#8b5cf6" },
  cyan: { star: "#22d3ee", trail: "#06b6d4" },
  orange: { star: "#fb923c", trail: "#f97316" },
  lime: { star: "#a3e635", trail: "#84cc16" },
  pink: { star: "#f472b6", trail: "#ec4899" },
};

interface StarBorderProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  color?: StarBorderColor;
  speed?: number;
  starCount?: number;
}

function StarShape({
  color,
  size,
  x,
  y,
  delay,
  duration,
}: {
  color: string;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}) {
  const id = useMemo(
    () => `star-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.15, 0.75, 1],
      }}
    >
      <defs>
        <filter id={id}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z"
        filter={`url(#${id})`}
      />
    </motion.svg>
  );
}

function TrailDot({
  color,
  size,
  x,
  y,
  delay,
  duration,
}: {
  color: string;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        left: x,
        top: y,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1, 0.5],
      }}
      transition={{
        duration: duration * 0.6,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export function StarBorder({
  children,
  className,
  as: Component = "div",
  color = "amber",
  speed = 6,
  starCount = 12,
}: StarBorderProps) {
  const colors = starBorderColors[color];

  const stars = useMemo(() => {
    const items: {
      id: number;
      size: number;
      x: string;
      y: string;
      delay: number;
      isCorner: boolean;
    }[] = [];

    // Generate stars along the perimeter
    const perimeterSegments = starCount;
    for (let i = 0; i < perimeterSegments; i++) {
      const progress = i / perimeterSegments;
      const delay = progress * speed;

      // Distribute along the border (top, right, bottom, left)
      const perimeterPos = progress * 4;
      let x: string;
      let y: string;
      let isCorner = false;

      if (perimeterPos < 1) {
        // Top edge
        x = `${(perimeterPos * 100).toFixed(1)}%`;
        y = "0%";
        isCorner = perimeterPos < 0.08 || perimeterPos > 0.92;
      } else if (perimeterPos < 2) {
        // Right edge
        x = "100%";
        y = `${((perimeterPos - 1) * 100).toFixed(1)}%`;
        isCorner = perimeterPos - 1 < 0.08 || perimeterPos - 1 > 0.92;
      } else if (perimeterPos < 3) {
        // Bottom edge
        x = `${((2 - (perimeterPos - 2)) * 100).toFixed(1)}%`;
        y = "100%";
        isCorner = perimeterPos - 2 < 0.08 || perimeterPos - 2 > 0.92;
      } else {
        // Left edge
        x = "0%";
        y = `${((3 - (perimeterPos - 3)) * 100).toFixed(1)}%`;
        isCorner = perimeterPos - 3 < 0.08 || perimeterPos - 3 > 0.92;
      }

      items.push({
        id: i,
        size: isCorner ? 14 : 8 + Math.random() * 6,
        x,
        y,
        delay,
        isCorner,
      });
    }

    return items;
  }, [starCount, speed]);

  const trailDots = useMemo(() => {
    const dots: {
      id: number;
      size: number;
      x: string;
      y: string;
      delay: number;
    }[] = [];
    const trailCount = Math.floor(starCount * 0.6);

    for (let i = 0; i < trailCount; i++) {
      const progress = (i + 0.3) / starCount;
      const delay = progress * speed;
      const perimeterPos = progress * 4;
      let x: string;
      let y: string;

      if (perimeterPos < 1) {
        x = `${(perimeterPos * 100).toFixed(1)}%`;
        y = "0%";
      } else if (perimeterPos < 2) {
        x = "100%";
        y = `${((perimeterPos - 1) * 100).toFixed(1)}%`;
      } else if (perimeterPos < 3) {
        x = `${((2 - (perimeterPos - 2)) * 100).toFixed(1)}%`;
        y = "100%";
      } else {
        x = "0%";
        y = `${((3 - (perimeterPos - 3)) * 100).toFixed(1)}%`;
      }

      dots.push({
        id: i,
        size: 2 + Math.random() * 2,
        x,
        y,
        delay,
      });
    }

    return dots;
  }, [starCount, speed]);

  return (
    <Component
      className={cn("relative overflow-visible", className)}
      style={{ isolation: "isolate" }}
    >
      {/* Glow border base */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          border: `1px solid ${colors.star}33`,
          boxShadow: `0 0 15px ${colors.star}15, inset 0 0 15px ${colors.star}08`,
        }}
      />

      {/* Stars */}
      {stars.map((star) => (
        <StarShape
          key={star.id}
          color={colors.star}
          size={star.size}
          x={star.x}
          y={star.y}
          delay={star.delay}
          duration={speed * 0.4}
        />
      ))}

      {/* Trail dots */}
      {trailDots.map((dot) => (
        <TrailDot
          key={`trail-${dot.id}`}
          color={colors.trail}
          size={dot.size}
          x={dot.x}
          y={dot.y}
          delay={dot.delay}
          duration={speed * 0.5}
        />
      ))}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
}

export default StarBorder;
