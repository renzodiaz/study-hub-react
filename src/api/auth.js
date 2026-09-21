import { normalize } from '@utils/jsonapi';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// The access token is short-lived (15 min, httpOnly cookie); the refresh token
// lives longer. Exchange it for a fresh access token so a learner who spends a
// while on a lesson isn't silently logged out mid-action. De-duped so a burst of
// concurrent 401s triggers exactly one refresh. Resolves true on success.
let refreshInFlight = null;
export const refreshSession = () => {
  refreshInFlight ??= fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
};

export const getMe = async () => {
  let res = await fetch(`${API_BASE}/api/v1/me`, { credentials: 'include' });
  // A 401 here would otherwise bounce a still-refreshable learner to /login on
  // the next navigation (e.g. opening the next lesson). Refresh once and retry.
  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await fetch(`${API_BASE}/api/v1/me`, { credentials: 'include' });
    }
  }
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

export const register = async (data) => {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user: data }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Registration failed');
  }

  return normalize(await res.json());
};

export const updateProfile = async (data) => {
  const res = await fetch(`${API_BASE}/api/v1/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user: data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors?.join(', ') ?? 'Failed to update profile');
  }
  return normalize(await res.json());
};

export const logout = async () => {
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'DELETE',
    credentials: 'include',
  });
};
