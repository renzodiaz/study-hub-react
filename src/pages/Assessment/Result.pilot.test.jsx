import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentResult from './Result';

vi.mock('@api/assessments', () => ({ getAttemptResult: vi.fn() }));
import { getAttemptResult } from '@api/assessments';

vi.mock('@hooks/useBoundedPoll', () => ({ default: vi.fn() }));
import useBoundedPoll from '@hooks/useBoundedPoll';

const render = () =>
  renderWithProviders(() => <AssessmentResult attemptId="att_pilot" />, {
    path: '/',
  });

const passedPilotResult = {
  attempt_id: 'att_pilot',
  passed: true,
  pilot: true,
  overall_score: 100,
  target_level: 'mid_senior',
  assessment_title: 'Browser, HTML Semantics & Accessibility',
  dimensions: [],
};

describe('AssessmentResult — pilot safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBoundedPoll.mockReturnValue({
      intervalFn: () => false,
      stopped: false,
      reset: vi.fn(),
    });
  });

  it('never shows credential-issued messaging for a passing pilot attempt', async () => {
    getAttemptResult.mockResolvedValue(passedPilotResult);
    render();

    expect(await screen.findByText(/passed/i)).toBeInTheDocument();
    expect(screen.getByText(/no credential is issued/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/credential is being issued/i),
    ).not.toBeInTheDocument();
  });

  it('a normal passing knowledge result still shows credential-issued copy', async () => {
    getAttemptResult.mockResolvedValue({ ...passedPilotResult, pilot: false });
    render();
    expect(
      await screen.findByText(/credential is being issued/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/no credential is issued/i),
    ).not.toBeInTheDocument();
  });
});
