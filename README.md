# Flowchart

Flowchart is a financial analysis tool for parsing, visualizing, and categorizing transactions from Nigerian bank statements. It ingests PDF statements, extracts transactions with a bank-specific parsing engine, categorizes them with Google Gemini, and turns the raw data into interactive spending insights.

## Features

- **Multi-bank PDF parsing** — Upload a statement PDF and the engine automatically detects the issuing bank and extracts transactions. Currently supported: **Access Bank, First Bank, Zenith Bank, Union Bank, Kuda Bank, OPay, and PalmPay**.
- **AI categorization** — Transactions are classified with **Google Gemini (gemini-2.5-flash)** into 12 categories (Food & Dining, Transport, Bank Fees & Taxes, Income, etc.). Manual override is supported for any transaction.
- **Interactive dashboard** — Income vs. expenditure over time, category breakdown, and spending summaries powered by Recharts.
- **Statement history** — Every uploaded statement is stored per user; revisit any month's analysis at any time.
- **Statement comparison** — Compare spending across two statements side-by-side to track month-over-month change.
- **Duplicate protection** — Transactions are SHA-256 hashed on `date + amount + type + description`, so re-uploading the same statement never double-counts.
- **Responsive UI** — Mobile, tablet, and desktop layouts.
- **Secure auth** — User accounts managed via Supabase Auth with row-level security.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (Postgres + Auth + RLS)
- **AI Model**: [Google Gemini](https://ai.google.dev/) via `@google/generative-ai`
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **PDF Processing**: [pdfjs-dist](https://github.com/mozilla/pdf.js)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react)
- **Icons**: [Lucide React](https://lucide.dev/)

## How the parsing engine works

The parsing pipeline lives in `lib/flowchart-engine/` and runs in four stages:

1. **PDF text extraction** — `pdfjs-dist` reads the PDF page by page and joins text items with double-spaces to preserve column boundaries.
2. **Bank detection** — `detectSource()` matches the filename and content against known signatures (e.g. `ZENITH BANK PLC`, `Kuda Microfinance`, OPay's `Wallet Account` + `Balance After` column pair) and returns the bank name.
3. **Bank-specific parsing** — Each bank has its own parser (`parsers/access.ts`, `parsers/kuda.ts`, etc.) that knows how to extract date, amount, type, description, and balance from that issuer's statement layout. Kuda uses a running-balance-diff strategy to infer credit/debit; OPay uses column-based regex.
4. **Normalization** — Shared utilities (`utils/date.ts`, `utils/currency.ts`, `utils/cleaner.ts`) convert varied date formats (`DD/MM/YY`, `DD-MMM-YYYY`, `DD MMM YYYY`), heal OCR artifacts (`1000,00` → `1000.00`), strip Nigerian banking garbage (`POS PYMT`, `NIP TRANSFER`, trailing `LAGOS NG`), and title-case merchant names.

Parsed transactions are then hashed for deduplication, sent to Gemini for categorization, and persisted alongside statement metadata.

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- A Supabase project (database + auth)
- A Google Cloud project with Gemini API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/flowchart.git
   cd flowchart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the project root:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key

   # Optional: Bypass Auth for Development
   NEXT_PUBLIC_BYPASS_AUTH=false
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run build` | Build the app for production. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint across the project. |
| `npm test` | Run Vitest in watch mode. |
| `npm run test:run` | Run the test suite once and exit. |
| `npm run test:coverage` | Generate a v8 coverage report. |

## Testing

The project uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/react) for unit and component tests. Tests live in `tests/` and mirror the source structure. jsdom powers the DOM environment, `@testing-library/jest-dom` extends the assertion vocabulary, and a shared `renderWithProviders` helper wraps components in a fresh `QueryClientProvider` per test to keep them isolated.

### Utility coverage (`tests/utils/`)

- `parseAmount` — currency string normalization (₦, NGN, comma thousands vs decimal, negative handling)
- `parseDate` — multi-format date parsing (Kuda, OPay, Union, ambiguous slashed formats)
- `cleanMerchantName` — garbage prefix/suffix stripping, HTML entity decoding, title-casing
- `detectSource` — bank identification from filename and PDF content
- `generateTransactionHash` — SHA-256 determinism and floating-point stability

### Component coverage (`tests/components/`)

- `TransactionTable` — empty state, row rendering, category filtering, date sort toggle, pagination, and category-update wiring to the server action
- `FileUpload` — file selection, terms-acceptance gating, upload button enable/disable states, `/api/parse` POST, and error banner on failure
- `StatementHistory` — loading spinner, empty state, error retry, list render, and delete-with-confirm flow
- `ComparisonSelector` — options rendering, `onSelect` firing, `excludeId` disabling, and controlled `selectedId`
- `PageInfo` — trigger button, open/close on click, and click-outside dismissal

Server actions and `next/link` are mocked via `vi.mock()` so tests never touch Supabase or the Next.js router.

### Running the suite

```bash
npm test              # watch mode
npm run test:run      # single pass (used by CI)
npm run test:coverage # v8 coverage report
```

## Project Structure

```
flowchart/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions (statement/transaction/user mutations)
│   ├── api/parse/                # PDF parse endpoint
│   ├── auth/callback/            # Supabase OAuth callback
│   ├── dashboard/                # Main dashboard, history, comparison views
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing/Login page
├── components/                   # React UI components
│   ├── FileUpload.tsx
│   ├── TransactionTable.tsx
│   ├── TransactionAnalysis.tsx   # Charts and summaries
│   ├── ComparisonView.tsx
│   ├── StatementHistory.tsx
│   └── ...
├── lib/
│   ├── constants.ts              # Transaction category list
│   ├── flowchart-engine/         # PDF parsing engine
│   │   ├── index.ts              # Entry point + PDF text extraction
│   │   ├── parsers/              # Bank-specific parsers
│   │   └── utils/                # Date, currency, cleaner, detect
│   ├── services/
│   │   ├── bank-statement.ts     # Orchestrates parse → categorize → persist
│   │   └── gemini.ts             # Gemini categorization
│   └── supabase/                 # Supabase client (browser, server, middleware)
├── utils/
│   └── hash.ts                   # SHA-256 transaction dedupe hash
├── tests/                        # Vitest test suite
│   ├── setup.ts                  # jest-dom + cleanup between tests
│   ├── test-utils.tsx            # renderWithProviders (QueryClient wrapper)
│   ├── utils/                    # Parsing engine unit tests
│   └── components/               # React component tests (RTL)
├── scripts/                      # Dev/debug scripts (tsx-runnable)
├── public/                       # Static assets
├── middleware.ts                 # Auth middleware
├── vitest.config.ts              # Vitest configuration
└── next.config.ts
```

## Development Status

Flowchart is under active development. The parsing engine currently supports seven Nigerian bank/finance platforms — Access Bank, First Bank, Zenith Bank, Union Bank, Kuda Bank, OPay, and PalmPay — with more planned. Parser accuracy depends on the PDF being digital (not a scanned image); image-based statements are rejected with a clear error.

## License

Distributed under the MIT License.

## Privacy Policy

**Effective Date:** February 19, 2026
**Last Updated:** February 19, 2026

### TL;DR

- We process your bank statements to give you financial insights.
- We do not sell your data. Period.
- You can delete your data at any time.
- We use industry-standard encryption to keep your records safe.

### 1. Information We Collect

To provide the Flowchart service, we collect:

- **Financial Data:** Transaction history, balances, and descriptions from bank statements (PDF/CSV) you upload.
- **Account Information:** Name and email address if you create an account.
- **Metadata:** Technical data like IP address and device type to ensure app security.

### 2. How We Use Your Data

Your data is used strictly to:

- Categorize and aggregate your spending across multiple accounts.
- Generate automated financial "flows" and budget suggestions.
- Improve the app's categorization algorithms.

### 3. Data Storage & Security

We implement bank-level security measures:

- **Encryption:** All uploaded statements are encrypted using AES-256 at rest and TLS in transit.
- **Data Minimization:** We only store what is necessary for the app to function.

### 4. Third-party Sharing

We do not sell, rent, or trade your personal financial data with third parties for marketing purposes. Data is only shared with essential service providers (e.g., secure cloud hosting) who are also bound by strict confidentiality.

### 5. Your Rights

Under the NDPR (and GDPR where applicable), you have the right to:

- Access the data we hold about you.
- Request the permanent deletion of all uploaded statements and your account.
- Withdraw consent for data processing at any time.

## Terms and Conditions

### 1. Acceptance of Terms

By accessing or using Flowchart, you agree to be bound by these terms. If you do not agree, please do not upload your financial data.

### 2. Not Financial Advice

**IMPORTANT:** Flowchart is a tool for personal information and organization only. We are not a bank, a licensed financial advisor, or a wealth manager. Any insights provided are suggestions based on your data and should not be taken as professional financial or investment advice.

### 3. User Responsibilities

- **Authorization:** You represent that you have the legal right to upload and process the bank statements you provide.
- **Security:** You are responsible for maintaining the confidentiality of your Flowchart login credentials.

### 4. Accuracy of Information

Flowchart relies on the data you provide. We are not responsible for inaccuracies in your financial overview caused by incomplete, modified, or corrupted bank statements.

### 5. Limitation of Liability

To the maximum extent permitted by law, Flowchart and its developers shall not be liable for any financial losses, damages, or data breaches resulting from unauthorized access to your device or third-party service failures.

### 6. Termination

We reserve the right to suspend or terminate your access to the service if we detect fraudulent activity or a violation of these terms.
