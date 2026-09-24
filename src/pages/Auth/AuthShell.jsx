import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from '@heroicons/react/16/solid';

// Shared account-entry shell for every auth screen (sign in, create account,
// forgot / reset password). It renders the approved auth card — the Study Hub
// wordmark, an optional back link, the title/subtitle, the screen body, and an
// optional divided footer — on the auth ground. All four screens use this so
// the experience is visually coherent (Instrument design system, no second
// auth design language).
const AuthShell = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Back to sign in',
  children,
  footer,
}) => (
  <div className="w-full max-w-[432px]">
    <div className="rounded-sheet border border-line-strong bg-ground px-6 py-10 sm:px-9 sm:py-12">
      <span className="text-card font-semibold tracking-tight text-ink">
        Study Hub
      </span>

      <div className="mt-10">
        {backTo ? (
          <Link
            to={backTo}
            className="mb-5 inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:text-primary-hover"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
            {backLabel}
          </Link>
        ) : null}

        <h1 className="text-title-app font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-body text-ink-secondary">{subtitle}</p>
        ) : null}

        <div className="mt-7">{children}</div>
      </div>

      {footer ? (
        <div className="mt-8 border-t border-line pt-5">{footer}</div>
      ) : null}
    </div>
  </div>
);

export default AuthShell;
