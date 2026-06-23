import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementsClient from './AchievementsClient';

describe('AchievementsClient search input accessibility', () => {
  beforeEach(() => {
    // No ?username -> the empty state renders, which contains both username search inputs.
    window.history.replaceState({}, '', '/achievements');
  });

  it('gives both username search inputs an accessible name (not just a placeholder)', () => {
    render(<AchievementsClient />);

    // Found by accessible name; placeholders alone would not satisfy this query.
    const inputs = screen.getAllByRole('textbox', { name: /search github username/i });
    expect(inputs).toHaveLength(2);

    const placeholders = inputs.map((input) => input.getAttribute('placeholder'));
    expect(placeholders).toContain('e.g. jhasourav07');
    expect(placeholders).toContain('Search user...');
  });
});
