import { useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/20/solid';

import { getPublicCredential } from '@api/learn';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Chip from '@components/ui/Chip';
import StatusPill from '@components/ui/StatusPill';
import Banner from '@components/ui/Banner';
import Disclosure from '@components/ui/Disclosure';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
  mid_senior: 'Mid-Senior',
};
const label = (v) => LEVEL_LABELS[v] ?? v;

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' }) : '';
const formatScore = (v) => (typeof v === 'number' ? v.toFixed(2) : null);

const publicUrl = (token) => `${window.location.origin}/verify/${token}`;

// Current lifecycle status → semantic StatusPill (icon + word, never colour
// alone). Authenticity (the token resolved to a Study Hub issuance record) is
// distinct from this current status.
const STATUS = {
  valid: { status: 'success', label: 'Valid' },
  revalidation_required: { status: 'warning', label: 'Revalidation required' },
  revoked: { status: 'neutral', label: 'Revoked' },
};

// Verification pages are shareable capabilities, not discovery surfaces — keep
// them out of search indexes. Scoped to this route (removed on unmount).
function useNoindex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}

const StatusLine = ({ status }) => {
  const cfg = STATUS[status] ?? STATUS.valid;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
        Current status
      </span>
      <StatusPill status={cfg.status}>{cfg.label}</StatusPill>
    </div>
  );
};

const SectionHeading = ({ children }) => (
  <h2 className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
    {children}
  </h2>
);

const CredentialId = ({ value }) =>
  value ? (
    <div>
      <SectionHeading>Credential ID</SectionHeading>
      <p className="mt-1 font-mono text-body-sm text-ink-secondary">{value}</p>
    </div>
  ) : null;

// ── Certificate: bounded evidence for ONE course ─────────────────────────────
const CertificateVerification = ({ certificate: c }) => {
  const isKnowledge = c.credential_kind === 'knowledge';
  const status = c.status === 'revoked' ? 'revoked' : 'valid';
  const dims = Array.isArray(c.dimensions) ? c.dimensions : [];

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-primary">
          <AcademicCapIcon aria-hidden="true" className="size-6" />
          <span className="text-caption font-semibold uppercase tracking-wide">
            Course Certificate
          </span>
        </div>
        <StatusLine status={status} />
      </div>

      <p className="mt-6 text-body-sm text-ink-muted">This certifies that</p>
      <h1 className="mt-1 font-serif text-title font-semibold text-ink">
        {c.holder_name}
      </h1>

      {/* Bounded claim — evidence for one course; never a seniority level. */}
      <p className="mt-4 text-body text-ink-secondary">
        satisfied the requirements for the course{' '}
        <span className="font-semibold text-ink">{c.course_title}</span>. This
        is evidence for one course and does not claim a seniority level.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isKnowledge ? (
          <Chip>{label(c.target_level)} standard</Chip>
        ) : (
          <Chip>{label(c.level)} level</Chip>
        )}
      </div>

      {status === 'revoked' ? (
        <div className="mt-6">
          <Banner variant="info" title="This credential has been revoked">
            The issuance record remains verifiable; its current status is
            revoked.
          </Banner>
        </div>
      ) : null}

      {isKnowledge && (formatScore(c.overall_score) || dims.length > 0) ? (
        <section className="mt-6 border-t border-line pt-6">
          <SectionHeading>Evidence</SectionHeading>
          {formatScore(c.overall_score) ? (
            <p className="mt-2 text-body text-ink-secondary">
              Overall score{' '}
              <span className="font-semibold text-ink">
                {formatScore(c.overall_score)}
              </span>
            </p>
          ) : null}
          {dims.length > 0 ? (
            <dl className="mt-2 space-y-1">
              {dims.map((d) => (
                <div
                  key={d.key}
                  className="flex justify-between gap-4 text-body-sm"
                >
                  <dt className="text-ink-secondary">{d.label ?? d.key}</dt>
                  <dd className="font-medium text-ink">
                    {formatScore(d.score)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6">
        <CredentialId value={c.public_identifier} />
        <p className="text-caption text-ink-muted">
          Issued {formatDate(c.issued_at)}
        </p>
      </section>
    </Card>
  );
};

// ── SeniorityBadge: career-level credential ──────────────────────────────────
const Claim = ({ claim }) => {
  if (!claim) return null;
  const caps = Array.isArray(claim.demonstrated_capabilities)
    ? claim.demonstrated_capabilities
    : [];
  return (
    <section className="mt-6 border-t border-line pt-6">
      <SectionHeading>What this credential claims</SectionHeading>
      {claim.summary ? (
        <p className="mt-2 text-body text-ink-secondary">{claim.summary}</p>
      ) : null}
      {claim.boundary ? (
        <p className="mt-3 text-body-sm text-ink-secondary">{claim.boundary}</p>
      ) : null}
      {caps.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-ink-secondary">
          {caps.map((cap) => (
            <li key={cap}>{cap}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

const BadgeEvidence = ({ qualification }) => {
  const q = qualification ?? {};
  const prereqs = Array.isArray(q.prerequisite_credentials)
    ? q.prerequisite_credentials
    : [];
  const interview = q.interview ?? {};
  const dims = Array.isArray(interview.dimension_scores)
    ? interview.dimension_scores
    : [];

  return (
    <section className="mt-6 border-t border-line pt-6">
      <SectionHeading>Evidence</SectionHeading>

      {prereqs.length > 0 ? (
        <div className="mt-3">
          <p className="text-body-sm font-medium text-ink">
            Course Certificates
            {typeof q.required_course_count === 'number'
              ? ` (${q.required_course_count} required)`
              : ''}
          </p>
          <ul className="mt-2 space-y-1.5">
            {prereqs.map((p) => (
              <li
                key={p.certificate_token ?? p.course_title}
                className="flex flex-wrap items-center justify-between gap-2 text-body-sm"
              >
                {p.certificate_token ? (
                  <a
                    href={publicUrl(p.certificate_token)}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary-hover hover:underline"
                  >
                    {p.course_title}
                    <ArrowTopRightOnSquareIcon
                      aria-hidden="true"
                      className="size-3.5"
                    />
                  </a>
                ) : (
                  <span className="text-ink-secondary">{p.course_title}</span>
                )}
                <StatusPill
                  status={p.status === 'revoked' ? 'neutral' : 'success'}
                >
                  {p.status === 'revoked' ? 'Revoked' : 'Valid'}
                </StatusPill>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {formatScore(interview.overall_score) || dims.length > 0 ? (
        <div className="mt-4">
          <p className="text-body-sm font-medium text-ink">
            Final Qualification
          </p>
          {formatScore(interview.overall_score) ? (
            <p className="mt-1 text-body-sm text-ink-secondary">
              Overall score{' '}
              <span className="font-semibold text-ink">
                {formatScore(interview.overall_score)}
              </span>
              {interview.completed_at
                ? ` · completed ${formatDate(interview.completed_at)}`
                : ''}
            </p>
          ) : null}
          {dims.length > 0 ? (
            <dl className="mt-2 space-y-1">
              {dims.map((d) => (
                <div
                  key={d.key}
                  className="flex justify-between gap-4 text-body-sm"
                >
                  <dt className="text-ink-secondary">{d.key}</dt>
                  <dd className="font-medium text-ink">
                    {formatScore(d.score)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

const CompetencyStandard = ({ standard, publicIdentifier }) => {
  if (!standard) return null;
  const areas = Array.isArray(standard.competency_areas)
    ? standard.competency_areas
    : [];
  return (
    <section className="mt-6 border-t border-line pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionHeading>Competency standard</SectionHeading>
          <p className="mt-1 text-body text-ink-secondary">
            {standard.name} · v{standard.version}
          </p>
        </div>
        <CredentialId value={publicIdentifier} />
      </div>

      {areas.length > 0 ? (
        <div className="mt-4">
          <Disclosure
            summary={`Competency areas (${areas.length})`}
            variant="section"
          >
            <ol className="space-y-1 px-4 pb-4 text-body-sm text-ink-secondary">
              {areas.map((a) => (
                <li key={a.number}>
                  {a.number}. {a.name}
                </li>
              ))}
            </ol>
          </Disclosure>
        </div>
      ) : null}
    </section>
  );
};

const Limitations = ({ limitations }) => {
  const items = Array.isArray(limitations) ? limitations : [];
  if (items.length === 0) return null;
  return (
    <section className="mt-6 border-t border-line pt-6">
      <SectionHeading>What this credential does not prove</SectionHeading>
      <p className="mt-2 text-body-sm text-ink-secondary">
        The credential does not by itself prove:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-ink-secondary">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
};

const REVALIDATION_COPY =
  'This credential was issued by Study Hub, but one or more of the credentials supporting it now requires revalidation.';

const BadgeVerification = ({ badge: b }) => {
  const status = STATUS[b.status] ? b.status : 'valid';
  const std = b.competency_standard;

  return (
    <Card variant="accented" accent="bronze" className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-bronze">
          <CheckBadgeIcon aria-hidden="true" className="size-6" />
          <span className="text-caption font-semibold uppercase tracking-wide">
            Seniority Badge
          </span>
        </div>
        <StatusLine status={status} />
      </div>

      <p className="mt-6 text-body-sm text-ink-muted">Issued by Study Hub to</p>
      <h1 className="mt-1 font-serif text-title font-semibold text-ink">
        {b.holder_name}
      </h1>
      <p className="mt-2 text-body text-ink-secondary">
        {label(b.career?.target_level)} · {b.career?.name}
      </p>

      {status === 'revalidation_required' ? (
        <div className="mt-6">
          <Banner variant="warning" title="Revalidation required">
            {REVALIDATION_COPY}
          </Banner>
        </div>
      ) : null}
      {status === 'revoked' ? (
        <div className="mt-6">
          <Banner variant="info" title="This credential has been revoked">
            The issuance record remains verifiable; its current status is
            revoked.
          </Banner>
        </div>
      ) : null}

      <Claim claim={std?.claim} />
      <BadgeEvidence qualification={b.qualification} />
      <CompetencyStandard
        standard={std}
        publicIdentifier={b.public_identifier}
      />
      <Limitations limitations={std?.limitations} />

      <p className="mt-6 border-t border-line pt-6 text-caption text-ink-muted">
        Issued {formatDate(b.badge?.issued_at)}
      </p>
    </Card>
  );
};

// ── States ───────────────────────────────────────────────────────────────────
const NotFound = () => (
  <Card className="p-8 text-center">
    <h1 className="text-section font-semibold text-ink">
      Credential not found
    </h1>
    <p className="mt-2 text-body text-ink-secondary">
      We couldn’t find a credential for this verification link. Check the link
      and try again.
    </p>
  </Card>
);

const TemporaryFailure = ({ onRetry, retrying }) => (
  <Card className="p-8 text-center">
    <h1 className="text-section font-semibold text-ink">
      Verification temporarily unavailable
    </h1>
    <p className="mt-2 text-body text-ink-secondary">
      We couldn’t verify this credential right now. Please try again.
    </p>
    <div className="mt-5 print:hidden">
      <Button
        variant="secondary"
        onClick={onRetry}
        busy={retrying}
        busyLabel="Retrying…"
      >
        Try again
      </Button>
    </div>
  </Card>
);

const Credential = () => {
  useNoindex();
  const { token } = useParams({ strict: false });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['public', 'credential', token],
    queryFn: () => getPublicCredential(token),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-ground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <p className="font-semibold text-ink">Study Hub</p>
          <p className="text-caption text-ink-muted">Credential verification</p>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8">
        {isLoading ? (
          <p
            aria-busy="true"
            className="text-center text-body text-ink-secondary"
          >
            Verifying credential…
          </p>
        ) : isError ? (
          error?.notFound ? (
            <NotFound />
          ) : (
            <TemporaryFailure onRetry={() => refetch()} retrying={isFetching} />
          )
        ) : data?.credential_type === 'seniority_badge' ? (
          <BadgeVerification badge={data} />
        ) : (
          <CertificateVerification certificate={data} />
        )}
      </main>
    </div>
  );
};

export default Credential;
