import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentResult from './Result';

vi.mock('@api/assessments', () => ({
  getAttemptResult: vi.fn(),
  getAttempt: vi.fn(),
}));
import { getAttemptResult, getAttempt } from '@api/assessments';

// Interview modality is server-authoritative via the owner-scoped attempt
// endpoint (kind), never inferred from target_level.
beforeEach(() =>
  getAttempt.mockResolvedValue({ id: 'att_1', kind: 'interview' }),
);

const render = () =>
  renderWithProviders(() => <AssessmentResult attemptId="att_1" />, {
    path: '/',
  });

describe('interview result', () => {
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

  it('renders a passed interview with a credential-pending note (never model_decision)', async () => {
    getAttemptResult.mockResolvedValue({
      passed: true,
      overall_score: 82.0,
      target_level: 'senior',
      assessment_title: 'Final Interview',
      model_decision: 'pass', // must be ignored
      dimensions: [{ key: 'technical', label: 'Technical', score: 82.0 }],
    });
    const { container } = render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(
      screen.getByText(/seniority credential is being issued/i),
    ).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/model_decision/i);
  });

  it('treats a MID_SENIOR interview as a seniority credential (kind, not target_level)', async () => {
    // The Frontend Mid-Senior qualification shares target_level "mid_senior"
    // with course assessments; only server `kind` distinguishes them.
    getAttempt.mockResolvedValue({ id: 'att_1', kind: 'interview' });
    getAttemptResult.mockResolvedValue({
      passed: true,
      overall_score: 85.0,
      target_level: 'mid_senior',
      assessment_title: 'Final Frontend Mid-Senior Qualification',
      dimensions: [],
    });
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(
      screen.getByText(/seniority credential is being issued/i),
    ).toBeInTheDocument();
    // Must NOT mislabel it as a course/knowledge credential.
    expect(screen.queryByText(/knowledge credential/i)).not.toBeInTheDocument();
  });

  it('renders a failed interview without any lower-level credit', async () => {
    getAttemptResult.mockResolvedValue({
      passed: false,
      overall_score: 40.0,
      target_level: 'senior',
      assessment_title: 'Final Interview',
      dimensions: [],
    });
    render();
    expect(await screen.findByText('Not passed')).toBeInTheDocument();
    expect(screen.getByText(/did not pass this time/i)).toBeInTheDocument();
    expect(screen.queryByText(/mid/i)).not.toBeInTheDocument();
  });
});
