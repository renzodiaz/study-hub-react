import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import TrackDetail from './TrackDetail';

vi.mock('@api/learn', () => ({
  getTrack: vi.fn().mockResolvedValue({ id: 'trk_1', name: 'Full-Stack Ruby' }),
  getTrackModules: vi.fn().mockResolvedValue([]),
  getEnrollments: vi.fn().mockResolvedValue([]),
  enroll: vi.fn(),
}));
vi.mock('@api/assessments', () => ({ getCareerInterview: vi.fn() }));
import { getCareerInterview } from '@api/assessments';

const payload = (
  attempt = {},
  credential = { state: 'none', badge: null },
) => ({
  assessment: { id: 'a1', target_level: 'senior', questions_count: 5 },
  qualification: { ready_for_interview: true },
  attempt: {
    state: 'none',
    can_start: true,
    can_resume: false,
    active_attempt_id: null,
    attempts_remaining: 3,
    reason: null,
    ...attempt,
  },
  credential,
});

const render = () =>
  renderWithProviders(TrackDetail, {
    path: 'learn/$trackId',
    initialPath: '/learn/trk_1',
    extraRoutes: [
      { path: 'learn/$trackId/interview', component: () => <div>intro</div> },
      {
        path: 'assessment-attempts/$attemptId',
        component: () => <div>runner</div>,
      },
      { path: 'achievements', component: () => <div>ach</div> },
      { path: 'my-learning', component: () => <div>ml</div> },
      { path: 'learn', component: () => <div>learn</div> },
    ],
  });

describe('TrackDetail final-interview card', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a Start CTA when ready', async () => {
    getCareerInterview.mockResolvedValue(payload());
    render();
    expect(
      await screen.findByText(/ready for the Final Qualification/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /start final qualification/i }),
    ).toBeInTheDocument();
  });

  it('shows the not-ready reason without a start action', async () => {
    getCareerInterview.mockResolvedValue(
      payload({ can_start: false, reason: 'career_not_ready' }),
    );
    render();
    expect(
      await screen.findByText(/Opens when every course in this career/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /start final qualification/i }),
    ).not.toBeInTheDocument();
  });

  it('shows evaluating', async () => {
    getCareerInterview.mockResolvedValue(
      payload({ state: 'evaluating', can_start: false }),
    );
    render();
    expect(await screen.findByText(/being evaluated/i)).toBeInTheDocument();
  });

  it('shows credential issued with a View credential link', async () => {
    getCareerInterview.mockResolvedValue(
      payload(
        { state: 'passed', can_start: false },
        { state: 'issued', badge: { public_token: 't' } },
      ),
    );
    render();
    expect(await screen.findByText(/Credential issued/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view credential/i }),
    ).toBeInTheDocument();
  });

  it('renders nothing when no interview is configured (query error)', async () => {
    getCareerInterview.mockRejectedValue(new Error('not configured'));
    render();
    await screen.findByText('The path to the credential'); // page rendered
    expect(screen.queryByText(/final qualification/i)).not.toBeInTheDocument();
  });
});
