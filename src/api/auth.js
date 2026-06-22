import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const getMe = async () => {
  const res = await fetch(`${API_BASE}/api/v1/me`, {
    credentials: 'include',
  });

  if (!res.ok) return null;

  return normalize(await res.json());
};

export const login = async ({ email, password }) => {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Login failed');
  }

  const data = await res.json();
  return { user: normalize(data.user), expires_at: data.expires_at };
};

export const logout = async () => {
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'DELETE',
    credentials: 'include',
  });
};
