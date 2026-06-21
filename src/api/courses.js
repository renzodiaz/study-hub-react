import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const getCourses = async () => {
  const res = await fetch(`${API_BASE}/api/v1/admin/courses`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Failed to fetch courses');
  }

  return normalize(await res.json());
};

export const getCourse = async (id) => {
  const res = await fetch(`${API_BASE}/api/v1/admin/courses/${id}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Failed to fetch course');
  }

  return normalize(await res.json());
};

export const createCourse = async (data) => {
  const res = await fetch(`${API_BASE}/api/v1/admin/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ course: data }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to create course');
  }

  return normalize(await res.json());
};
