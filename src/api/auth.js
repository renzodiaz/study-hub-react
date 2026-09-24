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

// Password recovery (AUTH-EMAIL-2). Both calls are public (no auth cookie
// required). The backend is deliberately enumeration-safe, so a successful
// request tells us nothing about whether the address has an account — we always
// surface the same generic success.
export const requestPasswordReset = async ({ email }) => {
  const res = await fetch(`${API_BASE}/api/v1/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  if (res.status === 429) {
    throw new Error('Too many requests. Please wait a moment and try again.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.errors?.join(', ') ?? 'Could not send reset instructions',
    );
  }

  const data = await res.json().catch(() => ({}));
  return { message: data.message };
};

// Distinguishes an invalid/expired link (code 'invalid_token') from a password
// policy failure (code 'invalid_password') and rate limiting (429), so the UI
// can react without ever learning whether an account exists. The reset token is
// used only for this request and is never persisted client-side.
export const resetPassword = async ({
  token,
  password,
  password_confirmation,
}) => {
  const res = await fetch(`${API_BASE}/api/v1/auth/password/reset`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, password, password_confirmation }),
  });

  if (res.status === 429) {
    const err = new Error(
      'Too many requests. Please wait a moment and try again.',
    );
    err.code = 'rate_limited';
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(
      body.errors?.join(', ') ?? 'Could not reset your password',
    );
    err.code = body.code ?? 'error';
    throw err;
  }

  return res.json().catch(() => ({}));
};
