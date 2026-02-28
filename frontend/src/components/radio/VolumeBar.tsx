"use client";

import { useCallback, useRef } from "react";

interface VolumeBarProps {
  volume: number; // 0-1
  onChange?: (volume: number) => void;
}

const TOTAL_BLOCKS = 10;

export default function VolumeBar({ volume, onChange }: VolumeBarProps) {
  const filled = Math.round(volume * TOTAL_BLOCKS);
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onChange || !barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      onChange(Math.max(0, Math.min(1, x / rect.width)));
    },
    [onChange]
  );

  return (
    <div
      ref={barRef}
      className="flex items-center gap-[3px] w-full cursor-pointer"
      style={{ fontFamily: "var(--font-vt323)" }}
      onClick={handleClick}
    >
      {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 1,
            background: i < filled ? "#ffb000" : "#2a2200",
            boxShadow: i < filled ? "0 0 4px rgba(255,176,0,0.4)" : "none",
            transition: "background 0.1s, box-shadow 0.1s",
          }}
        />
      ))}
    </div>
  );
}
