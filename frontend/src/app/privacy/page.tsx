import { textGreen, textAmber, GREEN } from "@/lib/crt-styles";

export default function PrivacyPolicy() {
    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl mb-6 font-bold" style={textAmber}>PRIVACY POLICY</h1>

            <div className="space-y-6" style={textGreen}>
                <section>
                    <h2 className="text-xl mb-2" style={{ color: GREEN }}>1. HACKATHON DISCLAIMER</h2>
                    <p>
                        RESONANCE is a temporary hackathon prototype. This system is designed
                        to read physiological state data and infer emotional states to dynamically
                        generate music.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl mb-2" style={{ color: GREEN }}>2. BIOMETRIC DATA</h2>
                    <p>
                        When you connect your Oura Ring, we request read-only access to:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Heart Rate & HRV</li>
                        <li>Sleep Scores</li>
                        <li>Readiness & Stress Indicators</li>
                        <li>Daily Activity</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl mb-2" style={{ color: GREEN }}>3. DATA STORAGE</h2>
                    <p>
                        Biometric data is temporarily processed to generate musical parameters (BPM,
                        scale, density). Session states may be temporarily stored in our database
                        to allow the system to adapt over time, but will be purged periodically.
                        We do not sell or monetize your health data.
                    </p>
                </section>

                <div className="mt-8 pt-4 border-t" style={{ borderColor: textGreen.color }}>
                    <p className="text-sm opacity-75">LAST UPDATED: SYSTEM INIT</p>
                    <a href="/" className="inline-block mt-4 hover:underline" style={textAmber}>
                        {"<"} RETURN TO TERMINAL
                    </a>
                </div>
            </div>
        </div>
    );
}
