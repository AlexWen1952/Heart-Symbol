import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import TopicPage from '@/pages/TopicPage';
import ConcernPage from '@/pages/ConcernPage';
import EmotionPage from '@/pages/EmotionPage';
import RitualPage from '@/pages/RitualPage';
import DrawPage from '@/pages/DrawPage';
import ReadingPage from '@/pages/ReadingPage';
import HistoryPage from '@/pages/HistoryPage';
import HistoryDetailPage from '@/pages/HistoryDetailPage';
import CollectionPage from '@/pages/CollectionPage';
import InsightsPage from '@/pages/InsightsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/topic" element={<TopicPage />} />
      <Route path="/concern" element={<ConcernPage />} />
      <Route path="/emotion" element={<EmotionPage />} />
      <Route path="/ritual" element={<RitualPage />} />
      <Route path="/draw" element={<DrawPage />} />
      <Route path="/reading" element={<ReadingPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/history/:id" element={<HistoryDetailPage />} />
      <Route path="/collection" element={<CollectionPage />} />
      <Route path="/insights" element={<InsightsPage />} />
    </Routes>
  );
}
