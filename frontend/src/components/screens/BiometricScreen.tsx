"use client";

import { textGreen, textAmber, btnAmber, btnGreen, separator, GREEN } from "@/lib/crt-styles";

interface BiometricScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

function Meter({ value, max = 10 }: { value: number; max?: number }) {
  const filled = Math.round((value / max) * 8);
  return (
    <span style={{ color: GREEN }}>
      {"█".repeat(filled)}
      {"░".repeat(8 - filled)}
    </span>
  );
}

export default function BiometricScreen({
  onContinue,
  onBack,
}: BiometricScreenProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm mb-4" style={textAmber}>
        BIOMETRICS
      </h2>

      <div className="text-lg space-y-1 mb-4" style={textGreen}>
        <div>
          OURA RING STATUS: [<span style={{ color: GREEN }}>CONNECTED</span>]
        </div>
      </div>

      <div className="text-lg space-y-2 flex-1" style={textGreen}>
        <div className="flex justify-between items-center">
          <span>HR:</span>
          <span>072 BPM</span>
          <Meter value={7} />
        </div>
        <div className="flex justify-between items-center">
          <span>HRV:</span>
          <span>074 ms</span>
          <Meter value={7} />
        </div>
        <div className="flex justify-between items-center">
          <span>TEMP:</span>
          <span>+0.2 C</span>
          <Meter value={3} />
        </div>

        <div style={separator} />

        <div className="flex justify-between">
          <span>STRESS:</span>
          <span>NORMAL</span>
        </div>
        <div className="flex justify-between">
          <span>SLEEP:</span>
          <span>70/100</span>
        </div>
        <div className="flex justify-between">
          <span>READINESS:</span>
          <span>82/100</span>
        </div>
      </div>

      <div className="mt-auto pt-4 flex gap-3">
        <button onClick={onBack} style={btnGreen}>
          {"<"} BACK
        </button>
        <button onClick={onContinue} style={btnAmber}>
          CONTINUE {">>"}
        </button>
      </div>
    </div>
  );
}
