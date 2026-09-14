import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Achievements from './Index';

vi.mock('@api/learn', () => ({
  getCertificates: vi.fn().mockResolvedValue([]),
  getSeniorityBadges: vi.fn(),
}));
import { getSeniorityBadges } from '@api/learn';

const badge = (status) => ({
  id: `b_${status}`,
  level: 'senior',
  career_track_name: 'Full-Stack Ruby',
  earned_at: '2026-01-02T00:00:00Z',
  public_token: `tok_${status}`,
  status,
});

describe('learner seniority badge status (server-authoritative)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a Valid status', async () => {
    getSeniorityBadges.mockResolvedValue([badge('valid')]);
    renderWithProviders(Achievements, { path: '/' });
    expect(await screen.findByText('Status: Valid')).toBeInTheDocument();
  });

  it('shows Revalidation required with clear wording (not "revoked")', async () => {
    getSeniorityBadges.mockResolvedValue([badge('revalidation_required')]);
    renderWithProviders(Achievements, { path: '/' });
    expect(
      await screen.findByText('Revalidation required'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /one of the credentials used when this badge was issued/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/revoked/i)).not.toBeInTheDocument();
  });

  it('shows Revoked distinctly', async () => {
    getSeniorityBadges.mockResolvedValue([badge('revoked')]);
    renderWithProviders(Achievements, { path: '/' });
    expect(await screen.findByText('Revoked')).toBeInTheDocument();
    expect(screen.getByText(/explicitly revoked/i)).toBeInTheDocument();
  });

  it('renders a verify link for the badge and does not compute status client-side', async () => {
    // No prerequisite/certificate data is provided — status must come from the
    // server field alone; the card still renders it.
    getSeniorityBadges.mockResolvedValue([badge('revalidation_required')]);
    renderWithProviders(Achievements, { path: '/' });
    expect(
      await screen.findByRole('link', { name: /verify/i }),
    ).toBeInTheDocument();
  });
});
