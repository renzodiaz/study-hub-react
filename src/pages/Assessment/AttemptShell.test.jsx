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
  getAttempt: vi.fn(),
  getCourseAssessment: vi.fn(),
  startAttempt: vi.fn(),
}));
import { getAttemptItems, saveResponse } from '@api/assessments';

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
