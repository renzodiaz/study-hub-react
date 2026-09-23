import { render, screen } from '@testing-library/react';

import Button from './Button';

describe('Button', () => {
  it('renders a semantic <button> with its label', () => {
    render(<Button>Continue lesson</Button>);
    const btn = screen.getByRole('button', { name: 'Continue lesson' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('applies the variant treatment (destructive → danger)', () => {
    render(<Button variant="destructive">Cancel subscription</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });

  it('when disabled, renders a visible reason linked with aria-describedby', () => {
    render(
      <Button disabled reason="Opens when all five courses pass">
        Begin qualification
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Begin qualification' });
    expect(btn).toBeDisabled();
    const reason = screen.getByText('Opens when all five courses pass');
    expect(reason.id).toBeTruthy();
    expect(btn).toHaveAttribute('aria-describedby', reason.id);
  });

  it('busy keeps a meaningful label (never a bare spinner) and is aria-busy', () => {
    render(
      <Button busy busyLabel="Saving…">
        Save changes
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent('Saving…');
  });

  it('supports fullWidth and an icon before the label', () => {
    render(
      <Button fullWidth iconStart={<svg data-testid="ico" />}>
        Explore careers
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('w-full');
    expect(screen.getByTestId('ico')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Explore careers');
  });
});
