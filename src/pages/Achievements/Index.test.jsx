import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Achievements from './Index';

vi.mock('@api/learn', () => ({
  getCertificates: vi.fn(),
  getSeniorityBadges: vi.fn(),
}));
import { getCertificates, getSeniorityBadges } from '@api/learn';

const knowledgeCert = {
  public_token: 'tok_k',
  course_title: 'React Fundamentals',
  issued_at: '2026-09-08T10:00:00Z',
  credential_kind: 'knowledge',
  target_level: 'mid_senior',
  level: null,
  revoked: false,
};

const courseCert = {
  public_token: 'tok_c',
  course_title: 'Intro to Programming',
  issued_at: '2026-01-01T00:00:00Z',
  credential_kind: 'course',
  level: 'senior',
  revoked: false,
};

const renderAchievements = () =>
  renderWithProviders(Achievements, {
    path: '/achievements',
    initialPath: '/achievements',
  });

describe('Achievements — knowledge credentials', () => {
  it('renders a knowledge credential distinctly with its target standard and verify link', async () => {
    getCertificates.mockResolvedValue([knowledgeCert]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();

    expect(await screen.findByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Knowledge credential')).toBeInTheDocument();
    expect(screen.getByText('Mid-Senior standard')).toBeInTheDocument();
    // Verify/share link points at the public token.
    const verify = screen.getByRole('link', { name: /verify/i });
    expect(verify).toHaveAttribute(
      'href',
      expect.stringContaining('/verify/tok_k'),
    );
  });

  it('still renders a legacy course certificate with its level', async () => {
    getCertificates.mockResolvedValue([courseCert]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();

    expect(await screen.findByText('Intro to Programming')).toBeInTheDocument();
    expect(screen.getByText('Senior')).toBeInTheDocument();
  });

  it('shows a newly valid credential alongside a revoked historical one (revoked does not hide valid)', async () => {
    const revokedOld = {
      ...knowledgeCert,
      public_token: 'tok_old',
      revoked: true,
    };
    const validNew = {
      ...knowledgeCert,
      public_token: 'tok_new',
      revoked: false,
    };
    getCertificates.mockResolvedValue([revokedOld, validNew]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();

    await screen.findAllByText('React Fundamentals');
    expect(screen.getAllByText('Knowledge credential')).toHaveLength(2);
    expect(screen.getByText('Revoked')).toBeInTheDocument();
    // The valid credential's verify link is present.
    const links = screen.getAllByRole('link', { name: /verify/i });
    expect(
      links.some((a) => a.getAttribute('href').includes('/verify/tok_new')),
    ).toBe(true);
  });

  it('never uses a full-seniority / verified-engineer claim', async () => {
    getCertificates.mockResolvedValue([knowledgeCert]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();
    await screen.findByText('React Fundamentals');

    expect(
      screen.queryByText(/Verified Senior Engineer/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Full Seniority Verified/i),
    ).not.toBeInTheDocument();
  });
});
