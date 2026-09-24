import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { Button, Banner } from '@components/ui';
import { register } from '@api/auth';
import { useAuth } from '@hooks/useAuth';
import AuthShell from './AuthShell';
import AuthField from './AuthField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const { setLoggedIn } = useAuth();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      setLoggedIn(user);
      navigate({ to: '/' });
    },
  });

  const form = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
    onSubmit: ({ value }) => mutate(value),
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start. Explore every career before you subscribe."
      footer={
        <span className="text-body text-ink-secondary">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-hover"
          >
            Sign in
          </Link>
        </span>
      }
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form.Field
            name="first_name"
            validators={{
              onChange: ({ value }) =>
                !value ? 'First name is required' : undefined,
            }}
            children={(field) => (
              <AuthField
                field={field}
                label="First name"
                autoComplete="given-name"
              />
            )}
          />
          <form.Field
            name="last_name"
            validators={{
              onChange: ({ value }) =>
                !value ? 'Last name is required' : undefined,
            }}
            children={(field) => (
              <AuthField
                field={field}
                label="Last name"
                autoComplete="family-name"
              />
            )}
          />
        </div>

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

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Password is required'
                : value.length < 8
                  ? 'Password must be at least 8 characters'
                  : undefined,
          }}
          children={(field) => (
            <AuthField
              field={field}
              label="Password"
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
              label="Confirm password"
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
          busyLabel="Creating account…"
          className="mt-1"
        >
          Create account
        </Button>
      </form>
    </AuthShell>
  );
};

export default Register;
