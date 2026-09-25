import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@test/renderWithProviders';
import Settings from './Index';

vi.mock('@api/auth', () => ({ updateProfile: vi.fn() }));
vi.mock('@hooks/useAuth', () => ({ useAuth: vi.fn() }));

import { updateProfile } from '@api/auth';
import { useAuth } from '@hooks/useAuth';

const Stub = () => <div>stub</div>;
const setLoggedIn = vi.fn();
const USER = {
  id: 'u1',
  first_name: 'First',
  last_name: 'Learner',
  email: 'first@test.example',
  avatar_url: '',
  bio: '',
};

beforeEach(() => {
  useAuth.mockReturnValue({ user: USER, setLoggedIn });
});

const render = () =>
  renderWithProviders(Settings, {
    path: '/settings',
    initialPath: '/settings',
    extraRoutes: [{ path: '/billing', component: Stub }],
  });

describe('Settings', () => {
  it('renders the profile fields prefilled and email as read-only', async () => {
    render();
    expect(await screen.findByLabelText('First name')).toHaveValue('First');
    expect(screen.getByLabelText('Last name')).toHaveValue('Learner');
    // Email is shown but not an editable control.
    expect(
      screen.getByText(/email can’t be changed here/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    // No fake Security/delete controls.
    expect(
      screen.queryByRole('button', { name: /change password|delete account/i }),
    ).not.toBeInTheDocument();
  });

  it('saves profile changes through updateProfile and confirms success', async () => {
    updateProfile.mockResolvedValue({ ...USER, first_name: 'Updated' });
    render();

    const first = await screen.findByLabelText('First name');
    await userEvent.clear(first);
    await userEvent.type(first, 'Updated');
    await userEvent.click(
      screen.getByRole('button', { name: /save changes/i }),
    );

    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    expect(updateProfile.mock.calls[0][0]).toMatchObject({
      first_name: 'Updated',
      last_name: 'Learner',
    });
    expect(setLoggedIn).toHaveBeenCalled();
    expect(
      await screen.findByText(/profile updated successfully/i),
    ).toBeInTheDocument();
  });

  it('surfaces a save error', async () => {
    updateProfile.mockRejectedValue(new Error('Could not update profile'));
    render();
    await userEvent.click(
      await screen.findByRole('button', { name: /save changes/i }),
    );
    expect(
      await screen.findByText(/could not update profile/i),
    ).toBeInTheDocument();
  });

  it('links to billing for subscription management', async () => {
    render();
    expect(
      await screen.findByRole('link', { name: /go to billing/i }),
    ).toHaveAttribute('href', '/billing');
  });
});
