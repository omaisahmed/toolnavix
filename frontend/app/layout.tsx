import type { Metadata } from 'next';
import './globals.css';
import { SettingsProvider } from './context/SettingsContext';

type PublicSettings = {
  favicon_url?: string;
  logo_url?: string;
  footer_text?: string;
  hero_badge?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_search_placeholder?: string;
  hero_search_button_text?: string;
};

async function getPublicSettings(): Promise<PublicSettings | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${apiBase}/api/settings`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const faviconUrl = settings?.favicon_url;

  return {
    title: 'ToolNavix - AI Tools Directory',
    description: 'Discover and compare the latest AI tools. Smart search, trends, and admin dashboard.',
    icons: faviconUrl
      ? {
          icon: faviconUrl,
          shortcut: faviconUrl,
          apple: faviconUrl,
        }
      : undefined,
    openGraph: {
      title: 'ToolNavix - AI Tools Directory',
      description: 'Discover and compare the latest AI tools with AI-powered search.',
      url: 'https://your-frontend-url.vercel.app',
      siteName: 'ToolNavix',
      type: 'website',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body>
        <SettingsProvider settings={settings || {}}>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
