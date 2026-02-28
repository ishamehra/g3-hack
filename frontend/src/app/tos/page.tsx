import { textGreen, textAmber, GREEN } from "@/lib/crt-styles";

export default function TermsOfService() {
    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl mb-6 font-bold" style={textAmber}>TERMS OF SERVICE</h1>

            <div className="space-y-6" style={textGreen}>
                <section>
                    <h2 className="text-xl mb-2" style={{ color: GREEN }}>1. ACCEPTANCE</h2>
                    <p>
                        By accessing the RESONANCE terminal ("The System"), you agree to these
                        terms. The System is provided "as is" for experimental and hackathon
                        purposes only.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl mb-2" style={{ color: GREEN }}>2. MEDICAL DISCLAIMER</h2>
                    <p>
                        RESONANCE IS NOT A MEDICAL DEVICE. The inferences made regarding emotional
                        states, stress levels, or physiological conditions are strictly for artistic
                        and musical generation purposes. Do not use this system for medical diagnosis
                        or treatment decisions.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl mb-2" style={{ color: GREEN }}>3. API USAGE</h2>
                    <p>
                        When authorizing Oura API access, you are granting The System permission
                        to poll your ring data. You may revoke this access at any time through
                        your Oura Cloud dashboard.
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
