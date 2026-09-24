import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { Button, Banner } from '@components/ui';
import { login } from '@/api/auth';
import { useAuth } from '@hooks/useAuth';
import AuthShell from './AuthShell';
import AuthField from './AuthField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const { setLoggedIn } = useAuth();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: ({ user }) => {
      setLoggedIn(user);
      navigate({ to: '/' });
    },
  });

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: ({ value }) => mutate(value),
  });

  return (
    <AuthShell
      title="Sign in"
      subtitle="Continue your career path."
      footer={
        <span className="text-body text-ink-secondary">
          New to Study Hub?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary-hover"
          >
            Create an account
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

        <div className="flex flex-col gap-1.5">
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
                label="Password"
                type="password"
                autoComplete="current-password"
              />
            )}
          />
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-body-sm font-medium text-primary hover:text-primary-hover"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          busy={isPending}
          busyLabel="Signing in…"
          className="mt-1"
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
