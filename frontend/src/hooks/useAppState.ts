"use client";

import { useCallback, useState } from "react";
import type { AppScreen, MoodState } from "@/types";

interface AppState {
  screen: AppScreen;
  targetMood: MoodState | null;
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    screen: "onboarding",
    targetMood: null,
  });

  const goTo = useCallback((screen: AppScreen) => {
    setState((prev) => ({ ...prev, screen }));
  }, []);

  const setTargetMood = useCallback((mood: MoodState) => {
    setState((prev) => ({ ...prev, targetMood: mood }));
  }, []);

  return {
    screen: state.screen,
    targetMood: state.targetMood,
    goTo,
    setTargetMood,
  };
}
