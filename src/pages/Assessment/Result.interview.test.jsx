import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentResult from './Result';

vi.mock('@api/assessments', () => ({
  getAttemptResult: vi.fn(),
  getAttempt: vi.fn(),
}));
import { getAttemptResult, getAttempt } from '@api/assessments';

// Modality (kind) is server-authoritative; credential messaging is driven by the
// authoritative credential.{state,status} (CRED-BE-3), never by passed/kind.
beforeEach(() =>
  getAttempt.mockResolvedValue({ id: 'att_1', kind: 'interview' }),
);

const render = () =>
  renderWithProviders(() => <AssessmentResult attemptId="att_1" />, {
    path: '/',
  });

const passedInterview = (credential) => ({
  passed: true,
  overall_score: 82.0,
  target_level: 'mid_senior',
  assessment_title: 'Final Frontend Mid-Senior Qualification',
  dimensions: [{ key: 'technical', label: 'Technical', score: 82.0 }],
  credential,
});

describe('Final Qualification result — credential state (authoritative)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an evaluating state while the backend reports evaluation_pending', async () => {
    getAttemptResult.mockResolvedValue({
      code: 'evaluation_pending',
      state: 'evaluating',
    });
    render();
    expect(await screen.findByText(/being evaluated/i)).toBeInTheDocument();
    expect(screen.queryByText(/not passed/i)).not.toBeInTheDocument();
  });

  it('shows "being issued" ONLY when credential.state is pending', async () => {
    getAttemptResult.mockResolvedValue(
      passedInterview({
        kind: 'seniority_badge',
        state: 'pending',
        status: null,
      }),
    );
    const { container } = render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(
      screen.getByText(/seniority credential is being issued/i),
    ).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/model_decision/i);
  });

  it('treats a MID_SENIOR interview as a seniority credential (server kind)', async () => {
    getAttemptResult.mockResolvedValue(
      passedInterview({
        kind: 'seniority_badge',
        state: 'pending',
        status: null,
      }),
    );
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(
      screen.getByText(/seniority credential is being issued/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/course certificate/i)).not.toBeInTheDocument();
  });

  it('shows issued (not "being issued") when credential.state is issued/valid', async () => {
    getAttemptResult.mockResolvedValue(
      passedInterview({
        kind: 'seniority_badge',
        state: 'issued',
        status: 'valid',
      }),
    );
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText(/has been issued/i)).toBeInTheDocument();
    expect(screen.queryByText(/being issued/i)).not.toBeInTheDocument();
  });

  it('shows credential unavailable while keeping the passed verdict', async () => {
    getAttemptResult.mockResolvedValue(
      passedInterview({
        kind: 'seniority_badge',
        state: 'unavailable',
        status: null,
      }),
    );
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/being issued/i)).not.toBeInTheDocument();
    // No internal reason leaks.
    expect(
      screen.queryByText(/prerequisite|dispatch|blocked|missing_/i),
    ).not.toBeInTheDocument();
  });

  it('issued + revoked keeps the qualification passed and shows revoked', async () => {
    getAttemptResult.mockResolvedValue(
      passedInterview({
        kind: 'seniority_badge',
        state: 'issued',
        status: 'revoked',
      }),
    );
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText(/has since been revoked/i)).toBeInTheDocument();
  });

  it('issued + revalidation_required is distinct from revoked', async () => {
    getAttemptResult.mockResolvedValue(
      passedInterview({
        kind: 'seniority_badge',
        state: 'issued',
        status: 'revalidation_required',
      }),
    );
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText(/revalidation required/i)).toBeInTheDocument();
  });

  it('NEGATIVE REGRESSION: passed alone (not_applicable) never claims issuance', async () => {
    getAttemptResult.mockResolvedValue(
      passedInterview({ kind: null, state: 'not_applicable', status: null }),
    );
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.queryByText(/being issued/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/has been issued/i)).not.toBeInTheDocument();
  });

  it('renders a failed interview without any credential issuance claim', async () => {
    getAttemptResult.mockResolvedValue({
      passed: false,
      overall_score: 40.0,
      target_level: 'mid_senior',
      assessment_title: 'Final Frontend Mid-Senior Qualification',
      dimensions: [],
      credential: { kind: null, state: 'not_applicable', status: null },
    });
    render();
    expect(await screen.findByText('Not passed')).toBeInTheDocument();
    expect(screen.getByText(/did not pass this time/i)).toBeInTheDocument();
    expect(screen.queryByText(/being issued/i)).not.toBeInTheDocument();
  });
});
