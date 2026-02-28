"use client";

import { config } from "@/lib/config";
import { textGreen, textAmber, textDim, btnAmber, btnGreen, separator, GREEN } from "@/lib/crt-styles";

interface OuraAuthScreenProps {
  onBack: () => void;
}

export default function OuraAuthScreen({ onBack }: OuraAuthScreenProps) {
  const handleConnect = () => {
    window.location.href = `${config.apiUrl}/api/auth/oura`;
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm mb-3" style={textAmber}>
        OURA RING
      </h2>

      <div className="text-lg space-y-2 mb-3" style={textGreen}>
        <div>BIOMETRIC LINK</div>
        <div style={separator} />
        <div className="text-base" style={textDim}>
          CONNECT YOUR OURA RING TO ENABLE REAL-TIME BIOMETRIC FEEDBACK.
        </div>
        <div className="text-base space-y-1 mt-2" style={textDim}>
          <div>{">"} HEART RATE MONITORING</div>
          <div>{">"} HRV TRACKING</div>
          <div>{">"} SLEEP QUALITY DATA</div>
          <div>{">"} STRESS DETECTION</div>
          <div>{">"} READINESS SCORING</div>
        </div>
      </div>

      <div className="text-xs mb-3 leading-relaxed" style={{ ...textDim, fontFamily: "var(--font-vt323)" }}>
        MUSIC WILL ADAPT IN REAL-TIME BASED ON YOUR PHYSIOLOGICAL STATE.
      </div>

      <div style={separator} />

      <div
        className="text-base my-3 animate-pulse"
        style={{ color: GREEN, fontFamily: "var(--font-vt323)" }}
      >
        ● AWAITING AUTHORIZATION
      </div>

      <div className="mt-auto flex gap-3">
        <button onClick={handleConnect} style={btnAmber}>
          {">"} AUTHORIZE OURA
        </button>
        <button onClick={onBack} style={{ ...btnGreen, fontSize: 8 }}>
          {"<"} BACK
        </button>
      </div>
    </div>
  );
}
