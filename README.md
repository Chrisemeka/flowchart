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
