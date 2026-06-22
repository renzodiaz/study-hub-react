import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import InputText from '@components/InputText';
import InputPassword from '@components/InputPassword';
import { register } from '@api/auth';
import { useAuth } from '@hooks/useAuth';

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
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="DevHub"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
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
            <div className="grid grid-cols-2 gap-x-4">
              <form.Field
                name="first_name"
                validators={{
                  onChange: ({ value }) => (!value ? 'Required' : undefined),
                }}
                children={(field) => (
                  <InputText
                    field={field}
                    label="First name:"
                    autoComplete="given-name"
                  />
                )}
              />
              <form.Field
                name="last_name"
                validators={{
                  onChange: ({ value }) => (!value ? 'Required' : undefined),
                }}
                children={(field) => (
                  <InputText
                    field={field}
                    label="Last name:"
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
                <InputText field={field} label="Email:" autoComplete="email" />
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
                <InputPassword
                  field={field}
                  label="Password:"
                  autoComplete="new-password"
                />
              )}
            />

            <form.Field
              name="password_confirmation"
              validators={{
                onChange: ({ value, fieldApi }) => {
                  const password = fieldApi.form.getFieldValue('password');
                  return value !== password
                    ? 'Passwords do not match'
                    : undefined;
                },
              }}
              children={(field) => (
                <InputPassword
                  field={field}
                  label="Confirm password:"
                  autoComplete="new-password"
                />
              )}
            />

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
