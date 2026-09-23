import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Field from './Field';

describe('Field', () => {
  it('renders a visible label associated with the control', () => {
    render(
      <Field label="Work email" type="email" value="" onChange={() => {}} />,
    );
    const input = screen.getByLabelText('Work email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('does not use the placeholder as the label', () => {
    render(
      <Field
        label="Display name"
        placeholder="e.g. Daniela Rojas"
        value=""
        onChange={() => {}}
      />,
    );
    // The real <label> is present in addition to any placeholder.
    expect(screen.getByText('Display name')).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
  });

  it('associates help text with aria-describedby', () => {
    render(
      <Field
        label="Display name"
        hint="Shown on your credentials."
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText('Display name');
    const hint = screen.getByText('Shown on your credentials.');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
  });

  it('carries an invalid state with a text message (not colour alone) and aria-invalid', () => {
    render(
      <Field
        label="Password"
        type="password"
        error="Must be at least 12 characters."
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const err = screen.getByText('Must be at least 12 characters.');
    expect(input.getAttribute('aria-describedby')).toContain(err.id);
  });

  it('reports typed input through onChange', async () => {
    const onChange = vi.fn();
    render(<Field label="Full name" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Full name'), 'Dani');
    expect(onChange).toHaveBeenCalled();
  });

  it('supports a checkbox with its label', () => {
    render(
      <Field
        label="Remember me"
        type="checkbox"
        value={false}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Remember me' }),
    ).toBeInTheDocument();
  });
});
