import Field from '@components/ui/Field';

// Thin adapter binding a TanStack Form field to the Instrument `Field`
// primitive, so every auth form gets the design system's control styling and
// accessibility (visible label, aria-describedby help/error, aria-invalid,
// icon + text error — never colour alone) without duplicating markup. The
// underlying form behaviour and validators are unchanged.
const AuthField = ({ field, label, type = 'text', autoComplete, hint }) => {
  const { meta } = field.state;
  const showError = meta.isTouched && meta.errors.length > 0;

  return (
    <Field
      id={field.name}
      label={label}
      type={type}
      autoComplete={autoComplete}
      hint={hint}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      error={showError ? meta.errors.join(', ') : undefined}
    />
  );
};

export default AuthField;
