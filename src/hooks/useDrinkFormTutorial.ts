"use client";

import { useState } from "react";

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
  const [state, setState] = useState(() => {
    if (typeof window === "undefined" || !isStorageAvailable()) {
      return { enabled: true, hasSeen: false };
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : { seen: false };
      const seen = Boolean(parsed?.seen);
      return { enabled: !seen, hasSeen: seen };
    } catch {
      return { enabled: true, hasSeen: false };
    }
  });

  const { enabled, hasSeen } = state;

  const dismiss = () => {
    setState({ enabled: false, hasSeen: true });
    if (typeof window !== "undefined" && isStorageAvailable()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ seen: true }));
    }
  };

  const reset = () => {
    setState({ enabled: true, hasSeen: false });
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
