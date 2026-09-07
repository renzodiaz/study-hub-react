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
