import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ignite AI Playground',
  description:
    'Multi-model streaming AI developer playground with real-time metrics, parameter controls, and reproducible API code.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
