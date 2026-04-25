const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const getCourses = async () => {
  const res = await fetch(`${API_BASE}/api/v1/courses`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Failed to fetch courses');
  }

  return res.json();
};

export const createCourse = async (data) => {
  const payload = { ...data };
  if (!payload.image_url) delete payload.image_url;

  const res = await fetch(`${API_BASE}/api/v1/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Failed to create course');
  }

  return res.json();
};
