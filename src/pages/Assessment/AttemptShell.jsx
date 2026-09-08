import { useEffect, useRef, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon } from '@heroicons/react/20/solid';

import { getAttemptItems, saveResponse } from '@api/assessments';
import useDisplayCountdown from '@hooks/useDisplayCountdown';

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
    retry: false, // never hammer an expired / not-owned attempt
  });

  const [current, setCurrent] = useState(0);
  // Local overlay of answers the learner has changed this session, keyed by item
  // id. Server data is the base; edits win only where present — so there is a
  // single source of truth (server) with an explicit, per-item local override,
  // and no seeding effect that could drift.
  const [edits, setEdits] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [serverExpired, setServerExpired] = useState(false);

  // Per-item autosave queue: at most ONE in-flight write per item; while one is
  // in flight, newer changes collapse into `pending` (only the latest is kept).
  // When the in-flight save resolves, the latest pending value is sent. This
  // guarantees server writes happen in the learner's intended order, so a slow
  // earlier request can never land after — and clobber — a newer one.
  // Held in a ref (not state): the queue is control flow, not rendered data.
  const queueRef = useRef({}); // { [itemId]: { inFlight, pending, lastSaved } }
  const mountedRef = useRef(true);
  useEffect(() => () => (mountedRef.current = false), []);

  const attempt = data?.attempt;
  const items = data?.items ?? [];
  const remaining = useDisplayCountdown(attempt?.expires_at);

  const setStatus = (itemId, value) => {
    if (mountedRef.current) setSaveStatus((s) => ({ ...s, [itemId]: value }));
  };

  const runSave = (itemId, ids) => {
    const q = queueRef.current[itemId];
    q.inFlight = true;
    q.pending = undefined;
    setStatus(itemId, 'saving');

    saveResponse(attemptId, itemId, ids)
      .then(() => {
        q.inFlight = false;
        q.lastSaved = ids;
        // Flush the latest pending value if it differs from what we just saved.
        if (q.pending !== undefined && !arraysEqual(q.pending, ids)) {
          const next = q.pending;
          q.pending = undefined;
          runSave(itemId, next);
        } else {
          q.pending = undefined;
          setStatus(itemId, 'saved');
        }
      })
      .catch((err) => {
        q.inFlight = false;
        // Server is authoritative: if the attempt is over, stop the queue and
        // send nothing further — regardless of the (cosmetic) local countdown.
        if (err?.code === 'attempt_expired') {
          q.pending = undefined;
          if (mountedRef.current) setServerExpired(true);
          return;
        }
        // Other failure: surface it and keep the latest selection. Retry re-sends
        // the CURRENT selection (never the stale failed value).
        setStatus(itemId, 'error');
      });
  };

  // Enqueue the latest selection for an item, serialized per item.
  const enqueueSave = (itemId, ids) => {
    const q = (queueRef.current[itemId] ||= {
      inFlight: false,
      pending: undefined,
      lastSaved: undefined,
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

  // Expiry authority: the server flag (from load or a save rejection) governs.
  // The local countdown reaching zero disables the UI proactively, but a wrong
  // client clock can never keep it editable — only the server can.
  const isExpired =
    serverExpired ||
    attempt.expired ||
    attempt.state === 'expired' ||
    remaining <= 0;

  const item = items[current];
  const selectionFor = (it) =>
    edits[it.id] ?? it.response?.selected_option_ids ?? [];

  const persist = (it, ids) => {
    setEdits((e) => ({ ...e, [it.id]: ids }));
    if (!isExpired) enqueueSave(it.id, ids);
  };

  const onChoose = (it, optionId) => {
    const currentIds = selectionFor(it);
    let next;
    if (it.item_type === 'multiple_choice') {
      next = currentIds.includes(optionId)
        ? currentIds.filter((id) => id !== optionId)
        : [...currentIds, optionId];
    } else {
      // single_choice: choosing the selected option again clears it.
      next = currentIds.includes(optionId) ? [] : [optionId];
    }
    persist(it, next);
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

      {/* Question navigator — answered items are marked so the learner can see
          progress. Navigation never persists or authorizes anything. */}
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

          <fieldset className="mt-4 space-y-2" disabled={isExpired}>
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
                    isExpired ? 'cursor-not-allowed opacity-60' : '',
                  ].join(' ')}
                >
                  <input
                    type={type}
                    name={`item-${item.id}`}
                    value={option.id}
                    checked={checked}
                    disabled={isExpired}
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
            {status === 'error' && !isExpired && (
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
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.min(items.length - 1, c + 1))}
          disabled={current >= items.length - 1}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
