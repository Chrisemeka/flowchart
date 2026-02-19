# Flowchart

Flowchart is a powerful financial analysis tool tailored for parsing, visualizing, and categorizing transactions from Nigerian bank statements. Built with modern web technologies, it transforms raw statement data into actionable financial insights using AI-powered categorization and interactive data visualizations.

## 🚀 Features

-   **Smart Statement Parsing**: Upload PDF bank statements. The system automatically extracts transaction details.
-   **AI-Powered Categorization**: Utilizes **Google Gemini (1.5 Flash)** to automatically categorize transactions (e.g., Food, Transport, Utilities) for better spending analysis. (Note: The system also allows for manual categorization of transactions for more accurate analysis)
-   **Interactive Dashboard**:
    -   **Income vs. Expenditure**: Visualize cash flow over time with dynamic generic charts.
    -   **Spending Breakdown**: See exactly where your money is going.
-   **Statement History**: Keep track of all your past uploaded statements and revisit their analysis at any time.
-   **Statement Comparison**: Compare spending habits across different months or statements to track financial progress.
-   **Responsive Design**: Fully optimized for mobile, tablet, and desktop types.
-   **Secure Authentication**: User accounts managed via Supabase Auth.

## 🛠 Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **AI Model**: [Google Gemini](https://ai.google.dev/) (@google/generative-ai)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
-   **Data Visualization**: [Recharts](https://recharts.org/)
-   **PDF Processing**: [pdfjs-dist](https://github.com/mozilla/pdf.js)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   Node.js (v18.17 or later recommended)
-   npm or yarn
-   A Supabase project (for database and auth)
-   A Google Cloud project with Gemini API access

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/flowchart.git
    cd flowchart
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add the following variables:

    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    # Google Gemini API Key
    GEMINI_API_KEY=your_gemini_api_key

    # Optional: Bypass Auth for Development (set to 'true' to skip login)
    NEXT_PUBLIC_BYPASS_AUTH=false
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
flowchart/
├── app/                  # Next.js App Router directories
│   ├── actions/          # Server Actions for mutations/data handling
│   ├── api/              # API Routes (e.g., /api/parse)
│   ├── auth/             # Authentication routes (login/signup)
│   ├── dashboard/        # Main application dashboard
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing/Login page
├── components/           # Reusable React components
│   ├── TransactionTable.tsx    # Datatable for transactions
│   ├── TransactionAnalysis.tsx # Charts and summaries
│   └── ...
├── lib/                  # Library code (Supabase client, utils)
├── public/               # Static assets (images, icons)
└── ...
```

## Notice ##

The system is not perfect yet, it is still in development and is subject to change as the system can only parse transactions from a few Nigerian bank/finance platforms statements such as Access Bank, Palmpay, and Opay. The goal is to capture all major and popular Nigerian bank/finance platforms statements.

## 📄 License

Distributed under the MIT License.

## 🔒 Privacy Policy for Flowchart

**Effective Date:** February 19, 2026  
**Last Updated:** February 19, 2026

### TL;DR

*   We process your bank statements to give you financial insights.
*   We do not sell your data. Period.
*   You can delete your data at any time.
*   We use industry-standard encryption to keep your records safe.

### 1. Information We Collect

To provide the Flowchart service, we collect:

*   **Financial Data:** Transaction history, balances, and descriptions from bank statements (PDF/CSV) you upload.
*   **Account Information:** Name and email address if you create an account.
*   **Metadata:** Technical data like IP address and device type to ensure app security.

### 2. How We Use Your Data

Your data is used strictly to:

*   Categorize and aggregate your spending across multiple accounts.
*   Generate automated financial "flows" and budget suggestions.
*   Improve the app’s categorization algorithms.

### 3. Data Storage & Security

We implement "Bank Level" security measures:

*   **Encryption:** All uploaded statements are encrypted using AES256 at rest and TLS during transit.
*   **Data Minimization:** We only store what is necessary for the app to function.

### 4. Third-party Sharing

We do not sell, rent, or trade your personal financial data with third parties for marketing purposes. Data is only shared with essential service providers (e.g., secure cloud hosting) who are also bound by strict confidentiality.

### 5. Your Rights

Under the NDPR (and GDPR where applicable), you have the right to:

*   Access the data we hold about you.
*   Request the permanent deletion of all uploaded statements and your account.
*   Withdraw consent for data processing at any time.

## ⚖️ Terms and Conditions for Flowchart

### 1. Acceptance of Terms

By accessing or using Flowchart, you agree to be bound by these terms. If you do not agree, please do not upload your financial data.

### 2. Not Financial Advice

**IMPORTANT:** Flowchart is a tool for personal information and organization only. We are not a bank, a licensed financial advisor, or a wealth manager. Any insights provided are suggestions based on your data and should not be taken as professional financial or investment advice.

### 3. User Responsibilities

*   **Authorization:** You represent that you have the legal right to upload and process the bank statements you provide.
*   **Security:** You are responsible for maintaining the confidentiality of your Flowchart login credentials.

### 4. Accuracy of Information

Flowchart relies on the data you provide. We are not responsible for inaccuracies in your financial overview caused by incomplete, modified, or corrupted bank statements.

### 5. Limitation of Liability

To the maximum extent permitted by law, Flowchart and its developers shall not be liable for any financial losses, damages, or data breaches resulting from unauthorized access to your device or thirdparty service failures.

### 6. Termination

We reserve the right to suspend or terminate your access to the service if we detect fraudulent activity or a violation of these terms.
