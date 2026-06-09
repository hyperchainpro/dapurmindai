'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------
 *  BentoGrid
 *  A responsive CSS-grid container. Children can declare custom
 *  column/row spans via BentoGridItem colSpan/rowSpan props.
 * ------------------------------------------------------------------ */

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  /** Column count per breakpoint */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Grid gap in rem */
  gap?: number;
}

function BentoGrid({
  children,
  className,
  columns = { default: 1, sm: 2, lg: 4 },
  gap = 1,
}: BentoGridProps) {
  const defaultCols = columns.default ?? 1;
  const smCols = columns.sm ?? defaultCols;
  const mdCols = columns.md ?? smCols;
  const lgCols = columns.lg ?? mdCols;
  const xlCols = columns.xl ?? lgCols;

  return (
    <>
      <div
        data-bento-grid=""
        className={cn('w-full', className)}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${defaultCols}, minmax(0, 1fr))`,
          gap: `${gap}rem`,
        }}
      >
        {children}
      </div>
      <style>{`
        [data-bento-grid] {
          --bento-default: ${defaultCols};
          --bento-sm: ${smCols};
          --bento-md: ${mdCols};
          --bento-lg: ${lgCols};
          --bento-xl: ${xlCols};
        }
        @media (min-width: 640px) {
          [data-bento-grid] {
            grid-template-columns: repeat(var(--bento-sm), minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 768px) {
          [data-bento-grid] {
            grid-template-columns: repeat(var(--bento-md), minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 1024px) {
          [data-bento-grid] {
            grid-template-columns: repeat(var(--bento-lg), minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 1280px) {
          [data-bento-grid] {
            grid-template-columns: repeat(var(--bento-xl), minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------------------
 *  BentoGridItem
 *  Individual grid item with optional column/row span controls.
 * ------------------------------------------------------------------ */

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns this item spans */
  colSpan?: number;
  /** Number of rows this item spans */
  rowSpan?: number;
}

function BentoGridItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-border/80',
        className
      )}
      style={{
        gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
        gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export { BentoGrid, BentoGridItem };
