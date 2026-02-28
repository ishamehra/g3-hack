"use client";

import { useCallback, useRef } from "react";

interface VolumeKnobProps {
  volume: number; // 0-1
  onChange: (volume: number) => void;
}

export default function VolumeKnob({ volume, onChange }: VolumeKnobProps) {
  const rotation = volume * 270 - 135;
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startRotation = useRef(0);

  const applyDelta = useCallback(
    (clientY: number) => {
      if (!isDragging.current) return;
      const delta = startY.current - clientY;
      const newRotation = Math.max(
        -135,
        Math.min(135, startRotation.current + delta * 1.5)
      );
      onChange((newRotation + 135) / 270);
    },
    [onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startY.current = e.clientY;
      startRotation.current = rotation;

      const handleMouseMove = (e: MouseEvent) => applyDelta(e.clientY);
      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [rotation, applyDelta]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
      startRotation.current = rotation;

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        applyDelta(e.touches[0].clientY);
      };
      const handleTouchEnd = () => {
        isDragging.current = false;
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };

      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    },
    [rotation, applyDelta]
  );

  return (
    <div className="flex flex-col items-center gap-[6px]">
      <div
        className="cursor-grab active:cursor-grabbing select-none"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #444, #1a1a1a)",
          border: "2px solid #333",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)",
          position: "relative",
          transform: `rotate(${rotation}deg)`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Indicator tick */}
        <div
          style={{
            position: "absolute",
            width: 3,
            height: 10,
            background: "white",
            borderRadius: 2,
            top: 5,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <span
        className="text-[8px] tracking-[2px]"
        style={{
          fontFamily: "var(--font-press-start)",
          color: "#666",
        }}
      >
        VOL {String(Math.round(volume * 100)).padStart(3, "0")}
      </span>
    </div>
  );
}
