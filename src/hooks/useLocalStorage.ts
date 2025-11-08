import { useState } from "react";
import { toast } from "sonner";

const isDevelopment = import.meta.env.DEV;

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      if (isDevelopment) {
        console.error("Error reading from localStorage:", error);
      }
      toast.error("Failed to load data from storage");
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      if (isDevelopment) {
        console.error("Error writing to localStorage:", error);
      }
      toast.error("Failed to save data to storage");
    }
  };

  return [storedValue, setValue] as const;
}
