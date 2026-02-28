"use client";

interface ToggleSwitch {
  label: string;
  on: boolean;
  onToggle: () => void;
}

interface ToggleSwitchPanelProps {
  switches: ToggleSwitch[];
}

export default function ToggleSwitchPanel({ switches }: ToggleSwitchPanelProps) {
  return (
    <div
      className="flex items-start gap-5"
      style={{
        padding: "10px 16px",
        background: "linear-gradient(180deg, #1a1a1a, #111, #0a0a0a)",
        borderRadius: 10,
        border: "1px solid #222",
        boxShadow:
          "inset 0 1px 2px rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.5)",
      }}
    >
      {switches.map(({ label, on, onToggle }) => (
        <div key={label} className="flex flex-col items-center gap-1">
          {/* Label above */}
          <span
            style={{
              fontFamily: "var(--font-press-start)",
              fontSize: 6,
              color: on ? "#ffb000" : "#444",
              letterSpacing: 1,
              textShadow: on ? "0 0 6px rgba(255,176,0,0.4)" : "none",
              transition: "color 0.2s, text-shadow 0.2s",
            }}
          >
            {label}
          </span>

          {/* Toggle housing */}
          <button
            onClick={onToggle}
            style={{
              width: 28,
              height: 44,
              borderRadius: 6,
              background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
              border: "2px solid #333",
              boxShadow:
                "inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 1px rgba(255,255,255,0.05)",
              position: "relative",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {/* Switch lever */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: `translateX(-50%) translateY(${on ? "-2px" : "14px"})`,
                width: 18,
                height: 22,
                borderRadius: 4,
                background: on
                  ? "linear-gradient(180deg, #c0a060, #8a6a30, #6a4a20)"
                  : "linear-gradient(180deg, #555, #3a3a3a, #2a2a2a)",
                border: `1px solid ${on ? "#9a7a40" : "#444"}`,
                boxShadow: on
                  ? "0 -2px 6px rgba(255,176,0,0.2), inset 0 1px 1px rgba(255,255,255,0.2)"
                  : "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)",
                transition: "transform 0.15s ease, background 0.2s, box-shadow 0.2s",
                top: 3,
              }}
            >
              {/* Grip lines */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 1,
                      background: on
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Indicator LED */}
            <div
              style={{
                position: "absolute",
                bottom: -8,
                left: "50%",
                transform: "translateX(-50%)",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: on ? "#ffb000" : "#1a1200",
                boxShadow: on
                  ? "0 0 6px rgba(255,176,0,0.6), 0 0 12px rgba(255,176,0,0.3)"
                  : "none",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            />
          </button>

          {/* ON/OFF label */}
          <span
            style={{
              fontFamily: "var(--font-press-start)",
              fontSize: 5,
              color: "#333",
              marginTop: 4,
            }}
          >
            {on ? "ON" : "OFF"}
          </span>
        </div>
      ))}
    </div>
  );
}
