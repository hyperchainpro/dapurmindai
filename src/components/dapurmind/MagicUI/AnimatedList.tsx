'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedListItem {
  id: string;
  content: React.ReactNode;
}

interface AnimatedListProps {
  /** Array of items to render with staggered animation */
  items: AnimatedListItem[];
  className?: string;
  /** Delay between each item's animation in seconds */
  staggerDelay?: number;
  /** Duration of each item's entrance animation in seconds */
  animationDuration?: number;
  /** Whether to animate on first render */
  animateOnMount?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  visible: (duration: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  exit: (duration: number) => ({
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: {
      duration: duration * 0.5,
      ease: 'easeIn',
    },
  }),
};

function AnimatedList({
  items,
  className,
  staggerDelay = 0.08,
  animationDuration = 0.5,
  animateOnMount = true,
}: AnimatedListProps) {
  return (
    <div className="relative w-full">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={items.map((i) => i.id).join('-')}
          custom={staggerDelay}
          variants={containerVariants}
          initial={animateOnMount ? 'hidden' : false}
          animate="visible"
          className={cn(className)}
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              custom={animationDuration}
              variants={itemVariants}
              initial={animateOnMount ? 'hidden' : false}
              animate="visible"
              exit="exit"
              layout
              className="relative"
            >
              {item.content}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Utility: wraps a single list item for use inside AnimatedList
function AnimatedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export { AnimatedList, AnimatedListItem };
export default AnimatedList;
