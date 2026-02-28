"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Resonance</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Your body already knows how you feel. Choose how you want to feel.
        </p>
      </div>

      <Link
        href="/session"
        className="rounded-full bg-primary px-8 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
      >
        Start Session
      </Link>
    </main>
  );
}
