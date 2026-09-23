import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  MinusCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/20/solid';

import { classNames as cn } from '@utils/helpers';

// StatusPill — a semantic status, never a colour (§6.2, §6.1, §5.1).
//
// The public API is a semantic `status`; the component derives colour, tint and
// a default icon from it. There is deliberately no raw-colour prop, so a caller
// cannot make status meaning colour-only. Every pill renders icon + word: the
// text label is the carrier and the icon reinforces it (aria-hidden), so the
// meaning survives in forced-colours mode and for colour-blind readers.

const STATUSES = {
  neutral: {
    className: 'text-neutral bg-neutral-tint border-neutral-line',
    Icon: MinusCircleIcon,
  },
  success: {
    className: 'text-success bg-success-tint border-success-line',
    Icon: CheckCircleIcon,
  },
  warning: {
    className: 'text-warning bg-warning-tint border-warning-line',
    Icon: ExclamationTriangleIcon,
  },
  danger: {
    className: 'text-danger bg-danger-tint border-danger-line',
    Icon: XCircleIcon,
  },
  info: {
    className: 'text-info bg-info-tint border-info-line',
    Icon: InformationCircleIcon,
  },
  bronze: {
    className: 'text-bronze bg-bronze-tint border-bronze-tint-line',
    Icon: CheckBadgeIcon,
  },
};

const StatusPill = ({ status = 'neutral', children, icon, className }) => {
  const { className: statusClass, Icon } = STATUSES[status] ?? STATUSES.neutral;
  const resolvedIcon =
    icon !== undefined ? (
      icon
    ) : (
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
    );

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5',
        'text-caption font-semibold',
        statusClass,
        className,
      )}
    >
      {resolvedIcon}
      <span>{children}</span>
    </span>
  );
};

export default StatusPill;
