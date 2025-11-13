"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pinkdrunk-tutorial-v1";

function isStorageAvailable() {
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function useDrinkFormTutorial() {
  const [enabled, setEnabled] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageReady = isStorageAvailable();
    if (!storageReady) {
      setEnabled(true);
      setHasSeen(false);
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : { seen: false };
    setHasSeen(!!parsed?.seen);
    setEnabled(!parsed?.seen);
  }, []);

  const dismiss = () => {
    setEnabled(false);
    setHasSeen(true);
    if (typeof window !== "undefined" && isStorageAvailable()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ seen: true }));
    }
  };

  const reset = () => {
    setEnabled(true);
    setHasSeen(false);
    if (typeof window !== "undefined" && isStorageAvailable()) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    enabled,
    hasSeen,
    dismiss,
    reset,
  };
}
