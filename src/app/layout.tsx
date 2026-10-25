import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QuotaHub — API Key & Quota Monitoring Dashboard',
  description: 'Monitor TikHub, OpenAI, 2Captcha, and AI model credit balances, rate limits, and runway from a unified, privacy-first developer dashboard.',
  keywords: ['API monitor', 'quota tracker', 'TikHub', 'OpenAI', '2Captcha', 'developer dashboard', 'API keys']
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#07090e] text-slate-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
