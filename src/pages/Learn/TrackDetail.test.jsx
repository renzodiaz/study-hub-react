import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import TrackDetail from './TrackDetail';

vi.mock('@api/learn', () => ({
  getTrack: vi.fn(),
  getTrackModules: vi.fn(),
  getEnrollments: vi.fn(),
  enroll: vi.fn(),
}));
import { getTrack, getTrackModules, getEnrollments } from '@api/learn';

const track = {
  id: 'react',
  name: 'Full-Stack Ruby',
  description: 'Ruby track',
  color: '#EF4444',
  icon: '💎',
};

// Courses as the backend roadmap returns them (with the progression block).
const MODULES = [
  {
    id: 'c-a',
    title: 'Web Foundations',
    level: 'beginner',
    description: 'HTML/CSS/JS',
    progression: {
      status: 'completed',
      completed: true,
      unlocked: true,
      unlock_requirement: null,
    },
  },
  {
    id: 'c-b',
    title: 'Rails Foundations',
    level: 'junior',
    description: 'MVC',
    progression: {
      status: 'available',
      completed: false,
      unlocked: true,
      unlock_requirement: null,
    },
  },
  {
    id: 'c-c',
    title: 'Rails API Design',
    level: 'mid',
    description: 'APIs',
    progression: {
      status: 'locked',
      completed: false,
      unlocked: false,
      unlock_requirement: {
        slug: 'rails-foundations',
        name: 'Rails Foundations',
      },
    },
  },
];

const renderTrack = () =>
  renderWithProviders(TrackDetail, {
    path: '/learn/$trackId',
    initialPath: '/learn/react',
    extraRoutes: [
      {
        path: '/learn/$trackId/$courseId',
        component: () => <div>Course page</div>,
      },
      { path: '/learn', component: () => <div>Careers</div> },
    ],
  });

beforeEach(() => {
  getTrack.mockResolvedValue(track);
  getEnrollments.mockResolvedValue([
    { id: 'e1', career_track: { id: 'react' }, progress: { percent: 33 } },
  ]);
  getTrackModules.mockResolvedValue(MODULES);
});

describe('TrackDetail roadmap progression', () => {
  it('renders every course, including the locked one (locked courses stay visible)', async () => {
    renderTrack();
    expect(await screen.findByText('Web Foundations')).toBeInTheDocument();
    expect(screen.getByText('Rails Foundations')).toBeInTheDocument();
    expect(screen.getByText('Rails API Design')).toBeInTheDocument();
  });

  it('shows Completed / Available / Locked badges from the backend status', async () => {
    renderTrack();
    await screen.findByText('Web Foundations');
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('shows the unlock_requirement copy on a locked course', async () => {
    renderTrack();
    expect(
      await screen.findByText('Complete Rails Foundations to unlock'),
    ).toBeInTheDocument();
  });

  it('makes completed and available courses navigable, but NOT the locked one', async () => {
    renderTrack();
    await screen.findByText('Web Foundations');

    // Completed + available render as links to the course page.
    expect(
      screen.getByRole('link', { name: /Web Foundations/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Rails Foundations/ }),
    ).toBeInTheDocument();
    // Locked course is not a link (no entry action).
    expect(
      screen.queryByRole('link', { name: /Rails API Design/ }),
    ).not.toBeInTheDocument();
  });

  it('prompts enrollment for a locked course with no prerequisite', async () => {
    getTrackModules.mockResolvedValue([
      {
        id: 'c-x',
        title: 'Intro Course',
        level: 'beginner',
        description: 'x',
        progression: {
          status: 'locked',
          completed: false,
          unlocked: false,
          unlock_requirement: null,
        },
      },
    ]);
    renderTrack();
    expect(await screen.findByText('Enroll to unlock')).toBeInTheDocument();
  });
});
