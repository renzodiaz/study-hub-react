import { useEffect, useRef, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon } from '@heroicons/react/20/solid';

import {
  getAttemptItems,
  saveResponse,
  saveTextResponse,
  submitAttempt,
} from '@api/assessments';
import useDisplayCountdown from '@hooks/useDisplayCountdown';
import AssessmentResult from './Result';
import ChoiceQuestion from './ChoiceQuestion';
import FreeTextQuestion from './FreeTextQuestion';

const DEBOUNCE_MS = 600;

const isFreeText = (item) => item.item_type === 'free_text';

// Generic value equality for the autosave queue: arrays (choice) vs strings
// (free_text).
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

// Persists one item's value with the correct endpoint for its type.
const persistValue = (attemptId, item, value) =>
  isFreeText(item)
    ? saveTextResponse(attemptId, item.id, value)
    : saveResponse(attemptId, item.id, value);

const formatClock = (total) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

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
  const [submitting, setSubmitting] = useState(false);
  const [submitBlock, setSubmitBlock] = useState(null);
  const [result, setResult] = useState(null);

  const queueRef = useRef({});
  const drainWaitersRef = useRef([]);
  const debounceTimersRef = useRef({}); // { [id]: timeoutId } — free_text only
  const pendingValueRef = useRef({}); // { [id]: latest debounced value }
  const expiredRef = useRef(false);
  const submittingRef = useRef(false); // hard guard against duplicate submits
  // MUST set true on every mount (StrictMode mounts → unmounts → remounts) so a
  // cleanup never leaves this false for the component's life (previously swallowed
  // setResult after submit). Also clears any pending debounce timers on unmount.
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

  // Fire any pending debounced saves immediately (navigation / submit).
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
    return <p className="p-6 text-sm text-gray-500">Loading questions…</p>;
  }

  // A submitted attempt (restore, or the items endpoint reporting it) shows the
  // result/evaluating screen, never an editable runner.
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
        <p className={`text-sm ${expired ? 'text-gray-600' : 'text-red-600'}`}>
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

  const item = items[current];
  const valueFor = (it) => edits[it.id] ?? savedValueFor(it);
  const answeredCount = items.filter((it) =>
    isAnswered(it, valueFor(it)),
  ).length;
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
    flushDebounces(); // persist latest text before moving
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
      // Knowledge → graded result seeds the screen; interview → evaluating (the
      // Result screen fetches/polls the authoritative outcome).
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
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {attempt.assessment_title}
          </h1>
          <p className="text-sm text-gray-500">
            Attempt #{attempt.attempt_number} · version v{attempt.version_no}
          </p>
        </div>
        {isExpired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            Expired
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700"
            aria-label="time remaining"
          >
            <ClockIcon className="size-4" />
            {formatClock(remaining)} left
          </span>
        )}
      </div>

      {isExpired && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          This attempt has expired. Your answers can no longer be changed.
        </div>
      )}

      <nav aria-label="Questions" className="mt-6 flex flex-wrap gap-2">
        {items.map((it, index) => {
          const answered = isAnswered(it, valueFor(it));
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => goTo(index)}
              aria-current={index === current ? 'true' : undefined}
              aria-label={`Question ${index + 1}${answered ? ', answered' : ''}`}
              className={[
                'size-9 rounded-md border text-sm font-medium',
                index === current
                  ? 'border-indigo-600 ring-2 ring-indigo-200'
                  : 'border-gray-200',
                answered
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700',
              ].join(' ')}
            >
              {index + 1}
            </button>
          );
        })}
      </nav>

      {item && (
        <section className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Question {current + 1} of {items.length}
          </p>
          <h2 className="mt-1 text-base font-semibold text-gray-900">
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

          <div className="mt-3 flex items-center gap-3 text-sm">
            {status && (
              <span
                role="status"
                className={
                  status === 'error' ? 'text-red-600' : 'text-gray-500'
                }
              >
                {SAVE_LABEL[status]}
              </span>
            )}
            {status === 'error' && !locked && (
              <button
                type="button"
                onClick={() => enqueueSave(item, valueFor(item))}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Retry
              </button>
            )}
          </div>
        </section>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(Math.max(0, current - 1))}
          disabled={current === 0}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          Previous
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(Math.min(items.length - 1, current + 1))}
            disabled={current >= items.length - 1}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            Next
          </button>
          {!isExpired && (
            <button
              type="button"
              onClick={() => {
                flushDebounces();
                setSubmitBlock(null);
                setConfirmOpen(true);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Submit assessment
            </button>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm submission"
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Submit this assessment?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You have answered <strong>{answeredCount}</strong> of{' '}
              <strong>{items.length}</strong> questions
              {unansweredCount > 0 && <> ({unansweredCount} unanswered)</>}.
              Submission is final and cannot be undone.
            </p>

            {submitBlock === 'unsaved' && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                Some answers didn’t save. Close this dialog, resolve them, then
                submit again.
              </p>
            )}
            {submitBlock && submitBlock !== 'unsaved' && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {submitBlock}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                {submitting ? 'Submitting…' : 'Confirm submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
