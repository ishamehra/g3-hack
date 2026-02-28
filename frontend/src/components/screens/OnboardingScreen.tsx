"use client";

import { useEffect, useState } from "react";
import { textGreen, textAmber, btnAmber, GREEN } from "@/lib/crt-styles";
import { config } from "@/lib/config";

interface OnboardingScreenProps {
  onContinue: () => void;
  ouraConnected: boolean;
}

export default function OnboardingScreen({
  onContinue,
  ouraConnected,
}: OnboardingScreenProps) {
  const BOOT_LINES = [
    "RESONANCE v1.0",
    "========================",
    "",
    "INITIALIZING SYSTEM...",
    "AUDIO ENGINE.......... OK",
    "LYRIA DECODER......... OK",
    "BIOMETRIC LINK........ STANDBY",
    ouraConnected
      ? "OURA RING............. CONNECTED"
      : "OURA RING............. SEARCHING",
    "SIGNAL NORMALIZER..... OK",
    "GEMINI INTERPRETER.... READY",
    "",
    "ALL SYSTEMS NOMINAL",
  ];

  const [visibleLines, setVisibleLines] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we just came back from successful OAuth — skip boot animation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("oura") === "success") {
      setShowPrompt(true);
      setVisibleLines(BOOT_LINES.length);
      window.history.replaceState({}, "", window.location.pathname);
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
  }, [visibleLines, BOOT_LINES.length]);

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
          const isOuraConnected =
            line.includes("OURA RING") && line.includes("CONNECTED");

          return (
            <div
              key={i}
              className={`text-lg ${isTitle ? "mb-1" : ""} ${isNominal ? "font-bold" : ""}`}
              style={
                isTitle || isSeparator
                  ? { ...textAmber, fontSize: isTitle ? 18 : 14 }
                  : isOuraConnected
                    ? { ...textGreen, color: GREEN }
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
        <div className="mt-auto pt-4 flex flex-col md:flex-row gap-2">
          {!ouraConnected && (
            <button onClick={handleOuraLogin} style={btnAmber} className="md:flex-1">
              {">"} CONNECT OURA RING
            </button>
          )}
          <button onClick={onContinue} style={btnAmber} className="md:flex-1">
            {">"} POWER ON
          </button>
        </div>
      )}
    </div>
  );
}
