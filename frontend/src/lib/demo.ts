"use client";

let _isDemoMode: boolean | null = null;

export function isDemoMode(): boolean {
  if (_isDemoMode !== null) return _isDemoMode;
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  _isDemoMode = params.get("demo") === "true";
  return _isDemoMode;
}
