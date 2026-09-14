import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import AttemptShell from './AttemptShell';

vi.mock('@api/assessments', () => ({
  getAttemptItems: vi.fn(),
  saveResponse: vi.fn(),
  saveTextResponse: vi.fn(),
  submitAttempt: vi.fn(),
  getAttemptResult: vi.fn(),
  getCareerInterview: vi.fn(),
  startAttempt: vi.fn(),
}));
import {
  getAttemptItems,
  saveTextResponse,
  submitAttempt,
  getAttemptResult,
} from '@api/assessments';

const items = (responses = {}) => ({
  attempt: {
    id: 'att_1',
    attempt_number: 1,
    version_no: 1,
    state: 'in_progress',
    expired: false,
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    assessment_title: 'Final Interview',
  },
  items: [
    {
      id: 'q1',
      position: 0,
      item_type: 'free_text',
      prompt: 'Design a rate limiter.',
      public_payload: { max_length: 1000 },
      response: responses.q1 ? { text: responses.q1 } : null,
    },
  ],
});

const render = () =>
  renderWithProviders(AttemptShell, {
    path: 'assessment-attempts/$attemptId',
    initialPath: '/assessment-attempts/att_1',
  });

describe('interview runner (free_text)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a textarea + character count for a free_text item', async () => {
    getAttemptItems.mockResolvedValue(items());
    render();
    expect(
      await screen.findByText('Design a rate limiter.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('0 / 1000')).toBeInTheDocument();
  });

  it('debounces and autosaves { text } via saveTextResponse', async () => {
    getAttemptItems.mockResolvedValue(items());
    saveTextResponse.mockResolvedValue({});
    render();
    const box = await screen.findByRole('textbox');

    fireEvent.change(box, { target: { value: 'Token bucket' } });
    expect(saveTextResponse).not.toHaveBeenCalled(); // debounced (not per-keystroke)

    await waitFor(
      () =>
        expect(saveTextResponse).toHaveBeenCalledWith(
          'att_1',
          'q1',
          'Token bucket',
        ),
      { timeout: 2000 },
    );
  });

  it('restores the server-saved answer on load (refresh-safe)', async () => {
    getAttemptItems.mockResolvedValue(items({ q1: 'my saved answer' }));
    render();
    expect(await screen.findByRole('textbox')).toHaveValue('my saved answer');
  });

  it('submits once and transitions to an evaluating state', async () => {
    getAttemptItems.mockResolvedValue(items({ q1: 'answer' }));
    submitAttempt.mockResolvedValue({ attempt: { state: 'evaluating' } });
    getAttemptResult.mockResolvedValue({
      code: 'evaluation_pending',
      state: 'evaluating',
    });

    const user = userEvent.setup();
    render();
    await screen.findByText('Design a rate limiter.');
    await user.click(screen.getByRole('button', { name: 'Submit assessment' }));
    await user.click(
      screen.getByRole('button', { name: 'Confirm submission' }),
    );

    expect(await screen.findByText(/being evaluated/i)).toBeInTheDocument();
    expect(submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('does not double-submit on a rapid double click', async () => {
    getAttemptItems.mockResolvedValue(items({ q1: 'answer' }));
    let resolveSubmit;
    submitAttempt.mockReturnValue(new Promise((r) => (resolveSubmit = r)));
    getAttemptResult.mockResolvedValue({ code: 'evaluation_pending' });

    const user = userEvent.setup();
    render();
    await screen.findByText('Design a rate limiter.');
    await user.click(screen.getByRole('button', { name: 'Submit assessment' }));
    const confirm = screen.getByRole('button', { name: 'Confirm submission' });
    await user.click(confirm);
    await user.click(confirm); // second click while in flight

    resolveSubmit({ attempt: { state: 'evaluating' } });
    await screen.findByText(/being evaluated/i);
    expect(submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('does not double-save under React StrictMode', async () => {
    getAttemptItems.mockResolvedValue(items());
    saveTextResponse.mockResolvedValue({});
    renderWithProviders(AttemptShell, {
      path: 'assessment-attempts/$attemptId',
      initialPath: '/assessment-attempts/att_1',
      strict: true, // dev mount → unmount → remount
    });
    const box = await screen.findByRole('textbox');
    fireEvent.change(box, { target: { value: 'once' } });
    await waitFor(() => expect(saveTextResponse).toHaveBeenCalled(), {
      timeout: 2000,
    });
    expect(saveTextResponse).toHaveBeenCalledTimes(1);
  });
});
