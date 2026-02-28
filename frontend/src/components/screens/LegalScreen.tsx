"use client";

import { useEffect, useRef, useState } from "react";
import { textGreen, textAmber, GREEN, GREEN_DIM } from "@/lib/crt-styles";

interface LegalScreenProps {
  type: "privacy" | "tos";
  onBack: () => void;
}

interface Section {
  title: string;
  body: string;
  items?: string[];
}

const PRIVACY_SECTIONS: Section[] = [
  {
    title: "1. HACKATHON DISCLAIMER",
    body: "RESONANCE is a temporary hackathon prototype. This system is designed to read physiological state data and infer emotional states to dynamically generate music.",
  },
  {
    title: "2. BIOMETRIC DATA",
    body: "When you connect your Oura Ring, we request read-only access to:",
    items: [
      "Heart Rate & HRV",
      "Sleep Scores",
      "Readiness & Stress Indicators",
      "Daily Activity",
    ],
  },
  {
    title: "3. DATA STORAGE",
    body: "Biometric data is temporarily processed to generate musical parameters (BPM, scale, density). Session states may be temporarily stored in our database to allow the system to adapt over time, but will be purged periodically. We do not sell or monetize your health data.",
  },
];

const TOS_SECTIONS: Section[] = [
  {
    title: "1. ACCEPTANCE",
    body: 'By accessing the RESONANCE terminal ("The System"), you agree to these terms. The System is provided "as is" for experimental and hackathon purposes only.',
  },
  {
    title: "2. MEDICAL DISCLAIMER",
    body: "RESONANCE IS NOT A MEDICAL DEVICE. The inferences made regarding emotional states, stress levels, or physiological conditions are strictly for artistic and musical generation purposes. Do not use this system for medical diagnosis or treatment decisions.",
  },
  {
    title: "3. API USAGE",
    body: "When authorizing Oura API access, you are granting The System permission to poll your ring data. You may revoke this access at any time through your Oura Cloud dashboard.",
  },
];

export default function LegalScreen({ type, onBack }: LegalScreenProps) {
  const sections = type === "privacy" ? PRIVACY_SECTIONS : TOS_SECTIONS;
  const title = type === "privacy" ? "PRIVACY POLICY" : "TERMS OF SERVICE";

  // Flatten all text into lines for typewriter effect
  const allLines = buildLines(title, sections);
  const [visibleLines, setVisibleLines] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleLines < allLines.length) {
      const delay = visibleLines === 0 ? 300 : 25; // fast typing
      const timer = setTimeout(() => setVisibleLines((v) => v + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [visibleLines, allLines.length]);

  // Auto-scroll as lines appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const done = visibleLines >= allLines.length;

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {allLines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            style={
              line.type === "title"
                ? { ...textAmber, fontSize: 14, marginBottom: 12 }
                : line.type === "heading"
                  ? { ...textAmber, fontSize: 12, marginTop: 12, marginBottom: 4 }
                  : line.type === "item"
                    ? { ...textGreen, fontSize: 14, paddingLeft: 16 }
                    : line.type === "separator"
                      ? { borderTop: `1px solid ${GREEN_DIM}`, margin: "12px 0" }
                      : { ...textGreen, fontSize: 14, lineHeight: 1.5 }
            }
          >
            {line.text || "\u00A0"}
          </div>
        ))}
        {!done && (
          <span
            className="inline-block animate-pulse"
            style={{ width: 8, height: 14, background: GREEN }}
          />
        )}
      </div>

      {done && (
        <div className="pt-3" style={{ borderTop: `1px solid ${GREEN_DIM}` }}>
          <button
            onClick={onBack}
            style={{
              ...textAmber,
              fontSize: 10,
              fontFamily: "var(--font-press-start)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            {"<"} RETURN HOME
          </button>
        </div>
      )}
    </div>
  );
}

type LineEntry = { text: string; type: "title" | "heading" | "body" | "item" | "separator" };

function buildLines(title: string, sections: Section[]): LineEntry[] {
  const lines: LineEntry[] = [{ text: title, type: "title" }];

  for (const sec of sections) {
    lines.push({ text: sec.title, type: "heading" });
    // Split body into ~80-char wrapped lines for terminal feel
    for (const chunk of wrapText(sec.body, 60)) {
      lines.push({ text: chunk, type: "body" });
    }
    if (sec.items) {
      for (const item of sec.items) {
        lines.push({ text: `> ${item}`, type: "item" });
      }
    }
  }

  lines.push({ text: "", type: "separator" });
  lines.push({ text: "LAST UPDATED: SYSTEM INIT", type: "body" });
  return lines;
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxLen && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
