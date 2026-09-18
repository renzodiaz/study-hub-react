import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import LessonViewer from './LessonViewer';

vi.mock('@api/learn', () => ({
  getLesson: vi.fn(),
  completeLesson: vi.fn(),
}));
import { getLesson, completeLesson } from '@api/learn';

const lesson = (overrides = {}) => ({
  id: 'L2',
  title: 'Event delegation',
  lesson_type: 'article',
  content: 'Bind one handler on the parent.',
  completed: false,
  prev_lesson_id: 'L1',
  next_lesson_id: 'L3',
  ...overrides,
});

const renderViewer = (data) => {
  getLesson.mockResolvedValue(data);
  return renderWithProviders(LessonViewer, {
    path: 'lessons/$lessonId',
    initialPath: '/lessons/L2',
  });
};

describe('LessonViewer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Markdown content and Previous/Next navigation', async () => {
    renderViewer(lesson());
    expect(
      await screen.findByText(/bind one handler on the parent/i),
    ).toBeInTheDocument();

    const prev = screen.getByRole('link', { name: /previous lesson/i });
    const next = screen.getByRole('link', { name: /next lesson/i });
    expect(prev).toHaveAttribute('href', '/lessons/L1');
    expect(next).toHaveAttribute('href', '/lessons/L3');
  });

  it('omits Previous on the first lesson and Next on the last', async () => {
    renderViewer(lesson({ prev_lesson_id: null, next_lesson_id: null }));
    await screen.findByText(/bind one handler on the parent/i);
    expect(
      screen.queryByRole('link', { name: /previous lesson/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /next lesson/i }),
    ).not.toBeInTheDocument();
  });

  it('marks the lesson complete via the existing endpoint', async () => {
    completeLesson.mockResolvedValue({});
    renderViewer(lesson());
    await userEvent.click(
      await screen.findByRole('button', { name: /mark as complete/i }),
    );
    await waitFor(() => expect(completeLesson).toHaveBeenCalledTimes(1));
  });
});
