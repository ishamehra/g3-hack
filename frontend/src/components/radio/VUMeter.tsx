"use client";

interface VUMeterProps {
  isPlaying: boolean;
}

export default function VUMeter({ isPlaying }: VUMeterProps) {
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 48 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            borderRadius: "1px 1px 0 0",
            background: "#33ff33",
            height: isPlaying ? undefined : 4,
            animation: isPlaying
              ? `vu-bounce 0.6s ease-in-out ${i * 0.08}s infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}
