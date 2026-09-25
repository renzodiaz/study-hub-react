import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Pilots from './Pilots';

vi.mock('@api/assessments', () => ({ getPilotAssessments: vi.fn() }));
import { getPilotAssessments } from '@api/assessments';

const Stub = () => <div>stub</div>;

const render = () =>
  renderWithProviders(Pilots, {
    path: '/pilots',
    initialPath: '/pilots',
    extraRoutes: [
      { path: '/learn/$trackId/$courseId/assessment', component: Stub },
    ],
  });

describe('Pilots', () => {
  it('shows an empty state when there are no active grants', async () => {
    getPilotAssessments.mockResolvedValue([]);
    render();
    expect(
      await screen.findByText(/no pilot assessments right now/i),
    ).toBeInTheDocument();
  });

  it('lists active pilot grants with an Open link, and notes no credential is issued', async () => {
    getPilotAssessments.mockResolvedValue([
      {
        assessment_id: 'a1',
        title: 'JS Foundations — Pilot',
        course_title: 'JS & TS Foundations',
        target_level: 'mid_senior',
        track_id: 't1',
        course_id: 'c1',
      },
    ]);
    render();

    expect(
      await screen.findByText('JS Foundations — Pilot'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not issue a credential/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open/i })).toBeInTheDocument();
  });

  it('surfaces a load error', async () => {
    getPilotAssessments.mockRejectedValue(
      new Error('Failed to load pilot assessments.'),
    );
    render();
    expect(
      await screen.findByText(/failed to load pilot assessments/i),
    ).toBeInTheDocument();
  });
});
