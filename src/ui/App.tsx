import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/shared/LoadingSpinner';

const VideoList = lazy(() => import('./pages/VideoList'));
const VideoCreator = lazy(() => import('./pages/VideoCreator'));
const VideoDetails = lazy(() => import('./pages/VideoDetails'));
const BulkQueue = lazy(() => import('./pages/BulkQueue'));
const CategoryMapping = lazy(() => import('./pages/CategoryMapping'));
const PublishDashboard = lazy(() => import('./pages/PublishDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const SchedulerDashboard = lazy(() => import('./pages/SchedulerDashboard'));
const ABTestingDashboard = lazy(() => import('./pages/ABTestingDashboard'));
const AIDashboard = lazy(() => import('./pages/AIDashboard'));
const TenantConsole = lazy(() => import('./pages/TenantConsole'));
const ContentTools = lazy(() => import('./pages/ContentTools'));
const HealthDashboard = lazy(() => import('./pages/HealthDashboard'));
const TrendDashboard = lazy(() => import('./pages/TrendDashboard'));
const HookLibrary = lazy(() => import('./pages/HookLibrary'));
const ImageGenerator = lazy(() => import('./pages/ImageGenerator'));
const RecycleDashboard = lazy(() => import('./pages/RecycleDashboard'));
const CostTracker = lazy(() => import('./pages/CostTracker'));
const StrategyDashboard = lazy(() => import('./pages/StrategyDashboard'));

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
            <Routes>
              <Route path="/" element={<VideoList />} />
              <Route path="/create" element={<VideoCreator />} />
              <Route path="/video/:videoId" element={<VideoDetails />} />
              <Route path="/queue" element={<BulkQueue />} />
              <Route path="/mappings" element={<CategoryMapping />} />
              <Route path="/publish" element={<PublishDashboard />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/scheduler" element={<SchedulerDashboard />} />
              <Route path="/ab-testing" element={<ABTestingDashboard />} />
              <Route path="/ai" element={<AIDashboard />} />
              <Route path="/health" element={<HealthDashboard />} />
              <Route path="/tenants" element={<TenantConsole />} />
              <Route path="/content-tools" element={<ContentTools />} />
              <Route path="/trends" element={<TrendDashboard />} />
              <Route path="/hooks" element={<HookLibrary />} />
              <Route path="/image-generator" element={<ImageGenerator />} />
              <Route path="/recycle" element={<RecycleDashboard />} />
              <Route path="/costs" element={<CostTracker />} />
              <Route path="/strategy" element={<StrategyDashboard />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
};

export default App;
