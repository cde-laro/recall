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

vi.mock('./hooks/useGameData', () => ({
  useGameData: () => ({ version: '', characters: CHARS, loading: false, error: null }),
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

  it('shows a partial scoreboard when giving up before completing', async () => {
    vi.stubGlobal('confirm', () => true);
    renderGame();
    const input = screen.getByRole('textbox');
    submit(input, 'jett'); // 1/2 trouvé
    fireEvent.click(screen.getByText('Abandonner'));
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
    expect(dialog).toHaveTextContent('Run Abandonnée');
    expect(dialog).toHaveTextContent('1/2');
  });

  it('rejects a wrong guess without completing', () => {
    renderGame();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    submit(input, 'zzzzz');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });
});
