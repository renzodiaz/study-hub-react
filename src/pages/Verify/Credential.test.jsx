import { screen, fireEvent } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Credential from './Credential';

vi.mock('@api/learn', () => ({ getPublicCredential: vi.fn() }));
import { getPublicCredential } from '@api/learn';

const render = () =>
  renderWithProviders(Credential, {
    path: 'verify/$token',
    initialPath: '/verify/tok_123',
  });

// Errors mirror the real PublicCredentialError shape the page branches on.
const notFoundError = () =>
  Object.assign(new Error('Credential not found'), { notFound: true });
const transientError = (status) =>
  Object.assign(new Error('Verification temporarily unavailable'), {
    notFound: false,
    status,
  });

const certificate = (overrides = {}) => ({
  id: 'tok_123',
  credential_type: 'certificate',
  public_identifier: 'SH-C-ABCD-EFGH-JK23',
  holder_name: 'Ada Lovelace',
  course_title: 'Ruby Fundamentals',
  credential_kind: 'knowledge',
  status: 'valid',
  target_level: 'mid_senior',
  overall_score: 88.5,
  dimensions: [{ key: 'technical', label: 'Technical', score: 88.5 }],
  issued_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Real CRED-BE-5 shape: competency_standard carries the version-bound meaning.
const AREAS = Array.from({ length: 13 }, (_, i) => ({
  number: i + 1,
  name: `Area ${i + 1}`,
}));
const LIMITATIONS = Array.from({ length: 8 }, (_, i) => `Limitation ${i + 1}`);

const badge = (overrides = {}) => ({
  id: 'tok_badge',
  credential_type: 'seniority_badge',
  public_identifier: 'SH-B-MNPQ-RSTV-WXY2',
  status: 'valid',
  holder_name: 'Grace Hopper',
  career: { name: 'Frontend Mid-Senior', target_level: 'mid_senior' },
  competency_standard: {
    slug: 'frontend-mid-senior',
    name: 'Frontend Mid-Senior Competency Standard',
    version: '1.0',
    claim: {
      summary: 'The claim is reasoning, not API recall.',
      boundary:
        'At the Mid-Senior boundary the important characteristics include being able to:',
      demonstrated_capabilities: ['predict consequences and failure modes'],
    },
    competency_areas: AREAS,
    limitations: LIMITATIONS,
  },
  badge: { issued_at: '2026-01-02T00:00:00Z', token: 'tok_badge' },
  qualification: {
    required_course_count: 2,
    prerequisite_credentials: [
      {
        course_title: 'Ruby',
        certificate_token: 'c1',
        issued_at: '2026-01-01',
        status: 'valid',
      },
    ],
    interview: {
      target_level: 'mid_senior',
      completed_at: '2026-01-02T00:00:00Z',
      overall_score: 82.0,
      dimension_scores: [{ key: 'technical', score: 82.0 }],
    },
  },
  ...overrides,
});

describe('public verification — valid seniority badge', () => {
  it('renders holder, career, status, Credential ID, standard, claim, all areas + limitations, evidence', async () => {
    getPublicCredential.mockResolvedValue(badge());
    render();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Grace Hopper' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mid-Senior · Frontend Mid-Senior/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Valid').length).toBeGreaterThan(0);
    expect(screen.getByText('SH-B-MNPQ-RSTV-WXY2')).toBeInTheDocument();
    expect(
      screen.getByText(/Frontend Mid-Senior Competency Standard · v1\.0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The claim is reasoning, not API recall.'),
    ).toBeInTheDocument();
    // All 13 areas + all 8 limitations rendered from the payload.
    AREAS.forEach((a) =>
      expect(screen.getByText(`${a.number}. ${a.name}`)).toBeInTheDocument(),
    );
    LIMITATIONS.forEach((l) => expect(screen.getByText(l)).toBeInTheDocument());
    // Final Qualification + prerequisite evidence.
    expect(screen.getByText('Final Qualification')).toBeInTheDocument();
    const prereq = screen.getByRole('link', { name: /Ruby/ });
    expect(prereq).toHaveAttribute(
      'href',
      expect.stringContaining('/verify/c1'),
    );
  });

  it('exactly one h1', async () => {
    getPublicCredential.mockResolvedValue(badge());
    render();
    await screen.findByText('Grace Hopper');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('public verification — status variants', () => {
  it('revalidation_required uses approved copy and keeps content visible', async () => {
    getPublicCredential.mockResolvedValue(
      badge({ status: 'revalidation_required' }),
    );
    render();
    expect(
      (await screen.findAllByText('Revalidation required')).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /one or more of the credentials supporting it now requires revalidation/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/expired|invalid|failed/i),
    ).not.toBeInTheDocument();
    // Not labelled revoked, and standard/claim/limitations still visible.
    expect(screen.getByText('SH-B-MNPQ-RSTV-WXY2')).toBeInTheDocument();
    expect(screen.getByText('Limitation 1')).toBeInTheDocument();
  });

  it('revoked resolves, shows Revoked, no reason, content still visible', async () => {
    getPublicCredential.mockResolvedValue(
      badge({ status: 'revoked' }), // payload never contains revoked_reason
    );
    render();
    expect(await screen.findByText('Revoked')).toBeInTheDocument();
    expect(screen.getByText('SH-B-MNPQ-RSTV-WXY2')).toBeInTheDocument();
    expect(screen.getByText('1. Area 1')).toBeInTheDocument();
    expect(
      screen.queryByText(/revocation reason|revoked_reason/i),
    ).not.toBeInTheDocument();
  });
});

describe('public verification — course certificate (bounded)', () => {
  it('renders bounded claim, evidence, Credential ID; no seniority/standard content', async () => {
    getPublicCredential.mockResolvedValue(certificate());
    render();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ruby Fundamentals')).toBeInTheDocument();
    expect(
      screen.getByText(/does not claim a seniority level/i),
    ).toBeInTheDocument();
    expect(screen.getByText('SH-C-ABCD-EFGH-JK23')).toBeInTheDocument();
    expect(screen.getAllByText('88.50').length).toBeGreaterThan(0);
    // Certificate must not carry badge/competency-standard content.
    expect(screen.queryByText('Competency areas (13)')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/does not by itself prove/i),
    ).not.toBeInTheDocument();
  });

  it('revoked certificate still resolves', async () => {
    getPublicCredential.mockResolvedValue(certificate({ status: 'revoked' }));
    render();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });
});

describe('public verification — error and loading states', () => {
  it('404 → Credential not found', async () => {
    getPublicCredential.mockRejectedValue(notFoundError());
    render();
    expect(await screen.findByText('Credential not found')).toBeInTheDocument();
    expect(
      screen.queryByText(/temporarily unavailable/i),
    ).not.toBeInTheDocument();
  });

  it('5xx/503/network → temporary unavailable with retry (refetch), never not-found', async () => {
    getPublicCredential.mockRejectedValue(transientError(503));
    render();
    expect(
      await screen.findByText(/Verification temporarily unavailable/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Credential not found')).not.toBeInTheDocument();

    getPublicCredential.mockResolvedValue(badge());
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
  });

  it('loading shows neither not-found nor invalidity language', async () => {
    getPublicCredential.mockReturnValue(new Promise(() => {}));
    render();
    expect(
      await screen.findByText(/Verifying credential/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Credential not found')).not.toBeInTheDocument();
    expect(screen.queryByText(/revoked|invalid/i)).not.toBeInTheDocument();
  });
});

describe('public verification — privacy & token/identifier separation', () => {
  it('never shows raw tokens or internal metadata as visible content', async () => {
    getPublicCredential.mockResolvedValue(
      // Even if a stale/accidental fixture carries internal fields, they must not render.
      badge({
        qualification: {
          ...badge().qualification,
          interview: {
            ...badge().qualification.interview,
            evaluator_type: 'llm',
            model: 'claude-opus-4-8',
            evidence_fingerprint: 'abc123',
          },
        },
      }),
    );
    const { container } = render();
    await screen.findByText('Grace Hopper');
    const text = container.textContent;
    // Visible text carries no tokens/internal detail (hrefs may carry tokens).
    expect(text).not.toMatch(/tok_badge|abc123|claude-opus|evaluator_type/);
    expect(text).not.toMatch(/evidence_fingerprint|model|revoked_reason/i);
    expect(container.innerHTML).not.toMatch(
      /@|min_required|overall_threshold|model_decision|raw_response/i,
    );
    // certificate_token appears only inside an href, never as visible text.
    expect(text).not.toContain('c1');
    expect(
      container.querySelector('a[href*="/verify/c1"]'),
    ).toBeInTheDocument();
  });

  it('sets a noindex robots meta while mounted', async () => {
    getPublicCredential.mockResolvedValue(badge());
    render();
    await screen.findByText('Grace Hopper');
    const meta = document.head.querySelector('meta[name="robots"]');
    expect(meta?.getAttribute('content')).toMatch(/noindex/);
  });
});

describe('public verification — version-bound content is server-driven', () => {
  it('renders whatever standard content the API returns (no hard-coded copy)', async () => {
    getPublicCredential.mockResolvedValue(
      badge({
        competency_standard: {
          slug: 'frontend-mid-senior',
          name: 'Frontend Mid-Senior Competency Standard',
          version: '2.0',
          claim: {
            summary: 'v2 claim summary',
            boundary: null,
            demonstrated_capabilities: [],
          },
          competency_areas: [{ number: 1, name: 'v2 only area' }],
          limitations: ['v2 only limitation'],
        },
      }),
    );
    render();
    expect(await screen.findByText(/· v2\.0/)).toBeInTheDocument();
    expect(screen.getByText('v2 claim summary')).toBeInTheDocument();
    expect(screen.getByText('1. v2 only area')).toBeInTheDocument();
    expect(screen.getByText('v2 only limitation')).toBeInTheDocument();
    // Did NOT substitute v1 hard-coded content.
    expect(
      screen.queryByText('The claim is reasoning, not API recall.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Competency areas (13)')).not.toBeInTheDocument();
  });
});
