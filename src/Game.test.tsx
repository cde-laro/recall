// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import i18n from './i18n';
import { Game } from './Game';
import type { Character } from './hooks/useGameData';

const CHARS: Character[] = [
  { name: 'Jett', id: 'uuid-jett', imageUrl: 'https://example.test/jett.png' },
  { name: 'Sage', id: 'uuid-sage', imageUrl: 'https://example.test/sage.png' },
];

const mockHook = vi.hoisted(() => ({ stale: false, loading: false }));

vi.mock('./hooks/useGameData', () => ({
  useGameData: () => ({
    version: '',
    characters: CHARS,
    loading: mockHook.loading,
    error: null,
    stale: mockHook.stale,
  }),
}));

function renderGame() {
  return render(
    <MemoryRouter>
      <Game game="valorant" lang="fr" onToggleLang={() => {}} />
    </MemoryRouter>
  );
}

function submit(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

describe('Game flow', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('fr');
    vi.restoreAllMocks();
    mockHook.stale = false;
    mockHook.loading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('tolerates a typo and completes the run (shows the completion modal)', async () => {
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett');
    submit(input, 'saje'); // faute de frappe pour "Sage" → fuzzy
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
    // localStorage vidé → première complétion = nouveau record
    expect(dialog).toHaveTextContent('Nouveau Record');
    expect(dialog).not.toHaveTextContent('abandon');
  });

  it('shows a partial scoreboard and reveals missed characters when giving up', async () => {
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett'); // 1/2 trouvé
    fireEvent.click(screen.getByText('Abandonner'));
    fireEvent.click(screen.getByText('Confirmer'));
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
    expect(dialog).toHaveTextContent('Run Abandonnée');
    expect(dialog).toHaveTextContent('1/2');
    // La grille révèle la manquée (Sage) en style "missed", la trouvée (Jett) reste "found".
    expect(document.querySelector('.card.missed .name-bar')).toHaveTextContent('Sage');
    expect(document.querySelector('.card.found .name-bar')).toHaveTextContent('Jett');
    expect(document.querySelectorAll('.card.missed')).toHaveLength(1);
  });

  it('keeps a gave-up run closed: no completion, no record from the revealed names', async () => {
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett'); // 1/2 trouvé
    fireEvent.click(screen.getByText('Abandonner'));
    fireEvent.click(screen.getByText('Confirmer'));
    await screen.findByRole('dialog', {}, { timeout: 2000 });
    // La saisie est close : impossible de compléter avec les noms révélés.
    expect(input).toBeDisabled();
    expect(screen.getByText('Valider')).toBeDisabled();
    submit(input, 'sage'); // tentative de triche post-abandon
    expect(screen.getByRole('dialog')).toHaveTextContent('Run Abandonnée');
    expect(localStorage.getItem('memochamp_best_valorant')).toBeNull();
  });

  it('shows the gave-up modal and reveals everything even at zero found', async () => {
    renderGame();
    fireEvent.click(screen.getByText('Abandonner'));
    fireEvent.click(screen.getByText('Confirmer'));
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
    expect(dialog).toHaveTextContent('0/2');
    expect(document.querySelectorAll('.card.missed')).toHaveLength(2);
  });

  it('does not end the run when the confirm dialog is cancelled', () => {
    renderGame();
    fireEvent.click(screen.getByText('Abandonner'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Annuler'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('shows the stale-data notice when data comes from the local snapshot', () => {
    mockHook.stale = true;
    renderGame();
    expect(screen.getByText('Données locales : patch antérieur possible')).toBeInTheDocument();
  });

  it('shows a full-page loader while loading', () => {
    mockHook.loading = true;
    renderGame();
    expect(document.querySelector('.page-loading')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('rejects a wrong guess without completing', () => {
    renderGame();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    submit(input, 'zzzzz');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).not.toBeDisabled();
    // Aucune trouvaille : le score/combo ne doit pas bouger sur une erreur.
    expect(document.querySelector('.stat-score-row .stat-big')).toHaveTextContent('0');
  });

  it('gives distinct feedback for a repeated guess instead of treating it as wrong', () => {
    renderGame();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    submit(input, 'jett');
    submit(input, 'jett'); // déjà trouvé
    expect(document.querySelector('.command-bar')).toHaveClass('flash-duplicate');
    expect(document.querySelector('.command-bar')).not.toHaveClass('flash-wrong');
    expect(document.querySelector('.command-bar')).not.toHaveClass('shake');
    expect(document.querySelector('.card.duplicate')).not.toBeNull();
    expect(document.querySelector('.card.duplicate .name-bar')).toHaveTextContent('Jett');
    expect(document.querySelector('.card.duplicate')).not.toHaveClass('justfound');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Le second submit du même nom est un no-op : score reste celui de la
    // première trouvaille légitime (combo=1 → score=1).
    expect(document.querySelector('.stat-score-row .stat-big')).toHaveTextContent('1');
  });

  it('scores each find by the current combo value and grows the combo on fast finds', () => {
    vi.useFakeTimers();
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett'); // combo=1 → score=1
    vi.advanceTimersByTime(2000); // rapide : pas de décroissance
    submit(input, 'sage'); // combo=2 → score=1+2=3
    expect(document.querySelector('.stat-score-row .stat-big')).toHaveTextContent('3');
  });

  it('decays the combo after 5s of inactivity but never drops below x1', () => {
    vi.useFakeTimers();
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett'); // combo=1 → score=1, comboBase devient 2
    vi.advanceTimersByTime(12000); // 2 tranches de 5s pleines écoulées : 2-2=0 → plancher 1
    submit(input, 'sage'); // +1 → score=2
    expect(document.querySelector('.stat-score-row .stat-big')).toHaveTextContent('2');
  });

  it('does not save a best score when the run is abandoned', () => {
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett');
    fireEvent.click(screen.getByText('Abandonner'));
    fireEvent.click(screen.getByText('Confirmer'));
    expect(localStorage.getItem('memochamp_bestscore_valorant')).toBeNull();
  });

  it('shows the score and marks a new score record in the completion modal', async () => {
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett');
    submit(input, 'sage');
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
    expect(dialog).toHaveTextContent('Score');
    expect(dialog).toHaveTextContent('Meilleur Score');
    // Premier run jamais joué : bat à la fois le temps et le score.
    expect(dialog).toHaveTextContent('Nouveau meilleur temps et meilleur score');
    expect(localStorage.getItem('memochamp_bestscore_valorant')).toBe('3');
  });

  it('marks only a score record when the best time is unbeatable', async () => {
    localStorage.setItem('memochamp_best_valorant', '1'); // 1ms : impossible à battre
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett');
    submit(input, 'sage');
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
    expect(dialog).toHaveTextContent('Nouveau meilleur score');
    expect(dialog).not.toHaveTextContent('Nouveau meilleur temps et meilleur score');
  });

  it('marks only a time record when the best score is unbeatable', async () => {
    localStorage.setItem('memochamp_bestscore_valorant', '999999'); // score inatteignable
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett');
    submit(input, 'sage');
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
    expect(dialog).toHaveTextContent('Nouveau meilleur temps');
    expect(dialog).not.toHaveTextContent('Nouveau meilleur temps et meilleur score');
  });
});
