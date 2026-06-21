import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const getCareerTracks = async () => {
  const res = await fetch(`${API_BASE}/api/v1/admin/career_tracks`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Failed to fetch career tracks');
  }

  return normalize(await res.json());
};
