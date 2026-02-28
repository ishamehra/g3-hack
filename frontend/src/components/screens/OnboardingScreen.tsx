"use client";

import { useEffect, useState } from "react";
import { textGreen, textAmber, btnAmber, GREEN } from "@/lib/crt-styles";
import { config } from "@/lib/config";

interface OnboardingScreenProps {
  onContinue: () => void;
}

const BOOT_LINES = [
  "RESONANCE v1.0",
  "========================",
  "",
  "INITIALIZING SYSTEM...",
  "AUDIO ENGINE.......... OK",
  "LYRIA DECODER......... OK",
  "BIOMETRIC LINK........ STANDBY",
  "OURA RING............. SEARCHING",
  "SIGNAL NORMALIZER..... OK",
  "GEMINI INTERPRETER.... READY",
  "",
  "ALL SYSTEMS NOMINAL",
];

export default function OnboardingScreen({
  onContinue,
}: OnboardingScreenProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we just came back from successful OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("oura") === "success") {
      setShowPrompt(true);
      setVisibleLines(BOOT_LINES.length);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (visibleLines < BOOT_LINES.length) {
      const timer = setTimeout(
        () => setVisibleLines((v) => v + 1),
        visibleLines === 0 ? 400 : 150
      );
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowPrompt(true), 300);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  const handleOuraLogin = () => {
    window.location.href = `${config.apiUrl}/api/auth/oura`;
  };

  return (
    <div className="flex flex-col h-full">
      <div>
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => {
          const isTitle = i === 0;
          const isSeparator = line.startsWith("=");
          const isNominal = line === "ALL SYSTEMS NOMINAL";

          return (
            <div
              key={i}
              className={`text-base ${isTitle ? "mb-1" : ""} ${isNominal ? "font-bold" : ""}`}
              style={
                isTitle || isSeparator
                  ? { ...textAmber, fontSize: isTitle ? 16 : 13 }
                  : textGreen
              }
            >
              {line || "\u00A0"}
            </div>
          );
        })}
        {visibleLines < BOOT_LINES.length && (
          <span
            className="inline-block animate-pulse"
            style={{
              width: 10,
              height: 18,
              background: GREEN,
              verticalAlign: "text-bottom",
            }}
          />
        )}
      </div>

      {showPrompt && (
        <div className="mt-auto pt-2 flex flex-col md:flex-row gap-2">
          <button onClick={handleOuraLogin} style={btnAmber} className="md:flex-1">
            {">"} CONNECT OURA RING
          </button>
          <button
            onClick={onContinue}
            style={btnAmber}
            className="md:flex-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            {">"} CONTINUE
          </button>
        </div>
      )}
    </div>
  );
}
