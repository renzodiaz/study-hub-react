import { render, screen } from '@testing-library/react';

import Banner from './Banner';
import Button from './Button';

describe('Banner', () => {
  it('renders title, body and a status role, with an icon carrier', () => {
    const { container } = render(
      <Banner variant="danger" title="Your last payment didn't go through">
        Access to enrolled content stops on 5 October.
      </Banner>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText("Your last payment didn't go through"),
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses a polite status role for info', () => {
    render(
      <Banner variant="info" title="A career you previewed is now released" />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the single provided action', () => {
    render(
      <Banner
        variant="danger"
        title="Payment failed"
        action={<Button>Fix payment</Button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Fix payment' }),
    ).toBeInTheDocument();
  });
});
