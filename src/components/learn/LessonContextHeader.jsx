import Breadcrumb from './Breadcrumb';
import ProgressBar from './ProgressBar';

// Compact orientation above the lesson: where am I (breadcrumb), which section +
// lesson, and how far through the course. Whitespace + a thin progress rule
// rather than a heavy card. Renders nothing without server-provided context.
const LessonContextHeader = ({ context }) => {
  if (!context) return null;

  const {
    career,
    course,
    section,
    lesson_index_in_section: lessonIndex,
    course_lesson_total: courseTotal,
    course_completed_count: courseCompleted,
  } = context;

  const trackId = career?.id;
  const courseId = course?.id;

  // Career → track page, Course → course page (both only when we have a track
  // the learner can access). Section is current-context text (no dedicated
  // route). The lesson title is intentionally NOT in the breadcrumb (it is H1).
  const items = [];
  if (career && trackId) {
    items.push({
      label: career.name,
      to: '/learn/$trackId',
      params: { trackId },
    });
  }
  if (course) {
    items.push(
      trackId && courseId
        ? {
            label: course.title,
            to: '/learn/$trackId/$courseId',
            params: { trackId, courseId },
          }
        : { label: course.title },
    );
  }

  return (
    <div className="space-y-2">
      <Breadcrumb items={items} />

      <div className="flex flex-col gap-y-2 sm:flex-row sm:items-end sm:justify-between sm:gap-x-6">
        {section && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">{section.title}</span>
            {typeof lessonIndex === 'number' && section.lesson_total ? (
              <span className="text-gray-400">
                {' · '}Lesson {lessonIndex} of {section.lesson_total}
              </span>
            ) : null}
          </p>
        )}

        {typeof courseTotal === 'number' && courseTotal > 0 && (
          <div className="w-full shrink-0 sm:w-48">
            <ProgressBar completed={courseCompleted ?? 0} total={courseTotal} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonContextHeader;
