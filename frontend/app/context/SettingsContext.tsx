'use client';

import { createContext, useContext, ReactNode } from 'react';

type Settings = {
  logo_url?: string;
  favicon_url?: string;
  footer_text?: string;
  hero_badge?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_search_placeholder?: string;
  hero_search_button_text?: string;
  hero_tag_1?: string;
  hero_tag_2?: string;
  hero_tag_3?: string;
};

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children, settings }: { children: ReactNode; settings: Settings }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) {
    return {};
  }
  return settings;
}
