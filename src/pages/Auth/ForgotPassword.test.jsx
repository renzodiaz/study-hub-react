import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import ForgotPassword from './ForgotPassword';

vi.mock('@/api/auth', () => ({ requestPasswordReset: vi.fn() }));
import { requestPasswordReset } from '@/api/auth';

const Stub = () => <div>stub</div>;

function renderPage() {
  return renderWithProviders(ForgotPassword, {
    path: '/forgot-password',
    initialPath: '/forgot-password',
    extraRoutes: [{ path: '/login', component: Stub }],
  });
}

describe('ForgotPassword', () => {
  it('submits the email and shows a generic success that never reveals existence', async () => {
    requestPasswordReset.mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/email/i),
      'person@example.com',
    );
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(requestPasswordReset.mock.calls[0][0]).toEqual({
      email: 'person@example.com',
    });
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/check your email/i);
    expect(status).toHaveTextContent(/if an account exists/i);
    // No existence disclosure anywhere.
    expect(screen.queryByText(/no account/i)).not.toBeInTheDocument();
  });

  it('shows the same success regardless of whether the account exists (UI cannot tell)', async () => {
    // The API resolves identically for known/unknown; the UI has no branch on it.
    requestPasswordReset.mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/email/i),
      'nobody@example.com',
    );
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      /if an account exists/i,
    );
  });

  it('validates the email client-side and does not call the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/email must be valid/i)).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('shows a loading state while the request is in flight', async () => {
    requestPasswordReset.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/email/i),
      'person@example.com',
    );
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(
      await screen.findByRole('button', { name: /sending/i }),
    ).toBeDisabled();
  });

  it('surfaces a throttled (429) error without disclosing existence', async () => {
    requestPasswordReset.mockRejectedValue(
      new Error('Too many requests. Please wait a moment and try again.'),
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/email/i),
      'person@example.com',
    );
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/too many requests/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('surfaces a temporary server/network error', async () => {
    requestPasswordReset.mockRejectedValue(
      new Error('Could not send reset instructions'),
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(
      await screen.findByLabelText(/email/i),
      'person@example.com',
    );
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not send reset instructions/i,
    );
  });
});
