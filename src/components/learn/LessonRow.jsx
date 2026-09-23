import { Link } from '@tanstack/react-router';
import {
  CheckCircleIcon,
  LockClosedIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid';

import Chip from '@components/ui/Chip';
import { classNames as cn } from '@utils/helpers';

// One lesson in a course/section listing or the lesson outline. Purely
// presentational: it renders the state it is told (done / available / locked +
// current + freePreview), all derived from server-supplied completion under the
// server's sequential rule (see lessonProgress.js). It never decides access.
//
// A locked row is a non-interactive element (not a dimmed link), so it can never
// be clicked to bypass the gate (§16, §23). Status is carried by an icon + word,
// never colour alone (§5.1). Fixed 56px becomes min-height so text-spacing
// overrides never clip (§5.5).

const TYPE_ICON = {
  video: PlayCircleIcon,
  article: DocumentTextIcon,
  narrative: DocumentTextIcon,
  mcq: QuestionMarkCircleIcon,
  quiz_gate: QuestionMarkCircleIcon,
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  return `${Math.max(1, Math.round(seconds / 60))} min`;
};

const LessonRow = ({
  number,
  title,
  state = 'available',
  current = false,
  currentLabel = 'In progress',
  ariaCurrent = 'true',
  freePreview = false,
  lessonType,
  durationSeconds,
  lessonId,
}) => {
  const locked = state === 'locked';
  const done = state === 'done';
  const TypeIcon = TYPE_ICON[lessonType] ?? DocumentTextIcon;
  const duration = formatDuration(durationSeconds);

  const marker = done ? (
    <CheckCircleIcon
      aria-hidden="true"
      className="size-5 shrink-0 text-success"
    />
  ) : locked ? (
    <LockClosedIcon
      aria-hidden="true"
      className="size-5 shrink-0 text-ink-disabled"
    />
  ) : (
    <TypeIcon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
  );

  const inner = (
    <>
      <span
        className={cn(
          'w-6 shrink-0 text-right text-body-sm tabular-nums',
          locked ? 'text-ink-disabled' : 'text-ink-muted',
        )}
      >
        {number}
      </span>
      {marker}
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-body',
          locked ? 'text-ink-disabled' : 'text-ink',
          current && 'font-semibold',
        )}
      >
        {title}
      </span>
      {freePreview ? <Chip variant="dashed">Free preview</Chip> : null}
      {current && currentLabel ? (
        <span className="text-body-sm font-medium text-primary">
          {currentLabel}
        </span>
      ) : null}
      {done ? <span className="sr-only">Completed</span> : null}
      {locked ? <span className="sr-only">Locked</span> : null}
      {duration ? (
        <span className="shrink-0 text-body-sm text-ink-muted">{duration}</span>
      ) : null}
    </>
  );

  const base = 'flex min-h-[56px] items-center gap-3 px-4 py-2';

  if (locked) {
    return (
      <div aria-disabled="true" className={cn(base, 'cursor-not-allowed')}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      to="/lessons/$lessonId"
      params={{ lessonId: String(lessonId) }}
      aria-current={current ? ariaCurrent : undefined}
      className={cn(
        base,
        'hover:bg-primary-wash',
        current && 'bg-primary-tint',
      )}
    >
      {inner}
    </Link>
  );
};

export default LessonRow;
