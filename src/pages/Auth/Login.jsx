import { useForm } from '@tanstack/react-form';
import InputText from '@components/InputText';
import InputPassword from '@components/InputPassword';

const Login = () => {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });
  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="Your Company"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
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
                  <InputText field={field} label="Email:" />
                </div>
              )}
            />

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
                  <InputPassword field={field} label="Password:" />
                </div>
              )}
            />

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign in
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Not a member?{' '}
            <a
              href="#"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Start a 14 day free trial
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
