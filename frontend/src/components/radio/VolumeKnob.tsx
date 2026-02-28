"use client";

import { useCallback, useRef, useState } from "react";

interface VolumeKnobProps {
  onChange: (volume: number) => void;
  initialVolume?: number;
}

export default function VolumeKnob({
  onChange,
  initialVolume = 0.7,
}: VolumeKnobProps) {
  const [rotation, setRotation] = useState(initialVolume * 270 - 135);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startRotation = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startY.current = e.clientY;
      startRotation.current = rotation;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = startY.current - e.clientY;
        const newRotation = Math.max(
          -135,
          Math.min(135, startRotation.current + delta * 1.5)
        );
        setRotation(newRotation);
        const volume = (newRotation + 135) / 270;
        onChange(volume);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [rotation, onChange]
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
        VOL
      </span>
    </div>
  );
}
