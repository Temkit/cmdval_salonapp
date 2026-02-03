"use client";

import { useEffect, useRef, useState } from "react";

interface UseFormPersistOptions<T> {
  debounceMs?: number;
  exclude?: (keyof T)[];
}

export function useFormPersist<T extends object>(
  key: string,
  state: T,
  setState: (val: T) => void,
  options: UseFormPersistOptions<T> = {}
): { clear: () => void; hasRestored: boolean } {
  const { debounceMs = 500, exclude = [] } = options;
  const [hasRestored, setHasRestored] = useState(false);
  const isInitialMount = useRef(true);

  // Restore on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<T>;
        setState({ ...state, ...parsed });
        setHasRestored(true);
      }
    } catch {
      // Ignore parse errors
    }
    isInitialMount.current = false;
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Save on state change (debounced)
  useEffect(() => {
    if (isInitialMount.current) return;

    const timer = setTimeout(() => {
      try {
        const toSave = { ...state };
        for (const field of exclude) {
          delete toSave[field];
        }
        sessionStorage.setItem(key, JSON.stringify(toSave));
      } catch {
        // Ignore storage errors (quota exceeded, etc.)
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [key, state, debounceMs, exclude]);

  const clear = () => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore
    }
  };

  return { clear, hasRestored };
}
