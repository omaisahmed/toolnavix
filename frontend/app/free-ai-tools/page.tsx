'use client';

import ToolFeedPage from '../components/ToolFeedPage';
import { fetchFreeTools } from '../lib/api';

export default function FreeAiToolsPage() {
  return (
    <ToolFeedPage
      title="Free AI Tools"
      subtitle="Discover tools you can start using for free."
      fetcher={fetchFreeTools}
    />
  );
}

