import React from 'react';
import { cn } from '@/lib/utils';

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={cn(
        "absolute left-4 top-4 z-50 px-4 py-2 bg-primary text-primary-foreground",
        "rounded-md font-medium transition-transform duration-200",
        "transform -translate-y-full focus:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
    >
      Zum Hauptinhalt springen
    </a>
  );
}