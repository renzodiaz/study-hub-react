import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

const CARD =
  'group flex flex-1 flex-col rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-300 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500';

const Kicker = ({ direction, children }) => (
  <span className="flex items-center gap-x-1 text-xs font-medium text-gray-500">
    {direction === 'prev' && (
      <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
    )}
    {children}
    {direction === 'next' && (
      <ArrowRightIcon className="size-3.5" aria-hidden="true" />
    )}
  </span>
);

const LessonLink = ({ direction, kicker, title, lessonId }) => (
  <Link
    to="/lessons/$lessonId"
    params={{ lessonId: String(lessonId) }}
    aria-label={`${kicker}: ${title}`}
    className={`${CARD} ${direction === 'next' ? 'sm:items-end sm:text-right' : ''}`}
  >
    <Kicker direction={direction}>{kicker}</Kicker>
    <span className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
      {title}
    </span>
  </Link>
);

// Shown in place of a lesson at the course boundaries (first lesson's Previous,
// last lesson's Next). Routes to the course page when we have an accessible
// track/course, else falls back to browser history. No completion celebration
// and no credential/assessment implication — lesson completion is learning
// progress only.
const CourseOverviewCard = ({ direction, to, onBack }) => {
  const inner = (
    <>
      <Kicker direction={direction}>Course overview</Kicker>
      <span
        className={`mt-0.5 text-sm font-semibold text-gray-900 group-hover:text-indigo-700 ${direction === 'next' ? 'sm:text-right' : ''}`}
      >
        Back to course
      </span>
    </>
  );
  if (to) {
    return (
      <Link
        to={to.to}
        params={to.params}
        aria-label="Back to course overview"
        className={`${CARD} ${direction === 'next' ? 'sm:items-end' : ''}`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to course overview"
      className={`${CARD} text-left ${direction === 'next' ? 'sm:items-end' : ''}`}
    >
      {inner}
    </button>
  );
};

// Rich previous/next. Uses server context (names + section-boundary flag) when
// available, and degrades to bare ids if a response predates the context
// contract.
const LessonNav = ({ context, prevId, nextId, courseOverviewTo, onBack }) => {
  // When context is present, a null prev/next means a genuine course boundary
  // (show the overview card). Only fall back to bare ids if the whole context is
  // absent (a response predating the contract).
  const prev = context
    ? context.prev
    : prevId
      ? { id: prevId, title: 'Previous lesson' }
      : null;
  const next = context
    ? context.next
    : nextId
      ? { id: nextId, title: 'Next lesson' }
      : null;

  return (
    <nav
      aria-label="Lesson navigation"
      className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      {prev ? (
        <LessonLink
          direction="prev"
          kicker="Previous"
          title={prev.title}
          lessonId={prev.id}
        />
      ) : (
        <CourseOverviewCard
          direction="prev"
          to={courseOverviewTo}
          onBack={onBack}
        />
      )}

      {next ? (
        <LessonLink
          direction="next"
          kicker={next.starts_new_section ? 'Next section' : 'Next lesson'}
          title={next.title}
          lessonId={next.id}
        />
      ) : (
        <CourseOverviewCard
          direction="next"
          to={courseOverviewTo}
          onBack={onBack}
        />
      )}
    </nav>
  );
};

export default LessonNav;
