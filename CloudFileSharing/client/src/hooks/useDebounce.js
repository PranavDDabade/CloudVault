import { useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce — returns a debounced version of a callback
 */
export const useDebounce = (callback, delay = 500) => {
  const timerRef = useRef(null);

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return debounced;
};

/**
 * useDebounceValue — returns a debounced value (for search inputs)
 */
import { useState, useEffect as useEff } from 'react';

export const useDebounceValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEff(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
