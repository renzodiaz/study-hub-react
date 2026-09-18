import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentIntro from './Intro';

vi.mock('@api/assessments', () => ({
  getCourseAssessment: vi.fn(),
  startAttempt: vi.fn(),
  startPilotAttempt: vi.fn(),
  getAttempt: vi.fn(),
}));
import {
  getCourseAssessment,
  startAttempt,
  startPilotAttempt,
} from '@api/assessments';

const pilotMetadata = (overrides = {}) => ({
  id: 'assess_pilot_1',
  title: 'Browser, HTML Semantics & Accessibility',
  target_level: 'mid_senior',
  kind: 'knowledge',
  available: true,
  pilot: true,
  version_no: 1,
  time_limit_seconds: 1800,
  max_attempts: 3,
  attempts_remaining: 3,
  cooldown_seconds: 86400,
  active_attempt_id: null,
  can_start: true,
  can_resume: false,
  reason: null,
  ...overrides,
});

const renderIntro = (metadata) => {
  getCourseAssessment.mockResolvedValue(metadata);
  return renderWithProviders(AssessmentIntro, {
    path: '/learn/$trackId/$courseId/assessment',
    initialPath: '/learn/frontend-ms/course_2/assessment',
    extraRoutes: [
      { path: '/pilots', component: () => <div>pilots list</div> },
      {
        path: '/assessment-attempts/$attemptId',
        component: () => <div>attempt shell</div>,
      },
    ],
  });
};

describe('AssessmentIntro — pilot mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a pilot notice and a "Start pilot assessment" action', async () => {
    renderIntro(pilotMetadata());
    expect(
      await screen.findByText(/completing it evaluates the assessment/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /start pilot assessment/i }),
    ).toBeEnabled();
  });

  it('uses the PILOT endpoint (never the normal start) and sends no version/checksum', async () => {
    startPilotAttempt.mockResolvedValue({ id: 'attempt_pilot_1' });
    renderIntro(pilotMetadata());

    await userEvent.click(
      await screen.findByRole('button', { name: /start pilot assessment/i }),
    );

    await waitFor(() => expect(startPilotAttempt).toHaveBeenCalledTimes(1));
    // Only the assessment id is passed — the client never sends a version id or checksum.
    expect(startPilotAttempt).toHaveBeenCalledWith('assess_pilot_1');
    expect(startAttempt).not.toHaveBeenCalled();
    expect(await screen.findByText('attempt shell')).toBeInTheDocument();
  });

  it('a normal (non-pilot) assessment still uses the normal start endpoint', async () => {
    startAttempt.mockResolvedValue({ id: 'attempt_normal_1' });
    renderIntro(pilotMetadata({ pilot: false }));

    await userEvent.click(
      await screen.findByRole('button', { name: /^start assessment$/i }),
    );
    await waitFor(() => expect(startAttempt).toHaveBeenCalledTimes(1));
    expect(startPilotAttempt).not.toHaveBeenCalled();
  });
});
