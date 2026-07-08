import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComparisonSelector from '@/components/ComparisonSelector';

const statements = [
  { id: 'a', bank_name: 'Access Bank', month: 3, year: 2025, file_name: 'access-mar.pdf' },
  { id: 'b', bank_name: 'Kuda Bank', month: 4, year: 2025, file_name: 'kuda-apr.pdf' },
  { id: 'c', bank_name: 'OPay', month: 5, year: 2025, file_name: 'opay-may.pdf' },
];

describe('ComparisonSelector', () => {
  it('renders the label', () => {
    render(
      <ComparisonSelector
        statements={statements}
        selectedId={null}
        onSelect={() => {}}
        label="First Statement"
      />
    );
    expect(screen.getByText('First Statement')).toBeInTheDocument();
  });

  it('renders all statements as options', () => {
    render(
      <ComparisonSelector
        statements={statements}
        selectedId={null}
        onSelect={() => {}}
        label="Pick one"
      />
    );

    expect(screen.getByRole('option', { name: /access bank - 3\/2025/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /kuda bank - 4\/2025/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /opay - 5\/2025/i })).toBeInTheDocument();
  });

  it('shows the placeholder option "Select a statement..." by default', () => {
    render(
      <ComparisonSelector
        statements={statements}
        selectedId={null}
        onSelect={() => {}}
        label="Pick one"
      />
    );
    expect(screen.getByRole('option', { name: /select a statement/i })).toBeInTheDocument();
  });

  it('calls onSelect with the chosen statement id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ComparisonSelector
        statements={statements}
        selectedId={null}
        onSelect={onSelect}
        label="Pick one"
      />
    );

    await user.selectOptions(screen.getByRole('combobox'), 'b');
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('disables the option matching excludeId', () => {
    render(
      <ComparisonSelector
        statements={statements}
        selectedId={null}
        onSelect={() => {}}
        label="Pick one"
        excludeId="b"
      />
    );

    const excluded = screen.getByRole('option', { name: /kuda bank - 4\/2025/i }) as HTMLOptionElement;
    expect(excluded.disabled).toBe(true);
  });

  it('reflects selectedId as the current value', () => {
    render(
      <ComparisonSelector
        statements={statements}
        selectedId="c"
        onSelect={() => {}}
        label="Pick one"
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('c');
  });
});
