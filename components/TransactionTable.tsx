import React, { useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { TRANSACTION_CATEGORIES } from '../lib/constants';

interface Transaction {
    id?: string;
    date: string;
    clean_name?: string;
    narration?: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    category?: string;
    description?: string;
}

interface TransactionTableProps {
    transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
    const itemsPerPage = 20;

    // Filter transactions based on selected category
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        if (selectedCategory === 'All') return transactions;
        return transactions.filter(t => t.category === selectedCategory);
    }, [transactions, selectedCategory]);

    // Reset page when category changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory]);

    if (!transactions || transactions.length === 0) {
        return <div className="text-center p-4 text-gray-500">No transactions to display.</div>;
    }

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

    const handlePrevious = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full max-w-xs p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="All">All Categories</option>
                    {TRANSACTION_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Description</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTransactions.length > 0 ? (
                            currentTransactions.map((t, index) => (
                                <tr key={t.id || index} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {new Date(t.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.clean_name || t.narration || t.description || 'No description'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                            {t.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${t.type === 'CREDIT'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-semibold ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {t.type === 'DEBIT' ? '-' : '+'}{Math.abs(t.amount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No transactions found for this category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6 shadow-sm rounded-lg">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredTransactions.length)}</span> of <span className="font-medium">{filteredTransactions.length}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={handleNext}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
