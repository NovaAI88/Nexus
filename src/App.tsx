import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { cssVariables } from './design/tokens';
import Shell from './components/layout/Shell';
import Home from './pages/Home';
import Today from './pages/Today';
import Week from './pages/Week';
import Projects from './pages/Projects';
import Inbox from './pages/Inbox';

// Inject CSS variables once on mount
function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'nexus-tokens';
    style.textContent = cssVariables;
    document.head.appendChild(style);
    return () => {
      document.getElementById('nexus-tokens')?.remove();
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <GlobalStyles />
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<Today />} />
          <Route path="/week" element={<Week />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </>
  );
}
