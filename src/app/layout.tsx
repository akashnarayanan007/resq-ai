import type { Metadata } from 'next';
import './globals.css';
import DemoDisclaimerBanner from '@/components/common/DemoDisclaimerBanner';

export const metadata: Metadata = {
  title: 'RESQ.AI — Disaster Incident Coordination Platform',
  description:
    'AI-assisted emergency response & disaster incident coordination platform for multi-agency disaster operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070C18] text-slate-100 antialiased selection:bg-red-500/30 selection:text-white">
        <DemoDisclaimerBanner />
        {children}
      </body>
    </html>
  );
}
