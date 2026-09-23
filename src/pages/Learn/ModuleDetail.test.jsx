import { screen, within } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import ModuleDetail from './ModuleDetail';

vi.mock('@api/learn', () => ({
  getModule: vi.fn(),
  getModuleSections: vi.fn(),
  getTrack: vi.fn(),
  getTrackModules: vi.fn(),
}));
import {
  getModule,
  getModuleSections,
  getTrack,
  getTrackModules,
} from '@api/learn';

const renderModule = () =>
  renderWithProviders(ModuleDetail, {
    path: '/learn/$trackId/$courseId',
    initialPath: '/learn/react/c-a',
    extraRoutes: [
      { path: '/lessons/$lessonId', component: () => <div>Lesson</div> },
      { path: '/learn/$trackId', component: () => <div>Career</div> },
      {
        path: '/learn/$trackId/$courseId/assessment',
        component: () => <div>Assessment</div>,
      },
    ],
  });

beforeEach(() => {
  vi.clearAllMocks();
  getTrack.mockResolvedValue({ id: 'react', name: 'Full-Stack Ruby' });
  getTrackModules.mockResolvedValue([
    { id: 'c-a', title: 'Web Foundations' },
    { id: 'c-b', title: 'Rails Foundations' },
  ]);
});

describe('ModuleDetail', () => {
  it('shows a neutral "not available" state when the backend denies the course', async () => {
    const err = new Error('Not authorized'); // backend 403/404 for a locked course
    getModule.mockRejectedValue(err);
    getModuleSections.mockRejectedValue(err);

    renderModule();

    expect(
      await screen.findByText(/this course isn't available to your account/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/complete the previous course/i),
    ).not.toBeInTheDocument();
    // No raw error, no assessment entry for an inaccessible course.
    expect(screen.queryByText('Not authorized')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /course assessment/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the course, its sections/lessons in order with continuous numbering', async () => {
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
            completed: true,
          },
          {
            id: 'l2',
            title: 'Elements',
            lesson_type: 'article',
            free_preview: false,
            completed: false,
          },
        ],
      },
      {
        id: 's2',
        title: 'CSS',
        lessons: [
          {
            id: 'l3',
            title: 'Selectors',
            lesson_type: 'article',
            free_preview: false,
            completed: false,
          },
        ],
      },
    ]);

    renderModule();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Web Foundations' }),
    ).toBeInTheDocument();
    // Course position derived from data (course 1 of 2), not hard-coded.
    expect(await screen.findByText(/Course 1 of 2/)).toBeInTheDocument();
    // Both sections render in order (await the async section listing).
    expect(await screen.findByText('CSS')).toBeInTheDocument();
    expect(screen.getByText('HTML5')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
    // Free-preview indication comes from server data.
    expect(screen.getByText('Free preview')).toBeInTheDocument();
    // Continuous numbering across sections: Selectors is lesson 3.
    const selectors = screen.getByText('Selectors').closest('a, div');
    expect(within(selectors).getByText('3')).toBeInTheDocument();
    // Assessment entry navigates to the existing intro (the gate), not enabled here.
    expect(
      screen.getByRole('link', { name: /go to course assessment/i }),
    ).toHaveAttribute('href', '/learn/react/c-a/assessment');
  });

  it('does not make a locked lesson clickable (server-authoritative gate)', async () => {
    getModule.mockResolvedValue({ id: 'c-a', title: 'Web Foundations' });
    getModuleSections.mockResolvedValue([
      {
        id: 's1',
        title: 'HTML5',
        lessons: [
          { id: 'l1', title: 'Intro', free_preview: false, completed: false },
          {
            id: 'l2',
            title: 'Locked lesson',
            free_preview: false,
            completed: false,
          },
        ],
      },
    ]);

    renderModule();

    await screen.findByRole('heading', { level: 1, name: 'Web Foundations' });
    // First incomplete accessible lesson is a link; the next is locked (no link).
    expect(
      await screen.findByRole('link', { name: /intro/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /locked lesson/i }),
    ).not.toBeInTheDocument();
  });
});
