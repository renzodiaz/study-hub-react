import { classNames as cn } from '@utils/helpers';

// Spinner — the indeterminate loading mark (§2.13, §6.2). Colour/opacity only,
// petrol on transparent, honouring reduced-motion via the global foundation.
// Always paired with a text label by the caller (or given an aria-label) so the
// loading state is announced, never conveyed by motion alone.
const SIZES = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-8 border-[3px]',
};

const Spinner = ({ size = 'md', className, label }) => (
  <span
    role="status"
    aria-label={label ?? 'Loading'}
    className={cn(
      'inline-block animate-spin rounded-full border-primary border-t-transparent',
      SIZES[size] ?? SIZES.md,
      className,
    )}
  />
);

export default Spinner;
