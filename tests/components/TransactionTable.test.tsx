import { describe, expect, it, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within } from '../test-utils';

// Mock the server action module so the component doesn't hit Supabase.
vi.mock('@/app/actions/transaction-actions', () => ({
  updateTransactionCategory: vi.fn(async () => ({ success: true })),
}));

import TransactionTable from '@/components/TransactionTable';
import { updateTransactionCategory } from '@/app/actions/transaction-actions';

const mockedUpdate = vi.mocked(updateTransactionCategory);

// Helper to build a batch of transactions
const makeTx = (overrides: Partial<Parameters<typeof TransactionTable>[0]['transactions'][number]> = {}) => ({
  id: 'tx-' + Math.random().toString(36).slice(2),
  date: '2025-03-15T00:00:00Z',
  clean_name: 'Shoprite',
  amount: 5000,
  type: 'DEBIT' as const,
  category: 'Food & Dining',
  ...overrides,
});

describe('TransactionTable', () => {
  beforeEach(() => {
    mockedUpdate.mockClear();
  });

  describe('empty state', () => {
    it('shows placeholder when transactions array is empty', () => {
      renderWithProviders(<TransactionTable transactions={[]} />);
      expect(screen.getByText(/no transactions to display/i)).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('renders transaction rows with description, type badge, and formatted amount', () => {
      const transactions = [
        makeTx({ clean_name: 'Shoprite', amount: 5000, type: 'DEBIT' }),
        makeTx({ clean_name: 'Salary', amount: 200000, type: 'CREDIT' }),
      ];
      renderWithProviders(<TransactionTable transactions={transactions} />);

      expect(screen.getByText('Shoprite')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.getByText('DEBIT')).toBeInTheDocument();
      expect(screen.getByText('CREDIT')).toBeInTheDocument();
    });

    it('falls back to narration then description when clean_name is missing', () => {
      const transactions = [
        makeTx({ clean_name: undefined, narration: 'NIP TRF FROM JOHN', amount: 100 }),
        makeTx({ clean_name: undefined, narration: undefined, description: 'Fallback desc', amount: 100 }),
      ];
      renderWithProviders(<TransactionTable transactions={transactions} />);

      expect(screen.getByText('NIP TRF FROM JOHN')).toBeInTheDocument();
      expect(screen.getByText('Fallback desc')).toBeInTheDocument();
    });
  });

  describe('filtering by category', () => {
    it('filters visible rows when a specific category is chosen', async () => {
      const user = userEvent.setup();
      const transactions = [
        makeTx({ clean_name: 'Shoprite', category: 'Food & Dining' }),
        makeTx({ clean_name: 'Uber Ride', category: 'Transport' }),
      ];
      renderWithProviders(<TransactionTable transactions={transactions} />);

      // The top filter select is the one containing the "All Categories" option.
      const topSelect = screen.getAllByRole('combobox').find(el =>
        within(el as HTMLElement).queryByRole('option', { name: /all categories/i })
      )!;

      await user.selectOptions(topSelect, 'Transport');

      expect(screen.getByText('Uber Ride')).toBeInTheDocument();
      expect(screen.queryByText('Shoprite')).not.toBeInTheDocument();
    });

    it('shows "No transactions found" placeholder when filter matches nothing', async () => {
      const user = userEvent.setup();
      const transactions = [makeTx({ clean_name: 'Shoprite', category: 'Food & Dining' })];
      renderWithProviders(<TransactionTable transactions={transactions} />);

      const topSelect = screen.getAllByRole('combobox').find(el =>
        within(el as HTMLElement).queryByRole('option', { name: /all categories/i })
      )!;

      await user.selectOptions(topSelect, 'Transport');

      expect(screen.getByText(/no transactions found for this category/i)).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('toggles sort direction when the Date header is clicked', async () => {
      const user = userEvent.setup();
      const transactions = [
        makeTx({ clean_name: 'Older', date: '2025-01-01T00:00:00Z' }),
        makeTx({ clean_name: 'Newer', date: '2025-06-01T00:00:00Z' }),
      ];
      renderWithProviders(<TransactionTable transactions={transactions} />);

      // Default sort is desc (newest first).
      const rowsInitial = screen.getAllByRole('row').slice(1); // skip header
      expect(within(rowsInitial[0]).getByText('Newer')).toBeInTheDocument();

      // Click the Date header to flip to ascending.
      await user.click(screen.getByText('Date'));

      const rowsAfter = screen.getAllByRole('row').slice(1);
      expect(within(rowsAfter[0]).getByText('Older')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('renders pagination controls when there are more than 20 items', () => {
      const transactions = Array.from({ length: 25 }, (_, i) =>
        makeTx({ clean_name: `TX-${i}`, id: `tx-${i}` })
      );
      renderWithProviders(<TransactionTable transactions={transactions} />);

      expect(screen.getByText(/page/i)).toBeInTheDocument();
      // "Page 1 of 2"
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does NOT render pagination controls at 20 items or fewer', () => {
      const transactions = Array.from({ length: 20 }, (_, i) =>
        makeTx({ clean_name: `TX-${i}`, id: `tx-${i}` })
      );
      renderWithProviders(<TransactionTable transactions={transactions} />);

      expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
    });

    it('advances to page 2 when Next is clicked', async () => {
      const user = userEvent.setup();
      const transactions = Array.from({ length: 25 }, (_, i) =>
        makeTx({ clean_name: `TX-${i}`, id: `tx-${i}` })
      );
      renderWithProviders(<TransactionTable transactions={transactions} />);

      // TX-0 through TX-19 should be visible on page 1; TX-20 should not.
      expect(screen.getByText('TX-0')).toBeInTheDocument();
      expect(screen.queryByText('TX-20')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByText('TX-20')).toBeInTheDocument();
      expect(screen.queryByText('TX-0')).not.toBeInTheDocument();
    });
  });

  describe('category update', () => {
    it('calls updateTransactionCategory with the new value when a row category is changed', async () => {
      const user = userEvent.setup();
      const transactions = [
        makeTx({ id: 'known-id', clean_name: 'Shoprite', category: 'Food & Dining' }),
      ];
      renderWithProviders(<TransactionTable transactions={transactions} />);

      // Row-level selects contain no "All Categories" option.
      const rowSelect = screen.getAllByRole('combobox').find(el =>
        !within(el as HTMLElement).queryByRole('option', { name: /all categories/i })
      )!;

      await user.selectOptions(rowSelect, 'Transport');

      expect(mockedUpdate).toHaveBeenCalledWith('known-id', 'Transport');
    });
  });
});
