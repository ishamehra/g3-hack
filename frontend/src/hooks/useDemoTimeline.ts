"use client";

import { useEffect, useRef, useState } from "react";
import type { LyriaParamsRow } from "@/types";
import { DEMO_KEYFRAMES } from "@/lib/demo-timeline";

export function useDemoTimeline(active: boolean) {
  const [params, setParams] = useState<LyriaParamsRow | null>(null);
  const startTime = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setParams(null);
      return;
    }

    startTime.current = Date.now();
    let lastKeyframeIndex = -1;

    const tick = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;

      // Find the most recent keyframe that has been reached
      let currentIndex = 0;
      for (let i = DEMO_KEYFRAMES.length - 1; i >= 0; i--) {
        if (elapsed >= DEMO_KEYFRAMES[i].t) {
          currentIndex = i;
          break;
        }
      }

      // Only update state when we cross a keyframe boundary
      if (currentIndex !== lastKeyframeIndex) {
        lastKeyframeIndex = currentIndex;
        setParams({
          ...DEMO_KEYFRAMES[currentIndex].data,
          updated_at: new Date().toISOString(),
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return params;
}
