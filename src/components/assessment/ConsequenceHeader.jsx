import { classNames as cn } from '@utils/helpers';

// ConsequenceHeader (§6.4, §10.3.1): the explicit text label is the PRIMARY
// carrier of the consequence and is rendered first; colour is reinforcement
// only, never the sole signal. `title` is the page h1.
//
// Course Assessment uses the petrol/neutral treatment; the Final Qualification
// uses bronze (proof). The runner derives its variant from the server's
// target_level, so the correct label shows for either without any
// Final-Qualification behaviour change.
const VARIANTS = {
  practice: {
    label: 'Practice — no credential effect',
    color: 'text-ink-muted',
  },
  'course-assessment': { label: 'Course assessment', color: 'text-primary' },
  'final-qualification': { label: 'Final Qualification', color: 'text-bronze' },
};

const ConsequenceHeader = ({ variant = 'course-assessment', title, meta }) => {
  const v = VARIANTS[variant] ?? VARIANTS['course-assessment'];
  return (
    <div>
      <p
        className={cn(
          'text-eyebrow font-semibold uppercase tracking-wide',
          v.color,
        )}
      >
        {v.label}
      </p>
      {title ? (
        <h1 className="mt-1 text-title-app font-semibold text-ink">{title}</h1>
      ) : null}
      {meta ? <p className="mt-1 text-body-sm text-ink-muted">{meta}</p> : null}
    </div>
  );
};

export default ConsequenceHeader;
