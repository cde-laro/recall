// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import i18n from './i18n';
import { HomeRoute } from './HomeRoute';

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/league" element={<div>LEAGUE PAGE</div>} />
        <Route path="/valorant" element={<div>VALORANT PAGE</div>} />
        <Route path="/overwatch" element={<div>OVERWATCH PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HomeRoute', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('fr');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all three game cards', () => {
    renderHome();
    expect(screen.getByText('League of Legends')).toBeInTheDocument();
    expect(screen.getByText('Valorant')).toBeInTheDocument();
    expect(screen.getByText('Overwatch')).toBeInTheDocument();
  });

  it('shows "not played yet" when no record exists for a game', () => {
    renderHome();
    expect(screen.getAllByText('Pas encore joué')).toHaveLength(3);
  });

  it('shows best time and best score together when a record exists', () => {
    localStorage.setItem('memochamp_best_lol', '252450');
    localStorage.setItem('memochamp_bestscore_lol', '184');
    renderHome();
    expect(screen.getByText('04:12')).toBeInTheDocument();
    expect(screen.getByText('184')).toBeInTheDocument();
  });

  it('navigates to the right game when a card is clicked', () => {
    renderHome();
    fireEvent.click(screen.getByText('Valorant'));
    expect(screen.getByText('VALORANT PAGE')).toBeInTheDocument();
  });

  it('toggles the language', () => {
    renderHome();
    expect(screen.getByText('Nomme tous les personnages.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /EN/ }));
    expect(screen.getByText('Name every character.')).toBeInTheDocument();
  });

  it('resets stale data-game attribute and document title left over from a game page', () => {
    document.documentElement.setAttribute('data-game', 'valorant');
    document.title = 'RECALL/Valorant - All agents';
    renderHome();
    expect(document.documentElement.hasAttribute('data-game')).toBe(false);
    expect(document.title).toBe('RECALL - Champion Identification Challenge');
  });
});
