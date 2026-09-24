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
    const verify = screen.getByRole('link', { name: /view verification/i });
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
    const links = screen.getAllByRole('link', { name: /view verification/i });
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

  it('does not expose the raw token or internal metadata as credential fields', async () => {
    getCertificates.mockResolvedValue([knowledgeCert]);
    getSeniorityBadges.mockResolvedValue([]);
    const { container } = renderAchievements();
    await screen.findByText('React Fundamentals');
    // The token is only used inside the verification href, never shown as text.
    expect(screen.queryByText('tok_k')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(
      /evaluator_version|provider|fingerprint|Credential ID|Certificate number/i,
    );
  });
});

const seniorityBadge = (extra = {}) => ({
  id: 'b1',
  level: 'mid_senior',
  career_track_name: 'Frontend Mid-Senior',
  earned_at: '2026-09-20T00:00:00Z',
  public_token: 'tok_b',
  status: 'valid',
  ...extra,
});

describe('Credentials — human-facing credential identifier', () => {
  it('renders the Course Certificate Credential ID (SH-C) from the API', async () => {
    getCertificates.mockResolvedValue([
      { ...knowledgeCert, public_identifier: 'SH-C-ABCD-EFGH-JK23' },
    ]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();

    expect(await screen.findByText('Credential ID')).toBeInTheDocument();
    expect(screen.getByText('SH-C-ABCD-EFGH-JK23')).toBeInTheDocument();
    // The opaque token is never shown as the credential id (only inside the href).
    expect(screen.queryByText('tok_k')).not.toBeInTheDocument();
  });

  it('renders the SeniorityBadge Credential ID (SH-B) independently of the standard', async () => {
    getCertificates.mockResolvedValue([]);
    getSeniorityBadges.mockResolvedValue([
      seniorityBadge({
        public_identifier: 'SH-B-MNPQ-RSTV-WXY2',
        competency_standard: {
          name: 'Frontend Mid-Senior Competency Standard',
          version: '1.0',
        },
      }),
    ]);
    renderAchievements();

    expect(await screen.findByText('SH-B-MNPQ-RSTV-WXY2')).toBeInTheDocument();
    expect(screen.getByText('Credential ID')).toBeInTheDocument();
    // Standard still renders from its own field.
    expect(
      screen.getByText(/Frontend Mid-Senior Competency Standard · v1\.0/),
    ).toBeInTheDocument();
    expect(screen.queryByText('tok_b')).not.toBeInTheDocument();
  });

  it('retains the Credential ID for a revoked credential', async () => {
    getCertificates.mockResolvedValue([]);
    getSeniorityBadges.mockResolvedValue([
      seniorityBadge({
        status: 'revoked',
        public_identifier: 'SH-B-2345-6789-ABCD',
      }),
    ]);
    renderAchievements();
    expect(await screen.findByText('SH-B-2345-6789-ABCD')).toBeInTheDocument();
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });

  it('omits the Credential ID cleanly when absent (no guessed fallback)', async () => {
    getCertificates.mockResolvedValue([
      { ...knowledgeCert, public_identifier: undefined },
    ]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();

    await screen.findByText('React Fundamentals');
    expect(screen.queryByText('Credential ID')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Unknown|N\/A|Missing|Pending/i),
    ).not.toBeInTheDocument();
  });

  it('uses the Credential ID (not the token) as the LinkedIn certId, with the verification URL as certUrl', async () => {
    getCertificates.mockResolvedValue([
      { ...knowledgeCert, public_identifier: 'SH-C-ABCD-EFGH-JK23' },
    ]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();
    await screen.findByText('React Fundamentals');

    const linkedIn = screen.getByRole('link', { name: /add to linkedin/i });
    const href = decodeURIComponent(linkedIn.getAttribute('href'));
    expect(href).toContain('certId=SH-C-ABCD-EFGH-JK23');
    expect(href).toContain('certUrl=');
    expect(href).toContain('/verify/tok_k'); // URL still carries the token capability
    expect(href).not.toContain('certId=tok_k'); // never the token as credential id
  });
});

describe('Credentials — seniority badge competency standard', () => {
  it('renders the standard name and version from the API (never fabricated)', async () => {
    getCertificates.mockResolvedValue([]);
    getSeniorityBadges.mockResolvedValue([
      seniorityBadge({
        competency_standard: {
          name: 'Frontend Mid-Senior Competency Standard',
          version: '1.0',
        },
      }),
    ]);
    renderAchievements();

    expect(await screen.findByText('Competency standard')).toBeInTheDocument();
    expect(
      screen.getByText(/Frontend Mid-Senior Competency Standard · v1\.0/),
    ).toBeInTheDocument();
  });

  it('omits the standard cleanly when absent (no guessed fallback)', async () => {
    getCertificates.mockResolvedValue([]);
    getSeniorityBadges.mockResolvedValue([
      seniorityBadge({ competency_standard: null }),
    ]);
    renderAchievements();

    // Badge still renders (title present) but no standard block / fabricated value.
    expect(
      await screen.findByText(/Mid-Senior · Frontend Mid-Senior/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Competency standard')).not.toBeInTheDocument();
    expect(screen.queryByText(/Unknown/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/· v/)).not.toBeInTheDocument();
  });
});

describe('Credentials — loading / empty / error states', () => {
  it('shows a loading state, not the empty state, while queries are pending', async () => {
    getCertificates.mockReturnValue(new Promise(() => {})); // never resolves
    getSeniorityBadges.mockReturnValue(new Promise(() => {}));
    renderAchievements();

    expect(await screen.findAllByText('Loading…')).not.toHaveLength(0);
    expect(screen.queryByText(/No credentials yet/i)).not.toBeInTheDocument();
  });

  it('shows a deliberate empty state only when BOTH queries succeed with no rows', async () => {
    getCertificates.mockResolvedValue([]);
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();

    expect(await screen.findByText(/No credentials yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /explore careers/i }),
    ).toBeInTheDocument();
  });

  it('shows an error (never "no credentials") when a query fails', async () => {
    getCertificates.mockRejectedValue(new Error('boom'));
    getSeniorityBadges.mockResolvedValue([]);
    renderAchievements();

    expect(
      await screen.findByText(/Couldn't load your course certificates/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No credentials yet/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it('handles partial failure truthfully (one section errors, the other renders)', async () => {
    getCertificates.mockResolvedValue([knowledgeCert]);
    getSeniorityBadges.mockRejectedValue(new Error('boom'));
    renderAchievements();

    expect(await screen.findByText('React Fundamentals')).toBeInTheDocument();
    expect(
      screen.getByText(/Couldn't load your seniority badges/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No credentials yet/i)).not.toBeInTheDocument();
  });
});
