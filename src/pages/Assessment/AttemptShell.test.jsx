import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentAttemptShell from './AttemptShell';

// A promise whose resolution we control, to deterministically hold a save
// "in flight" and observe the queue — no timers, no arbitrary sleeps.
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Flush a settled promise's microtasks inside act() so React state updates from
// its .then/.catch are applied before assertions.
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

// The learner-safe result the submit endpoint returns (seeds the result screen).
const passResult = (overrides = {}) => ({
  attempt_id: 'att_1',
  attempt_number: 1,
  state: 'passed',
  passed: true,
  overall_score: 100.0,
  assessment_title: 'Backend Engineering Credential',
  target_level: 'mid_senior',
  submitted_at: '2026-09-08T10:00:00Z',
  dimensions: [{ key: 'technical', label: 'Technical', score: 100.0 }],
  ...overrides,
});

// A full runner payload with two ordered items (single- then multiple-choice).
// expires_at is far in the future so the display countdown is non-zero and the
// attempt is not treated as locally expired.
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
    {
      id: 'it_2',
      position: 1,
      item_type: 'multiple_choice',
      prompt: 'Which are HTTP-safe methods?',
      public_payload: {
        options: [
          { id: 'opt_a', label: 'Alpha' },
          { id: 'opt_b', label: 'Beta' },
          { id: 'opt_c', label: 'Gamma' },
        ],
      },
      response: null,
    },
  ],
});

const renderRunner = () =>
  renderWithProviders(AssessmentAttemptShell, {
    path: '/assessment-attempts/$attemptId',
    initialPath: '/assessment-attempts/att_1',
  });

describe('AssessmentAttemptShell (runner)', () => {
  describe('load and restoration', () => {
    it('fetches items and renders the ordered first question', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      renderRunner();

      expect(await screen.findByText('What is a closure?')).toBeInTheDocument();
      expect(getAttemptItems).toHaveBeenCalledWith('att_1');
      // Two questions in the navigator, in server order.
      expect(
        screen.getByRole('button', { name: /^Question 1/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^Question 2/ }),
      ).toBeInTheDocument();
    });

    it('restores a previously saved single-choice answer from the server', async () => {
      const data = runnerData();
      data.items[0].response = { selected_option_ids: ['opt_b'] };
      getAttemptItems.mockResolvedValue(data);
      renderRunner();

      const beta = await screen.findByRole('radio', { name: 'Beta' });
      expect(beta).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Alpha' })).not.toBeChecked();
    });

    it('restores a saved multiple-choice answer (both selections)', async () => {
      const data = runnerData();
      data.items[1].response = { selected_option_ids: ['opt_a', 'opt_c'] };
      getAttemptItems.mockResolvedValue(data);
      renderRunner();

      await screen.findByText('What is a closure?');
      await userEvent.click(
        screen.getByRole('button', { name: /^Question 2/ }),
      );

      expect(screen.getByRole('checkbox', { name: 'Alpha' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Gamma' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Beta' })).not.toBeChecked();
    });
  });

  describe('single choice autosave', () => {
    it('sends the stable option id and shows a saved state', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockResolvedValue({
        item_id: 'it_1',
        response: { selected_option_ids: ['opt_b'] },
        attempt: {},
      });
      renderRunner();

      const beta = await screen.findByRole('radio', { name: 'Beta' });
      await userEvent.click(beta);

      await waitFor(() =>
        expect(saveResponse).toHaveBeenCalledWith('att_1', 'it_1', ['opt_b']),
      );
      expect(await screen.findByText('Saved')).toBeInTheDocument();
      expect(beta).toBeChecked();
    });
  });

  describe('multiple choice autosave', () => {
    it('accumulates selections into a canonical payload', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockResolvedValue({ response: {}, attempt: {} });
      renderRunner();

      await screen.findByText('What is a closure?');
      await userEvent.click(
        screen.getByRole('button', { name: /^Question 2/ }),
      );
      await userEvent.click(screen.getByRole('checkbox', { name: 'Alpha' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Gamma' }));

      await waitFor(() =>
        expect(saveResponse).toHaveBeenLastCalledWith('att_1', 'it_2', [
          'opt_a',
          'opt_c',
        ]),
      );
    });
  });

  describe('navigation', () => {
    it('preserves a selected answer when moving between questions', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockResolvedValue({ response: {}, attempt: {} });
      renderRunner();

      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(
        screen.getByText('Which are HTTP-safe methods?'),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
      expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    });
  });

  describe('autosave failure', () => {
    it('keeps the selection, shows an error, and retries successfully', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockRejectedValueOnce(new Error('network'));
      renderRunner();

      const alpha = await screen.findByRole('radio', { name: 'Alpha' });
      await userEvent.click(alpha);

      expect(await screen.findByText('Could not save')).toBeInTheDocument();
      expect(alpha).toBeChecked(); // selection is NOT lost

      saveResponse.mockResolvedValueOnce({ response: {}, attempt: {} });
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(await screen.findByText('Saved')).toBeInTheDocument();
    });
  });

  describe('expiration authority', () => {
    it('disables editing when a save is rejected as expired (server, not clock)', async () => {
      getAttemptItems.mockResolvedValue(runnerData()); // countdown shows time left
      const expiredErr = new Error('expired');
      expiredErr.code = 'attempt_expired';
      saveResponse.mockRejectedValue(expiredErr);
      renderRunner();

      const alpha = await screen.findByRole('radio', { name: 'Alpha' });
      await userEvent.click(alpha);

      // Server said expired → inputs disabled even though the local clock has
      // time remaining. The client clock is never the authority.
      await waitFor(() =>
        expect(screen.getByRole('radio', { name: 'Alpha' })).toBeDisabled(),
      );
      expect(screen.getByText(/this attempt has expired/i)).toBeInTheDocument();
    });

    it('shows an expired state when the runner loads an already-expired attempt', async () => {
      const err = new Error('gone');
      err.code = 'attempt_expired';
      getAttemptItems.mockRejectedValue(err);
      renderRunner();

      expect(
        await screen.findByText(/this attempt has expired/i),
      ).toBeInTheDocument();
    });
  });

  describe('autosave serialization (ordering / races)', () => {
    // A single-choice item with three options, so A→B→C are three distinct
    // whole answers rather than accumulating toggles.
    const threeOptionSingle = () => {
      const d = runnerData();
      d.items = [
        {
          id: 'it_1',
          position: 0,
          item_type: 'single_choice',
          prompt: 'Pick one',
          public_payload: {
            options: [
              { id: 'opt_a', label: 'Alpha' },
              { id: 'opt_b', label: 'Beta' },
              { id: 'opt_c', label: 'Gamma' },
            ],
          },
          response: null,
        },
      ];
      return d;
    };

    it('never starts a second save while one is in flight; sends the newest after', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      const d1 = deferred();
      const d2 = deferred();
      saveResponse
        .mockReturnValueOnce(d1.promise)
        .mockReturnValueOnce(d2.promise);
      renderRunner();

      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(screen.getByRole('radio', { name: 'Beta' }));

      // Second change is queued, NOT sent concurrently.
      expect(saveResponse).toHaveBeenCalledTimes(1);
      expect(saveResponse).toHaveBeenLastCalledWith('att_1', 'it_1', ['opt_a']);

      await flush(() => d1.resolve({})); // first settles → flush pending
      expect(saveResponse).toHaveBeenCalledTimes(2);
      expect(saveResponse).toHaveBeenLastCalledWith('att_1', 'it_1', ['opt_b']);

      await flush(() => d2.resolve({}));
      expect(await screen.findByText('Saved')).toBeInTheDocument();
    });

    it('coalesces rapid A→B→C to A then C (no wasted B request)', async () => {
      getAttemptItems.mockResolvedValue(threeOptionSingle());
      const d1 = deferred();
      const d2 = deferred();
      saveResponse
        .mockReturnValueOnce(d1.promise)
        .mockReturnValueOnce(d2.promise);
      renderRunner();

      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(screen.getByRole('radio', { name: 'Beta' }));
      await userEvent.click(screen.getByRole('radio', { name: 'Gamma' }));

      expect(saveResponse).toHaveBeenCalledTimes(1); // only A is in flight

      await flush(() => d1.resolve({})); // flush newest pending = C
      expect(saveResponse).toHaveBeenCalledTimes(2);
      expect(saveResponse.mock.calls.map((c) => c[2])).toEqual([
        ['opt_a'],
        ['opt_c'],
      ]); // B was never sent
      await flush(() => d2.resolve({}));
    });

    it('keeps the newer selection when an earlier save fails; retry sends the newest', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      const d1 = deferred();
      saveResponse.mockReturnValueOnce(d1.promise);
      renderRunner();

      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(screen.getByRole('radio', { name: 'Beta' })); // pending B

      await flush(() => d1.reject(new Error('network'))); // A fails

      expect(screen.getByText('Could not save')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked(); // B not lost

      saveResponse.mockResolvedValueOnce({}); // retry succeeds
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

      await waitFor(() =>
        expect(saveResponse).toHaveBeenLastCalledWith('att_1', 'it_1', [
          'opt_b',
        ]),
      );
      expect(await screen.findByText('Saved')).toBeInTheDocument();
    });

    it('does not discard a pending save when navigating to another question', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      const d1 = deferred();
      const d2 = deferred();
      saveResponse
        .mockReturnValueOnce(d1.promise)
        .mockReturnValueOnce(d2.promise);
      renderRunner();

      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(screen.getByRole('radio', { name: 'Beta' })); // pending B
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));

      await flush(() => d1.resolve({})); // queue continues despite navigation
      expect(saveResponse).toHaveBeenCalledTimes(2);
      expect(saveResponse).toHaveBeenLastCalledWith('att_1', 'it_1', ['opt_b']);
      await flush(() => d2.resolve({}));
    });

    it('stops the queue and marks expired if a save returns attempt_expired', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      const d1 = deferred();
      saveResponse.mockReturnValueOnce(d1.promise);
      renderRunner();

      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(screen.getByRole('radio', { name: 'Beta' })); // pending B

      const err = new Error('expired');
      err.code = 'attempt_expired';
      await flush(() => d1.reject(err));

      // Pending B is dropped — never sent — and editing is disabled.
      expect(saveResponse).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/this attempt has expired/i)).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Beta' })).toBeDisabled();
    });
  });

  describe('submission → result transition', () => {
    // Drive: answer → open confirm → confirm. Returns after the confirm click.
    const submitFlow = async ({ strict = false } = {}) => {
      // Result seeds from the submit response but also refetches this endpoint.
      getAttemptResult.mockResolvedValue(passResult());
      renderWithProviders(AssessmentAttemptShell, {
        path: '/assessment-attempts/$attemptId',
        initialPath: '/assessment-attempts/att_1',
        strict,
      });
      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Submit assessment' }),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Confirm submission' }),
      );
    };

    it('successful submit shows the result and clears "Submitting…"', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockResolvedValue({ response: {}, attempt: {} });
      submitAttempt.mockResolvedValue(passResult());
      await submitFlow();

      expect(
        await screen.findByRole('heading', { name: 'Passed' }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Submitting…')).not.toBeInTheDocument();
      expect(submitAttempt).toHaveBeenCalledWith('att_1');
    });

    // Regression: under StrictMode (mount → unmount → remount, as the real app
    // runs) the old mountedRef pattern stayed false and swallowed setResult, so
    // the UI got stuck on "Submitting…". This must transition to the result.
    it('successful submit transitions to the result UNDER StrictMode', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockResolvedValue({ response: {}, attempt: {} });
      submitAttempt.mockResolvedValue(passResult());
      await submitFlow({ strict: true });

      expect(
        await screen.findByRole('heading', { name: 'Passed' }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Submitting…')).not.toBeInTheDocument();
    });

    it('flushes a pending autosave before submitting, then submits exactly once', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      const save = deferred();
      saveResponse.mockReturnValueOnce(save.promise); // held in-flight
      submitAttempt.mockResolvedValue(passResult());
      getAttemptResult.mockResolvedValue(passResult());

      renderWithProviders(AssessmentAttemptShell, {
        path: '/assessment-attempts/$attemptId',
        initialPath: '/assessment-attempts/att_1',
      });
      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Submit assessment' }),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Confirm submission' }),
      );

      // Submit must NOT fire while the autosave is still in flight.
      expect(submitAttempt).not.toHaveBeenCalled();

      await flush(() => save.resolve({ response: {}, attempt: {} })); // drain → submit
      expect(
        await screen.findByRole('heading', { name: 'Passed' }),
      ).toBeInTheDocument();
      expect(submitAttempt).toHaveBeenCalledTimes(1);
    });

    it('a failed submit leaves a recoverable state (no false result, retry possible)', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockResolvedValue({ response: {}, attempt: {} });
      submitAttempt
        .mockRejectedValueOnce(
          new Error('Submission failed. Please try again.'),
        )
        .mockResolvedValueOnce(passResult());
      await submitFlow();

      expect(
        await screen.findByText(/submission failed\. please try again\./i),
      ).toBeInTheDocument();
      // Never a false pass, and the runner is not stuck submitting.
      expect(
        screen.queryByRole('heading', { name: 'Passed' }),
      ).not.toBeInTheDocument();
      const confirm = screen.getByRole('button', {
        name: 'Confirm submission',
      });
      expect(confirm).toBeEnabled();

      await userEvent.click(confirm); // retry succeeds
      expect(
        await screen.findByRole('heading', { name: 'Passed' }),
      ).toBeInTheDocument();
    });

    it('rapid double-confirm submits exactly once', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      saveResponse.mockResolvedValue({ response: {}, attempt: {} });
      const submit = deferred();
      submitAttempt.mockReturnValue(submit.promise); // hold in-flight
      getAttemptResult.mockResolvedValue(passResult());

      renderWithProviders(AssessmentAttemptShell, {
        path: '/assessment-attempts/$attemptId',
        initialPath: '/assessment-attempts/att_1',
      });
      await userEvent.click(
        await screen.findByRole('radio', { name: 'Alpha' }),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Submit assessment' }),
      );
      const confirm = screen.getByRole('button', {
        name: /Confirm submission|Submitting…/,
      });
      await userEvent.click(confirm);
      await userEvent.click(confirm); // second click while in-flight (disabled + ref guard)

      expect(submitAttempt).toHaveBeenCalledTimes(1);
      await flush(() => submit.resolve(passResult()));
      expect(
        await screen.findByRole('heading', { name: 'Passed' }),
      ).toBeInTheDocument();
    });

    it('an already-submitted attempt (refresh) renders the result without re-submitting', async () => {
      const err = new Error('already submitted');
      err.code = 'attempt_submitted';
      getAttemptItems.mockRejectedValue(err); // items endpoint reports submitted
      getAttemptResult.mockResolvedValue(passResult());

      renderWithProviders(AssessmentAttemptShell, {
        path: '/assessment-attempts/$attemptId',
        initialPath: '/assessment-attempts/att_1',
      });

      expect(
        await screen.findByRole('heading', { name: 'Passed' }),
      ).toBeInTheDocument();
      expect(submitAttempt).not.toHaveBeenCalled(); // no re-submit on restore
      expect(getAttemptResult).toHaveBeenCalledWith('att_1');
    });
  });

  describe('question-bank safety', () => {
    it('never renders correctness indicators or grading data', async () => {
      getAttemptItems.mockResolvedValue(runnerData());
      renderRunner();

      await screen.findByText('What is a closure?');
      // No correctness UI exists in the runner.
      expect(screen.queryByText(/correct/i)).not.toBeInTheDocument();
      expect(document.body.innerHTML).not.toMatch(/answer_key/);
    });
  });
});
