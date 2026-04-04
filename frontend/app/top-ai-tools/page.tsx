'use client';

import ToolFeedPage from '../components/ToolFeedPage';
import { fetchTopTools } from '../lib/api';

export default function TopAiToolsPage() {
  return (
    <ToolFeedPage
      title="Top AI Tools"
      subtitle="Ranked by top flags, rating, and engagement."
      fetcher={fetchTopTools}
    />
  );
}

