import { useEffect, useRef, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon } from '@heroicons/react/20/solid';

import { getAttemptItems, saveResponse, submitAttempt } from '@api/assessments';
import useDisplayCountdown from '@hooks/useDisplayCountdown';
import AssessmentResult from './Result';

const arraysEqual = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const formatClock = (total) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Autosave status label per item. Purely advisory — the server is the authority
// on what was actually persisted.
const SAVE_LABEL = {
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Could not save',
};

export default function AttemptShell() {
  const { attemptId } = useParams({ strict: false });

  // Everything is restored from the server — nothing about the attempt or the
  // answers is persisted client-side, so a refresh reconstructs the full state.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attempt-runner', attemptId],
    queryFn: () => getAttemptItems(attemptId),
    retry: false, // never hammer an expired / not-owned / submitted attempt
  });

  const [current, setCurrent] = useState(0);
  const [edits, setEdits] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [serverExpired, setServerExpired] = useState(false);

  // Submission UI state.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitBlock, setSubmitBlock] = useState(null); // 'unsaved' | message | null
  const [result, setResult] = useState(null); // set once submitted (avoids refetch)

  // Per-item autosave queue: at most ONE in-flight write per item; newer changes
  // collapse into `pending` (latest only). Held in a ref (control flow, not
  // rendered). `error` mirrors the last outcome so the submit gate can read it
  // synchronously without racing React state.
  const queueRef = useRef({}); // { [id]: { inFlight, pending, lastSaved, error } }
  const drainWaitersRef = useRef([]);
  const expiredRef = useRef(false); // server said expired (authoritative)
  const mountedRef = useRef(true);
  useEffect(() => () => (mountedRef.current = false), []);

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

  // Resolves once no autosave is in-flight or pending for any item.
  const awaitDrain = () =>
    queueIdle()
      ? Promise.resolve()
      : new Promise((resolve) => drainWaitersRef.current.push(resolve));

  const runSave = (itemId, ids) => {
    const q = queueRef.current[itemId];
    q.inFlight = true;
    q.pending = undefined;
    q.error = false;
    setStatus(itemId, 'saving');

    saveResponse(attemptId, itemId, ids)
      .then(() => {
        q.inFlight = false;
        q.lastSaved = ids;
        if (q.pending !== undefined && !arraysEqual(q.pending, ids)) {
          const next = q.pending;
          q.pending = undefined;
          runSave(itemId, next);
        } else {
          q.pending = undefined;
          setStatus(itemId, 'saved');
          resolveDrainIfIdle();
        }
      })
      .catch((err) => {
        q.inFlight = false;
        q.pending = undefined;
        // Server is authoritative: if the attempt is over, stop the queue.
        if (err?.code === 'attempt_expired') {
          expiredRef.current = true;
          if (mountedRef.current) setServerExpired(true);
        } else {
          q.error = true;
          setStatus(itemId, 'error');
        }
        resolveDrainIfIdle();
      });
  };

  const enqueueSave = (itemId, ids) => {
    const q = (queueRef.current[itemId] ||= {
      inFlight: false,
      pending: undefined,
      lastSaved: undefined,
      error: false,
    });
    if (q.inFlight) {
      q.pending = ids; // coalesce: only the newest pending value survives
    } else {
      runSave(itemId, ids);
    }
  };

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Loading questions…</p>;
  }

  // A submitted attempt (restore, or the items endpoint reporting it) shows the
  // result, never an editable runner.
  if (result || error?.code === 'attempt_submitted') {
    return (
      <AssessmentResult
        attemptId={attemptId}
        initialData={result ?? undefined}
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
  const selectionFor = (it) =>
    edits[it.id] ?? it.response?.selected_option_ids ?? [];
  const answeredCount = items.filter(
    (it) => selectionFor(it).length > 0,
  ).length;
  const unansweredCount = items.length - answeredCount;

  const persist = (it, ids) => {
    setEdits((e) => ({ ...e, [it.id]: ids }));
    if (!locked) enqueueSave(it.id, ids);
  };

  const onChoose = (it, optionId) => {
    const currentIds = selectionFor(it);
    let next;
    if (it.item_type === 'multiple_choice') {
      next = currentIds.includes(optionId)
        ? currentIds.filter((id) => id !== optionId)
        : [...currentIds, optionId];
    } else {
      next = currentIds.includes(optionId) ? [] : [optionId];
    }
    persist(it, next);
  };

  // Submission: flush every autosave first; only submit if all saved and the
  // attempt is still live. Answers are never sent — the server grades what it
  // already has.
  const confirmSubmit = async () => {
    setSubmitBlock(null);
    setSubmitting(true); // disable edits + duplicate submits
    await awaitDrain();

    if (queueHasError()) {
      setSubmitting(false);
      setSubmitBlock('unsaved');
      return;
    }
    if (expiredRef.current) {
      setSubmitting(false);
      setConfirmOpen(false);
      return; // expiry surfaced during flush — do not submit
    }

    try {
      const data = await submitAttempt(attemptId);
      if (mountedRef.current) setResult(data);
    } catch (err) {
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

  const options = item?.public_payload?.options ?? [];
  const selected = item ? selectionFor(item) : [];
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
          const answered = selectionFor(it).length > 0;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setCurrent(index)}
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

          <fieldset className="mt-4 space-y-2" disabled={locked}>
            <legend className="sr-only">Answer options</legend>
            {options.map((option) => {
              const checked = selected.includes(option.id);
              const type =
                item.item_type === 'multiple_choice' ? 'checkbox' : 'radio';
              return (
                <label
                  key={option.id}
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm',
                    checked
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200',
                    locked ? 'cursor-not-allowed opacity-60' : '',
                  ].join(' ')}
                >
                  <input
                    type={type}
                    name={`item-${item.id}`}
                    value={option.id}
                    checked={checked}
                    disabled={locked}
                    onChange={() => onChoose(item, option.id)}
                    className="size-4"
                  />
                  <span className="text-gray-900">{option.label}</span>
                </label>
              );
            })}
          </fieldset>

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
                onClick={() => enqueueSave(item.id, selectionFor(item))}
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
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          Previous
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(items.length - 1, c + 1))}
            disabled={current >= items.length - 1}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            Next
          </button>
          {!isExpired && (
            <button
              type="button"
              onClick={() => {
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
              {unansweredCount > 0 && (
                <> ({unansweredCount} unanswered will be marked incorrect)</>
              )}
              . Submission is final and cannot be undone.
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
