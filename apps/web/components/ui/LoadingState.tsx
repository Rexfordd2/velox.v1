"use client";

import React from 'react';

interface LoadingStateProps {
  className?: string;
  lines?: number;
  variant?: 'list' | 'detail' | 'inline';
}

export function LoadingState({ className, lines = 3, variant = 'list' }: LoadingStateProps) {
  const base = 'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700';

  if (variant === 'inline') {
    return (
      <div className={className} aria-busy="true" aria-live="polite">
        <div className={`${base} h-4 w-24`} />
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={`space-y-4 ${className || ''}`} aria-busy="true" aria-live="polite">
        <div className={`${base} h-6 w-1/3`} />
        <div className={`${base} h-4 w-1/2`} />
        <div className={`${base} h-64 w-full`} />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className || ''}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`${base} h-10 w-10`} />
          <div className="flex-1 space-y-2">
            <div className={`${base} h-4 w-2/3`} />
            <div className={`${base} h-3 w-1/3`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingState;


