"use client";

interface CDDriveProps {
  isPlaying: boolean;
}

export default function CDDrive({ isPlaying }: CDDriveProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* CD Slot */}
      <div
        style={{
          width: 140,
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(to bottom, #000, #1a1a1a, #000)",
          boxShadow: "inset 0 0 4px rgba(0,0,0,0.8)",
        }}
      />
      {/* Disc */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, #1a1a1a, #2a2a2a, #1a1a1a, #333, #1a1a1a, #2a2a2a, #1a1a1a, #333)",
          boxShadow: "0 0 0 2px #333, inset 0 0 20px rgba(0,0,0,0.5)",
          position: "relative",
          animation: isPlaying ? "spin 2s linear infinite" : "none",
        }}
      >
        {/* Center label */}
        <div
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, #3a2a10, #8a6000)",
            border: "2px solid #555",
          }}
        />
      </div>
    </div>
  );
}
