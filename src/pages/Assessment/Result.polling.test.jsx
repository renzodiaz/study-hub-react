import { screen, fireEvent } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentResult from './Result';

vi.mock('@api/assessments', () => ({ getAttemptResult: vi.fn() }));
import { getAttemptResult } from '@api/assessments';

// Control the bounded-poll hook so the stopped/keep-polling branches are
// deterministic (the hook's timing logic is covered in useBoundedPoll.test.js).
vi.mock('@hooks/useBoundedPoll', () => ({ default: vi.fn() }));
import useBoundedPoll from '@hooks/useBoundedPoll';

const render = () =>
  renderWithProviders(() => <AssessmentResult attemptId="att_1" />, {
    path: '/',
  });

describe('evaluating UI + bounded-poll integration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('while still polling (not stopped) shows evaluating without a Check again button', async () => {
    useBoundedPoll.mockReturnValue({
      intervalFn: () => false,
      stopped: false,
      reset: vi.fn(),
    });
    getAttemptResult.mockResolvedValue({ code: 'evaluation_pending' });
    render();
    expect(await screen.findByText(/being evaluated/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /check again/i }),
    ).not.toBeInTheDocument();
  });

  it('after automatic polling stops, keeps evaluating and offers Check again (manual refetch)', async () => {
    const reset = vi.fn();
    useBoundedPoll.mockReturnValue({
      intervalFn: () => false,
      stopped: true,
      reset,
    });
    getAttemptResult.mockResolvedValue({ code: 'evaluation_pending' });
    render();

    expect(
      await screen.findByText(/still being evaluated/i),
    ).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /check again/i });
    const calls = getAttemptResult.mock.calls.length;

    fireEvent.click(btn);
    expect(reset).toHaveBeenCalled();
    // refetch re-invokes the query fn.
    await screen.findByText(/still being evaluated/i);
    expect(getAttemptResult.mock.calls.length).toBeGreaterThan(calls);
  });

  it('renders the terminal result (stops evaluating) when passed', async () => {
    useBoundedPoll.mockReturnValue({
      intervalFn: () => false,
      stopped: false,
      reset: vi.fn(),
    });
    getAttemptResult.mockResolvedValue({
      passed: true,
      overall_score: 80,
      target_level: 'senior',
      assessment_title: 'Final Interview',
      dimensions: [],
    });
    render();
    expect(await screen.findByText('Passed')).toBeInTheDocument();
  });
});
