import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

// Named previous/next lesson navigation (§30). It renders the prev/next identity
// the server supplies in the lesson context; it never fabricates a destination
// or shows a Next that does not exist. At a course boundary it offers "Back to
// course" instead. Lesson completion is learning progress only — no credential
// or assessment implication here.

const CARD =
  'group flex flex-1 flex-col rounded-card border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong hover:bg-primary-wash';

const Kicker = ({ direction, children }) => (
  <span className="flex items-center gap-x-1 text-body-sm font-medium text-ink-muted">
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
    <span className="mt-0.5 line-clamp-2 text-body font-semibold text-ink group-hover:text-primary">
      {title}
    </span>
  </Link>
);

const CourseOverviewCard = ({ direction, to, onBack }) => {
  const inner = (
    <>
      <Kicker direction={direction}>Course overview</Kicker>
      <span
        className={`mt-0.5 text-body font-semibold text-ink group-hover:text-primary ${direction === 'next' ? 'sm:text-right' : ''}`}
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

const LessonNav = ({ context, prevId, nextId, courseOverviewTo, onBack }) => {
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
