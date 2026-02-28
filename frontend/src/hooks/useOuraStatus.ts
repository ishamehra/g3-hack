"use client";

import { useState, useEffect } from "react";
import { config } from "@/lib/config";

const STORAGE_KEY = "resonance_oura_connected";

export function useOuraStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore from sessionStorage immediately
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === "true") setIsConnected(true);
    } catch {}

    const checkStatus = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/auth/oura/status`);
        const data = await res.json();
        setIsConnected(data.connected);
        try {
          sessionStorage.setItem(STORAGE_KEY, String(data.connected));
        } catch {}
      } catch {
        // Backend unreachable — keep whatever we had
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Re-check after OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("oura") === "success") {
      // Small delay to let backend process the token
      setTimeout(checkStatus, 500);
    }
  }, []);

  return { isConnected, isLoading };
}
