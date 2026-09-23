import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Disclosure from './Disclosure';

describe('Disclosure', () => {
  it('uses a native details/summary and toggles open on activation', async () => {
    render(
      <Disclosure summary="Areas covered by the standard">
        <p>Thirteen competency areas.</p>
      </Disclosure>,
    );
    const summary = screen.getByText('Areas covered by the standard');
    const details = summary.closest('details');
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute('open');

    await userEvent.click(summary);
    expect(details).toHaveAttribute('open');
  });

  it('honours defaultOpen', () => {
    render(
      <Disclosure summary="More" defaultOpen>
        <p>Body</p>
      </Disclosure>,
    );
    expect(screen.getByText('More').closest('details')).toHaveAttribute('open');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});
