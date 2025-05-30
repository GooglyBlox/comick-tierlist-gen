import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Comick.io Tier List Generator',
  description: 'Create tier lists from your Comick.io reading list',
  authors: [{ name: 'GooglyBlox' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}