"use client";

import React from 'react';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn\'t load this right now. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={`text-center py-10 ${className || ''}`} role="alert" aria-live="assertive">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <svg className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {onRetry && (
        <div className="mt-4">
          <Button onClick={onRetry} variant="outline">Try again</Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;


