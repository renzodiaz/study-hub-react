import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Certificate from './Certificate';

vi.mock('@api/learn', () => ({
  getPublicCertificate: vi.fn(),
}));
import { getPublicCertificate } from '@api/learn';

const knowledge = (overrides = {}) => ({
  id: 'tok_123',
  credential_kind: 'knowledge',
  status: 'valid',
  holder_name: 'Ada Lovelace',
  course_title: 'React Fundamentals',
  target_level: 'mid_senior',
  overall_score: 87.5,
  evaluator_version: 'deterministic-v1',
  dimensions: [{ key: 'technical', label: 'Technical', score: 90 }],
  issued_at: '2026-09-08T10:00:00Z',
  ...overrides,
});

const renderVerify = () =>
  renderWithProviders(Certificate, {
    path: 'verify/$token',
    initialPath: '/verify/tok_123',
  });

describe('public credential verification', () => {
  it('shows a valid knowledge credential with the target standard and score', async () => {
    getPublicCertificate.mockResolvedValue(knowledge());
    renderVerify();

    expect(await screen.findByText('Verified Knowledge')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Mid-Senior standard')).toBeInTheDocument();
    expect(screen.getByText('87.50')).toBeInTheDocument(); // overall
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('90.00')).toBeInTheDocument(); // dimension
  });

  it('uses knowledge-standard wording, never a seniority-title claim', async () => {
    getPublicCertificate.mockResolvedValue(knowledge());
    renderVerify();
    await screen.findByText('Verified Knowledge');

    expect(
      screen.queryByText(/Verified Mid-Senior Engineer/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Certified Senior Engineer/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Full Seniority/i)).not.toBeInTheDocument();
    // No private grading detail leaks into the DOM.
    expect(document.body.innerHTML).not.toMatch(
      /answer_key|selected_option_ids|min_required/,
    );
  });

  it('shows a revoked credential as no longer valid', async () => {
    getPublicCertificate.mockResolvedValue(knowledge({ status: 'revoked' }));
    renderVerify();

    expect(await screen.findByText('Credential revoked')).toBeInTheDocument();
    expect(screen.getByText(/no longer valid/i)).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown token', async () => {
    getPublicCertificate.mockRejectedValue(new Error('Certificate not found'));
    renderVerify();

    expect(
      await screen.findByText('Certificate not found'),
    ).toBeInTheDocument();
  });

  it('verifies a legacy course certificate', async () => {
    getPublicCertificate.mockResolvedValue({
      id: 'tok_9',
      credential_kind: 'course',
      status: 'valid',
      holder_name: 'Grace Hopper',
      course_title: 'Intro to Programming',
      level: 'senior',
      issued_at: '2026-01-01T00:00:00Z',
    });
    renderVerify();

    expect(
      await screen.findByText(/has been certified in/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Senior level')).toBeInTheDocument();
  });
});
