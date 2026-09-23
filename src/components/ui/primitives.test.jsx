import { render, screen } from '@testing-library/react';

import Link from './Link';
import Card from './Card';
import Chip from './Chip';

// Light contracts for the remaining structural primitives. Focus-visible and
// reduced-motion are global CSS rules (see src/index.css) and are exercised in
// manual/browser QA rather than jsdom, which does not apply stylesheets; the
// testable contract here is that interactive primitives are real, focusable
// native elements.

describe('Link', () => {
  it('is always a real anchor with its href and variant', () => {
    render(
      <Link href="/verify/abc" variant="standalone">
        Verify a credential
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Verify a credential' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/verify/abc');
    // Real anchors are keyboard-focusable — the focus-visible ring is global.
    link.focus();
    expect(link).toHaveFocus();
  });
});

describe('Card', () => {
  it('renders children in a flat bordered surface', () => {
    const { container } = render(
      <Card>
        <p>Body</p>
      </Card>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('border');
  });

  it('draws a bronze accent rail only when accented for proof', () => {
    const { container } = render(
      <Card variant="accented" accent="bronze">
        <p>Credential</p>
      </Card>,
    );
    expect(container.firstChild).toHaveClass('border-t-bronze-line');
  });
});

describe('Chip', () => {
  it('marks a qualified state with the dashed variant', () => {
    const { container } = render(<Chip variant="dashed">Preview</Chip>);
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('border-dashed');
  });
});
