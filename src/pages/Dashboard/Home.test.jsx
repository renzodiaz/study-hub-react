import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Home from './Home';

vi.mock('@api/learn', () => ({
  getEnrollments: vi.fn(),
}));
import { getEnrollments } from '@api/learn';

const render = () => renderWithProviders(Home, { path: '/', initialPath: '/' });

describe('Home', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an empty state with an Explore action when nothing is enrolled', async () => {
    getEnrollments.mockResolvedValue([]);
    render();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Home' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/you're not on a career yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /explore careers/i }),
    ).toHaveAttribute('href', '/learn');
  });

  it('continues the active career with truthful track progress and a resume action', async () => {
    getEnrollments.mockResolvedValue([
      {
        id: 'e1',
        career_track: { id: 'fms', name: 'Frontend Mid-Senior' },
        progress: { completed: 2, total: 22, percent: 9 },
      },
    ]);
    render();
    // The active career name is the single page h1.
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Frontend Mid-Senior',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Enrolled')).toBeInTheDocument();
    expect(screen.getByText('2 of 22 lessons')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /resume/i })).toHaveAttribute(
      'href',
      '/my-learning/fms',
    );
    expect(
      screen.getByRole('link', { name: /view all my learning/i }),
    ).toHaveAttribute('href', '/my-learning');
  });

  it('renders no plan/entitlement inference', async () => {
    getEnrollments.mockResolvedValue([
      {
        id: 'e1',
        career_track: { id: 'fms', name: 'Frontend Mid-Senior' },
        progress: { completed: 0, total: 21, percent: 0 },
      },
    ]);
    render();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/\bpro\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\badvanced\b/i)).not.toBeInTheDocument();
    // No attention band without a supported signal.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
