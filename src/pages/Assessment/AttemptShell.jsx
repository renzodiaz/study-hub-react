import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import {
  getAttemptItems,
  saveResponse,
  saveTextResponse,
  submitAttempt,
} from '@api/assessments';
import useDisplayCountdown from '@hooks/useDisplayCountdown';
import Button from '@components/ui/Button';
import Dialog from '@components/ui/Dialog';
import Banner from '@components/ui/Banner';
import ConsequenceHeader from '@components/assessment/ConsequenceHeader';
import ProgressStrip from '@components/assessment/ProgressStrip';
import Timer from '@components/assessment/Timer';
import AssessmentResult from './Result';
import ChoiceQuestion from './ChoiceQuestion';
import FreeTextQuestion from './FreeTextQuestion';

const DEBOUNCE_MS = 600;

const isFreeText = (item) => item.item_type === 'free_text';

// Generic value equality for the autosave queue: arrays (choice) vs strings.
const valuesEqual = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
};

const savedValueFor = (item) =>
  isFreeText(item)
    ? (item.response?.text ?? '')
    : (item.response?.selected_option_ids ?? []);

const isAnswered = (item, value) =>
  isFreeText(item) ? value.trim().length > 0 : value.length > 0;

const persistValue = (attemptId, item, value) =>
  isFreeText(item)
    ? saveTextResponse(attemptId, item.id, value)
    : saveResponse(attemptId, item.id, value);

const SAVE_LABEL = {
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Could not save',
};

// A knowledge submit returns a graded result (has `passed`); an interview submit
// returns an evaluating acknowledgement (no `passed`) — the result is polled.
const isGradedResult = (data) => data && data.passed !== undefined;

export default function AttemptShell() {
  const { attemptId } = useParams({ strict: false });
  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attempt-runner', attemptId],
    queryFn: () => getAttemptItems(attemptId),
    retry: false,
  });

  const [current, setCurrent] = useState(0);
  const [edits, setEdits] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [serverExpired, setServerExpired] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitBlock, setSubmitBlock] = useState(null);
  const [result, setResult] = useState(null);

  const queueRef = useRef({});
  const drainWaitersRef = useRef([]);
  const debounceTimersRef = useRef({});
  const pendingValueRef = useRef({});
  const expiredRef = useRef(false);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    const timers = debounceTimersRef.current;
    return () => {
      mountedRef.current = false;
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const attempt = data?.attempt;
  const items = data?.items ?? [];
  const remaining = useDisplayCountdown(attempt?.expires_at);

  const setStatus = (itemId, value) => {
    if (mountedRef.current) setSaveStatus((s) => ({ ...s, [itemId]: value }));
  };

  const queueIdle = () =>
    Object.values(queueRef.current).every(
      (q) => !q.inFlight && q.pending === undefined,
    );
  const queueHasError = () =>
    Object.values(queueRef.current).some((q) => q.error);
  const resolveDrainIfIdle = () => {
    if (queueIdle()) {
      const waiters = drainWaitersRef.current;
      drainWaitersRef.current = [];
      waiters.forEach((resolve) => resolve());
    }
  };
  const awaitDrain = () =>
    queueIdle()
      ? Promise.resolve()
      : new Promise((resolve) => drainWaitersRef.current.push(resolve));

  const runSave = (item, value) => {
    const q = queueRef.current[item.id];
    q.inFlight = true;
    q.pending = undefined;
    q.error = false;
    setStatus(item.id, 'saving');

    persistValue(attemptId, item, value)
      .then(() => {
        q.inFlight = false;
        q.lastSaved = value;
        if (q.pending !== undefined && !valuesEqual(q.pending, value)) {
          const next = q.pending;
          q.pending = undefined;
          runSave(item, next); // newer value wins
        } else {
          q.pending = undefined;
          setStatus(item.id, 'saved');
          resolveDrainIfIdle();
        }
      })
      .catch((err) => {
        q.inFlight = false;
        q.pending = undefined;
        if (err?.code === 'attempt_expired') {
          expiredRef.current = true;
          if (mountedRef.current) setServerExpired(true);
        } else {
          q.error = true;
          setStatus(item.id, 'error');
        }
        resolveDrainIfIdle();
      });
  };

  const enqueueSave = (item, value) => {
    const q = (queueRef.current[item.id] ||= {
      inFlight: false,
      pending: undefined,
      lastSaved: undefined,
      error: false,
    });
    if (q.inFlight) {
      q.pending = value; // coalesce: newest pending value survives
    } else {
      runSave(item, value);
    }
  };

  const flushDebounces = () => {
    Object.keys(debounceTimersRef.current).forEach((id) => {
      clearTimeout(debounceTimersRef.current[id]);
      delete debounceTimersRef.current[id];
      const value = pendingValueRef.current[id];
      delete pendingValueRef.current[id];
      const item = items.find((it) => String(it.id) === String(id));
      if (item && value !== undefined) enqueueSave(item, value);
    });
  };

  if (isLoading) {
    return (
      <p aria-busy="true" className="p-6 text-body text-ink-secondary">
        Loading questions…
      </p>
    );
  }

  if (result || error?.code === 'attempt_submitted') {
    return (
      <AssessmentResult
        attemptId={attemptId}
        initialData={isGradedResult(result) ? result : undefined}
      />
    );
  }

  if (isError) {
    const expired = error?.code === 'attempt_expired';
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p
          className={`text-body ${expired ? 'text-ink-secondary' : 'text-danger'}`}
        >
          {expired
            ? 'This attempt has expired. You can no longer change your answers.'
            : (error?.message ?? 'Failed to load the assessment.')}
        </p>
      </div>
    );
  }

  const isExpired =
    serverExpired ||
    attempt.expired ||
    attempt.state === 'expired' ||
    remaining <= 0;
  const locked = isExpired || submitting;
  const variant =
    attempt.target_level === 'mid_senior'
      ? 'course-assessment'
      : 'final-qualification';

  const item = items[current];
  const valueFor = (it) => edits[it.id] ?? savedValueFor(it);
  const answeredFlags = items.map((it) => isAnswered(it, valueFor(it)));
  const answeredCount = answeredFlags.filter(Boolean).length;
  const unansweredCount = items.length - answeredCount;

  const onChangeValue = (it, value) => {
    setEdits((e) => ({ ...e, [it.id]: value }));
    if (locked) return;
    if (isFreeText(it)) {
      pendingValueRef.current[it.id] = value;
      clearTimeout(debounceTimersRef.current[it.id]);
      debounceTimersRef.current[it.id] = setTimeout(() => {
        delete debounceTimersRef.current[it.id];
        const v = pendingValueRef.current[it.id];
        delete pendingValueRef.current[it.id];
        if (v !== undefined) enqueueSave(it, v);
      }, DEBOUNCE_MS);
    } else {
      enqueueSave(it, value);
    }
  };

  const goTo = (index) => {
    flushDebounces();
    setCurrent(index);
  };

  const confirmSubmit = async () => {
    if (submittingRef.current) return; // exactly one in-flight submission
    submittingRef.current = true;
    setSubmitBlock(null);
    setSubmitting(true);
    flushDebounces();
    await awaitDrain();

    if (queueHasError()) {
      submittingRef.current = false;
      setSubmitting(false);
      setSubmitBlock('unsaved');
      return;
    }
    if (expiredRef.current) {
      submittingRef.current = false;
      setSubmitting(false);
      setConfirmOpen(false);
      return;
    }

    try {
      const submitted = await submitAttempt(attemptId);
      if (mountedRef.current)
        setResult(isGradedResult(submitted) ? submitted : { pending: true });
    } catch (err) {
      submittingRef.current = false;
      if (!mountedRef.current) return;
      setSubmitting(false);
      if (err?.code === 'attempt_expired') {
        expiredRef.current = true;
        setServerExpired(true);
        setConfirmOpen(false);
      } else {
        setSubmitBlock(err?.message ?? 'Submission failed. Please try again.');
      }
    }
  };

  const status = item ? saveStatus[item.id] : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ConsequenceHeader
          variant={variant}
          title={attempt.assessment_title}
          meta={`Attempt #${attempt.attempt_number} · version v${attempt.version_no}`}
        />
        <div className="flex shrink-0 items-center gap-3">
          <Timer secondsRemaining={remaining} expired={isExpired} />
          <Button variant="quiet" onClick={() => setExitOpen(true)}>
            Exit
          </Button>
        </div>
      </div>

      {isExpired ? (
        <Banner variant="warning" title="This attempt has expired">
          Your answers can no longer be changed.
        </Banner>
      ) : null}

      <ProgressStrip
        count={items.length}
        answeredFlags={answeredFlags}
        current={current}
        onSelect={goTo}
      />

      {item ? (
        <section>
          <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
            Question {current + 1} of {items.length}
          </p>
          <h2 className="mt-1 text-section font-semibold text-ink">
            {item.prompt}
          </h2>

          {isFreeText(item) ? (
            <FreeTextQuestion
              item={item}
              value={valueFor(item)}
              locked={locked}
              onChange={(text) => onChangeValue(item, text)}
            />
          ) : (
            <ChoiceQuestion
              item={item}
              value={valueFor(item)}
              locked={locked}
              onChange={(ids) => onChangeValue(item, ids)}
            />
          )}

          <div className="mt-3 flex items-center gap-3 text-body-sm">
            {status ? (
              <span
                role="status"
                className={
                  status === 'error' ? 'text-danger' : 'text-ink-muted'
                }
              >
                {SAVE_LABEL[status]}
              </span>
            ) : null}
            {status === 'error' && !locked ? (
              <button
                type="button"
                onClick={() => enqueueSave(item, valueFor(item))}
                className="font-medium text-primary hover:text-primary-hover"
              >
                Retry
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between border-t border-line pt-6">
        <Button
          variant="secondary"
          onClick={() => goTo(Math.max(0, current - 1))}
          disabled={current === 0}
        >
          Previous
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => goTo(Math.min(items.length - 1, current + 1))}
            disabled={current >= items.length - 1}
          >
            Next
          </Button>
          {!isExpired ? (
            <Button
              onClick={() => {
                flushDebounces();
                setSubmitBlock(null);
                setConfirmOpen(true);
              }}
            >
              Submit assessment
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!submitting) setConfirmOpen(false);
        }}
        variant="confirm"
        title="Submit this assessment?"
        actions={
          <>
            <Button
              variant="quiet"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSubmit}
              busy={submitting}
              busyLabel="Submitting…"
            >
              Confirm submission
            </Button>
          </>
        }
      >
        <p className="text-body text-ink-secondary">
          You have answered <strong>{answeredCount}</strong> of{' '}
          <strong>{items.length}</strong> questions
          {unansweredCount > 0 ? <> ({unansweredCount} unanswered)</> : null}.
          Submission is final and cannot be undone.
        </p>
        {submitBlock === 'unsaved' ? (
          <div className="mt-3">
            <Banner variant="danger" title="Some answers didn’t save">
              Close this dialog, resolve them, then submit again.
            </Banner>
          </div>
        ) : null}
        {submitBlock && submitBlock !== 'unsaved' ? (
          <div className="mt-3">
            <Banner variant="danger">{submitBlock}</Banner>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        variant="informational"
        title="Leave the assessment?"
        actions={
          <>
            <Button variant="quiet" onClick={() => setExitOpen(false)}>
              Keep going
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setExitOpen(false);
                router.history.back();
              }}
            >
              Leave
            </Button>
          </>
        }
      >
        <p className="text-body text-ink-secondary">
          Your saved answers are kept and you can return to this attempt.{' '}
          <span className="font-medium text-ink">
            Leaving does not stop the clock
          </span>{' '}
          — the attempt window keeps running while you are away.
        </p>
      </Dialog>
    </div>
  );
}
