"use client";

import type { BiometricData } from "@/types";
import { textGreen, textAmber, GREEN, GREEN_DIM, separator } from "@/lib/crt-styles";

interface BiometricOverlayProps {
  biometrics: BiometricData | null | undefined;
}

function Meter({ value, max }: { value: number; max: number }) {
  const filled = Math.round((value / max) * 8);
  return (
    <span style={{ color: GREEN, fontSize: 14 }}>
      {"█".repeat(Math.min(8, filled))}
      {"░".repeat(8 - Math.min(8, filled))}
    </span>
  );
}

function Row({ label, value, unit, meter }: {
  label: string;
  value: string | number | null;
  unit?: string;
  meter?: { value: number; max: number };
}) {
  return (
    <div className="flex items-center gap-2" style={{ minHeight: 20 }}>
      <span style={{ width: 100, flexShrink: 0, color: GREEN_DIM, fontFamily: "var(--font-vt323)", fontSize: 16 }}>
        {label}
      </span>
      <span style={{ ...textGreen, fontSize: 18, flex: 1 }}>
        {value != null ? `${value}${unit ?? ""}` : "---"}
      </span>
      {meter && value != null && <Meter value={meter.value} max={meter.max} />}
    </div>
  );
}

export default function BiometricOverlay({ biometrics }: BiometricOverlayProps) {
  const b = biometrics;

  return (
    <div
      className="w-full h-full p-4 md:p-6 overflow-y-auto"
      style={{ background: "#0a0a0a" }}
    >
      <h2 className="text-sm mb-3" style={textAmber}>
        BIOMETRICS
      </h2>

      {!b ? (
        <div style={{ ...textGreen, fontSize: 18, opacity: 0.5 }}>
          NO BIOMETRIC DATA
          <br />
          START A SESSION TO RECEIVE DATA
        </div>
      ) : (
        <div className="space-y-1">
          {/* Vitals */}
          <div className="text-xs mb-1" style={{ color: GREEN_DIM, fontFamily: "var(--font-press-start)", fontSize: 8 }}>
            VITALS
          </div>
          <Row label="HR" value={b.hr} unit=" BPM" meter={b.hr != null ? { value: b.hr, max: 180 } : undefined} />
          <Row label="HRV" value={b.hrv} unit=" ms" meter={b.hrv != null ? { value: b.hrv, max: 150 } : undefined} />
          <Row label="HR LOW" value={b.hr_lowest} unit=" BPM" />
          <Row label="SpO2" value={b.spo2_avg} unit="%" />
          <Row label="TEMP Δ" value={b.temp_delta != null ? (b.temp_delta >= 0 ? `+${b.temp_delta}` : `${b.temp_delta}`) : null} unit="°C" />
          <Row label="STRESS" value={b.stress_pct != null ? `${Math.round(b.stress_pct)}%` : null} meter={b.stress_pct != null ? { value: b.stress_pct, max: 100 } : undefined} />

          <div style={separator} />

          {/* Sleep */}
          <div className="text-xs mb-1" style={{ color: GREEN_DIM, fontFamily: "var(--font-press-start)", fontSize: 8 }}>
            SLEEP
          </div>
          <Row label="SCORE" value={b.sleep_score} unit="/100" meter={b.sleep_score != null ? { value: b.sleep_score, max: 100 } : undefined} />
          <Row label="DEEP" value={b.deep_sleep_min} unit=" min" />
          <Row label="REM" value={b.rem_sleep_min} unit=" min" />
          <Row label="EFFICIENCY" value={b.sleep_efficiency} unit="%" />

          <div style={separator} />

          {/* Readiness & Activity */}
          <div className="text-xs mb-1" style={{ color: GREEN_DIM, fontFamily: "var(--font-press-start)", fontSize: 8 }}>
            READINESS
          </div>
          <Row label="SCORE" value={b.readiness_score} unit="/100" meter={b.readiness_score != null ? { value: b.readiness_score, max: 100 } : undefined} />
          <Row label="RESILIENCE" value={b.resilience_level} />
          <Row label="STEPS" value={b.steps} />
          <Row label="ACTIVE CAL" value={b.active_calories} unit=" kcal" />
        </div>
      )}
    </div>
  );
}
