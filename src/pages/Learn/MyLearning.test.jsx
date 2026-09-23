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

const hrefsFor = (name) =>
  screen.getAllByRole('link', { name }).map((a) => a.getAttribute('href'));

describe('MyLearning — states', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a neutral empty state when nothing is enrolled or granted', async () => {
    getEnrollments.mockResolvedValue([]);
    getPreviewTracks.mockResolvedValue([]);
    render();
    expect(
      await screen.findByText(/you're not on a career yet/i),
    ).toBeInTheDocument();
    // No status pill is asserted by an empty state.
    expect(screen.queryByText('Enrolled')).not.toBeInTheDocument();
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
  });

  it('renders a Preview access section for preview-only grants', async () => {
    getEnrollments.mockResolvedValue([]);
    getPreviewTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior' },
    ]);
    render();
    expect(await screen.findByText(/preview access/i)).toBeInTheDocument();
    expect(hrefsFor(/frontend mid-senior/i)).toContain('/learn/fms');
    expect(
      screen.getByText(/preview — not yet publicly released/i),
    ).toBeInTheDocument();
    // Must not imply the credential/exam is available.
    expect(screen.queryByText(/credential/i)).not.toBeInTheDocument();
  });
});

describe('MyLearning — Preview + Enrollment dedup (PR #24 regression)', () => {
  beforeEach(() => vi.clearAllMocks());

  const enrollment = (trackId, name, extra = {}) => ({
    id: `e-${trackId}`,
    career_track: { id: trackId, name },
    progress: { completed: 2, total: 22, percent: 9 },
    ...extra,
  });

  it('CASE A — preview only → exactly one Preview card', async () => {
    getEnrollments.mockResolvedValue([]);
    getPreviewTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior' },
    ]);
    render();
    await screen.findByText(/preview access/i);
    const links = screen.getAllByRole('link', { name: /frontend mid-senior/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/learn/fms');
  });

  it('CASE B — preview + enrolled → one enrolled card with a Preview mark, no duplicate', async () => {
    getEnrollments.mockResolvedValue([
      enrollment('fms', 'Frontend Mid-Senior'),
    ]);
    getPreviewTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior' },
    ]);
    render();
    const cards = await screen.findAllByRole('link', {
      name: /frontend mid-senior/i,
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute('href', '/my-learning/fms');
    // Track-scoped lesson progress, not relabelled as Course progress.
    expect(screen.getByText('2 of 22 lessons')).toBeInTheDocument();
    // Subtle Preview indicator retained; no separate Preview section.
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.queryByText(/preview access/i)).not.toBeInTheDocument();
  });

  it('CASE C — normal published enrollment → plain enrolled card, no Preview mark', async () => {
    getEnrollments.mockResolvedValue([enrollment('pub', 'Published Career')]);
    getPreviewTracks.mockResolvedValue([]);
    render();
    expect(
      await screen.findByRole('link', { name: /published career/i }),
    ).toHaveAttribute('href', '/my-learning/pub');
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    expect(screen.queryByText(/preview access/i)).not.toBeInTheDocument();
  });

  it('CASE D — same title, different stable ids → both render (dedupe by id, not title)', async () => {
    getEnrollments.mockResolvedValue([enrollment('a', 'Frontend')]);
    getPreviewTracks.mockResolvedValue([{ id: 'b', name: 'Frontend' }]);
    render();
    await screen.findByText(/preview access/i);
    const hrefs = hrefsFor(/frontend/i);
    expect(hrefs).toContain('/my-learning/a'); // enrolled 'a'
    expect(hrefs).toContain('/learn/b'); // preview-only 'b'
  });

  it('keeps a preview-only track in Preview access while an enrolled preview track shows once', async () => {
    getEnrollments.mockResolvedValue([
      enrollment('fms', 'Frontend Mid-Senior'),
    ]);
    getPreviewTracks.mockResolvedValue([
      { id: 'fms', name: 'Frontend Mid-Senior' }, // enrolled → not in Preview section
      { id: 'be', name: 'Backend Track' }, // preview-only → stays in Preview section
    ]);
    render();
    expect(await screen.findByText(/preview access/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /backend track/i }),
    ).toHaveAttribute('href', '/learn/be');
    const fms = screen.getAllByRole('link', { name: /frontend mid-senior/i });
    expect(fms).toHaveLength(1);
    expect(fms[0]).toHaveAttribute('href', '/my-learning/fms');
  });
});
