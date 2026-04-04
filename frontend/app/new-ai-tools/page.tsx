'use client';

import ToolFeedPage from '../components/ToolFeedPage';
import { fetchNewTools } from '../lib/api';

export default function NewAiToolsPage() {
  return (
    <ToolFeedPage
      title="New AI Tools"
      subtitle="Latest tool launches and recently added products."
      fetcher={fetchNewTools}
    />
  );
}

