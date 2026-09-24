import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import InputPassword from '@components/InputPassword';
import { resetPassword } from '@/api/auth';
import { useAuth } from '@hooks/useAuth';

const AuthCard = ({ title, children }) => (
  <>
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <img
        alt="Study Hub"
        src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
        className="mx-auto h-10 w-auto"
      />
      <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
        {title}
      </h2>
    </div>
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
        {children}
      </div>
    </div>
  </>
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
  const headingRef = useRef(null);

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

  // Move focus to the result heading so the outcome is announced.
  useEffect(() => {
    if (isSuccess || error) headingRef.current?.focus();
  }, [isSuccess, error]);

  const invalidLink = !token || error?.code === 'invalid_token';

  if (isSuccess) {
    return (
      <AuthCard title="Password reset">
        <div ref={headingRef} tabIndex={-1} role="status">
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Password reset successfully
            </p>
            <p className="mt-2 text-sm text-green-700">
              You can now sign in with your new password.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Link
            to="/login"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Continue to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (invalidLink) {
    return (
      <AuthCard title="Reset link problem">
        <div ref={headingRef} tabIndex={-1} role="alert">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">
              This password reset link is invalid or has expired.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm/6 text-gray-600">
          Reset links can be used once and expire after a few hours. Request a
          new one to continue.
        </p>
        <div className="mt-8">
          <Link
            to="/forgot-password"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Request a new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      {error && (
        <div
          ref={headingRef}
          tabIndex={-1}
          role="alert"
          className="mb-6 rounded-md bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}
      <form
        className="space-y-6"
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
                ? 'Password is required!'
                : value.length < 8
                  ? 'Password must have at least 8 characters'
                  : undefined,
          }}
          children={(field) => (
            <div>
              <InputPassword
                field={field}
                label="New password:"
                autoComplete="new-password"
              />
            </div>
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
            <div>
              <InputPassword
                field={field}
                label="Confirm new password:"
                autoComplete="new-password"
              />
            </div>
          )}
        />

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Resetting...' : 'Reset password'}
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm/6 text-gray-500">
        <Link
          to="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default ResetPassword;
