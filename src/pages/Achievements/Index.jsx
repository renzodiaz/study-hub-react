import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from '@tanstack/react-router';
import {
  AcademicCapIcon,
  CheckBadgeIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/20/solid';

import { getCertificates, getSeniorityBadges } from '@api/learn';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Chip from '@components/ui/Chip';
import StatusPill from '@components/ui/StatusPill';
import Banner from '@components/ui/Banner';
import EmptyState from '@components/learn/EmptyState';

const LEVEL_LABELS = {
  beginner: 'Beginner',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
  mid_senior: 'Mid-Senior',
};

const label = (value) => LEVEL_LABELS[value] ?? value;
const isKnowledge = (cert) => cert.credential_kind === 'knowledge';

// The verification URL is built from the existing public route + the server's
// opaque token. No new backend URL contract, and the token is never shown as a
// human "credential number".
const publicUrl = (token) => `${window.location.origin}/verify/${token}`;

// LinkedIn's "Add to profile" deep link. certUrl is the existing verification
// link; certId is the human-facing credential identifier (a supported LinkedIn
// field) — never the opaque public_token.
const linkedInUrl = (cert) => {
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cert.course_title ?? 'Study Hub Certificate',
    organizationName: 'Study Hub',
    certUrl: publicUrl(cert.public_token),
  });
  if (cert.public_identifier) params.set('certId', cert.public_identifier);
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
};

// Human-facing, display-only credential reference (SH-C-… / SH-B-…). Rendered as
// secondary document metadata in monospace; omitted cleanly when absent (never a
// guessed fallback, never derived from the token or resource id).
const CredentialId = ({ value }) =>
  value ? (
    <div>
      <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
        Credential ID
      </p>
      <p className="mt-0.5 font-mono text-body-sm text-ink-secondary">
        {value}
      </p>
    </div>
  ) : null;

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '';

// Verify action — opens the existing public verification route (unauthenticated
// page, new tab). Not the token in raw form.
const VerifyLink = ({ token }) => (
  <a
    href={publicUrl(token)}
    target="_blank"
    rel="noreferrer"
    className="inline-flex h-9 items-center gap-1.5 rounded-control bg-primary px-3 text-body-sm font-semibold text-white hover:bg-primary-hover"
  >
    <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4" />
    View verification
  </a>
);

const CopyLinkButton = ({ token }) => {
  const [copied, setCopied] = useState(false);
  const statusId = useId();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl(token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={copy}
        iconStart={<LinkIcon aria-hidden="true" className="size-4" />}
        aria-describedby={statusId}
      >
        Copy link
      </Button>
      <span id={statusId} role="status" className="text-caption text-success">
        {copied ? 'Link copied' : ''}
      </span>
    </span>
  );
};

// Authoritative badge status → semantic StatusPill (icon + word, never colour
// alone; bronze is proof emphasis and never stands in for "valid").
const BADGE_STATUS = {
  valid: { status: 'success', label: 'Valid' },
  revalidation_required: {
    status: 'warning',
    label: 'Revalidation required',
  },
  revoked: { status: 'neutral', label: 'Revoked' },
};

const BadgeStatusPill = ({ status }) => {
  const cfg = BADGE_STATUS[status];
  if (!cfg) return null; // status omitted → make no claim
  return <StatusPill status={cfg.status}>{cfg.label}</StatusPill>;
};

const BADGE_STATUS_NOTE = {
  revalidation_required:
    'This badge was issued, but one of the credentials it was built on now requires revalidation.',
  revoked: 'This badge was issued and has since been revoked.',
};

// SeniorityBadge — the primary career credential. Bronze proof accent and a
// document-like presentation give it more consequence than a Course Certificate,
// without gamification or plan-tier prestige.
const BadgeCard = ({ badge }) => {
  const note = BADGE_STATUS_NOTE[badge.status];
  return (
    <Card
      as="li"
      variant="accented"
      accent="bronze"
      className="flex flex-col gap-4 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckBadgeIcon
            aria-hidden="true"
            className="size-8 shrink-0 text-bronze"
          />
          <div className="min-w-0">
            <p className="text-caption font-semibold uppercase tracking-wide text-bronze">
              Seniority Badge
            </p>
            <h3 className="mt-0.5 break-words font-serif text-card font-semibold text-ink">
              {label(badge.level)} · {badge.career_track_name}
            </h3>
            <p className="mt-1 text-body-sm text-ink-muted">
              Earned {formatDate(badge.earned_at)}
            </p>
          </div>
        </div>
        <BadgeStatusPill status={badge.status} />
      </div>

      {note ? <p className="text-body-sm text-ink-secondary">{note}</p> : null}

      {/* The authoritative competency standard the badge was earned against
          (server-provided; omitted cleanly if a legacy badge lacks one). Never
          derived from the career name or level, never a hard-coded value. */}
      {badge.competency_standard ? (
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Competency standard
          </p>
          <p className="mt-0.5 text-body-sm text-ink-secondary">
            {badge.competency_standard.name} · v
            {badge.competency_standard.version}
          </p>
        </div>
      ) : null}

      <CredentialId value={badge.public_identifier} />

      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <VerifyLink token={badge.public_token} />
        <CopyLinkButton token={badge.public_token} />
      </div>
    </Card>
  );
};

// Course Certificate — bounded evidence for one Course. Never implies overall
// Mid-Senior seniority (that is the SeniorityBadge's claim).
const CertificateCard = ({ certificate }) => (
  <Card as="li" className="flex flex-col gap-4 p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <AcademicCapIcon
          aria-hidden="true"
          className="size-7 shrink-0 text-primary"
        />
        <div className="min-w-0">
          <h3 className="break-words text-card font-semibold text-ink">
            {certificate.course_title}
          </h3>
          <p className="mt-1 text-body-sm text-ink-muted">
            Issued {formatDate(certificate.issued_at)}
          </p>
        </div>
      </div>
      <StatusPill status={certificate.revoked ? 'neutral' : 'success'}>
        {certificate.revoked ? 'Revoked' : 'Valid'}
      </StatusPill>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      {isKnowledge(certificate) ? (
        <>
          <Chip>Knowledge credential</Chip>
          <Chip>{label(certificate.target_level)} standard</Chip>
        </>
      ) : (
        <Chip>{label(certificate.level)}</Chip>
      )}
    </div>

    <CredentialId value={certificate.public_identifier} />

    <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <VerifyLink token={certificate.public_token} />
      <CopyLinkButton token={certificate.public_token} />
      <a
        href={linkedInUrl(certificate)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-body-sm font-semibold text-ink hover:bg-primary-wash"
      >
        Add to LinkedIn
      </a>
    </div>
  </Card>
);

// One section (Certificates / Seniority Badges). Loading, request failure and a
// successful-but-empty result are three DISTINCT states — a failed query never
// masquerades as "none yet".
const CredentialSection = ({
  heading,
  query,
  emptyText,
  errorText,
  gridClassName,
  renderItem,
}) => {
  const { data = [], isLoading, isError, refetch, isFetching } = query;

  return (
    <section className="space-y-4">
      <h2 className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
        {heading}
      </h2>

      {isLoading ? (
        <p aria-busy="true" className="text-body-sm text-ink-muted">
          Loading…
        </p>
      ) : isError ? (
        <Banner
          variant="danger"
          title={errorText}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              busy={isFetching}
              busyLabel="Retrying…"
            >
              Try again
            </Button>
          }
        >
          Something went wrong loading this section. Your credentials are safe.
        </Banner>
      ) : data.length === 0 ? (
        <p className="text-body-sm text-ink-muted">{emptyText}</p>
      ) : (
        <ul className={gridClassName}>{data.map(renderItem)}</ul>
      )}
    </section>
  );
};

const Credentials = () => {
  const certificatesQuery = useQuery({
    queryKey: ['learn', 'certificates'],
    queryFn: getCertificates,
    retry: false,
  });
  const badgesQuery = useQuery({
    queryKey: ['learn', 'badges'],
    queryFn: getSeniorityBadges,
    retry: false,
  });

  // Distinguish "still loading" from "loaded and genuinely empty" from "failed".
  // The empty state only shows when BOTH queries succeeded with no rows.
  const bothLoaded = certificatesQuery.isSuccess && badgesQuery.isSuccess;
  const isEmpty =
    bothLoaded &&
    certificatesQuery.data.length === 0 &&
    badgesQuery.data.length === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-title-app font-semibold text-ink">Credentials</h1>
        <p className="mt-2 max-w-prose text-body text-ink-secondary">
          Your verifiable proof of what you have learned and demonstrated. A
          Course Certificate covers one course; a Seniority Badge is the
          career-level credential earned by completing every course and passing
          the Final Qualification.
        </p>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={CheckBadgeIcon}
          title="No credentials yet"
          description="Learn, practise, and prove what you know — pass a course assessment to earn your first Course Certificate, then the Final Qualification for your Seniority Badge."
          action={
            <RouterLink
              to="/learn"
              className="inline-flex h-10 items-center rounded-control bg-primary px-4 text-body font-semibold text-white hover:bg-primary-hover"
            >
              Explore careers
            </RouterLink>
          }
        />
      ) : (
        <div className="space-y-10">
          <CredentialSection
            heading="Seniority Badges"
            query={badgesQuery}
            emptyText="No seniority badges yet."
            errorText="Couldn't load your seniority badges"
            gridClassName="grid grid-cols-1 gap-6 lg:grid-cols-2"
            renderItem={(b) => <BadgeCard key={b.id} badge={b} />}
          />
          <CredentialSection
            heading="Course Certificates"
            query={certificatesQuery}
            emptyText="No course certificates yet."
            errorText="Couldn't load your course certificates"
            gridClassName="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            renderItem={(c) => <CertificateCard key={c.id} certificate={c} />}
          />
        </div>
      )}
    </div>
  );
};

export default Credentials;
