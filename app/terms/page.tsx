export const metadata = {
    title: 'Terms of Service | OSCaller',
    description: 'Terms of Service for the OSCaller platform.',
}

export default function TermsPage() {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h1 className="text-4xl font-extrabold tracking-tight mb-8">Terms of Service</h1>
            <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
                <p className="text-muted-foreground mb-8 font-medium">Last updated: March 2026</p>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">1. Acceptance of Terms</h2>
                    <p className="leading-relaxed">
                        By accessing or using the OSCaller platform, you agree to be bound by these Terms of Service.
                        If you do not agree to all of the terms, you may not use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">2. Description of Service</h2>
                    <p className="leading-relaxed">
                        OSCaller provides a platform that connects users seeking home services (Clients) with independent
                        contractors offering those services (Providers). OSCaller is a technology platform and does not
                        directly provide home or repair services itself.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">3. User Responsibilities</h2>
                    <p className="leading-relaxed">
                        You agree to provide accurate, current, and complete information when submitting service requests
                        or registering as a Provider. You are responsible for maintaining the confidentiality of your
                        account and communications.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-slate-900">4. Limitation of Liability</h2>
                    <p className="leading-relaxed">
                        OSCaller shall not be liable for any indirect, incidental, special, consequential or punitive damages
                        resulting from your use of the service or any interactions with Providers or Clients found through the platform.
                    </p>
                </section>
            </div>
        </div>
    )
}
