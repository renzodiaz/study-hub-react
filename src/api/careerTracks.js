import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const BASE = `${API_BASE}/api/v1/admin/career_tracks`;

export const getCareerTracks = async () => {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error ?? body.errors?.join(', ') ?? 'Failed to fetch career tracks',
    );
  }
  return normalize(await res.json());
};

export const createCareerTrack = async (data) => {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ career_track: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to create career track');
  }
  return normalize(await res.json());
};

export const updateCareerTrack = async (id, data) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ career_track: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to update career track');
  }
  return normalize(await res.json());
};

export const deleteCareerTrack = async (id) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to delete career track');
  }
};
