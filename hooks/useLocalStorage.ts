
import React, { useState, useEffect } from 'react';

// Date reviver function to parse ISO date strings back to Date objects
function dateReviver(key: string, value: any): any {
  // Check for various date string formats
  if (typeof value === 'string') {
    // ISO date format (2023-12-25T10:30:00.000Z)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
      return new Date(value);
    }
    // Date-like strings that can be parsed by Date constructor
    if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.includes('GMT') || value.includes('UTC')) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return value;
}

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item, dateReviver) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const valueToStore =
          typeof storedValue === 'function'
            ? storedValue(storedValue)
            : storedValue;
        
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
