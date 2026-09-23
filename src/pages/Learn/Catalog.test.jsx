import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Catalog from './Catalog';

vi.mock('@api/learn', () => ({
  getTracks: vi.fn(),
  getEnrollments: vi.fn(),
}));
import { getTracks, getEnrollments } from '@api/learn';

const render = () =>
  renderWithProviders(Catalog, { path: 'learn', initialPath: '/learn' });

describe('Explore (Catalog)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders published career cards from query data, with server-provided counts (not hard-coded)', async () => {
    getTracks.mockResolvedValue([
      {
        id: 'fms',
        name: 'Frontend Mid-Senior',
        description: 'Reason about JS/TS under pressure.',
        courses_count: 5,
        target_level: 'Mid-Senior',
      },
      {
        id: 'be',
        name: 'Backend Track',
        description: 'Services and data.',
        courses_count: 3,
      },
    ]);
    getEnrollments.mockResolvedValue([]);
    render();

    const fms = await screen.findByRole('link', {
      name: 'Frontend Mid-Senior',
    });
    expect(fms).toHaveAttribute('href', '/learn/fms');
    // Counts come from data — 5 and 3, not a global constant.
    expect(screen.getByText('5 courses')).toBeInTheDocument();
    expect(screen.getByText('3 courses')).toBeInTheDocument();
    expect(screen.getByText('2 careers')).toBeInTheDocument();
  });

  it('marks enrolled careers with an Enrolled status (presentation only)', async () => {
    getTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior', courses_count: 5 },
    ]);
    getEnrollments.mockResolvedValue([
      { id: 'e1', career_track: { id: 'fms', name: 'Frontend Mid-Senior' } },
    ]);
    render();
    await screen.findByRole('link', { name: 'Frontend Mid-Senior' });
    expect(screen.getByText('Enrolled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue/i })).toHaveAttribute(
      'href',
      '/learn/fms',
    );
  });

  it('shows a truthful empty state and the published-only note when no careers exist', async () => {
    getTracks.mockResolvedValue([]);
    getEnrollments.mockResolvedValue([]);
    render();
    expect(
      await screen.findByText(/no careers published yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/explore lists published careers only/i),
    ).toBeInTheDocument();
    // Never implies preview/pilot content is public.
    expect(screen.queryByText(/pilot/i)).not.toBeInTheDocument();
  });

  it('does not surface Preview or Pilot presentation in Explore', async () => {
    getTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior', courses_count: 5 },
    ]);
    getEnrollments.mockResolvedValue([]);
    render();
    await screen.findByRole('link', { name: 'Frontend Mid-Senior' });
    expect(screen.queryByText(/^preview$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pilot/i)).not.toBeInTheDocument();
  });
});
