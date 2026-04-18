const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const getMe = async () => {
  const res = await fetch(`${API_BASE}/api/v1/me`, {
    credentials: 'include',
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.user ?? data;
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
    throw new Error(body.message ?? 'Login failed');
  }

  return res.json();
};

export const logout = async () => {
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'DELETE',
    credentials: 'include',
  });
};
