import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import ModuleDetail from './ModuleDetail';

vi.mock('@api/learn', () => ({
  getModule: vi.fn(),
  getModuleSections: vi.fn(),
}));
import { getModule, getModuleSections } from '@api/learn';

const renderModule = () =>
  renderWithProviders(ModuleDetail, {
    path: '/learn/$trackId/$courseId',
    initialPath: '/learn/react/c-c',
    extraRoutes: [
      { path: '/lessons/$lessonId', component: () => <div>Lesson</div> },
      {
        path: '/learn/$trackId/$courseId/assessment',
        component: () => <div>Assessment</div>,
      },
    ],
  });

describe('ModuleDetail', () => {
  it('shows a friendly "locked" state when the backend denies a locked course (direct URL)', async () => {
    const err = new Error('Not authorized'); // backend 403 for a locked course
    getModule.mockRejectedValue(err);
    getModuleSections.mockRejectedValue(err);

    renderModule();

    expect(
      await screen.findByText(/this course is locked/i),
    ).toBeInTheDocument();
    // No raw error, no curriculum, no assessment CTA for a locked course.
    expect(
      screen.queryByRole('link', { name: /credential assessment/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Not authorized')).not.toBeInTheDocument();
  });

  it('renders the course, its lessons, and the assessment CTA when accessible', async () => {
    getModule.mockResolvedValue({
      id: 'c-a',
      title: 'Web Foundations',
      description: 'HTML/CSS/JS',
    });
    getModuleSections.mockResolvedValue([
      {
        id: 's1',
        title: 'HTML5',
        lessons: [
          {
            id: 'l1',
            title: 'Intro',
            lesson_type: 'video',
            free_preview: true,
            completed: false,
          },
        ],
      },
    ]);

    renderModule();

    expect(await screen.findByText('Web Foundations')).toBeInTheDocument();
    expect(screen.getByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument(); // preview discovery preserved
    expect(
      screen.getByRole('link', { name: /credential assessment/i }),
    ).toBeInTheDocument();
  });
});
