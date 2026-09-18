import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Pilots from './Pilots';

vi.mock('@api/assessments', () => ({ getPilotAssessments: vi.fn() }));
import { getPilotAssessments } from '@api/assessments';

const render = () =>
  renderWithProviders(Pilots, {
    path: '/pilots',
    extraRoutes: [
      {
        path: '/learn/$trackId/$courseId/assessment',
        component: () => <div>intro</div>,
      },
    ],
  });

describe('Pilots page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an empty state when the learner has no pilot grants', async () => {
    getPilotAssessments.mockResolvedValue([]);
    render();
    expect(
      await screen.findByText(/no pilot assessments/i),
    ).toBeInTheDocument();
  });

  it('lists the learner pilot assessments with an Open link into the intro', async () => {
    getPilotAssessments.mockResolvedValue([
      {
        assessment_id: 'assess_pilot_1',
        title: 'Browser, HTML Semantics & Accessibility',
        kind: 'knowledge',
        target_level: 'mid_senior',
        course_id: 'course_2',
        course_title: 'Browser & Accessibility',
        track_id: 'frontend-ms',
      },
    ]);
    render();

    expect(
      await screen.findByText('Browser, HTML Semantics & Accessibility'),
    ).toBeInTheDocument();
    const open = screen.getByRole('link', { name: /open/i });
    expect(open).toHaveAttribute(
      'href',
      '/learn/frontend-ms/course_2/assessment',
    );
  });
});
