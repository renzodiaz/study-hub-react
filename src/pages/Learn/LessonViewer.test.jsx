import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import LessonViewer from './LessonViewer';

vi.mock('@api/learn', () => ({
  getLesson: vi.fn(),
  completeLesson: vi.fn(),
  getModuleSections: vi.fn(),
}));
import { getLesson, completeLesson, getModuleSections } from '@api/learn';

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

// Course outline (server section listing) used to derive the continuous lesson
// number and render the LessonOutline. L2 is the active lesson.
const SECTIONS = [
  {
    id: 'sec',
    title: 'Runtime & values',
    lessons: [
      {
        id: 'L1',
        title: 'How your code actually runs',
        completed: true,
        free_preview: true,
      },
      {
        id: 'L2',
        title: 'Values & types',
        completed: false,
        free_preview: false,
      },
      {
        id: 'L3',
        title: 'References & mutation',
        completed: false,
        free_preview: false,
      },
      {
        id: 'L4',
        title: 'Equality & identity',
        completed: false,
        free_preview: false,
      },
    ],
  },
];

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

const renderViewer = (data, sections = SECTIONS) => {
  getLesson.mockResolvedValue(data);
  getModuleSections.mockResolvedValue(sections);
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
    // findBy's timeout under full-suite parallel load.
    await import('@components/LessonContent');
  });

  beforeEach(() => vi.clearAllMocks());

  it('renders the lesson title and Markdown content', async () => {
    renderViewer(lesson());
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Values & types' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/bind one handler on the parent/i),
    ).toBeInTheDocument();
  });

  it('shows a semantic breadcrumb with career and course links', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    const crumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    const career = within(crumb).getByRole('link', {
      name: 'Frontend Mid-Senior',
    });
    const course = within(crumb).getByRole('link', {
      name: 'JavaScript & TypeScript Foundations',
    });
    expect(career).toHaveAttribute('href', '/learn/trk');
    expect(course).toHaveAttribute('href', '/learn/trk/crs');
  });

  it('shows section name, course-level Lesson X of Y, and course progress', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    // Section title appears in the header and the outline; assert it exists.
    expect(screen.getAllByText('Runtime & values').length).toBeGreaterThan(0);
    // Course-level position derived from the outline (L2 → 2 of 21).
    expect(await screen.findByText(/Lesson 2 of 21/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '6');
    expect(bar).toHaveAttribute('aria-valuemax', '21');
    expect(screen.getByText('6 of 21 lessons')).toBeInTheDocument();
  });

  it('renders a Course outline landmark with the current lesson marked', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    const outlines = await screen.findAllByRole('navigation', {
      name: /course outline/i,
    });
    expect(outlines.length).toBeGreaterThan(0);
    // The active lesson is marked current (aria-current="page") in the outline.
    const current = within(outlines[0]).getByRole('link', {
      name: /values & types/i,
    });
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('keeps locked outline lessons non-interactive (no client unlock)', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    const outline = (
      await screen.findAllByRole('navigation', { name: /course outline/i })
    )[0];
    // L4 is locked (prior lessons incomplete) → rendered as a non-link.
    expect(
      within(outline).queryByRole('link', { name: /equality & identity/i }),
    ).not.toBeInTheDocument();
    expect(
      within(outline).getByText('Equality & identity'),
    ).toBeInTheDocument();
  });

  it('renders descriptive, accessible Previous/Next by name', async () => {
    renderViewer(lesson());
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    const nav = screen.getByRole('navigation', { name: /lesson navigation/i });
    const prev = within(nav).getByRole('link', {
      name: 'Previous: How your code actually runs',
    });
    const next = within(nav).getByRole('link', {
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
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    const nav = screen.getByRole('navigation', { name: /lesson navigation/i });
    expect(
      within(nav).getByRole('link', { name: 'Next section: Scope' }),
    ).toBeInTheDocument();
  });

  it('on the first lesson, Previous becomes a course-overview link', async () => {
    renderViewer(lesson({ context: { ...baseContext, prev: null } }));
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    const nav = screen.getByRole('navigation', { name: /lesson navigation/i });
    const back = within(nav).getByRole('link', {
      name: /back to course overview/i,
    });
    expect(back).toHaveAttribute('href', '/learn/trk/crs');
    expect(
      within(nav).queryByRole('link', { name: /^previous:/i }),
    ).not.toBeInTheDocument();
  });

  it('on the final lesson, Next becomes a course-overview link (no fake next)', async () => {
    renderViewer(lesson({ context: { ...baseContext, next: null } }));
    await screen.findByRole('heading', { level: 1, name: 'Values & types' });
    const nav = screen.getByRole('navigation', { name: /lesson navigation/i });
    expect(
      within(nav).getByRole('link', { name: /back to course overview/i }),
    ).toBeInTheDocument();
    expect(
      within(nav).queryByRole('link', { name: /^next/i }),
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
