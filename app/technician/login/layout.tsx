import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Technician Login - OSCaller',
    robots: 'noindex, nofollow',
}

export default function TechnicianLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
