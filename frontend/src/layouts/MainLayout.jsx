import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
// FloatingDock removed for top nav design
import { getModelMetadata } from '../services/api';

export default function MainLayout() {
  const [mode, setMode] = useState('demo');

  useEffect(() => {
    getModelMetadata()
      .then((res) => setMode(res.data.mode || 'demo'))
      .catch(() => setMode('demo'));
  }, []);

  return (
    <div className="app-layout">
      {/* Top Nav replaces FloatingDock */}
      <div className="main-content">
        <Header mode={mode} />
        <main className="page-content">
          <Outlet context={{ mode }} />
        </main>
      </div>
    </div>
  );
}
