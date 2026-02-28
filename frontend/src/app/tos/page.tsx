"use client";

import Link from "next/link";
import CRTMonitor from "@/components/crt/CRTMonitor";
import LegalScreen from "@/components/screens/LegalScreen";

export default function TosPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-2 md:p-8">
      <div className="flex flex-col items-center w-full max-w-[860px] px-1 md:px-0">
        <CRTMonitor>
          <LegalScreen type="tos" onBack={() => {}} hideBackButton />
        </CRTMonitor>
      </div>

      <div className="mt-3 flex gap-4 text-center items-center">
        <Link
          href="/"
          className="opacity-50 hover:opacity-100 transition-opacity"
          style={{ fontFamily: "var(--font-vt323)", fontSize: 13, color: "#ffb000", textDecoration: "none" }}
        >
          {"<"} RETURN HOME
        </Link>
        <span style={{ color: "#1a8a1a", fontSize: 13 }}>|</span>
        <Link
          href="/privacy"
          className="opacity-30 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-vt323)", fontSize: 13, color: "#33ff33", textDecoration: "none" }}
        >
          PRIVACY POLICY
        </Link>
      </div>
    </main>
  );
}
