'use client';

import ToolFeedPage from '../components/ToolFeedPage';
import { fetchFeaturedTools } from '../lib/api';

export default function FeaturedAiToolsPage() {
  return (
    <ToolFeedPage
      title="Featured AI Tools"
      subtitle="Hand-picked tools marked as featured by admin."
      fetcher={fetchFeaturedTools}
    />
  );
}

