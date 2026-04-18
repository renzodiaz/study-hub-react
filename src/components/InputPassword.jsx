import { classNames } from '@utils/helpers';
import { ExclamationCircleIcon } from '@heroicons/react/16/solid';

const InputPassword = ({ field, label, autoComplete }) => {
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <>
      <label
        htmlFor={field.name}
        className="block text-sm/6 font-medium text-gray-900"
      >
        {label}
      </label>
      <div className="mt-1 grid grid-cols-1">
        <input
          type="password"
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={hasError}
          className={classNames(
            hasError
              ? 'text-red-900 outline-red-300 placeholder:text-red-300 focus:outline-red-600'
              : 'text-gray-900 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600',
            'col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-10 sm:pr-9 pl-3 text-base sm:text-sm/6 focus:outline-2 outline-1 -outline-offset-1 focus:-outline-offset-2 sm:text-sm/6',
          )}
          autoComplete={autoComplete || undefined}
        />
        {hasError ? (
          <ExclamationCircleIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
          />
        ) : null}
      </div>
      {hasError ? (
        <p id={`${field.name}-error`} className="text-sm text-red-600">
          {field.state.meta.errors.join(',')}
        </p>
      ) : null}
    </>
  );
};

export default InputPassword;
