import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { Button, Banner } from '@components/ui';
import { resetPassword } from '@/api/auth';
import { useAuth } from '@hooks/useAuth';
import AuthShell from './AuthShell';
import AuthField from './AuthField';

// A TanStack navigation link styled as a full-width primary action, for the
// terminal states (continue to sign in / request a new link) where the control
// navigates rather than submits.
const PrimaryLink = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex h-12 w-full items-center justify-center rounded-control bg-primary px-5 text-body-lg font-semibold text-white hover:bg-primary-hover"
  >
    {children}
  </Link>
);

// Public reset page reached from the emailed link. Reads the one-time token from
// the URL, then removes it from the visible URL/history (token hygiene): the
// token lives only in component memory and is never persisted to storage or the
// auth state. On success we do NOT auth the user — a reset is an explicit
// security boundary, so we clear any stale client auth state and send them to
// sign in with the new password.
const ResetPassword = () => {
  const search = useSearch({ strict: false });
  // Capture once on first render so cleaning the URL below can't drop it.
  const [token] = useState(() => search?.token ?? '');
  const { setLoggedOut } = useAuth();
  const resultRef = useRef(null);

  // Strip the token from the address bar (and this history entry) after capture.
  // Trade-off: refreshing the cleaned page loses the token, so we surface the
  // "request a new link" path rather than keeping a sensitive token in history.
  useEffect(() => {
    if (
      token &&
      typeof window !== 'undefined' &&
      window.history?.replaceState
    ) {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname,
      );
    }
  }, [token]);

  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      // Reset never signs the user in; drop any stale current-user state so the
      // app doesn't believe a now-revoked session is still authenticated.
      setLoggedOut?.();
    },
  });

  const form = useForm({
    defaultValues: { password: '', password_confirmation: '' },
    onSubmit: ({ value }) =>
      mutate({
        token,
        password: value.password,
        password_confirmation: value.password_confirmation,
      }),
  });

  // Move focus to the result region so the outcome is announced.
  useEffect(() => {
    if (isSuccess || error) resultRef.current?.focus();
  }, [isSuccess, error]);

  const invalidLink = !token || error?.code === 'invalid_token';

  if (isSuccess) {
    return (
      <AuthShell title="Password reset">
        <div ref={resultRef} tabIndex={-1}>
          <Banner variant="success" title="Password reset successfully">
            You can now sign in with your new password.
          </Banner>
        </div>
        <div className="mt-8">
          <PrimaryLink to="/login">Continue to sign in</PrimaryLink>
        </div>
      </AuthShell>
    );
  }

  if (invalidLink) {
    return (
      <AuthShell title="Reset link problem">
        <div ref={resultRef} tabIndex={-1}>
          <Banner variant="danger" title="This link is invalid or has expired">
            Reset links can be used once and expire after a few hours. Request a
            new one to continue.
          </Banner>
        </div>
        <div className="mt-8">
          <PrimaryLink to="/forgot-password">Request a new link</PrimaryLink>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Signing in on your other devices will be required again."
    >
      {error && (
        <div ref={resultRef} tabIndex={-1}>
          <Banner variant="danger" className="mb-5">
            {error.message}
          </Banner>
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Password is required'
                : value.length < 8
                  ? 'Password must have at least 8 characters'
                  : undefined,
          }}
          children={(field) => (
            <AuthField
              field={field}
              label="New password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters."
            />
          )}
        />

        <form.Field
          name="password_confirmation"
          validators={{
            onChange: ({ value, fieldApi }) => {
              const password = fieldApi.form.getFieldValue('password');
              return value !== password ? 'Passwords do not match' : undefined;
            },
          }}
          children={(field) => (
            <AuthField
              field={field}
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
            />
          )}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          busy={isPending}
          busyLabel="Resetting…"
          className="mt-1"
        >
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
