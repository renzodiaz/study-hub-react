import { normalize } from '@utils/jsonapi';

// Learner-facing assessment endpoints. The intro metadata endpoint returns a
// plain JSON object (availability summary — never question content); the attempt
// endpoints return JSON:API resources. Server time and expiry are authoritative:
// this client never creates attempt ids/timestamps or decides expiry itself.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

const parseError = async (res, fallback) => {
  const body = await res.json().catch(() => ({}));
  const err = new Error(body.error ?? body.errors?.join(', ') ?? fallback);
  err.code = body.code; // structured failure category (e.g. not_enrolled)
  err.status = res.status;
  return err;
};

// Intro availability for a course's credential assessment (plain JSON).
export const getCourseAssessment = async (courseId) => {
  const res = await fetch(`${API_BASE}/api/v1/courses/${courseId}/assessment`, {
    credentials: 'include',
  });
  if (!res.ok) throw await parseError(res, 'Failed to load assessment');
  return res.json();
};

// Start (or idempotently resume) an attempt. No body is sent — the server
// decides version, number, timestamps, and state.
export const startAttempt = async (assessmentId) => {
  const res = await fetch(
    `${API_BASE}/api/v1/assessments/${assessmentId}/attempts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    },
  );
  if (!res.ok) throw await parseError(res, 'Failed to start assessment');
  return normalize(await res.json());
};

// Restore an attempt from the server (owner-only). Refresh-safe: state is
// always re-read here, never from local storage.
export const getAttempt = async (attemptId) => {
  const res = await fetch(
    `${API_BASE}/api/v1/assessment_attempts/${attemptId}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw await parseError(res, 'Failed to load attempt');
  return normalize(await res.json());
};

// The runner payload: authoritative attempt status + ordered safe items, each
// with the learner's own saved draft response. Plain JSON (a bespoke composite,
// not a JSON:API resource). Refresh restores everything from here.
export const getAttemptItems = async (attemptId) => {
  const res = await fetch(
    `${API_BASE}/api/v1/assessment_attempts/${attemptId}/items`,
    { credentials: 'include' },
  );
  if (!res.ok) throw await parseError(res, 'Failed to load questions');
  return res.json();
};

// Autosave one item's draft answer. The server derives everything authoritative;
// the only thing sent is the canonical selection. Returns the saved answer plus
// a fresh attempt status so the client can re-sync its countdown.
export const saveResponse = async (attemptId, itemId, selectedOptionIds) => {
  const res = await fetch(
    `${API_BASE}/api/v1/assessment_attempts/${attemptId}/responses/${itemId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        response_payload: { selected_option_ids: selectedOptionIds },
      }),
    },
  );
  if (!res.ok) throw await parseError(res, 'Failed to save answer');
  return res.json();
};

// Submit the attempt. No body — the server grades the already-saved responses
// and returns the authoritative learner-safe result.
export const submitAttempt = async (attemptId) => {
  const res = await fetch(
    `${API_BASE}/api/v1/assessment_attempts/${attemptId}/submission`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    },
  );
  if (!res.ok) throw await parseError(res, 'Failed to submit assessment');
  return res.json();
};

// The learner-safe result of a submitted attempt (pass/fail + aggregate
// dimension scores only — never answer keys or per-item correctness).
export const getAttemptResult = async (attemptId) => {
  const res = await fetch(
    `${API_BASE}/api/v1/assessment_attempts/${attemptId}/result`,
    { credentials: 'include' },
  );
  if (!res.ok) throw await parseError(res, 'Failed to load result');
  return res.json();
};
