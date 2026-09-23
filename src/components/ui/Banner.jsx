import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid';

import { classNames as cn } from '@utils/helpers';

// Banner — an inline, in-flow status message (§6.2, §5.1).
//
// It is never a floating toast for anything consequential, and it carries at
// most one action (the API is a single `action` node, not a list). Status is
// carried by an icon + text, never colour alone. This is a generic primitive:
// the Dashboard attention band is a later, product-specific composition, not
// this component.

const VARIANTS = {
  info: {
    container: 'bg-info-tint border-info-line',
    icon: 'text-info',
    Icon: InformationCircleIcon,
    role: 'status',
  },
  success: {
    container: 'bg-success-tint border-success-line',
    icon: 'text-success',
    Icon: CheckCircleIcon,
    role: 'status',
  },
  warning: {
    container: 'bg-warning-tint border-warning-line',
    icon: 'text-warning',
    Icon: ExclamationTriangleIcon,
    role: 'alert',
  },
  danger: {
    container: 'bg-danger-tint border-danger-line',
    icon: 'text-danger',
    Icon: ExclamationCircleIcon,
    role: 'alert',
  },
};

const Banner = ({
  variant = 'info',
  title,
  children,
  action,
  role,
  className,
}) => {
  const cfg = VARIANTS[variant] ?? VARIANTS.info;
  const { Icon } = cfg;

  return (
    <div
      role={role ?? cfg.role}
      className={cn(
        'flex items-start gap-3 rounded-control border p-4',
        cfg.container,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('mt-0.5 size-5 shrink-0', cfg.icon)}
      />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="text-body font-semibold text-ink">{title}</p>
        ) : null}
        {children ? (
          <div
            className={cn('text-body-sm text-ink-secondary', title && 'mt-0.5')}
          >
            {children}
          </div>
        ) : null}
        {/* One action maximum (§6.2). */}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
};

export default Banner;
