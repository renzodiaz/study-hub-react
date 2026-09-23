import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ClockIcon } from '@heroicons/react/20/solid';

import { getAttemptResult, getAttempt } from '@api/assessments';
import useBoundedPoll from '@hooks/useBoundedPoll';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Banner from '@components/ui/Banner';
import ResultSummary from '@components/assessment/ResultSummary';

const isEvaluating = (data) => data?.code === 'evaluation_pending';

// The authoritative credential issuance state (CRED-BE-3). Credential messaging
// is driven by this — never by `passed`/kind. While issuance is genuinely
// pending the result is refreshed (bounded, alongside evaluation polling); it
// stops on issued / unavailable / not_applicable.
const isCredentialPending = (data) => data?.credential?.state === 'pending';
const isRefreshable = (data) => isEvaluating(data) || isCredentialPending(data);

const CREDENTIAL_NOUN = {
  seniority_badge: 'seniority credential',
  course_certificate: 'course certificate',
};

const TARGET_LEVEL_LABEL = {
  mid_senior: 'Mid / Senior',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
};

// Learner-safe credential notice, driven entirely by the server's authoritative
// credential.{state,status}. Never asserts issuance from a passed flag, and
// never leaks an internal reason for the unavailable state.
function CredentialNotice({ credential }) {
  const state = credential?.state;
  if (!state || state === 'not_applicable') return null;

  const noun = CREDENTIAL_NOUN[credential.kind] ?? 'credential';

  if (state === 'pending') {
    return (
      <Banner variant="success" title="Your credential is being issued">
        Your {noun} is being issued and will appear in your Credentials shortly.
      </Banner>
    );
  }

  if (state === 'unavailable') {
    return (
      <Banner variant="info" title="Credential not available yet">
        You passed, but your {noun} isn’t available yet. It will appear in your
        Credentials once it’s ready.
      </Banner>
    );
  }

  // issued — interpret the live status; the qualification verdict is unchanged.
  if (credential.status === 'revoked') {
    return (
      <Banner variant="info" title="Credential revoked">
        Your {noun} was issued and has since been revoked.
      </Banner>
    );
  }
  if (credential.status === 'revalidation_required') {
    return (
      <Banner
        variant="warning"
        title="Credential issued — revalidation required"
      >
        Your {noun} was issued; one of the credentials it relies on now requires
        revalidation.
      </Banner>
    );
  }
  return (
    <Banner variant="success" title="Credential issued">
      Your {noun} has been issued — you can view it in your Credentials.
    </Banner>
  );
}

// Learner-safe result. While the backend reports evaluation_pending (202), shows
// an evaluating state and polls (bounded); then renders the authoritative
// pass/fail. The verdict and score shown are always the server's.
export default function AssessmentResult({ attemptId, initialData }) {
  const { intervalFn, stopped, reset } = useBoundedPoll({
    isPending: isRefreshable,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: () => getAttemptResult(attemptId),
    initialData,
    retry: false,
    refetchInterval: intervalFn,
  });

  // Server-authoritative modality: an interview earns a Seniority Badge, a
  // knowledge assessment a Course Certificate. Read from the owner-scoped
  // attempt endpoint — never inferred from target_level (which is `mid_senior`
  // for both a Mid-Senior course assessment and the Mid-Senior qualification).
  const { data: attemptMeta } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => getAttempt(attemptId),
    retry: false,
  });

  const checkAgain = () => {
    reset();
    refetch();
  };

  if (isLoading) {
    return (
      <p aria-busy="true" className="p-6 text-body text-ink-secondary">
        Loading result…
      </p>
    );
  }
  if (isError) {
    return (
      <p className="p-6 text-body text-danger">
        {error?.message ?? 'Failed to load the result.'}
      </p>
    );
  }

  // Async evaluation still in progress (interview). Generic, reassuring copy —
  // never provider/infrastructure detail, never "you failed".
  if (isEvaluating(data)) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card
          variant="accented"
          accent="primary"
          className="flex items-center gap-3 p-5"
        >
          <ClockIcon
            aria-hidden="true"
            className="size-8 shrink-0 text-primary"
          />
          <div>
            <h1 className="text-section font-semibold text-ink" role="status">
              Your interview is being evaluated
            </h1>
            <p className="mt-1 text-body-sm text-ink-secondary">
              {stopped
                ? 'Your interview is still being evaluated. Your submission is safe — no action is needed from you.'
                : 'Your submission is safe. This can take a little while — you can leave this page and come back; the result will appear here.'}
            </p>
            {stopped ? (
              <div className="mt-3">
                <Button
                  variant="secondary"
                  onClick={checkAgain}
                  busy={isFetching}
                  busyLabel="Checking…"
                >
                  Check again
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  const passed = data.passed;
  const interview = attemptMeta?.kind === 'interview';

  return (
    <div className="mx-auto max-w-2xl p-6">
      <ResultSummary
        passed={passed}
        title={data.assessment_title}
        levelLabel={TARGET_LEVEL_LABEL[data.target_level] ?? data.target_level}
        overallScore={data.overall_score}
        dimensions={data.dimensions}
      />

      {/* A pilot attempt never issues a credential — say so explicitly. The
          server also reports credential.state "not_applicable" for pilots, so no
          issuance notice renders regardless. */}
      {data.pilot ? (
        <div className="mt-6">
          <Banner variant="info" title="This was a pilot assessment">
            No credential is issued for pilot attempts — thank you for helping
            evaluate it.
          </Banner>
        </div>
      ) : null}

      {/* Credential messaging is authoritative (credential.state/status), never
          inferred from passed/kind. */}
      {!data.pilot ? (
        <div className="mt-6">
          <CredentialNotice credential={data.credential} />
        </div>
      ) : null}

      {!passed && interview ? (
        <div className="mt-6">
          <Banner variant="info">
            You did not pass this time. Return to your career to see whether you
            can try again.
          </Banner>
        </div>
      ) : null}

      {typeof data.summary === 'string' && data.summary.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-panel font-semibold text-ink">Summary</h2>
          {/* Untrusted model text — rendered as plain escaped React text. */}
          <p className="mt-2 whitespace-pre-wrap text-body text-ink-secondary">
            {data.summary}
          </p>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Link
          to="/"
          className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-body font-semibold text-white hover:bg-primary-hover"
        >
          Back to Home
        </Link>
        {!data.pilot && passed ? (
          <Link
            to="/achievements"
            className="text-body font-medium text-primary hover:text-primary-hover"
          >
            View credentials
          </Link>
        ) : null}
      </div>

      {data.submitted_at ? (
        <p className="mt-6 text-caption text-ink-muted">
          Submitted {new Date(data.submitted_at).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
