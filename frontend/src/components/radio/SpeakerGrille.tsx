interface SpeakerGrilleProps {
  bassIntensity?: number;
}

export default function SpeakerGrille({ bassIntensity = 0 }: SpeakerGrilleProps) {
  const wooferScale = 1 + bassIntensity * 0.08;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Tweeter */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "radial-gradient(circle, #2a2a2a, #111)",
          border: "2px solid #333",
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.4)",
        }}
      />
      {/* Woofer */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #1a1a1a 28%, transparent 30%), radial-gradient(circle, transparent 40%, rgba(40,40,40,0.3) 41%, transparent 42%), radial-gradient(circle, transparent 55%, rgba(40,40,40,0.3) 56%, transparent 57%), radial-gradient(circle, transparent 70%, rgba(40,40,40,0.3) 71%, transparent 72%), repeating-conic-gradient(#1e1e1e 0deg 4deg, #151515 4deg 8deg)",
          border: "3px solid #333",
          boxShadow:
            "inset 0 0 20px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
          transform: `scale(${wooferScale})`,
          transformOrigin: "center center",
          willChange: "transform",
          transition: "transform 0.05s ease-out",
        }}
      />
    </div>
  );
}
