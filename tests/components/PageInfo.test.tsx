import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageInfo from '@/components/PageInfo';

describe('PageInfo', () => {
  it('renders the info trigger button with accessible label', () => {
    render(<PageInfo content="Some helpful text." />);
    expect(screen.getByRole('button', { name: /page information/i })).toBeInTheDocument();
  });

  it('does not show the popup content until the trigger is clicked', () => {
    render(<PageInfo content="Hidden until clicked." />);
    expect(screen.queryByText('Hidden until clicked.')).not.toBeInTheDocument();
  });

  it('opens the popup when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<PageInfo content="Now you see me." />);

    await user.click(screen.getByRole('button', { name: /page information/i }));
    expect(screen.getByText('Now you see me.')).toBeInTheDocument();
    expect(screen.getByText(/about this page/i)).toBeInTheDocument();
  });

  it('closes the popup when the close (X) button is clicked', async () => {
    const user = userEvent.setup();
    render(<PageInfo content="Toggle me." />);

    await user.click(screen.getByRole('button', { name: /page information/i }));
    expect(screen.getByText('Toggle me.')).toBeInTheDocument();

    // The X close button has no accessible name — find it by its position
    // as the second button rendered.
    const buttons = screen.getAllByRole('button');
    // buttons[0] = trigger; buttons[1] = close (X)
    await user.click(buttons[1]);

    expect(screen.queryByText('Toggle me.')).not.toBeInTheDocument();
  });

  it('closes when clicking outside the popup', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside area</div>
        <PageInfo content="Close on outside click." />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /page information/i }));
    expect(screen.getByText('Close on outside click.')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByText('Close on outside click.')).not.toBeInTheDocument();
  });
});
