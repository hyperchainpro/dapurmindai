"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SparkColor =
  | "amber"
  | "emerald"
  | "rose"
  | "violet"
  | "cyan"
  | "orange"
  | "lime"
  | "pink"
  | "white";

const sparkColorMap: Record<SparkColor, string> = {
  amber: "#fbbf24",
  emerald: "#34d399",
  rose: "#fb7185",
  violet: "#a78bfa",
  cyan: "#22d3ee",
  orange: "#fb923c",
  lime: "#a3e635",
  pink: "#f472b6",
  white: "#ffffff",
};

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  rotation: number;
}

interface ClickSparkProps {
  children: React.ReactNode;
  className?: string;
  color?: SparkColor;
  count?: number;
}

function SparkleSVG({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ filter: `drop-shadow(0 0 ${size * 0.5}px ${color})` }}
    >
      <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
    </svg>
  );
}

let sparkIdCounter = 0;

export function ClickSpark({
  children,
  className,
  color = "amber",
  count = 8,
}: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<SparkParticle[]>([]);

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        const touch = e.changedTouches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const newSparks: SparkParticle[] = Array.from({ length: count }, () => {
        const angle = (Math.PI * 2 * Math.random());
        const distance = 20 + Math.random() * 50;

        return {
          id: sparkIdCounter++,
          x,
          y,
          angle,
          distance,
          size: 6 + Math.random() * 10,
          rotation: Math.random() * 360,
        };
      });

      setSparks((prev) => [...prev, ...newSparks]);

      // Clean up after animation completes
      setTimeout(() => {
        setSparks((prev) =>
          prev.filter((s) => !newSparks.find((ns) => ns.id === s.id))
        );
      }, 800);
    },
    [count]
  );

  const hexColor = sparkColorMap[color];

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none", className)}
      onClick={handleClick}
      onTouchEnd={handleClick}
    >
      <AnimatePresence>
        {sparks.map((spark) => {
          const endX = spark.x + Math.cos(spark.angle) * spark.distance;
          const endY = spark.y + Math.sin(spark.angle) * spark.distance;

          return (
            <motion.div
              key={spark.id}
              className="absolute pointer-events-none"
              style={{
                left: spark.x,
                top: spark.y,
                x: "-50%",
                y: "-50%",
              }}
              initial={{
                opacity: 1,
                scale: 0,
                x: 0,
                y: 0,
                rotate: spark.rotation,
              }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0, 1.2, 0.3],
                x: endX - spark.x,
                y: endY - spark.y,
                rotate: spark.rotation + 180,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                opacity: { duration: 0.6, times: [0, 0.4, 1] },
                scale: { duration: 0.6, times: [0, 0.2, 1] },
              }}
            >
              <SparkleSVG color={hexColor} size={spark.size} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Main ripple effect */}
      <AnimatePresence>
        {sparks.length > 0 && (
          <motion.div
            key="ripple"
            className="absolute rounded-full pointer-events-none"
            style={{
              left: sparks[sparks.length - 1].x,
              top: sparks[sparks.length - 1].y,
              width: 4,
              height: 4,
              backgroundColor: hexColor,
              x: "-50%",
              y: "-50%",
            }}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

export default ClickSpark;
