import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Team Launchpad Portal',
  description: 'Verified Participation Credentials for Community Hub Events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-xl font-bold font-display text-blue-600 hover:opacity-90">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Team Launchpad Portal
            </a>
            <div className="flex items-center gap-4">
              <a href="/verify" className="text-sm font-medium text-slate-600 hover:text-slate-900">Claim Code</a>
              <a href="/verify-certificate" className="text-sm font-medium text-slate-600 hover:text-slate-900">Verify Certificate</a>
              <a href="/admin/login" className="text-sm font-medium text-blue-600 hover:underline">Coordinator Login</a>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4">
            Built for Community Hub Portal
          </div>
        </footer>
      </body>
    </html>
  );
}
