import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../test-utils';

// Mock the server-action module before importing the component.
vi.mock('@/app/actions/user', () => ({
  getUserTermsStatus: vi.fn(),
  acceptTermsAndPrivacy: vi.fn(),
}));

// next/link renders as an anchor in tests.
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

import FileUpload from '@/components/FileUpload';
import { getUserTermsStatus, acceptTermsAndPrivacy } from '@/app/actions/user';

const mockedGetStatus = vi.mocked(getUserTermsStatus);
const mockedAccept = vi.mocked(acceptTermsAndPrivacy);

// Stub global fetch.
const mockFetch = vi.fn();

beforeEach(() => {
  mockedGetStatus.mockReset();
  mockedAccept.mockReset();
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const makePdf = () =>
  new File(['dummy pdf content'], 'statement.pdf', { type: 'application/pdf' });

describe('FileUpload', () => {
  describe('initial render (terms already accepted)', () => {
    beforeEach(() => {
      mockedGetStatus.mockResolvedValue({
        termsAcceptedAt: '2025-01-01T00:00:00Z',
        privacyAcceptedAt: '2025-01-01T00:00:00Z',
      });
    });

    it('renders the upload prompt', async () => {
      renderWithProviders(<FileUpload onUploadSuccess={() => {}} />);
      expect(screen.getByRole('heading', { name: /upload statement/i })).toBeInTheDocument();
      expect(screen.getByText(/click to upload or drag and drop/i)).toBeInTheDocument();
    });

    it('disables the upload button when no file is selected', async () => {
      renderWithProviders(<FileUpload onUploadSuccess={() => {}} />);
      const button = screen.getByRole('button', { name: /upload & analyze/i });
      expect(button).toBeDisabled();
    });

    it('enables the upload button once a file is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUpload onUploadSuccess={() => {}} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, makePdf());

      const button = screen.getByRole('button', { name: /upload & analyze/i });
      expect(button).toBeEnabled();
      expect(screen.getByText('statement.pdf')).toBeInTheDocument();
    });

    it('does not render the terms/privacy checkboxes', async () => {
      renderWithProviders(<FileUpload onUploadSuccess={() => {}} />);
      // Wait for the async status check.
      await waitFor(() => expect(mockedGetStatus).toHaveBeenCalled());
      expect(screen.queryByLabelText(/i agree to the terms/i)).not.toBeInTheDocument();
    });

    it('POSTs the file to /api/parse and calls onUploadSuccess on success', async () => {
      const user = userEvent.setup();
      const onUploadSuccess = vi.fn();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', bank: 'Kuda Bank' }),
      });

      renderWithProviders(<FileUpload onUploadSuccess={onUploadSuccess} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, makePdf());
      await user.click(screen.getByRole('button', { name: /upload & analyze/i }));

      await waitFor(() => expect(onUploadSuccess).toHaveBeenCalled());
      expect(mockFetch).toHaveBeenCalledWith('/api/parse', expect.objectContaining({ method: 'POST' }));
      expect(onUploadSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success', bank: 'Kuda Bank' })
      );
    });

    it('renders an error message when the API returns a non-ok response', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'PDF is empty' }),
      });

      renderWithProviders(<FileUpload onUploadSuccess={() => {}} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, makePdf());
      await user.click(screen.getByRole('button', { name: /upload & analyze/i }));

      expect(await screen.findByText(/upload failed/i)).toBeInTheDocument();
      expect(screen.getByText(/pdf is empty/i)).toBeInTheDocument();
    });
  });

  describe('when the user has not yet accepted terms', () => {
    beforeEach(() => {
      mockedGetStatus.mockResolvedValue({
        termsAcceptedAt: null,
        privacyAcceptedAt: null,
      });
    });

    it('renders the terms and privacy checkboxes', async () => {
      renderWithProviders(<FileUpload onUploadSuccess={() => {}} />);
      expect(await screen.findByLabelText(/terms and conditions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/privacy policy/i)).toBeInTheDocument();
    });

    it('keeps the upload button disabled until both boxes are checked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUpload onUploadSuccess={() => {}} />);

      await screen.findByLabelText(/terms and conditions/i);

      // Select a file first so the "no file" reason is out of the picture.
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, makePdf());

      const button = screen.getByRole('button', { name: /upload & analyze/i });
      expect(button).toBeDisabled();

      // Check only terms - still disabled.
      await user.click(screen.getByLabelText(/terms and conditions/i));
      expect(button).toBeDisabled();

      // Check privacy too - now enabled.
      await user.click(screen.getByLabelText(/privacy policy/i));
      expect(button).toBeEnabled();
    });
  });
});
