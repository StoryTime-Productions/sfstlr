import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SFSTLR — Slimefun Recipe Calculator',
  description: 'Raw materials list and step-by-step recipe guide for Slimefun items',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
