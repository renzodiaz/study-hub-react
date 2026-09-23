import LessonRow from './LessonRow';
import { courseLessonDisplay } from './lessonProgress';

// The course outline shown alongside a lesson: every section and lesson, with
// the current lesson clearly marked, completed lessons shown as done, and locked
// lessons visibly locked and non-interactive (§23). It is a SECOND navigation
// landmark, labelled "Course outline" so it never collides with the AppShell's
// "Primary" nav.
//
// Lesson states come from the same server-derived display as the course page
// (lessonProgress.js); the active lesson is whichever the learner is currently
// reading (activeLessonId), marked aria-current="page".
const LessonOutline = ({ sections = [], activeLessonId }) => {
  const display = courseLessonDisplay(sections);
  const byId = new Map(display.map((d) => [d.id, d]));

  return (
    <nav aria-label="Course outline" className="space-y-4">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="px-4 text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
            {section.title}
          </h3>
          <ul className="mt-1">
            {(section.lessons ?? []).map((lesson) => {
              const d = byId.get(lesson.id) ?? {};
              const isActive = String(lesson.id) === String(activeLessonId);
              return (
                <li key={lesson.id}>
                  <LessonRow
                    lessonId={lesson.id}
                    number={d.number}
                    title={lesson.title}
                    // The active lesson always renders as the current one, even
                    // if it is already completed.
                    state={
                      isActive && d.state === 'locked' ? 'available' : d.state
                    }
                    current={isActive}
                    currentLabel={null}
                    ariaCurrent="page"
                    freePreview={d.freePreview}
                    lessonType={lesson.lesson_type}
                    durationSeconds={lesson.duration_seconds}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default LessonOutline;
