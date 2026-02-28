"use client";

import { useEffect, useRef } from "react";
import type { MoodState, AppScreen } from "@/types";

interface DemoAutoPilotOptions {
  active: boolean;
  sessionId: string | null;
  goTo: (screen: AppScreen) => void;
  setTargetMood: (mood: MoodState) => void;
}

const ENERGIZED_MOOD: MoodState = {
  valence: 0.3,
  arousal: 0.8,
  quadrant: "Q1",
  label: "Energized",
};

export function useDemoAutoPilot({
  active,
  sessionId,
  goTo,
  setTargetMood,
}: DemoAutoPilotOptions) {
  const didRun = useRef(false);

  useEffect(() => {
    if (!active || !sessionId || didRun.current) return;
    didRun.current = true;

    // At t=14s: flash to mood selector, auto-select "Energized"
    const moodSwitchTimer = setTimeout(() => {
      goTo("mood");

      setTimeout(() => {
        setTargetMood(ENERGIZED_MOOD);
        goTo("session");
      }, 1200); // Show mood selector for 1.2s so viewer sees it
    }, 14000);

    return () => clearTimeout(moodSwitchTimer);
  }, [active, sessionId, goTo, setTargetMood]);
}
