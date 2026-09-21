import { normalize } from '@utils/jsonapi';

// Learner-facing catalog API — hits the PUBLIC endpoints (read-only), distinct
// from the admin authoring modules under the same resource names.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

const get = async (path, errorMessage) => {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? body.errors?.join(', ') ?? errorMessage);
  }
  return normalize(await res.json());
};

const send = async (path, method, body, errorMessage) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error ?? errorBody.errors?.join(', ') ?? errorMessage,
    );
  }
  return res.status === 204 ? null : normalize(await res.json());
};

export const getTracks = () =>
  get('/api/v1/career_tracks', 'Failed to load career tracks');

// Controlled-access ("Preview") tracks for the current learner — otherwise
// unpublished careers they have been explicitly granted access to. Caller-scoped;
// returns an empty list when the learner has no grants.
export const getPreviewTracks = () =>
  get('/api/v1/preview_tracks', 'Failed to load preview access');

export const getTrack = (trackId) =>
  get(`/api/v1/career_tracks/${trackId}`, 'Failed to load career track');

// Ordered modules (courses) within a track.
export const getTrackModules = (trackId) =>
  get(`/api/v1/career_tracks/${trackId}/courses`, 'Failed to load modules');

// A single module (course) and its sections (with lesson metadata).
export const getModule = (trackId, courseId) =>
  get(
    `/api/v1/career_tracks/${trackId}/courses/${courseId}`,
    'Failed to load module',
  );

export const getModuleSections = (trackId, courseId) =>
  get(
    `/api/v1/career_tracks/${trackId}/courses/${courseId}/course_modules`,
    'Failed to load sections',
  );

// A single lesson's full content (flat, access-gated).
export const getLesson = (lessonId) =>
  get(`/api/v1/lessons/${lessonId}`, 'Failed to load lesson');

export const completeLesson = (lessonId) =>
  send(
    '/api/v1/lesson_progresses',
    'POST',
    { lesson_progress: { lesson_id: lessonId } },
    'Failed to mark lesson complete',
  );

// Enrollments — the current user's learning.
export const getEnrollments = () =>
  get('/api/v1/enrollments', 'Failed to load your enrollments');

export const enroll = (trackId) =>
  send(
    '/api/v1/enrollments',
    'POST',
    { enrollment: { career_track_id: trackId } },
    'Failed to enroll',
  );

export const unenroll = (enrollmentId) =>
  send(
    `/api/v1/enrollments/${enrollmentId}`,
    'DELETE',
    null,
    'Failed to unenroll',
  );

// Credentials — earned certificates and seniority badges.
export const getCertificates = () =>
  get('/api/v1/certificates', 'Failed to load certificates');

export const getSeniorityBadges = () =>
  get('/api/v1/seniority_badges', 'Failed to load badges');

// Public certificate verification (no auth required).
export const getPublicCertificate = (token) =>
  get(`/api/v1/public/certificates/${token}`, 'Certificate not found');

// Unified public credential verification (no auth). The backend resolves the
// token to a Certificate or SeniorityBadge and returns `credential_type` — the
// frontend never infers type from the token or probes endpoints in sequence.
export const getPublicCredential = (token) =>
  get(`/api/v1/public/credentials/${token}`, 'Credential not found');
