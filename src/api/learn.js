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

export const getTracks = () =>
  get('/api/v1/career_tracks', 'Failed to load career tracks');

export const getTrack = (trackId) =>
  get(`/api/v1/career_tracks/${trackId}`, 'Failed to load career track');

// Ordered modules (courses) within a track.
export const getTrackModules = (trackId) =>
  get(`/api/v1/career_tracks/${trackId}/courses`, 'Failed to load modules');
