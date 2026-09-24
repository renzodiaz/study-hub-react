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

  it('offers "Check again" for a credential still pending after the poll bound', async () => {
    const reset = vi.fn();
    useBoundedPoll.mockReturnValue({
      intervalFn: () => false,
      stopped: true,
      reset,
    });
    getAttemptResult.mockResolvedValue({
      passed: true,
      overall_score: 80,
      target_level: 'mid_senior',
      assessment_title: 'Final Frontend Mid-Senior Qualification',
      dimensions: [],
      credential: { kind: 'seniority_badge', state: 'pending', status: null },
    });
    render();

    expect(
      await screen.findByText(/will appear in your Credentials/i),
    ).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /check again/i });
    const calls = getAttemptResult.mock.calls.length;
    fireEvent.click(btn);
    expect(reset).toHaveBeenCalled();
    await screen.findByText(/will appear in your Credentials/i);
    expect(getAttemptResult.mock.calls.length).toBeGreaterThan(calls);
  });

  it('does not offer "Check again" for a pending credential while still refreshing', async () => {
    useBoundedPoll.mockReturnValue({
      intervalFn: () => 1000,
      stopped: false,
      reset: vi.fn(),
    });
    getAttemptResult.mockResolvedValue({
      passed: true,
      overall_score: 80,
      target_level: 'mid_senior',
      assessment_title: 'Final Frontend Mid-Senior Qualification',
      dimensions: [],
      credential: { kind: 'seniority_badge', state: 'pending', status: null },
    });
    render();
    expect(
      await screen.findByText(/will appear in your Credentials/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /check again/i }),
    ).not.toBeInTheDocument();
  });

  // The bounded-poll predicate: credential issuance is refreshed only while it can
  // legitimately transition, and stops on every terminal state (the hook's timing,
  // bound, and unmount mechanics are covered in useBoundedPoll.test.js).
  it('refreshes while credential is pending and stops on every terminal state', async () => {
    useBoundedPoll.mockReturnValue({
      intervalFn: () => false,
      stopped: false,
      reset: vi.fn(),
    });
    getAttemptResult.mockResolvedValue({ code: 'evaluation_pending' });
    render();
    await screen.findByText(/being evaluated/i);

    const { isPending } = useBoundedPoll.mock.calls[0][0];
    // evaluation still pending → refresh
    expect(isPending({ code: 'evaluation_pending' })).toBe(true);
    // credential pending → refresh
    expect(isPending({ credential: { state: 'pending' } })).toBe(true);
    // terminal credential states → stop
    expect(isPending({ credential: { state: 'issued' } })).toBe(false);
    expect(isPending({ credential: { state: 'unavailable' } })).toBe(false);
    expect(isPending({ credential: { state: 'not_applicable' } })).toBe(false);
    // a graded result with no credential projection → stop
    expect(isPending({ passed: true })).toBe(false);
  });
});
