import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import InputText from '@components/InputText';
import { requestPasswordReset } from '@/api/auth';

// Public password-recovery request page. Deliberately enumeration-safe: a
// successful submit always shows the same generic confirmation, whether or not
// the address has an account. We never render "no account found".
const ForgotPassword = () => {
  const successRef = useRef(null);

  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: requestPasswordReset,
  });

  const form = useForm({
    defaultValues: { email: '' },
    onSubmit: ({ value }) => mutate(value),
  });

  // Move focus to the confirmation so screen-reader and keyboard users are told
  // the request went through (status is not conveyed by layout alone).
  useEffect(() => {
    if (isSuccess) successRef.current?.focus();
  }, [isSuccess]);

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="Study Hub"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
          {isSuccess ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="rounded-md bg-green-50 p-4"
            >
              <p className="text-sm font-medium text-green-800">
                Check your email
              </p>
              <p className="mt-2 text-sm text-green-700">
                If an account exists for that email, we&apos;ve sent password
                reset instructions. The link expires in a few hours.
              </p>
              <p className="mt-6 text-center text-sm/6 text-gray-500">
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm/6 text-gray-600">
                Enter the email address for your account and we&apos;ll send you
                a link to choose a new password.
              </p>
              {error && (
                <div role="alert" className="mb-6 rounded-md bg-red-50 p-4">
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
                  name="email"
                  validators={{
                    onChange: ({ value }) =>
                      !value
                        ? 'Email is required!'
                        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                          ? 'Email must be valid'
                          : undefined,
                  }}
                  children={(field) => (
                    <div>
                      <InputText
                        field={field}
                        label="Email:"
                        autoComplete="email"
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
                    {isPending ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
              </form>

              <p className="mt-10 text-center text-sm/6 text-gray-500">
                Remembered your password?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
