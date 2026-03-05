export const metadata = {
    title: 'Privacy Policy | OSCaller',
    description: 'Privacy Policy for the OSCaller platform.',
}

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h1 className="text-4xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
            <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
                <p className="text-muted-foreground mb-8 font-medium">Last updated: March 2026</p>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">1. Information We Collect</h2>
                    <p className="leading-relaxed">
                        When you use OSCaller, we collect information that you provide to us directly, such as your name,
                        phone number, email address, physical address, and service request details.
                        We also collect location data to provide our GPS mapping features.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">2. How We Use Your Information</h2>
                    <p className="leading-relaxed">
                        We use the collected information to route your service requests to the appropriate verified providers,
                        facilitate communication between you and the provider, process payments, and improve our platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">3. Data Sharing and Disclosure</h2>
                    <p className="leading-relaxed">
                        We share your necessary service details (such as address and problem description) with matched providers
                        to fulfill your request. We do not sell your personal data to third parties under any circumstances.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">4. Security</h2>
                    <p className="leading-relaxed">
                        We implement industry-standard security measures to protect your personal information, though no method
                        of transmission over the Internet is 100% secure. We utilize secure OTP verification and encrypted data transport.
                    </p>
                </section>
            </div>
        </div>
    )
}
