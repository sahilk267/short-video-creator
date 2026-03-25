import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VideoList from './pages/VideoList';
import VideoCreator from './pages/VideoCreator';
import VideoDetails from './pages/VideoDetails';
import BulkQueue from './pages/BulkQueue';
import CategoryMapping from './pages/CategoryMapping';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<VideoList />} />
          <Route path="/create" element={<VideoCreator />} />
          <Route path="/video/:videoId" element={<VideoDetails />} />
          <Route path="/queue" element={<BulkQueue />} />
          <Route path="/mappings" element={<CategoryMapping />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App; 