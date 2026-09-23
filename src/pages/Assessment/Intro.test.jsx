import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import AssessmentIntro from './Intro';

// Mock the API MODULE directly (the component's own boundary). This is the
// smallest realistic seam: no network, no MSW — just control what the two
// endpoints the page calls return. See the PR note on why MSW is deferred.
vi.mock('@api/assessments', () => ({
  getCourseAssessment: vi.fn(),
  startAttempt: vi.fn(),
  getAttempt: vi.fn(),
}));
import { getCourseAssessment, startAttempt } from '@api/assessments';

// Availability metadata the intro endpoint returns. `available: true` plus the
// timing stats are what the page needs before it renders the action area.
const baseMetadata = (overrides = {}) => ({
  id: 'assess_backend_1',
  title: 'Backend Engineering Credential',
  target_level: 'mid_senior',
  kind: 'credential',
  available: true,
  version_no: 1,
  time_limit_seconds: 3600,
  max_attempts: 3,
  attempts_remaining: 3,
  cooldown_seconds: 86400,
  active_attempt_id: null,
  can_start: false,
  can_resume: false,
  reason: null,
  next_eligible_at: null,
  ...overrides,
});

// The intro lives at learn/$trackId/$courseId/assessment and can navigate to the
// attempt shell or back to the module — register those as inert stubs so the
// router resolves params, <Link> hrefs, and post-start navigation for real.
const renderIntro = (metadata) => {
  getCourseAssessment.mockResolvedValue(metadata);
  return renderWithProviders(AssessmentIntro, {
    path: '/learn/$trackId/$courseId/assessment',
    initialPath: '/learn/react/course_1/assessment',
    extraRoutes: [
      { path: '/learn/$trackId/$courseId', component: () => <div>Module</div> },
      {
        path: '/assessment-attempts/$attemptId',
        component: AttemptStub,
      },
    ],
  });
};

function AttemptStub() {
  return <div>attempt shell</div>;
}

describe('AssessmentIntro', () => {
  it('viewing the intro never starts/consumes an attempt', async () => {
    renderIntro(baseMetadata({ can_start: true }));
    await screen.findByRole('button', { name: /start assessment/i });
    // An attempt is created only by the explicit Start action, not by viewing.
    expect(startAttempt).not.toHaveBeenCalled();
  });

  it('shows a Start action when the learner can start a new attempt', async () => {
    renderIntro(baseMetadata({ can_start: true, can_resume: false }));

    expect(
      await screen.findByRole('button', { name: /start assessment/i }),
    ).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: /resume attempt/i }),
    ).not.toBeInTheDocument();
  });

  it('offers Resume (not a start block) when a live attempt exists after entitlement lapsed', async () => {
    // PR-3 semantic under protection: entitlement lapsed mid-attempt →
    // can_start:false but the learner must still be able to RESUME.
    renderIntro(
      baseMetadata({
        can_start: false,
        can_resume: true,
        active_attempt_id: 'att_live_1',
        reason: 'no_active_subscription',
      }),
    );

    expect(
      await screen.findByRole('button', { name: /resume attempt/i }),
    ).toBeEnabled();
    // Not blocked behind a disabled Start button.
    expect(
      screen.queryByRole('button', { name: /start assessment/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the cooldown reason and no start when the learner is ineligible', async () => {
    renderIntro(
      baseMetadata({
        can_start: false,
        can_resume: false,
        reason: 'cooldown_active',
        next_eligible_at: '2026-09-08T12:00:00Z',
      }),
    );

    expect(await screen.findByText(/cooldown is active/i)).toBeInTheDocument();
    // Start is present but must be disabled; Resume must be absent.
    expect(
      screen.getByRole('button', { name: /start assessment/i }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: /resume attempt/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a GENERIC course_locked reason (no invented prerequisite) and disables Start', async () => {
    renderIntro(
      baseMetadata({
        can_start: false,
        can_resume: false,
        reason: 'course_locked',
      }),
    );

    expect(
      await screen.findByText(
        /complete the prerequisite course to unlock this assessment/i,
      ),
    ).toBeInTheDocument();
    // React must NOT invent "previous course in this career" copy.
    expect(
      screen.queryByText(/previous course in this career/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start assessment/i }),
    ).toBeDisabled();
  });

  it('uses the API-provided prerequisite name for course_locked when present', async () => {
    renderIntro(
      baseMetadata({
        can_start: false,
        can_resume: false,
        reason: 'course_locked',
        unlock_requirement: {
          slug: 'web-foundations',
          name: 'Web Foundations',
        },
      }),
    );

    expect(
      await screen.findByText(
        /complete web foundations to unlock this assessment/i,
      ),
    ).toBeInTheDocument();
  });

  it('starts an attempt via the API and navigates to the attempt shell on success', async () => {
    startAttempt.mockResolvedValue({ id: 'att_new_9' });
    renderIntro(baseMetadata({ can_start: true, can_resume: false }));

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: /start assessment/i }),
    );

    // Observable behavior: the start endpoint is called with the assessment id,
    // and the learner lands on the attempt shell.
    await waitFor(() =>
      expect(startAttempt).toHaveBeenCalledWith('assess_backend_1'),
    );
    expect(await screen.findByText(/attempt shell/i)).toBeInTheDocument();
  });
});
