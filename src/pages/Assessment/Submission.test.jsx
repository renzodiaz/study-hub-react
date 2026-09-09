import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentAttemptShell from './AttemptShell';

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const flush = (fn) => act(async () => fn());

vi.mock('@api/assessments', () => ({
  getAttemptItems: vi.fn(),
  saveResponse: vi.fn(),
  submitAttempt: vi.fn(),
  getAttemptResult: vi.fn(),
  getAttempt: vi.fn(),
  getCourseAssessment: vi.fn(),
  startAttempt: vi.fn(),
}));
import {
  getAttemptItems,
  saveResponse,
  submitAttempt,
  getAttemptResult,
} from '@api/assessments';

const runnerData = (overrides = {}) => ({
  attempt: {
    id: 'att_1',
    attempt_number: 1,
    state: 'in_progress',
    expired: false,
    started_at: '2026-09-07T10:00:00Z',
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    server_time: new Date().toISOString(),
    seconds_remaining: 3600,
    assessment_title: 'Backend Engineering Credential',
    version_no: 1,
    time_limit_seconds: 3600,
    ...overrides.attempt,
  },
  items: overrides.items ?? [
    {
      id: 'it_1',
      position: 0,
      item_type: 'single_choice',
      prompt: 'What is a closure?',
      public_payload: {
        options: [
          { id: 'opt_a', label: 'Alpha' },
          { id: 'opt_b', label: 'Beta' },
        ],
      },
      response: null,
    },
  ],
});

const resultData = (overrides = {}) => ({
  attempt_id: 'att_1',
  attempt_number: 1,
  state: 'passed',
  passed: true,
  overall_score: 100.0,
  target_level: 'mid_senior',
  assessment_title: 'Backend Engineering Credential',
  submitted_at: '2026-09-07T10:20:00Z',
  evaluator_version: 'deterministic-v1',
  dimensions: [{ key: 'technical', label: 'Technical', score: 100.0 }],
  ...overrides,
});

const renderRunner = () =>
  renderWithProviders(AssessmentAttemptShell, {
    path: '/assessment-attempts/$attemptId',
    initialPath: '/assessment-attempts/att_1',
  });

describe('AttemptShell submission', () => {
  it('opens a confirmation dialog showing answered/unanswered counts', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    renderRunner();

    await screen.findByText('What is a closure?');
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/answered\s*0\s*of\s*1/i);
    expect(dialog).toHaveTextContent(/1 unanswered/i);
  });

  it('flushes pending autosaves before calling submit', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    const saveD = deferred();
    saveResponse.mockReturnValueOnce(saveD.promise);
    submitAttempt.mockResolvedValue(resultData());
    getAttemptResult.mockResolvedValue(resultData());
    renderRunner();

    await userEvent.click(await screen.findByRole('radio', { name: 'Alpha' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirm submission/i }),
    );

    // Save still in flight → submit must NOT have been called yet.
    expect(submitAttempt).not.toHaveBeenCalled();

    await flush(() => saveD.resolve({}));
    expect(submitAttempt).toHaveBeenCalledWith('att_1');
    expect(await screen.findByText('Passed')).toBeInTheDocument();
  });

  it('blocks submit when an autosave has failed', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    saveResponse.mockRejectedValueOnce(new Error('network'));
    renderRunner();

    await userEvent.click(await screen.findByRole('radio', { name: 'Alpha' }));
    await screen.findByText('Could not save');

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirm submission/i }),
    );

    expect(submitAttempt).not.toHaveBeenCalled();
    expect(screen.getByText(/didn’t save|didn't save/i)).toBeInTheDocument();
  });

  it('does not submit if the attempt expires while flushing autosaves', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    const saveD = deferred();
    saveResponse.mockReturnValueOnce(saveD.promise);
    renderRunner();

    await userEvent.click(await screen.findByRole('radio', { name: 'Alpha' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirm submission/i }),
    );

    const expired = new Error('expired');
    expired.code = 'attempt_expired';
    await flush(() => saveD.reject(expired));

    expect(submitAttempt).not.toHaveBeenCalled();
    expect(screen.getByText(/this attempt has expired/i)).toBeInTheDocument();
  });

  it('does not call submit twice on a double click', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    submitAttempt.mockReturnValueOnce(deferred().promise); // stays pending
    renderRunner();

    await screen.findByText('What is a closure?');
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );
    const confirm = screen.getByRole('button', { name: /confirm submission/i });
    await userEvent.click(confirm);
    await userEvent.click(confirm); // disabled after first click

    expect(submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('renders the pass result after a successful submission', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    submitAttempt.mockResolvedValue(resultData());
    getAttemptResult.mockResolvedValue(resultData());
    renderRunner();

    await screen.findByText('What is a closure?');
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirm submission/i }),
    );

    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
  });

  it('renders a not-passed result on a failing submission', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    const failing = resultData({
      passed: false,
      overall_score: 20.0,
      state: 'failed',
    });
    submitAttempt.mockResolvedValue(failing);
    getAttemptResult.mockResolvedValue(failing);
    renderRunner();

    await screen.findByText('What is a closure?');
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirm submission/i }),
    );

    expect(await screen.findByText('Not passed')).toBeInTheDocument();
  });

  it('restores the result when loading an already-submitted attempt', async () => {
    const submitted = new Error('submitted');
    submitted.code = 'attempt_submitted';
    getAttemptItems.mockRejectedValue(submitted);
    getAttemptResult.mockResolvedValue(resultData());
    renderRunner();

    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
  });

  it('offers no submit action for an expired attempt', async () => {
    getAttemptItems.mockResolvedValue(
      runnerData({ attempt: { expired: true, state: 'expired' } }),
    );
    renderRunner();

    await screen.findByText(/this attempt has expired/i);
    expect(
      screen.queryByRole('button', { name: 'Submit assessment' }),
    ).not.toBeInTheDocument();
  });

  describe('result precision', () => {
    const restoreWith = (result) => {
      const submitted = new Error('submitted');
      submitted.code = 'attempt_submitted';
      getAttemptItems.mockRejectedValue(submitted);
      getAttemptResult.mockResolvedValue(result);
      renderRunner();
    };

    it('renders the overall score at exactly 2 decimals (79.49 → 79.49)', async () => {
      restoreWith(
        resultData({
          overall_score: 79.49,
          dimensions: [{ key: 'technical', label: 'Technical', score: 66.67 }],
        }),
      );
      expect(await screen.findByText('79.49')).toBeInTheDocument();
      expect(screen.getByText('66.67')).toBeInTheDocument();
      // No whole-number rounding.
      expect(screen.queryByText('79')).not.toBeInTheDocument();
      expect(screen.queryByText('67')).not.toBeInTheDocument();
    });

    it('formats a whole-number score with 2 decimals (80 → 80.00)', async () => {
      restoreWith(
        resultData({
          overall_score: 80,
          dimensions: [{ key: 'technical', label: 'Technical', score: 100 }],
        }),
      );
      expect(await screen.findByText('80.00')).toBeInTheDocument();
      expect(screen.getByText('100.00')).toBeInTheDocument();
    });

    it('derives pass/fail from the backend flag, not the score', async () => {
      // High score but backend says not passed (e.g. a mandatory minimum missed).
      restoreWith(resultData({ passed: false, overall_score: 95.0 }));
      expect(await screen.findByText('Not passed')).toBeInTheDocument();
    });
  });

  it('shows no correct-answer review or grading keys on the result', async () => {
    getAttemptItems.mockResolvedValue(runnerData());
    submitAttempt.mockResolvedValue(resultData());
    getAttemptResult.mockResolvedValue(resultData());
    renderRunner();

    await screen.findByText('What is a closure?');
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit assessment' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirm submission/i }),
    );
    await screen.findByText('Passed');

    expect(document.body.innerHTML).not.toMatch(
      /answer_key|selected_option_ids|"correct"/,
    );
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument();
  });
});
