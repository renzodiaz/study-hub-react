import {
  Dialog as HuiDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react';

import { classNames as cn } from '@utils/helpers';

// Dialog — a modal decision surface (§6.2, §5.2).
//
// Built on Headless UI's Dialog (already a project dependency — no new UI
// framework is added). It provides the accessible contract the handoff
// requires: focus moves in, is contained while open, Escape closes, and focus
// returns to the trigger on close; the panel is aria-modal and is labelled by
// its title. The `title` states the decision ("Cancel your subscription?"),
// never "Are you sure?". Consequence is carried by the title text and the
// actions, never by colour alone; `variant` is reinforcement only.
//
// Actions are passed in (composed from Button) so the primitive owns no
// product behaviour. Overlay elevation and scrim follow §2.10.

const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  variant = 'confirm',
  className,
}) => (
  <HuiDialog open={open} onClose={onClose} className="relative z-50">
    {/* Scrim (§2.10: rgba(20,23,26,.38)). No token exists for the scrim. */}
    <DialogBackdrop className="fixed inset-0 bg-[rgba(20,23,26,0.38)]" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        data-variant={variant}
        className={cn(
          'w-full max-w-md rounded-sheet border border-line bg-surface p-6 shadow-overlay',
          className,
        )}
      >
        <DialogTitle className="text-section font-semibold text-ink">
          {title}
        </DialogTitle>
        {description ? (
          <Description className="mt-2 text-body text-ink-secondary">
            {description}
          </Description>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {actions ? (
          <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>
        ) : null}
      </DialogPanel>
    </div>
  </HuiDialog>
);

export default Dialog;
