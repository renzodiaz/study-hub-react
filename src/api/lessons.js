import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const BASE = `${API_BASE}/api/v1/admin/lessons`;

export const createLesson = async (data) => {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ lesson: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to create lesson');
  }
  return normalize(await res.json());
};

export const updateLesson = async (id, data) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ lesson: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to update lesson');
  }
  return normalize(await res.json());
};

export const deleteLesson = async (id) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to delete lesson');
  }
};
