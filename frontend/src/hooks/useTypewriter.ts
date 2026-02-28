"use client";

import { useState, useEffect, useRef } from "react";

const CHAR_DELAY = 30; // ms per character
const FADE_DURATION = 200; // ms for old text fade

export function useTypewriter(text: string | undefined | null) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const prevTextRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const incoming = text ?? "";

    // Same text — nothing to do
    if (incoming === prevTextRef.current) return;

    // Clear any running animation
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    prevTextRef.current = incoming;

    if (!incoming) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }

    // Brief pause before typing new text (fade gap)
    indexRef.current = 0;
    setDisplayText("");
    setIsTyping(true);

    const startTyping = () => {
      const tick = () => {
        indexRef.current += 1;
        const i = indexRef.current;
        setDisplayText(incoming.slice(0, i));

        if (i < incoming.length) {
          timerRef.current = setTimeout(tick, CHAR_DELAY);
        } else {
          setIsTyping(false);
          timerRef.current = null;
        }
      };
      timerRef.current = setTimeout(tick, CHAR_DELAY);
    };

    // Small delay so old text disappears before new one types in
    timerRef.current = setTimeout(startTyping, FADE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  return { displayText, isTyping };
}
