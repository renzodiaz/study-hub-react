import Breadcrumb from './Breadcrumb';
import ProgressMeter from './ProgressMeter';

// Orientation above the lesson (§20): where am I — Career › Course (breadcrumb),
// which Section, Lesson X of Y in the course, and how far through the course.
// All values come from server-supplied context; `lessonNumber` is the lesson's
// continuous position derived from the course outline the page already loads.
// Renders nothing without context.
const LessonContextHeader = ({ context, lessonNumber }) => {
  if (!context) return null;

  const {
    career,
    course,
    section,
    course_lesson_total: courseTotal,
    course_completed_count: courseCompleted,
  } = context;

  const trackId = career?.id;
  const courseId = course?.id;

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
    <div className="space-y-3">
      <Breadcrumb items={items} />

      <div className="flex flex-col gap-y-2 sm:flex-row sm:items-end sm:justify-between sm:gap-x-6">
        <p className="text-body text-ink-secondary">
          {section ? (
            <span className="font-medium">{section.title}</span>
          ) : null}
          {typeof lessonNumber === 'number' && courseTotal ? (
            <span className="text-ink-muted">
              {section ? ' · ' : ''}Lesson {lessonNumber} of {courseTotal}
            </span>
          ) : null}
        </p>

        {typeof courseTotal === 'number' && courseTotal > 0 ? (
          <div className="w-full shrink-0 sm:w-56">
            <ProgressMeter
              completed={courseCompleted ?? 0}
              total={courseTotal}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LessonContextHeader;
