import { categorizeTransactions } from '../lib/services/gemini';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testCategorization() {
    console.log('Testing Gemini Categorization...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('ERROR: GEMINI_API_KEY is not set in .env.local');
        return;
    }

    const mockTransactions = [
        { id: 1, description: 'Netflix Subscription', amount: 15.99 },
        { id: 2, description: 'Uber Trip', amount: 24.50 },
        { id: 3, description: 'Walmart Grocery', amount: 120.45 },
        { id: 4, description: 'Salary Deposit', amount: 3000.00 },
        { id: 5, description: 'Starbucks Coffee', amount: 5.75 }
    ];

    console.log('Mock Transactions:', mockTransactions);

    try {
        const categories = await categorizeTransactions(mockTransactions);
        console.log('\nCategorization Results:');
        console.log(JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error('Error during test:', error);
    }
}

testCategorization();
