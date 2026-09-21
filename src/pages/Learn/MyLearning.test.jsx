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
