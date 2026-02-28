"use client";

import type { LyriaParamsRow } from "@/types";
import {
  textGreen,
  textAmber,
  textDim,
  btnAmber,
  btnGreen,
  separator,
  GREEN,
} from "@/lib/crt-styles";

interface BiometricScreenProps {
  onContinue: () => void;
  onBack: () => void;
  lyriaParams?: LyriaParamsRow | null;
  ouraConnected?: boolean;
}

function Meter({ value, max = 10 }: { value: number; max?: number }) {
  const clamped = Math.max(0, Math.min(max, value));
  const filled = Math.round((clamped / max) * 8);
  return (
    <span style={{ color: GREEN }}>
      {"█".repeat(filled)}
      {"░".repeat(8 - filled)}
    </span>
  );
}

function scaleMeter(val: number | null | undefined, min: number, max: number): number {
  if (val == null) return 0;
  return Math.round(((val - min) / (max - min)) * 10);
}

function fmt(val: number | null | undefined, pad = 3): string {
  if (val == null) return "---";
  return String(Math.round(val)).padStart(pad, "0");
}

function fmtScore(val: number | null | undefined): string {
  if (val == null) return "---";
  return `${Math.round(val)}/100`;
}

function fmtTemp(val: number | null | undefined): string {
  if (val == null) return "---";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)} C`;
}

function fmtStress(val: number | null | undefined): string {
  if (val == null) return "---";
  if (val < 25) return "LOW";
  if (val < 50) return "NORMAL";
  if (val < 75) return "ELEVATED";
  return "HIGH";
}

export default function BiometricScreen({
  onContinue,
  onBack,
  lyriaParams,
  ouraConnected = false,
}: BiometricScreenProps) {
  const bio = lyriaParams?.biometrics;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm mb-4" style={textAmber}>
        BIOMETRICS
      </h2>

      <div className="text-lg space-y-1 mb-4" style={textGreen}>
        <div>
          OURA RING STATUS: [
          {ouraConnected ? (
            <span style={{ color: GREEN }}>CONNECTED</span>
          ) : (
            <span style={{ color: "#ff4444" }}>NOT CONNECTED</span>
          )}
          ]
        </div>
        {!ouraConnected && (
          <div className="text-xs" style={textDim}>
            BROWSER SIGNALS ACTIVE
          </div>
        )}
      </div>

      <div className="text-lg space-y-2 flex-1" style={textGreen}>
        <div className="flex justify-between items-center">
          <span>HR:</span>
          <span>{fmt(bio?.hr)} BPM</span>
          <Meter value={scaleMeter(bio?.hr, 40, 120)} />
        </div>
        <div className="flex justify-between items-center">
          <span>HRV:</span>
          <span>{fmt(bio?.hrv)} ms</span>
          <Meter value={scaleMeter(bio?.hrv, 10, 120)} />
        </div>
        <div className="flex justify-between items-center">
          <span>TEMP:</span>
          <span>{fmtTemp(bio?.temp_delta)}</span>
          <Meter value={scaleMeter(bio?.temp_delta, -1, 1)} />
        </div>

        <div style={separator} />

        <div className="flex justify-between">
          <span>STRESS:</span>
          <span>{fmtStress(bio?.stress_pct)}</span>
        </div>
        <div className="flex justify-between">
          <span>SLEEP:</span>
          <span>{fmtScore(bio?.sleep_score)}</span>
        </div>
        <div className="flex justify-between">
          <span>READINESS:</span>
          <span>{fmtScore(bio?.readiness_score)}</span>
        </div>
        <div className="flex justify-between">
          <span>STEPS:</span>
          <span>{bio?.steps != null ? bio.steps.toLocaleString() : "---"}</span>
        </div>
        <div className="flex justify-between">
          <span>SpO2:</span>
          <span>
            {bio?.spo2_avg != null ? `${Math.round(bio.spo2_avg)}%` : "---"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>RESILIENCE:</span>
          <span>{bio?.resilience_level?.toUpperCase() ?? "---"}</span>
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
