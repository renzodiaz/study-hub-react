import { classNames as cn } from '@utils/helpers';

// Card — a structural, presentational surface (§6.2). Flat elevation: border,
// never a shadow (§2.10). It holds no Course, Career, credential or billing
// logic; feature cards compose it later.
//
// Variants:
//   plain    — surface with a hairline border
//   sunken   — recessed well on surface-sunken
//   accented — a 4px top rail in `accent` ('primary' | 'bronze'); bronze is the
//              credential/proof accent (§2.4) and is applied by the composing
//              credential card, never as decoration on a generic card.

const ACCENTS = {
  primary: 'border-t-4 border-t-primary',
  bronze: 'border-t-4 border-t-bronze-line',
};

const Card = ({
  children,
  variant = 'plain',
  accent = 'primary',
  as = 'div',
  className,
  ...rest
}) => {
  const Component = as;
  return (
    <Component
      className={cn(
        'rounded-card border border-line',
        variant === 'sunken' ? 'bg-surface-sunken' : 'bg-surface',
        variant === 'accented' && (ACCENTS[accent] ?? ACCENTS.primary),
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Card;
