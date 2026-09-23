import { courseLessonDisplay, courseLessonProgress } from './lessonProgress';

const S = (lessons) => [{ id: 's', lessons }];

describe('courseLessonDisplay', () => {
  it('numbers lessons continuously across sections', () => {
    const display = courseLessonDisplay([
      { id: 's1', lessons: [{ id: 'a' }, { id: 'b' }] },
      { id: 's2', lessons: [{ id: 'c' }] },
    ]);
    expect(display.map((d) => d.number)).toEqual([1, 2, 3]);
  });

  it('marks done from server completion, the first accessible as current, and the rest locked', () => {
    const display = courseLessonDisplay(
      S([
        { id: 'a', completed: true },
        { id: 'b', completed: false },
        { id: 'c', completed: false },
      ]),
    );
    expect(display.map((d) => d.state)).toEqual([
      'done',
      'available',
      'locked',
    ]);
    expect(display[1].current).toBe(true);
    expect(display[2].current).toBe(false);
  });

  it('treats a free-preview lesson as accessible regardless of prior completion', () => {
    const display = courseLessonDisplay(
      S([
        { id: 'a', completed: false },
        { id: 'b', completed: false, free_preview: true },
      ]),
    );
    // 'a' is the first accessible (current); 'b' is accessible via free preview.
    expect(display[0].state).toBe('available');
    expect(display[1].state).toBe('available');
    expect(display[1].freePreview).toBe(true);
  });

  it('locks everything after the first incomplete lesson (continuous, not per-section)', () => {
    const display = courseLessonDisplay([
      { id: 's1', lessons: [{ id: 'a', completed: false }] },
      { id: 's2', lessons: [{ id: 'b', completed: false }] }, // must NOT reset to available
    ]);
    expect(display[0].state).toBe('available');
    expect(display[1].state).toBe('locked');
  });
});

describe('courseLessonProgress', () => {
  it('counts completed lessons across sections', () => {
    expect(
      courseLessonProgress([
        { id: 's1', lessons: [{ completed: true }, { completed: false }] },
        { id: 's2', lessons: [{ completed: true }] },
      ]),
    ).toEqual({ completed: 2, total: 3 });
  });
});
