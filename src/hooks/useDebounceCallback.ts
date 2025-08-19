import { useCallback, useRef } from 'react';

/**
 * Enhanced debounce hook with immediate execution option
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @param immediate - Execute immediately on first call
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  immediate: boolean = false
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const immediateRef = useRef<boolean>(immediate);

  return useCallback(
    (...args: Parameters<T>) => {
      const callNow = immediate && !timeoutRef.current;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        if (!immediate) callback(...args);
      }, delay);
      
      if (callNow) callback(...args);
    },
    [callback, delay, immediate]
  ) as T;
}