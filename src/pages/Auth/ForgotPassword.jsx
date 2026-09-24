import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { Button, Banner } from '@components/ui';
import { requestPasswordReset } from '@/api/auth';
import AuthShell from './AuthShell';
import AuthField from './AuthField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (isSuccess) {
    return (
      <AuthShell title="Check your email" backTo="/login">
        <div ref={successRef} tabIndex={-1}>
          <Banner variant="success" title="Reset link sent">
            If an account exists for that email, we&apos;ve sent password reset
            instructions. The link expires in a few hours.
          </Banner>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email on your account and we'll send a link to set a new password. The link expires in a few hours."
      backTo="/login"
    >
      {error && (
        <Banner variant="danger" className="mb-5">
          {error.message}
        </Banner>
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
          name="email"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Email is required'
                : !EMAIL_RE.test(value)
                  ? 'Email must be valid'
                  : undefined,
          }}
          children={(field) => (
            <AuthField field={field} label="Email" autoComplete="email" />
          )}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          busy={isPending}
          busyLabel="Sending…"
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-body-sm text-ink-muted">
        For your security we send the same confirmation whether or not an
        account exists for that address.
      </p>
    </AuthShell>
  );
};

export default ForgotPassword;
