import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import './index.css';
import { Game } from './Game';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/league" replace />} />
        <Route path="/league" element={<Game game="lol" />} />
        <Route path="/valorant" element={<Game game="valorant" />} />
        <Route path="/overwatch" element={<Game game="overwatch" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
