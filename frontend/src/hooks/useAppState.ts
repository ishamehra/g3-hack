"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppScreen, MoodState } from "@/types";

const STORAGE_KEY = "resonance_app_state";

interface AppState {
  screen: AppScreen;
  targetMood: MoodState | null;
}

const DEFAULT_STATE: AppState = { screen: "onboarding", targetMood: null };

function saveState(state: AppState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useAppState() {
  // Always start with default to match SSR — restore in useEffect
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  // Restore from sessionStorage after hydration
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const screen = parsed.screen ?? "onboarding";
        setState({
          screen: screen === "privacy" || screen === "tos" || screen === "oura" ? "onboarding" : screen,
          targetMood: parsed.targetMood ?? null,
        });
      }
    } catch {}
  }, []);

  const goTo = useCallback((screen: AppScreen) => {
    setState((prev) => {
      const next = { ...prev, screen };
      // Don't persist transient legal screens to sessionStorage
      if (screen !== "privacy" && screen !== "tos") saveState(next);
      return next;
    });
  }, []);

  const setTargetMood = useCallback((mood: MoodState) => {
    setState((prev) => {
      const next = { ...prev, targetMood: mood };
      saveState(next);
      return next;
    });
  }, []);

  return {
    screen: state.screen,
    targetMood: state.targetMood,
    goTo,
    setTargetMood,
  };
}
