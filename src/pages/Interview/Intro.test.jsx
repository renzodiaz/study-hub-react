import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import InterviewIntro from './Intro';

vi.mock('@api/assessments', () => ({
  getCareerInterview: vi.fn(),
  startAttempt: vi.fn(),
}));
import { getCareerInterview } from '@api/assessments';

const render = () =>
  renderWithProviders(InterviewIntro, {
    path: 'learn/$trackId/interview',
    initialPath: '/learn/trk_1/interview',
    extraRoutes: [
      {
        path: 'assessment-attempts/$attemptId',
        component: () => <div>runner</div>,
      },
      { path: 'achievements', component: () => <div>achievements</div> },
      { path: 'pricing', component: () => <div>pricing</div> },
      { path: 'learn/$trackId', component: () => <div>track</div> },
    ],
  });

const payload = (
  attempt = {},
  credential = { state: 'none', badge: null },
) => ({
  assessment: {
    id: 'asmt_1',
    title: 'Full-Stack Ruby — Senior Interview',
    target_level: 'senior',
    version_no: 1,
    questions_count: 5,
    time_limit_seconds: 3600,
    max_attempts: 3,
  },
  qualification: { ready_for_interview: true, reason: null },
  attempt: {
    state: 'none',
    active_attempt_id: null,
    can_start: true,
    can_resume: false,
    attempts_remaining: 3,
    next_eligible_at: null,
    reason: null,
    ...attempt,
  },
  credential,
});

describe('interview intro', () => {
  it('shows safe metadata and a Start CTA for a ready learner', async () => {
    getCareerInterview.mockResolvedValue(payload());
    render();
    expect(
      await screen.findByText('Full-Stack Ruby — Senior Interview'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Final interview · Senior level'),
    ).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // questions_count
    expect(
      screen.getByRole('button', { name: /start final interview/i }),
    ).toBeEnabled();
  });

  it('does not render hidden rubric/evaluator data', async () => {
    getCareerInterview.mockResolvedValue(payload());
    const { container } = render();
    await screen.findByText(/Senior Interview/);
    expect(container.innerHTML).not.toMatch(
      /min_required|threshold|evaluator|prompt|answer_key/i,
    );
  });

  it('shows a career_not_ready reason and no start button', async () => {
    getCareerInterview.mockResolvedValue(
      payload({ can_start: false, reason: 'career_not_ready' }),
    );
    render();
    expect(
      await screen.findByText(/Complete every course in this track/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /start final interview/i }),
    ).not.toBeInTheDocument();
  });

  it('offers Resume for an in-progress attempt', async () => {
    getCareerInterview.mockResolvedValue(
      payload({
        state: 'in_progress',
        can_start: false,
        can_resume: true,
        active_attempt_id: 'att_9',
      }),
    );
    render();
    expect(
      await screen.findByRole('button', { name: /resume final interview/i }),
    ).toBeInTheDocument();
  });

  it('shows an evaluating status', async () => {
    getCareerInterview.mockResolvedValue(
      payload({ state: 'evaluating', can_start: false }),
    );
    render();
    expect(
      await screen.findByText(/Evaluation in progress/i),
    ).toBeInTheDocument();
  });

  it('links to the credential when issued', async () => {
    getCareerInterview.mockResolvedValue(
      payload(
        { state: 'passed', can_start: false },
        { state: 'issued', badge: { public_token: 't' } },
      ),
    );
    render();
    expect(
      await screen.findByRole('link', { name: /view credential/i }),
    ).toBeInTheDocument();
  });

  it('shows a generic unavailable message on error', async () => {
    getCareerInterview.mockRejectedValue(new Error('nope'));
    render();
    expect(
      await screen.findByText(/temporarily unavailable/i),
    ).toBeInTheDocument();
  });
});
