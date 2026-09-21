import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import MyLearning from './MyLearning';

vi.mock('@api/learn', () => ({
  getEnrollments: vi.fn(),
  getPreviewTracks: vi.fn(),
}));
import { getEnrollments, getPreviewTracks } from '@api/learn';

const render = () =>
  renderWithProviders(MyLearning, {
    path: 'my-learning',
    initialPath: '/my-learning',
  });

describe('MyLearning — Preview access', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a Preview access section for granted tracks', async () => {
    getEnrollments.mockResolvedValue([]);
    getPreviewTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior', color: '#4F46E5', icon: '🖥️' },
    ]);

    render();

    expect(await screen.findByText('Preview access')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /frontend mid-senior/i });
    expect(link).toHaveAttribute('href', '/learn/fms');
    expect(
      screen.getByText(/preview — not yet publicly released/i),
    ).toBeInTheDocument();
    // Must not imply the credential/exam is available.
    expect(screen.queryByText(/credential/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/earn your/i)).not.toBeInTheDocument();
  });

  it('hides the Preview access section when there are no grants', async () => {
    getEnrollments.mockResolvedValue([]);
    getPreviewTracks.mockResolvedValue([]);

    render();

    expect(
      await screen.findByText(/haven't enrolled in any careers/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Preview access')).not.toBeInTheDocument();
  });
});

describe('MyLearning — Preview + Enrollment dedup', () => {
  beforeEach(() => vi.clearAllMocks());

  const enrollment = (trackId, name, extra = {}) => ({
    id: `e-${trackId}`,
    career_track: { id: trackId, name, color: '#4F46E5', icon: '🖥️' },
    progress: { completed: 2, total: 22, percent: 9 },
    ...extra,
  });

  it('shows a preview+enrolled track ONCE, as the enrolled card with a Preview badge', async () => {
    getEnrollments.mockResolvedValue([
      enrollment('fms', 'Frontend Mid-Senior'),
    ]);
    getPreviewTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior', color: '#4F46E5', icon: '🖥️' },
    ]);

    render();

    // Exactly one card for the track (enrolled card → /my-learning/fms).
    const cards = await screen.findAllByRole('link', {
      name: /frontend mid-senior/i,
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute('href', '/my-learning/fms');
    // Enrolled/progress representation retained.
    expect(screen.getByText('2 / 22 lessons')).toBeInTheDocument();
    // Subtle Preview indicator retained; no duplicate "Preview access" section.
    expect(
      screen.getByText(/preview — not yet publicly released/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Preview access')).not.toBeInTheDocument();
  });

  it('keeps a preview-only track under Preview access while an enrolled preview track shows once', async () => {
    getEnrollments.mockResolvedValue([
      enrollment('fms', 'Frontend Mid-Senior'),
    ]);
    getPreviewTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior' }, // enrolled → not in Preview section
      { id: 'be', name: 'Backend Track' }, // preview-only → stays in Preview section
    ]);

    render();

    expect(await screen.findByText('Preview access')).toBeInTheDocument();
    // Preview-only track appears under Preview access (links to /learn/be).
    expect(
      screen.getByRole('link', { name: /backend track/i }),
    ).toHaveAttribute('href', '/learn/be');
    // The enrolled preview track appears exactly once (enrolled card).
    const fms = screen.getAllByRole('link', { name: /frontend mid-senior/i });
    expect(fms).toHaveLength(1);
    expect(fms[0]).toHaveAttribute('href', '/my-learning/fms');
  });

  it('a normal published enrollment shows a plain card with no Preview indicator', async () => {
    getEnrollments.mockResolvedValue([enrollment('pub', 'Published Career')]);
    getPreviewTracks.mockResolvedValue([]);

    render();

    expect(
      await screen.findByRole('link', { name: /published career/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/preview — not yet publicly released/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Preview access')).not.toBeInTheDocument();
  });

  it('dedupes by id, not title — two different tracks sharing a title both render', async () => {
    getEnrollments.mockResolvedValue([enrollment('a', 'Frontend')]);
    getPreviewTracks.mockResolvedValue([{ id: 'b', name: 'Frontend' }]); // different id, same title

    render();

    // Enrolled 'a' + preview-only 'b' → two cards, NOT collapsed by title.
    await screen.findByText('Preview access');
    const cards = screen.getAllByRole('link', { name: /frontend/i });
    const hrefs = cards.map((c) => c.getAttribute('href'));
    expect(hrefs).toContain('/my-learning/a'); // enrolled 'a'
    expect(hrefs).toContain('/learn/b'); // preview-only 'b'
  });
});
