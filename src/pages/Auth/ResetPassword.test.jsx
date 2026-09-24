import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import ResetPassword from './ResetPassword';

vi.mock('@/api/auth', () => ({ resetPassword: vi.fn() }));
vi.mock('@hooks/useAuth', () => ({ useAuth: vi.fn() }));

import { resetPassword } from '@/api/auth';
import { useAuth } from '@hooks/useAuth';

const Stub = () => <div>stub</div>;
const setLoggedOut = vi.fn();

beforeEach(() => {
  useAuth.mockReturnValue({ setLoggedOut });
});

function renderPage(initialPath = '/reset-password?token=tok-abc-123') {
  return renderWithProviders(ResetPassword, {
    path: '/reset-password',
    initialPath,
    extraRoutes: [
      { path: '/login', component: Stub },
      { path: '/forgot-password', component: Stub },
    ],
  });
}

async function fillAndSubmit(user, pw = 'brand-new-pass-9', confirm = pw) {
  await user.type(await screen.findByLabelText('New password'), pw);
  await user.type(screen.getByLabelText('Confirm new password'), confirm);
  await user.click(screen.getByRole('button', { name: /reset password/i }));
}

describe('ResetPassword', () => {
  it('reads the token from the URL and submits it with the new password', async () => {
    resetPassword.mockResolvedValue({
      message: 'Password reset successfully.',
    });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(resetPassword.mock.calls[0][0]).toEqual({
      token: 'tok-abc-123',
      password: 'brand-new-pass-9',
      password_confirmation: 'brand-new-pass-9',
    });
  });

  it('shows success with a sign-in link and does NOT auto-login', async () => {
    resetPassword.mockResolvedValue({
      message: 'Password reset successfully.',
    });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(
      await screen.findByText(/password reset successfully/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /continue to sign in/i }),
    ).toBeInTheDocument();
    // Reset must clear stale auth state, never establish a session.
    expect(setLoggedOut).toHaveBeenCalled();
  });

  it('does not persist the token in localStorage or sessionStorage', async () => {
    resetPassword.mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);
    await screen.findByText(/password reset successfully/i);

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(JSON.stringify({ ...localStorage })).not.toContain('tok-abc-123');
  });

  it('shows an invalid/expired state with a request-new-link path on invalid_token', async () => {
    resetPassword.mockRejectedValue(
      Object.assign(
        new Error('This password reset link is invalid or has expired.'),
        {
          code: 'invalid_token',
        },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid or has expired/i,
    );
    expect(
      screen.getByRole('link', { name: /request a new link/i }),
    ).toBeInTheDocument();
  });

  it('shows the invalid-link state immediately when the URL has no token', async () => {
    renderPage('/reset-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid or has expired/i,
    );
    expect(
      screen.getByRole('link', { name: /request a new link/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reset password/i }),
    ).not.toBeInTheDocument();
  });

  it('validates password length client-side and does not call the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm new password'), 'short');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(
      await screen.findByText(/at least 8 characters/i),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('validates the confirmation match client-side', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText('New password'),
      'brand-new-pass-9',
    );
    await user.type(
      screen.getByLabelText('Confirm new password'),
      'different-pass-9',
    );
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('surfaces a backend password validation error (invalid_password)', async () => {
    resetPassword.mockRejectedValue(
      Object.assign(
        new Error('Password is too short (minimum is 8 characters)'),
        {
          code: 'invalid_password',
        },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/too short/i);
    // Still on the form (not the invalid-link view).
    expect(
      screen.getByRole('button', { name: /reset password/i }),
    ).toBeInTheDocument();
  });

  it('surfaces a throttled (429) error', async () => {
    resetPassword.mockRejectedValue(
      Object.assign(
        new Error('Too many requests. Please wait a moment and try again.'),
        {
          code: 'rate_limited',
        },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /too many requests/i,
    );
  });

  it('surfaces a temporary server/network error', async () => {
    resetPassword.mockRejectedValue(
      Object.assign(new Error('Could not reset your password'), {
        code: 'error',
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not reset your password/i,
    );
  });
});
