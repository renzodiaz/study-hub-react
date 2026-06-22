import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const BASE = `${API_BASE}/api/v1/admin/course_modules`;

export const getCourseModules = async (courseId) => {
  const res = await fetch(`${BASE}?course_id=${courseId}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to fetch sections');
  }
  return normalize(await res.json());
};

export const createModule = async (data) => {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ course_module: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to create section');
  }
  return normalize(await res.json());
};

export const updateModule = async (id, data) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ course_module: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to update section');
  }
  return normalize(await res.json());
};

export const deleteModule = async (id) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to delete section');
  }
};
