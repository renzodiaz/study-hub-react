import { render, screen } from '@testing-library/react';

import StatusPill from './StatusPill';

describe('StatusPill', () => {
  it('renders the word plus a non-colour carrier (icon)', () => {
    const { container } = render(
      <StatusPill status="success">Valid</StatusPill>,
    );
    expect(screen.getByText('Valid')).toBeInTheDocument();
    // The reinforcing icon is present so meaning never rests on colour alone.
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('derives the semantic treatment from status (success → success foreground)', () => {
    const { container } = render(
      <StatusPill status="success">Passed</StatusPill>,
    );
    expect(container.firstChild).toHaveClass('text-success');
  });

  it('renders a distinct treatment for a different status (danger)', () => {
    const { container } = render(
      <StatusPill status="danger">Revoked</StatusPill>,
    );
    expect(container.firstChild).toHaveClass('text-danger');
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });

  it('falls back to neutral for an unknown status', () => {
    const { container } = render(
      <StatusPill status="whatever">Preview</StatusPill>,
    );
    expect(container.firstChild).toHaveClass('text-neutral');
  });
});
