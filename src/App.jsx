import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Obligations from './pages/Obligations';
import Social from './pages/Social';
import IPO from './pages/IPO';
import Savings from './pages/Savings';

function AppContent() {
  const { activePeriod } = useApp();

  if (!activePeriod) {
    return <Onboarding />;
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/gelir" element={<Income />} />
          <Route path="/yükümler" element={<Obligations />} />
          <Route path="/sosyal" element={<Social />} />
          <Route path="/ipo" element={<IPO />} />
          <Route path="/tasarruf" element={<Savings />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
}
