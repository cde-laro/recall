// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import i18n from './i18n';
import { Game } from './Game';
import type { Character } from './hooks/useGameData';

const CHARS: Character[] = [
  { name: 'Jett', id: 'uuid-jett', imageUrl: '' },
  { name: 'Sage', id: 'uuid-sage', imageUrl: '' },
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
    expect(screen.getByText('Données locales — patch antérieur possible')).toBeInTheDocument();
  });

  it('shows a skeleton grid while loading', () => {
    mockHook.loading = true;
    renderGame();
    expect(document.querySelectorAll('.card.skeleton')).toHaveLength(24);
  });

  it('rejects a wrong guess without completing', () => {
    renderGame();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    submit(input, 'zzzzz');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });
});
