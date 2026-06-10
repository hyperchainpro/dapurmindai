"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const intensityConfig = {
  1: { bounce: 10, stiffness: 300, damping: 15 },
  2: { bounce: 20, stiffness: 400, damping: 12 },
  3: { bounce: 35, stiffness: 500, damping: 10 },
} as const;

interface BounceProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  intensity?: 1 | 2 | 3;
  repeat?: boolean;
  hover?: boolean;
}

export function Bounce({
  children,
  className,
  delay = 0,
  intensity = 2,
  repeat = false,
  hover = false,
}: BounceProps) {
  const config = intensityConfig[intensity];

  const springTransition = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: config.stiffness,
      damping: config.damping,
      delay,
    }),
    [config.stiffness, config.damping, delay]
  );

  const whileHoverConfig = useMemo(
    () =>
      hover
        ? {
            y: -config.bounce * 0.4,
            scale: 1.05,
            transition: springTransition,
          }
        : undefined,
    [hover, config.bounce, springTransition]
  );

  return (
    <motion.div
      className={cn(className)}
      initial={{ y: config.bounce, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      whileHover={whileHoverConfig}
      transition={
        repeat
          ? {
              ...springTransition,
              repeat: Infinity,
              repeatType: "reverse" as const,
              repeatDelay: 0.3,
            }
          : springTransition
      }
    >
      {children}
    </motion.div>
  );
}

export default Bounce;
