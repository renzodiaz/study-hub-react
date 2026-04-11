import { useForm } from '@tanstack/react-form';
import { classNames } from '@utils/helpers';
import { ExclamationCircleIcon } from '@heroicons/react/16/solid';

const Form = () => {
  const form = useForm({
    defaultValues: {
      image_url: '',
      name: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  return (
    <div className="space-y-6 pt-6 pb-5">
      <form
        id="study-hub-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Name is required!'
                : value.length < 3
                  ? 'Name must be at least 3 characters'
                  : undefined,
          }}
          children={(field) => (
            <div>
              <label
                htmlFor="name"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Name:
              </label>
              <div className="mt-2 grid grid-cols-1">
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  className={classNames(
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? 'text-red-900 outline-red-300 placeholder:text-red-300 focus:outline-red-600'
                      : 'text-gray-900 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600',
                    'col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-10 sm:pr-9 pl-3 text-base sm:text-sm/6 focus:outline-2 outline-1 -outline-offset-1 focus:-outline-offset-2 sm:text-sm/6',
                  )}
                  autoComplete="on"
                />
                {field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <ExclamationCircleIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                  />
                ) : null}
              </div>
              {field.state.meta.isTouched && !field.state.meta.isValid ? (
                <p
                  id={`${field.name}-error`}
                  className="mt-2 text-sm text-red-600"
                >
                  {field.state.meta.errors.join(',')}
                </p>
              ) : null}
            </div>
          )}
        />
        <form.Field
          name="description"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Description is required!'
                : value.length < 30
                  ? 'description must be at least 30 characters'
                  : undefined,
          }}
          children={(field) => (
            <div className="mt-2">
              <label
                htmlFor="description"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Description:
              </label>
              <div className="mt-2 grid grid-cols-1">
                <textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  className={classNames(
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? 'text-red-900 outline-red-300 placeholder:text-red-300 focus:outline-red-600'
                      : 'text-gray-900 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600',
                    'col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-10 sm:pr-9 pl-3 text-base sm:text-sm/6 focus:outline-2 outline-1 -outline-offset-1 focus:-outline-offset-2 sm:text-sm/6',
                  )}
                  rows={4}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid ? (
                  <ExclamationCircleIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                  />
                ) : null}
              </div>
              {field.state.meta.isTouched && !field.state.meta.isValid ? (
                <p
                  id={`${field.name}-error`}
                  className="mt-2 text-sm text-red-600"
                >
                  {field.state.meta.errors.join(',')}
                </p>
              ) : null}
            </div>
          )}
        />
      </form>
    </div>
  );
};

export default Form;
