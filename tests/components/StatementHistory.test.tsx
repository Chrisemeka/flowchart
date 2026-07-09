import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../test-utils';

// Mock the server actions.
vi.mock('@/app/actions/statement-actions', () => ({
  getUserStatements: vi.fn(),
  deleteStatement: vi.fn(),
}));

// next/link → plain anchor.
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// next/image → plain img.
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

import StatementHistory from '@/components/StatementHistory';
import { getUserStatements, deleteStatement } from '@/app/actions/statement-actions';

const mockedGet = vi.mocked(getUserStatements);
const mockedDelete = vi.mocked(deleteStatement);

beforeEach(() => {
  mockedGet.mockReset();
  mockedDelete.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StatementHistory', () => {
  it('shows the loading spinner while the query is pending', () => {
    // Never-resolving promise keeps the query in "loading" state.
    mockedGet.mockImplementation(() => new Promise(() => {}));
    const { container } = renderWithProviders(<StatementHistory />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the empty state when there are no statements', async () => {
    mockedGet.mockResolvedValue({ data: [], error: undefined });
    renderWithProviders(<StatementHistory />);

    expect(await screen.findByText(/no statements uploaded yet/i)).toBeInTheDocument();
    expect(screen.getByText(/upload a statement to get started/i)).toBeInTheDocument();
  });

  it('renders an error state with a retry button when the query fails', async () => {
    mockedGet.mockResolvedValue({ data: undefined, error: 'Server exploded' });
    renderWithProviders(<StatementHistory />);

    expect(await screen.findByText(/server exploded/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders one row per statement', async () => {
    mockedGet.mockResolvedValue({
      data: [
        {
          id: 's1',
          bank_name: 'Access Bank',
          account_number: '0123456789',
          month: 3,
          year: 2025,
          file_name: 'access-mar.pdf',
          start_date: '2025-03-01T00:00:00Z',
        },
        {
          id: 's2',
          bank_name: 'Kuda Bank',
          account_number: '9876543210',
          month: 4,
          year: 2025,
          file_name: 'kuda-apr.pdf',
          start_date: '2025-04-01T00:00:00Z',
        },
      ],
      error: undefined,
    });
    renderWithProviders(<StatementHistory />);

    expect(await screen.findByText('Access Bank')).toBeInTheDocument();
    expect(screen.getByText('Kuda Bank')).toBeInTheDocument();
    expect(screen.getByText('access-mar.pdf')).toBeInTheDocument();
    expect(screen.getByText('kuda-apr.pdf')).toBeInTheDocument();
  });

  it('calls deleteStatement when the user confirms the delete prompt', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedGet.mockResolvedValue({
      data: [
        {
          id: 's1',
          bank_name: 'Access Bank',
          account_number: '0123456789',
          month: 3,
          year: 2025,
          file_name: 'access-mar.pdf',
          start_date: '2025-03-01T00:00:00Z',
        },
      ],
      error: undefined,
    });
    mockedDelete.mockResolvedValue({ success: true });

    renderWithProviders(<StatementHistory />);
    const deleteBtn = await screen.findByTitle(/delete statement/i);
    await user.click(deleteBtn);

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('s1'));
  });

  it('does NOT call deleteStatement when the confirm dialog is dismissed', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockedGet.mockResolvedValue({
      data: [
        {
          id: 's1',
          bank_name: 'Access Bank',
          account_number: '0123456789',
          month: 3,
          year: 2025,
          file_name: 'access-mar.pdf',
          start_date: '2025-03-01T00:00:00Z',
        },
      ],
      error: undefined,
    });

    renderWithProviders(<StatementHistory />);
    const deleteBtn = await screen.findByTitle(/delete statement/i);
    await user.click(deleteBtn);

    expect(mockedDelete).not.toHaveBeenCalled();
  });
});
