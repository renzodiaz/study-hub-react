import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import LessonViewer from './LessonViewer';

vi.mock('@api/learn', () => ({
  getLesson: vi.fn(),
  completeLesson: vi.fn(),
}));
import { getLesson, completeLesson } from '@api/learn';

const baseContext = {
  career: { id: 'trk', name: 'Frontend Mid-Senior' },
  course: {
    id: 'crs',
    title: 'JavaScript & TypeScript Foundations',
    level: 'mid',
  },
  section: {
    id: 'sec',
    title: 'Runtime & values',
    position: 0,
    lesson_total: 4,
  },
  lesson_index_in_section: 2,
  course_lesson_total: 21,
  course_completed_count: 6,
  prev: { id: 'L1', title: 'How your code actually runs' },
  next: { id: 'L3', title: 'References & mutation', starts_new_section: false },
};

const lesson = ({ context = baseContext, ...overrides } = {}) => ({
  id: 'L2',
  title: 'Values & types',
  lesson_type: 'article',
  content: 'Bind one handler on the parent.',
  completed: false,
  prev_lesson_id: 'L1',
  next_lesson_id: 'L3',
  context,
  ...overrides,
});

const renderViewer = (data) => {
  getLesson.mockResolvedValue(data);
  return renderWithProviders(LessonViewer, {
    path: 'lessons/$lessonId',
    initialPath: '/lessons/L2',
    extraRoutes: [
      { path: '/learn/$trackId', component: () => <div>Track</div> },
      { path: '/learn/$trackId/$courseId', component: () => <div>Course</div> },
    ],
  });
};

describe('LessonViewer', () => {
  beforeAll(async () => {
    // Warm the lazy Markdown renderer so its cold dynamic import can't race
    // findBy's timeout under full-suite parallel load (kept from the flaky-test
    // fix; real integration, not a mock).
    await import('@components/LessonContent');
  });

  beforeEach(() => vi.clearAllMocks());

  it('renders the lesson title and Markdown content', async () => {
    renderViewer(lesson());
    expect(
      await screen.findByRole('heading', { name: 'Values & types' }),
    ).toBeInTheDocument();
    // Markdown is lazy-loaded, so await it.
    expect(
      await screen.findByText(/bind one handler on the parent/i),
    ).toBeInTheDocument();
  });

  it('shows a semantic breadcrumb with career and course links', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { name: 'Values & types' });
    const crumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    const career = screen.getByRole('link', { name: 'Frontend Mid-Senior' });
    const course = screen.getByRole('link', {
      name: 'JavaScript & TypeScript Foundations',
    });
    expect(crumb).toContainElement(career);
    expect(career).toHaveAttribute('href', '/learn/trk');
    expect(course).toHaveAttribute('href', '/learn/trk/crs');
  });

  it('shows section name, lesson X of Y, and course progress', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { name: 'Values & types' });
    expect(screen.getByText('Runtime & values')).toBeInTheDocument();
    expect(screen.getByText(/Lesson 2 of 4/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '6');
    expect(bar).toHaveAttribute('aria-valuemax', '21');
    expect(screen.getByText('6 of 21 lessons')).toBeInTheDocument();
  });

  it('renders descriptive, accessible Previous/Next by name', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { name: 'Values & types' });
    const prev = screen.getByRole('link', {
      name: 'Previous: How your code actually runs',
    });
    const next = screen.getByRole('link', {
      name: 'Next lesson: References & mutation',
    });
    expect(prev).toHaveAttribute('href', '/lessons/L1');
    expect(next).toHaveAttribute('href', '/lessons/L3');
  });

  it('labels Next as a section boundary when it starts a new section', async () => {
    renderViewer(
      lesson({
        context: {
          ...baseContext,
          next: { id: 'L3', title: 'Scope', starts_new_section: true },
        },
      }),
    );
    await screen.findByRole('heading', { name: 'Values & types' });
    expect(
      screen.getByRole('link', { name: 'Next section: Scope' }),
    ).toBeInTheDocument();
  });

  it('on the first lesson, Previous becomes a course-overview link', async () => {
    renderViewer(lesson({ context: { ...baseContext, prev: null } }));
    await screen.findByRole('heading', { name: 'Values & types' });
    const back = screen.getByRole('link', { name: /back to course overview/i });
    expect(back).toHaveAttribute('href', '/learn/trk/crs');
    expect(
      screen.queryByRole('link', { name: /^previous:/i }),
    ).not.toBeInTheDocument();
  });

  it('on the final lesson, Next becomes a course-overview link (no fake next)', async () => {
    renderViewer(lesson({ context: { ...baseContext, next: null } }));
    await screen.findByRole('heading', { name: 'Values & types' });
    expect(
      screen.getByRole('link', { name: /back to course overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /^next/i }),
    ).not.toBeInTheDocument();
  });

  it('does NOT introduce a course outline / contents control (deferred)', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { name: 'Values & types' });
    expect(screen.queryByText(/contents/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/course outline/i)).not.toBeInTheDocument();
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
