import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import './index.css';
import { GameRoute } from './GameRoute';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/recall">
      <Routes>
        <Route path="/" element={<Navigate to="/league" replace />} />
        <Route path="/league" element={<GameRoute game="lol" />} />
        <Route path="/valorant" element={<GameRoute game="valorant" />} />
        <Route path="/overwatch" element={<GameRoute game="overwatch" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
