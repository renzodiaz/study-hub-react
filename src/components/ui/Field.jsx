import { useId } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/16/solid';

import { classNames as cn } from '@utils/helpers';

// Field — the form-control primitive (§6.2, §6.1, §5.2/5.5).
//
// Contract:
//   - the label is always visible; a placeholder is never the label;
//   - help text and error text are linked with aria-describedby;
//   - the invalid state is carried by an icon + a text message, never colour
//     alone, and sets aria-invalid;
//   - real <input>/<textarea>/<select> with a real <label>; focus is the one
//     global ring; disabled/read-only are honoured.
//
// It is controlled and form-library-agnostic (value / onChange) so it can be
// reused directly or wrapped by a thin adapter for a form library later. No
// business behaviour lives here.

const CONTROL_BASE =
  'block w-full rounded-control border bg-surface px-3 text-body text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-disabled';

const Field = ({
  label,
  type = 'text',
  id,
  value,
  onChange,
  onBlur,
  hint,
  error,
  placeholder,
  options = [],
  rows = 4,
  disabled = false,
  readOnly = false,
  required = false,
  autoComplete,
  className,
  ...rest
}) => {
  const reactId = useId();
  const fieldId = id ?? reactId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const invalid = Boolean(error);
  const describedBy =
    cn(hint && hintId, invalid && errorId).trim() || undefined;

  // Checkbox reverses the label/control order and needs no border box.
  if (type === 'checkbox') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-center gap-2">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange?.(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="size-4 rounded-chip border-line text-primary"
            {...rest}
          />
          <label htmlFor={fieldId} className="text-body text-ink">
            {label}
          </label>
        </div>
        <FieldMessages
          hint={hint}
          hintId={hintId}
          error={error}
          errorId={errorId}
        />
      </div>
    );
  }

  const controlClass = cn(
    CONTROL_BASE,
    type === 'textarea' ? 'py-2' : 'h-10',
    invalid ? 'border-danger' : 'border-line',
  );

  let control;
  if (type === 'textarea') {
    control = (
      <textarea
        id={fieldId}
        rows={rows}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={controlClass}
        {...rest}
      />
    );
  } else if (type === 'select') {
    control = (
      <select
        id={fieldId}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={controlClass}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={controlClass}
        {...rest}
      />
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fieldId} className="text-body font-medium text-ink">
        {label}
      </label>
      {control}
      <FieldMessages
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
      />
    </div>
  );
};

// Help text (when there is no error) and the error message. The error carries
// an icon + text so it never depends on colour alone (§5.1).
const FieldMessages = ({ hint, hintId, error, errorId }) => (
  <>
    {hint && !error ? (
      <p id={hintId} className="text-body-sm text-ink-muted">
        {hint}
      </p>
    ) : null}
    {error ? (
      <p
        id={errorId}
        className="flex items-center gap-1 text-body-sm text-danger"
      >
        <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
        <span>{error}</span>
      </p>
    ) : null}
  </>
);

export default Field;
