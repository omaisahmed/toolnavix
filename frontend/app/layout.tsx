import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ToolNavix – AI Tools Directory',
  description: 'Discover and compare the latest AI tools. Smart search, trends, and admin dashboard.',
  openGraph: {
    title: 'ToolNavix – AI Tools Directory',
    description: 'Discover and compare the latest AI tools with AI-powered search.',
    url: 'https://your-frontend-url.vercel.app',
    siteName: 'ToolNavix',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
