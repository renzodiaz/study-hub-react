import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentResult from './Result';

vi.mock('@api/assessments', () => ({ getAttemptResult: vi.fn() }));
import { getAttemptResult } from '@api/assessments';

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
