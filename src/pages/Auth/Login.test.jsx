import { screen } from '@testing-library/react';

import { renderWithProviders } from '@test/renderWithProviders';
import Login from './Login';

vi.mock('@/api/auth', () => ({ login: vi.fn() }));
vi.mock('@hooks/useAuth', () => ({ useAuth: vi.fn() }));

import { useAuth } from '@hooks/useAuth';

const Stub = () => <div>stub</div>;

beforeEach(() => {
  useAuth.mockReturnValue({ setLoggedIn: vi.fn() });
});

describe('Login', () => {
  it('offers a Forgot password link pointing at the recovery page', async () => {
    renderWithProviders(Login, {
      path: '/login',
      initialPath: '/login',
      extraRoutes: [
        { path: '/register', component: Stub },
        { path: '/forgot-password', component: Stub },
      ],
    });

    const link = await screen.findByRole('link', {
      name: /forgot your password/i,
    });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });
});
