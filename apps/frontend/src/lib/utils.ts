import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCallback, useRef } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce hook for search and other delayed operations
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Format ayah key (e.g., "2:255")
export function formatAyahKey(surahId: number, ayahNumber: number): string {
  return `${surahId}:${ayahNumber}`;
}

// Parse ayah key
export function parseAyahKey(key: string): { surahId: number; ayahNumber: number } | null {
  const match = key.match(/^(\d+):(\d+)$/);
  if (!match) return null;
  return {
    surahId: parseInt(match[1], 10),
    ayahNumber: parseInt(match[2], 10),
  };
}

// Format duration in minutes/hours
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes}m`;
}

// Format date for display
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}
