import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitScore - Git Practice Analyzer',
  description: 'Analyze GitHub repositories to evaluate Git commit practices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
