"use client";

import type { MoodState } from "@/types";
import { Zap, Sun, Target, Leaf } from "lucide-react";
import { textAmber, textGreen, textDim, btnGreen } from "@/lib/crt-styles";

interface MoodSelectorScreenProps {
  onMoodSelect: (mood: MoodState) => void;
  onBack: () => void;
}

const MOODS: {
  mood: MoodState;
  label: string;
  color: string;
  glowColor: string;
  Icon: typeof Zap;
}[] = [
  {
    mood: { valence: 0.3, arousal: 0.8, quadrant: "Q1", label: "Energized" },
    label: "ENERGIZED",
    color: "#ff4444",
    glowColor: "rgba(255,68,68,0.4)",
    Icon: Zap,
  },
  {
    mood: { valence: 0.8, arousal: 0.8, quadrant: "Q2", label: "Happy" },
    label: "HAPPY",
    color: "#ffb000",
    glowColor: "rgba(255,176,0,0.4)",
    Icon: Sun,
  },
  {
    mood: { valence: 0.3, arousal: 0.3, quadrant: "Q3", label: "Focus" },
    label: "FOCUS",
    color: "#4488ff",
    glowColor: "rgba(68,136,255,0.4)",
    Icon: Target,
  },
  {
    mood: { valence: 0.8, arousal: 0.3, quadrant: "Q4", label: "Calm" },
    label: "CALM",
    color: "#33ff33",
    glowColor: "rgba(51,255,51,0.4)",
    Icon: Leaf,
  },
];

export default function MoodSelectorScreen({
  onMoodSelect,
  onBack,
}: MoodSelectorScreenProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm mb-2" style={textAmber}>
        SELECT TARGET
      </h2>
      <p className="text-lg mb-4" style={textGreen}>
        Choose how you want to feel.
      </p>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {MOODS.map(({ mood, label, color, glowColor, Icon }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-2 cursor-pointer"
            style={{
              fontFamily: "var(--font-press-start)",
              fontSize: 9,
              padding: 16,
              border: `1px solid ${color}40`,
              background: "transparent",
              color,
              textShadow: `0 0 6px ${glowColor}`,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.boxShadow = `0 0 16px ${glowColor}, inset 0 0 16px ${glowColor}20`;
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${color}40`;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "transparent";
            }}
            onClick={() => onMoodSelect(mood)}
          >
            <Icon size={24} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button onClick={onBack} style={btnGreen}>
          {"<"} BACK
        </button>
        <span className="text-base" style={textDim}>
          VALENCE {"<->"} AROUSAL
        </span>
      </div>
    </div>
  );
}
