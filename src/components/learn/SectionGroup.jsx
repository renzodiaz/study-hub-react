import Card from '@components/ui/Card';
import LessonRow from './LessonRow';

// A course Section: a titled group of lessons. Lesson numbering is continuous
// across sections (the numbers come from the course-wide display map passed in,
// not from this section's local index). Counts are always derived from data.
const SectionGroup = ({ section, displayById }) => {
  const lessons = section.lessons ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-raised px-4 py-3">
        <h3 className="text-panel font-semibold text-ink">{section.title}</h3>
        <span className="text-body-sm text-ink-muted">
          {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
        </span>
      </div>
      <ul className="divide-y divide-line">
        {lessons.map((lesson) => {
          const d = displayById.get(lesson.id) ?? {};
          return (
            <li key={lesson.id}>
              <LessonRow
                lessonId={lesson.id}
                number={d.number}
                title={lesson.title}
                state={d.state}
                current={d.current}
                freePreview={d.freePreview}
                lessonType={lesson.lesson_type}
                durationSeconds={lesson.duration_seconds}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default SectionGroup;
