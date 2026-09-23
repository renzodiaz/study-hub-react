import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Dialog from './Dialog';
import Button from './Button';

// A minimal harness: a trigger that opens the controlled Dialog, so focus
// movement and return-to-trigger can be observed as they would be in the app.
const Harness = ({ onClose }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        title="Cancel your subscription?"
        description="Pro stays active until the period end."
        actions={
          <Button variant="quiet" onClick={() => setOpen(false)}>
            Keep my plan
          </Button>
        }
      />
    </>
  );
};

describe('Dialog', () => {
  it('is not in the document until opened, then shows its decision title', async () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Cancel your subscription?' }),
    ).toBeInTheDocument();
  });

  it('moves focus into the dialog when opened', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
