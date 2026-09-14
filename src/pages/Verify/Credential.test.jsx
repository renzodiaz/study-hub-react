import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Credential from './Credential';

vi.mock('@api/learn', () => ({ getPublicCredential: vi.fn() }));
import { getPublicCredential } from '@api/learn';

const render = () =>
  renderWithProviders(Credential, {
    path: 'verify/$token',
    initialPath: '/verify/tok_123',
  });

// getPublicCredential returns the normalized attributes (id + credential_type + …).
const certificate = (overrides = {}) => ({
  id: 'tok_123',
  credential_type: 'certificate',
  holder_name: 'Ada Lovelace',
  course_title: 'Ruby Fundamentals',
  credential_kind: 'knowledge',
  status: 'valid',
  target_level: 'mid_senior',
  overall_score: 88.5,
  dimensions: [{ key: 'technical', label: 'Technical', score: 88.5 }],
  ...overrides,
});

const badge = (overrides = {}) => ({
  id: 'tok_badge',
  credential_type: 'seniority_badge',
  status: 'valid',
  holder_name: 'Grace Hopper',
  career: { name: 'Full-Stack Ruby', target_level: 'senior' },
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
      target_level: 'senior',
      overall_score: 82.0,
      dimension_scores: [{ key: 'technical', score: 82.0 }],
      evaluator_type: 'llm',
      model: 'claude-opus-4-8',
      evidence_fingerprint: 'abc123',
    },
  },
  ...overrides,
});

describe('unified public verification', () => {
  it('renders a certificate by credential_type', async () => {
    getPublicCredential.mockResolvedValue(certificate());
    render();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Verified by Study Hub')).toBeInTheDocument();
    expect(screen.getByText('Ruby Fundamentals')).toBeInTheDocument();
  });

  it('renders a valid seniority badge with bounded fields', async () => {
    getPublicCredential.mockResolvedValue(badge());
    render();
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText(/Senior · Full-Stack Ruby/)).toBeInTheDocument();
    expect(
      screen.getByText('This credential is currently valid.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('82.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Ruby')).toBeInTheDocument();
  });

  it('distinguishes revalidation_required from revoked', async () => {
    getPublicCredential.mockResolvedValue(
      badge({ status: 'revalidation_required' }),
    );
    const { unmount } = render();
    expect(
      await screen.findByText('Revalidation required'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/one of the exact prerequisite credentials/i),
    ).toBeInTheDocument();
    unmount();

    getPublicCredential.mockResolvedValue(badge({ status: 'revoked' }));
    render();
    expect(await screen.findByText('Credential revoked')).toBeInTheDocument();
    expect(
      screen.getByText('This credential has been explicitly revoked.'),
    ).toBeInTheDocument();
  });

  it('shows a generic not-found for an unknown token', async () => {
    getPublicCredential.mockRejectedValue(new Error('Credential not found'));
    render();
    expect(await screen.findByText('Credential not found')).toBeInTheDocument();
  });

  it('never renders email, thresholds, model_decision, or raw provider output', async () => {
    getPublicCredential.mockResolvedValue(badge());
    const { container } = render();
    await screen.findByText('Grace Hopper');
    const html = container.innerHTML;
    expect(html).not.toMatch(
      /@|min_required|overall_threshold|model_decision|raw_response|request_id/i,
    );
  });
});
