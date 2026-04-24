"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

type GlowColor =
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "cyan"
  | "orange"
  | "lime"
  | "pink";

const glowColorMap: Record<GlowColor, { base: string; shadow: string }> = {
  emerald: {
    base: "text-emerald-400",
    shadow:
      "0 0 7px #34d399, 0 0 10px #34d399, 0 0 21px #34d399, 0 0 42px #059669, 0 0 82px #059669",
  },
  amber: {
    base: "text-amber-400",
    shadow:
      "0 0 7px #fbbf24, 0 0 10px #fbbf24, 0 0 21px #fbbf24, 0 0 42px #d97706, 0 0 82px #d97706",
  },
  rose: {
    base: "text-rose-400",
    shadow:
      "0 0 7px #fb7185, 0 0 10px #fb7185, 0 0 21px #fb7185, 0 0 42px #e11d48, 0 0 82px #e11d48",
  },
  violet: {
    base: "text-violet-400",
    shadow:
      "0 0 7px #a78bfa, 0 0 10px #a78bfa, 0 0 21px #a78bfa, 0 0 42px #7c3aed, 0 0 82px #7c3aed",
  },
  cyan: {
    base: "text-cyan-400",
    shadow:
      "0 0 7px #22d3ee, 0 0 10px #22d3ee, 0 0 21px #22d3ee, 0 0 42px #0891b2, 0 0 82px #0891b2",
  },
  orange: {
    base: "text-orange-400",
    shadow:
      "0 0 7px #fb923c, 0 0 10px #fb923c, 0 0 21px #fb923c, 0 0 42px #ea580c, 0 0 82px #ea580c",
  },
  lime: {
    base: "text-lime-400",
    shadow:
      "0 0 7px #a3e635, 0 0 10px #a3e635, 0 0 21px #a3e635, 0 0 42px #65a30d, 0 0 82px #65a30d",
  },
  pink: {
    base: "text-pink-400",
    shadow:
      "0 0 7px #f472b6, 0 0 10px #f472b6, 0 0 21px #f472b6, 0 0 42px #db2777, 0 0 82px #db2777",
  },
};

const intensityMultiplier = { 1: 0.5, 2: 0.75, 3: 1 } as const;

interface GlowingTextProps {
  children: React.ReactNode;
  className?: string;
  color?: GlowColor;
  intensity?: 1 | 2 | 3;
}

export function GlowingText({
  children,
  className,
  color = "emerald",
  intensity = 2,
}: GlowingTextProps) {
  const config = useMemo(() => glowColorMap[color], [color]);
  const multiplier = intensityMultiplier[intensity];

  const animationStyle = useMemo(() => {
    const steps = 20;
    const keyframes: Record<string, string> = {};

    for (let i = 0; i <= steps; i++) {
      const progress = (i / steps) * 100;
      const pulse = Math.sin((i / steps) * Math.PI * 2) * 0.5 + 0.5;
      const opacity = 0.4 + pulse * 0.6 * multiplier;
      const blur = 1 + pulse * multiplier;

      keyframes[`${progress}%`] = `text-shadow: 0 0 ${blur * 4}px ${
        color === "emerald"
          ? "#34d399"
          : color === "amber"
            ? "#fbbf24"
            : color === "rose"
              ? "#fb7185"
              : color === "violet"
                ? "#a78bfa"
                : color === "cyan"
                  ? "#22d3ee"
                  : color === "orange"
                    ? "#fb923c"
                    : color === "lime"
                      ? "#a3e635"
                      : "#f472b6"
      } ${opacity.toFixed(2)};`;
    }

    return keyframes;
  }, [color, multiplier]);

  const animationName = useMemo(() => {
    return `glow-${color}-${intensity}`;
  }, [color, intensity]);

  const styleContent = useMemo(() => {
    const entries = Object.entries(animationStyle)
      .map(([key, value]) => `  ${key} { ${value} }`)
      .join("\n");
    return `@keyframes ${animationName} {\n${entries}\n}`;
  }, [animationStyle, animationName]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />
      <span
        className={cn(
          "inline-block font-semibold",
          config.base,
          className
        )}
        style={{
          animation: `${animationName} 3s ease-in-out infinite`,
          willChange: "text-shadow",
        }}
      >
        {children}
      </span>
    </>
  );
}

export default GlowingText;
